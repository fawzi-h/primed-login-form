(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("primed-validation-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-validation-styles";
    style.textContent = `
      .is-invalid {
        border-color: #d93025 !important;
        box-shadow: 0 0 0 1px #d93025 inset;
      }

      .field-error {
        display: none;
        width: 100%;
        color: #d93025;
        background: #fff;
        border: 1px solid rgba(217, 48, 37, 0.18);
        border-radius: 0.5rem;
        box-shadow: 0 10px 24px rgba(0, 0, 0, 0.08);
        padding: 0.55rem 0.75rem;
        margin-top: 0.45rem;
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        line-height: 1.35;
        letter-spacing: inherit;
      }

      .field-error.is-visible {
        display: block;
      }

      .field-error-host {
        position: relative;
        display: block;
        width: 100%;
      }

      .field-error-host > .form_input,
      .field-error-host > .w-input,
      .field-error-host > input,
      .field-error-host > textarea,
      .field-error-host > select {
        width: 100%;
      }

      .field-hint {
        display: none;
        width: 100%;
        color: #4a5568;
        background: #f7fafc;
        border: 1px solid rgba(160, 174, 192, 0.3);
        border-radius: 0.5rem;
        padding: 0.55rem 0.75rem;
        margin-top: 0.45rem;
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 400;
        line-height: 1.35;
        letter-spacing: inherit;
      }

      .field-hint.is-visible {
        display: block;
      }

      .field-hint.password-feedback {
        grid-column: 1 / -1;
        width: 100%;
      }

      .password-rule {
        color: #718096;
      }

      .password-rule + .password-rule {
        margin-top: 0.2rem;
      }

      .password-rule.is-met {
        color: #2f855a;
        font-weight: 600;
      }

      .field-hint.show-invalid .password-rule:not(.is-met) {
        color: #d93025;
        font-weight: 500;
      }
    `;
    document.head.appendChild(style);
  }

  const AU_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

  function digitsOnly(s) {
    return (s || "").replace(/\D/g, "");
  }

  function isAustralianMobile(value) {
    const d = digitsOnly((value || "").trim());
    return (d.length === 10 && d.startsWith("04")) || (d.length === 11 && d.startsWith("614"));
  }

  function normalizeAustralianMobile(value) {
    const d = digitsOnly((value || "").trim());
    if (d.length === 11 && d.startsWith("614")) return "0" + d.slice(2);
    return d;
  }

  function isStrongPassword(pw) {
    if (!pw || pw.length < 8) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[a-zA-Z]/.test(pw)) return false;
    return true;
  }

  function getErrorId(input) {
    const base = input.id || input.name || "field";
    return "field-error-" + String(base).replace(/[^a-zA-Z0-9\-_:.]/g, "");
  }

  function getOrCreateErrorNode(input) {
    if (!input) return null;

    const errorId = getErrorId(input);
    let err = document.getElementById(errorId);
    const host = getErrorHost(input);

    if (!host) return null;

    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      err.id = errorId;
      err.setAttribute("role", "alert");
      host.classList.add("field-error-host");
      host.appendChild(err);
    }

    return err;
  }

  function getErrorHost(input) {
    if (!input) return null;
    return input.closest(".form_field-wrapper") || input.parentElement;
  }

  function getGroupedPasswordErrorHost(passwordInput, confirmInput) {
    const passwordHost = getErrorHost(passwordInput);
    const confirmHost = getErrorHost(confirmInput);

    if (passwordHost && confirmHost && passwordHost.parentElement === confirmHost.parentElement) {
      return confirmHost.parentElement;
    }

    return confirmHost || passwordHost;
  }

  function getCustomHintNode(id, host) {
    if (!id || !host) return null;

    let hint = document.getElementById(id);
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "field-hint password-feedback";
      hint.id = id;
      host.appendChild(hint);
    } else if (hint.parentElement !== host) {
      host.appendChild(hint);
    }

    return hint;
  }

  function getPasswordRuleState(value) {
    const passwordValue = value || "";
    return {
      length: passwordValue.length >= 8,
      uppercase: /[A-Z]/.test(passwordValue),
      number: /[0-9]/.test(passwordValue)
    };
  }

  function getPasswordMatchState(passwordValue, confirmValue) {
    if (!passwordValue || !confirmValue) return false;
    return passwordValue === confirmValue;
  }

  function renderPasswordHint(passwordInput, confirmInput, options) {
    const showInvalid = !!(options && options.showInvalid);
    const host = getGroupedPasswordErrorHost(passwordInput, confirmInput);
    const hint = getCustomHintNode("field-hint-password-rules", host);
    if (!hint) return;

    if (!hint.dataset.initialized) {
      hint.innerHTML = [
        '<div class="password-rule" data-password-rule="length">At least 8 characters.</div>',
        '<div class="password-rule" data-password-rule="uppercase">At least 1 capital letter.</div>',
        '<div class="password-rule" data-password-rule="number">At least 1 number.</div>',
        '<div class="password-rule" data-password-rule="match">Passwords match.</div>'
      ].join("");
      hint.dataset.initialized = "true";
    }

    const value = passwordInput && passwordInput.value ? passwordInput.value : "";
    const confirmValue = confirmInput && confirmInput.value ? confirmInput.value : "";
    if (!value) {
      hint.classList.remove("is-visible");
      hint.classList.remove("show-invalid");
      hint.querySelectorAll("[data-password-rule]").forEach(function (el) {
        el.classList.remove("is-met");
      });
      return;
    }

    const ruleState = getPasswordRuleState(value);
    hint.classList.add("is-visible");
    hint.classList.toggle("show-invalid", showInvalid);
    hint.querySelectorAll("[data-password-rule]").forEach(function (el) {
      const ruleName = el.getAttribute("data-password-rule");
      const isMet = ruleName === "match"
        ? getPasswordMatchState(value, confirmValue)
        : !!ruleState[ruleName];
      el.classList.toggle("is-met", isMet);
    });
  }

  function setError(input, message) {
    if (!input) return;

    const err = getOrCreateErrorNode(input);
    const host = getErrorHost(input);
    if (!err) return;

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", err.id);

    err.textContent = message;
    err.classList.add("is-visible");
  }

  function clearError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");

    const err = document.getElementById(getErrorId(input));
    if (err) {
      err.textContent = "";
      err.classList.remove("is-visible");
    }
  }

  function clearPasswordValidationState(passwordInput, confirmInput) {
    [passwordInput, confirmInput].forEach(function (input) {
      if (!input) return;
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
  }

  function markInvalidWithoutError(input, describedById) {
    if (!input) return;

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    if (describedById) {
      input.setAttribute("aria-describedby", describedById);
    } else {
      input.removeAttribute("aria-describedby");
    }
  }

  function clearAllErrors(form) {
    if (!form) return;

    form.querySelectorAll(".is-invalid").forEach(function (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");

    });

    form.querySelectorAll(".field-error.is-visible").forEach(function (err) {
      err.textContent = "";
      err.classList.remove("is-visible");
    });
  }

  function requireValue(input, msg) {
    if (!input) return true;
    const v = (input.value || "").trim();
    if (!v) {
      setError(input, msg);
      return false;
    }
    clearError(input);
    return true;
  }

  function validateEmail(input) {
    if (!input) return true;
    if (!requireValue(input, "Email is required.")) return false;

    const v = (input.value || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError(input, "Enter a valid email.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validatePhone(input) {
    if (!input) return true;
    if (!requireValue(input, "Phone number is required.")) return false;

    if (!isAustralianMobile(input.value)) {
      setError(input, "Enter a valid Australian mobile (starts with 04, 10 digits).");
      return false;
    }

    input.value = normalizeAustralianMobile(input.value);
    clearError(input);
    return true;
  }

  function validateStreetNumber(input) {
    if (!input) return true;
    if (!requireValue(input, "Street number is required.")) return false;

    const v = (input.value || "").trim();
    if (!/^[0-9]{1,6}[A-Za-z]?$/.test(v)) {
      setError(input, "Enter a valid street number (for example 12 or 12A).");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateStreetName(input) {
    if (!input) return true;
    if (!requireValue(input, "Street name is required.")) return false;

    const v = (input.value || "").trim();
    if (!/^[A-Za-z0-9 .'\-]{2,}$/.test(v)) {
      setError(input, "Enter a valid street name.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateSuburb(input) {
    if (!input) return true;
    if (!requireValue(input, "Suburb is required.")) return false;

    const v = (input.value || "").trim();
    if (!/^[A-Za-z .'\-]{2,}$/.test(v)) {
      setError(input, "Enter a valid suburb.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateState(input) {
    if (!input) return true;
    if (!requireValue(input, "State is required.")) return false;

    const v = (input.value || "").trim().toUpperCase();
    if (!AU_STATES.has(v)) {
      setError(input, "Use NSW, VIC, QLD, WA, SA, TAS, ACT, or NT.");
      return false;
    }

    input.value = v;
    clearError(input);
    return true;
  }

  function validatePostcode(input) {
    if (!input) return true;
    if (!requireValue(input, "Postcode is required.")) return false;

    const v = (input.value || "").trim();
    if (!/^\d{4}$/.test(v)) {
      setError(input, "Postcode must be 4 digits.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateAddressLine(input) {
    if (!input) return true;
    if (!requireValue(input, "Address is required.")) return false;

    const v = (input.value || "").trim();
    if (v.length < 6) {
      setError(input, "Enter a valid address.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validatePassword(input) {
    if (!input) return true;
    if (!requireValue(input, "Password is required.")) return false;

    if (!isStrongPassword(input.value || "")) {
      const form = input.form || input.closest("form");
      const confirmInput = form && findField(form, ['#register-confirm-password', 'input[name="Register-Confirm-Password"]', 'input[name="Confirm-Password"]']);
      renderPasswordHint(input, confirmInput, { showInvalid: true });
      clearError(input);
      markInvalidWithoutError(input, "field-hint-password-rules");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateConfirmPassword(pwInput, confirmInput) {
    if (!confirmInput) return true;

    if ((pwInput && pwInput.value ? pwInput.value : "") !== (confirmInput.value || "")) {
      renderPasswordHint(pwInput, confirmInput, { showInvalid: true });
      clearError(confirmInput);
      markInvalidWithoutError(confirmInput, "field-hint-password-rules");
      return false;
    }

    clearPasswordValidationState(pwInput, confirmInput);
    clearError(confirmInput);
    return true;
  }

  function findField(form, options) {
    for (var i = 0; i < options.length; i++) {
      var el = form.querySelector(options[i]);
      if (el) return el;
    }
    return null;
  }

  function focusFirstInvalid(form) {
    if (!form) return;
    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) firstInvalid.focus();
  }

  function isSubmitTrigger(el) {
    if (!el || !el.matches) return false;
    return el.matches(
      'button[type="submit"], input[type="submit"], input[type="image"], button:not([type])'
    );
  }

  function bindLiveClear(input) {
    if (!input || input.__primedLiveClearBound) return;
    input.__primedLiveClearBound = true;

    input.addEventListener("input", function () {
      clearError(input);
      if (input.name === "Password" || input.name === "Confirm-Password" || input.id === "register-password" || input.id === "register-confirm-password") {
        const form = input.form || input.closest("form");
        const passwordInput = form && findField(form, ['#register-password', 'input[name="Register-Password"]', 'input[name="Password"]']);
        const confirmInput = form && findField(form, ['#register-confirm-password', 'input[name="Register-Confirm-Password"]', 'input[name="Confirm-Password"]']);
        clearPasswordValidationState(passwordInput, confirmInput);
        renderPasswordHint(passwordInput, confirmInput);
      }
    });
  }

  function initOnForm(form) {
    if (!form || form.__primedValidationBound) return;

    const firstName = findField(form, ['#register-first-name', 'input[name="First-Name"]']);
    const lastName = findField(form, ['#register-last-name', 'input[name="Last-Name"]']);
    const email = findField(form, ['#register-email', 'input[name="Register-Email"]', 'input[name="Email"]']);
    const phone = findField(form, ['#register-phone', 'input[name="Phone"]']);
    const address = findField(form, ['#register-address', 'input[name="Address"]']);
    const streetNumber = findField(form, ['#streetNumber', 'input[name="streetNumber"]']);
    const streetName = findField(form, ['#streetName', 'input[name="streetName"]']);
    const suburb = findField(form, ['#suburb', 'input[name="suburb"]']);
    const state = findField(form, ['#state', 'input[name="state"]']);
    const postcode = findField(form, ['#postcode', 'input[name="postcode"]']);
    const password = findField(form, ['#register-password', 'input[name="Register-Password"]', 'input[name="Password"]']);
    const confirmPassword = findField(form, ['#register-confirm-password', 'input[name="Register-Confirm-Password"]', 'input[name="Confirm-Password"]']);

    const hasRegisterSignals = !!(firstName || lastName || streetNumber || confirmPassword);
    if (!hasRegisterSignals) return;

    form.__primedValidationBound = true;

    [
      firstName,
      lastName,
      email,
      phone,
      address,
      streetNumber,
      streetName,
      suburb,
      state,
      postcode,
      password,
      confirmPassword
    ].forEach(bindLiveClear);

    renderPasswordHint(password, confirmPassword);

    function validateForm() {
      clearAllErrors(form);

      let ok = true;
      ok = requireValue(firstName, "First name is required.") && ok;
      ok = requireValue(lastName, "Last name is required.") && ok;
      ok = validateEmail(email) && ok;
      ok = validatePhone(phone) && ok;
      ok = validateAddressLine(address) && ok;
      ok = validateStreetNumber(streetNumber) && ok;
      ok = validateStreetName(streetName) && ok;
      ok = validateSuburb(suburb) && ok;
      ok = validateState(state) && ok;
      ok = validatePostcode(postcode) && ok;
      ok = validatePassword(password) && ok;
      ok = validateConfirmPassword(password, confirmPassword) && ok;

      return ok;
    }

    form.addEventListener(
      "click",
      function (e) {
        const submitTrigger = e.target.closest(
          'button[type="submit"], input[type="submit"], input[type="image"], button:not([type])'
        );

        if (!submitTrigger || !form.contains(submitTrigger) || !isSubmitTrigger(submitTrigger)) {
          return;
        }

        if (!validateForm()) {
          e.preventDefault();
          e.stopImmediatePropagation();
          focusFirstInvalid(form);
        }
      },
      true
    );

    form.addEventListener("submit", function (e) {
      if (!validateForm()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        focusFirstInvalid(form);
      }
    });
  }

  function tryInit() {
    document.querySelectorAll("form").forEach(initOnForm);

    const directForm = document.getElementById("register-form-el");
    if (directForm) initOnForm(directForm);
  }

  function boot() {
    injectStyles();
    tryInit();
    setTimeout(tryInit, 300);
    setTimeout(tryInit, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
