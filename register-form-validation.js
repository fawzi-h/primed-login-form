(function () {
  "use strict";

  /* ---------------------------
     Inject validation CSS
  --------------------------- */

  function injectStyles() {
    const style = document.createElement("style");
    style.innerHTML = `
      .is-invalid {
        border-color: #d93025 !important;
      }
      .field-error {
        color: #d93025;
        font-size: 0.875rem;
        margin-top: 6px;
        display: none;
      }
      .field-error.is-visible {
        display: block;
      }
    `;
    document.head.appendChild(style);
  }

  /* ---------------------------
     Helpers
  --------------------------- */

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
    return (
      pw &&
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[a-zA-Z]/.test(pw) &&
      /[0-9]/.test(pw)
    );
  }

  function setError(input, message) {
    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");

    let err = input.parentElement.querySelector(".field-error");
    if (!err) {
      err = document.createElement("div");
      err.className = "field-error";
      input.parentElement.appendChild(err);
    }
    err.textContent = message;
    err.classList.add("is-visible");
  }

  function clearError(input) {
    input.classList.remove("is-invalid");
    input.removeAttribute("aria-invalid");

    const err = input.parentElement.querySelector(".field-error");
    if (err) err.classList.remove("is-visible");
  }

  function requireValue(input, msg) {
    const v = (input.value || "").trim();
    if (!v) {
      setError(input, msg);
      return false;
    }
    clearError(input);
    return true;
  }

  /* ---------------------------
     Field Validators
  --------------------------- */

  function validateEmail(input) {
    if (!requireValue(input, "Email is required.")) return false;
    const v = input.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setError(input, "Enter a valid email.");
      return false;
    }
    clearError(input);
    return true;
  }

  function validatePhone(input) {
    if (!requireValue(input, "Phone number is required.")) return false;

    if (!isAustralianMobile(input.value)) {
      setError(input, "Enter a valid Australian mobile (10 digits starting with 04).");
      return false;
    }

    input.value = normalizeAustralianMobile(input.value);
    clearError(input);
    return true;
  }

  function validateState(input) {
    const v = input.value.trim().toUpperCase();
    if (!v) {
      setError(input, "State is required.");
      return false;
    }
    if (!AU_STATES.has(v)) {
      setError(input, "Use NSW, VIC, QLD, WA, SA, TAS, ACT, or NT.");
      return false;
    }
    input.value = v;
    clearError(input);
    return true;
  }

  function validatePostcode(input) {
    const v = input.value.trim();
    if (!v) {
      setError(input, "Postcode is required.");
      return false;
    }
    if (!/^\d{4}$/.test(v)) {
      setError(input, "Postcode must be 4 digits.");
      return false;
    }
    clearError(input);
    return true;
  }

  function validatePassword(input) {
    if (!requireValue(input, "Password is required.")) return false;

    if (!isStrongPassword(input.value)) {
      setError(input, "Minimum 8 characters with at least 1 capital letter and 1 number.");
      return false;
    }

    clearError(input);
    return true;
  }

  function validateConfirmPassword(pwInput, confirmInput) {
    if (!requireValue(confirmInput, "Please confirm your password.")) return false;

    if (pwInput.value !== confirmInput.value) {
      setError(confirmInput, "Passwords do not match.");
      return false;
    }

    clearError(confirmInput);
    return true;
  }

  function attachLiveValidation(input, fn) {
    ["input", "blur"].forEach(function (evt) {
      input.addEventListener(evt, fn);
    });
  }

  /* ---------------------------
     Init
  --------------------------- */

  document.addEventListener("DOMContentLoaded", function () {
    injectStyles();

    const form = document.getElementById("register-form-el");
    if (!form) return;

    const firstName = document.getElementById("register-first-name");
    const lastName = document.getElementById("register-last-name");
    const email = document.getElementById("register-email");
    const phone = document.getElementById("register-phone");
    const state = document.getElementById("state");
    const postcode = document.getElementById("postcode");
    const password = document.getElementById("register-password");
    const confirmPassword = document.getElementById("register-confirm-password");

    attachLiveValidation(firstName, () => requireValue(firstName, "First name is required."));
    attachLiveValidation(lastName, () => requireValue(lastName, "Last name is required."));
    attachLiveValidation(email, () => validateEmail(email));
    attachLiveValidation(phone, () => validatePhone(phone));
    attachLiveValidation(state, () => validateState(state));
    attachLiveValidation(postcode, () => validatePostcode(postcode));
    attachLiveValidation(password, () => validatePassword(password));
    attachLiveValidation(confirmPassword, () => validateConfirmPassword(password, confirmPassword));

    form.addEventListener("submit", function (e) {
      let ok = true;

      ok = requireValue(firstName, "First name is required.") && ok;
      ok = requireValue(lastName, "Last name is required.") && ok;
      ok = validateEmail(email) && ok;
      ok = validatePhone(phone) && ok;
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
  });
})();
