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

      .form_field-wrapper.has-error,
      .field-wrapper.has-error,
      .input-wrapper.has-error {
        margin-bottom: 3rem;
      }

      .field-error {
        position: absolute;
        left: 0;
        top: calc(100% + 0.35rem);
        z-index: 20;
        display: none;
        background: #fff;
        color: #d93025;
        border: 1px solid #f1b5b0;
        border-radius: 0.375rem;
        padding: 0.35rem 0.6rem;

        font-family: inherit;
        font-size: inherit;
        font-weight: inherit;
        line-height: inherit;
        letter-spacing: inherit;

        white-space: normal;
        box-shadow: 0 0.375rem 1.125rem rgba(0,0,0,0.08);
        max-width: 100%;
        min-width: 14rem;
        pointer-events: none;
      }

      .field-error.is-visible {
        display: block;
      }

      .field-error::before {
        content: "";
        position: absolute;
        top: -0.35rem;
        left: 0.75rem;
        width: 0.6rem;
        height: 0.6rem;
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
    if (!input) return null;

    return (
      input.closest(".form_field-wrapper") ||
      input.closest(".field-wrapper") ||
      input.closest(".input-wrapper") ||
      input.parentElement
    );
  }

  function getErrorId(input) {
    const base = input.id || input.name || "field";
    return "field-error-" + String(base).replace(/[^a-zA-Z0-9\-_:.]/g, "");
  }

  function setError(input, message) {
    if (!input) return;

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    const wrapper = getWrapper(input);
    if (!wrapper) return;

    wrapper.classList.add("has-error");

    const errorId = getErrorId(input);
    let err = wrapper.querySelector('.field-error[data-error-for="' + errorId + '"]');

    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      err.setAttribute("role", "alert");
      err.setAttribute("id", errorId);
      err.setAttribute("data-error-for", errorId);
      input.insertAdjacentElement("afterend", err);
    }

    input.setAttribute("aria-describedby", errorId);
    err.textContent = message;
    err.classList.add("is-visible");
  }

  function clearError(input) {
    if (!input) return;

    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");

    const wrapper = getWrapper(input);
    if (!wrapper) return;

    const visibleErrors = wrapper.querySelectorAll(".field-error.is-visible");
    visibleErrors.forEach(function (err) {
      if (
        err.previousElementSibling === input ||
        err.getAttribute("id") === getErrorId(input)
      ) {
        err.classList.remove("is-visible");
      }
    });

    if (!wrapper.querySelector(".field-error.is-visible")) {
      wrapper.classList.remove("has-error");
    }
  }

  function clearAllErrors(form) {
    if (!form) return;

    form.querySelectorAll(".is-invalid").forEach(function (input) {
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });

    form.querySelectorAll(".has-error").forEach(function (wrapper) {
      wrapper.classList.remove("has-error");
    });

    form.querySelectorAll(".field-error.is-visible").forEach(function (err) {
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

    if ((pwInput && pwInput.value ? pwInput.value : "") !== (confirmInput.value || "")) {
      setError(confirmInput, "Passwords do not match.");
      return false;
    }

    clearError(confirmInput);
    return true;
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

    const hasRegisterSignals = !!(firstName || lastName || streetNumber || confirmPassword);
    if (!hasRegisterSignals) return;

    form.addEventListener("submit", function (e) {
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
