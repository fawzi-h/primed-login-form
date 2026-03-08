(function () {
  "use strict";

  // ---------- CSS injection ----------
  function injectStyles() {
    if (document.getElementById("primed-validation-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-validation-styles";
    style.textContent = `
      .is-invalid {
        border-color: #d93025 !important;
        box-shadow: 0 0 0 1px #d93025 inset;
      }

      .form_field-wrapper,
      .field-wrapper,
      .input-wrapper {
        position: relative;
      }

      .field-error {
        position: absolute;
        left: 0;
        top: calc(100% + 6px);
        z-index: 20;
        display: none;
        background: #fff;
        color: #d93025;
        border: 1px solid #f1b5b0;
        border-radius: 6px;
        padding: 6px 10px;
        font-size: 0.8125rem;
        line-height: 1.3;
        white-space: normal;
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
        max-width: 100%;
        min-width: 220px;
        pointer-events: none;
      }

      .field-error.is-visible {
        display: block;
      }

      .field-error::before {
        content: "";
        position: absolute;
        top: -6px;
        left: 12px;
        width: 10px;
        height: 10px;
        background: #fff;
        border-top: 1px solid #f1b5b0;
        border-left: 1px solid #f1b5b0;
        transform: rotate(45deg);
      }
    `;
    document.head.appendChild(style);
  }

  // ---------- helpers ----------
  const AU_STATES = new Set(["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"]);

  function digitsOnly(s) {
    return (s || "").replace(/\D/g, "");
  }

  function isAustralianMobile(value) {
    const d = digitsOnly((value || "").trim());
    if (d.length === 10 && d.startsWith("04")) return true;
    if (d.length === 11 && d.startsWith("614")) return true;
    return false;
  }

  function normalizeAustralianMobile(value) {
    const d = digitsOnly((value || "").trim());
    if (d.length === 11 && d.startsWith("614")) return "0" + d.slice(2);
    return d;
  }

  function isStrongPassword(pw) {
    if (!pw) return false;
    if (pw.length < 8) return false;
    if (!/[A-Z]/.test(pw)) return false;
    if (!/[0-9]/.test(pw)) return false;
    if (!/[a-zA-Z]/.test(pw)) return false;
    return true;
  }

  function getWrapper(input) {
    return (
      input.closest(".form_field-wrapper") ||
      input.closest(".field-wrapper") ||
      input.closest(".input-wrapper") ||
      input.parentElement
    );
  }

  function setError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const wrapper = getWrapper(input);
    if (!wrapper) return;

    wrapper.style.position = "relative";

    let err = wrapper.querySelector(".field-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      err.setAttribute("role", "alert");
      wrapper.appendChild(err);
    }

    err.textContent = message;
    err.classList.add("is-visible");
  }

  function clearError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    const wrapper = getWrapper(input);
    if (!wrapper) return;

    const err = wrapper.querySelector(".field-error");
    if (err) err.classList.remove("is-visible");
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
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!ok) {
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
      setError(input, "Minimum 8 characters with at least 1 capital letter and 1 number.");
      return false;
    }
    clearError(input);
    return true;
  }

  function validateConfirmPassword(pwInput, confirmInput) {
    if (!confirmInput) return true;
    if (!requireValue(confirmInput, "Please confirm your password.")) return false;
    if ((pwInput?.value || "") !== (confirmInput.value || "")) {
      setError(confirmInput, "Passwords do not match.");
      return false;
    }
    clearError(confirmInput);
    return true;
  }

  function attachLiveValidation(input, fn) {
    if (!input) return;
    ["input", "blur", "change"].forEach(function (evt) {
      input.addEventListener(evt, fn);
    });
  }

  function findField(form, options) {
    for (const sel of options) {
      const el = form.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function initOnForm(form) {
    if (!form || form.__primedValidationBound) return;
    form.__primedValidationBound = true;

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

    const referral = findField(form, ['#register-referral-code', 'input[name="Referral-Code"]']);

    const hasRegisterSignals = !!(firstName || lastName || streetNumber || confirmPassword);
    if (!hasRegisterSignals) return;

    attachLiveValidation(firstName, function () { requireValue(firstName, "First name is required."); });
    attachLiveValidation(lastName, function () { requireValue(lastName, "Last name is required."); });
    attachLiveValidation(email, function () { validateEmail(email); });
    attachLiveValidation(phone, function () { validatePhone(phone); });
    attachLiveValidation(streetNumber, function () { validateStreetNumber(streetNumber); });
    attachLiveValidation(streetName, function () { validateStreetName(streetName); });
    attachLiveValidation(suburb, function () { validateSuburb(suburb); });
    attachLiveValidation(state, function () { validateState(state); });
    attachLiveValidation(postcode, function () { validatePostcode(postcode); });

    attachLiveValidation(password, function () {
      validatePassword(password);
      if (confirmPassword && (confirmPassword.value || "").length) {
        validateConfirmPassword(password, confirmPassword);
      }
    });

    attachLiveValidation(confirmPassword, function () {
      validateConfirmPassword(password, confirmPassword);
    });

    attachLiveValidation(referral, function () {
      if (!referral) return;
      const v = (referral.value || "").trim();
      if (!v) clearError(referral);
    });

    form.addEventListener("submit", function (e) {
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

      if (!ok) {
        e.preventDefault();
        const firstInvalid = form.querySelector(".is-invalid");
        if (firstInvalid) firstInvalid.focus();
      }
    });
  }

  function tryInit() {
    const forms = Array.from(document.querySelectorAll("form"));
    forms.forEach(initOnForm);

    const f = document.getElementById("register-form-el");
    if (f) initOnForm(f);
  }

  function waitForRegisterForm() {
    tryInit();

    const obs = new MutationObserver(function () {
      tryInit();
    });

    obs.observe(document.documentElement, { childList: true, subtree: true });

    setTimeout(function () {
      obs.disconnect();
    }, 20000);
  }

  injectStyles();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForRegisterForm);
  } else {
    waitForRegisterForm();
  }
})();
