(function () {
  "use strict";

  const PROD_APP_ORIGIN = "https://app.primedclinic.com.au";
  const PROD_RESET_PASSWORD_ENDPOINT = PROD_APP_ORIGIN + "/api/reset-password";
  const LOGIN_URL = "/sign-up-login?view=login";
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const TOKEN_PATTERN = /^[a-fA-F0-9]{32,128}$/;

  function injectStyles() {
    if (document.getElementById("primed-password-reset-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-password-reset-styles";
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

      .field-error-host > .form_input-3,
      .field-error-host > .form_input,
      .field-error-host > .w-input,
      .field-error-host > input {
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

      .primed-reset-email-locked[readonly],
      .primed-reset-email-locked[disabled] {
        background: #f7fafc;
        color: rgba(15, 23, 42, 0.78);
        cursor: not-allowed;
        pointer-events: none;
        opacity: 1;
      }

      .password-reset.is-initializing .password-reset_form-block {
        opacity: 0;
      }

      .password-reset.is-ready .password-reset_form-block,
      .password-reset.is-invalid-link .password-reset_form-block {
        opacity: 1;
        transition: opacity 0.2s ease;
      }

      .primed-reset-hidden {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function getResetContext() {
    const container = document.querySelector("#password-reset");
    if (!container) return null;

    const formBlock = container.querySelector(".password-reset_form-block");
    const form = container.querySelector("form.signup_input-form");

    if (!formBlock || !form) return null;

    return {
      container: container,
      formBlock: formBlock,
      form: form,
      emailInput: form.querySelector("#Email"),
      passwordInput: form.querySelector("#Password"),
      confirmInput: form.querySelector("#Confirm-Password"),
      submitButton: form.querySelector('input[type="submit"], button[type="submit"], button:not([type])'),
      successWrapper: formBlock.querySelector(".form_message-success-wrapper"),
      errorWrapper: formBlock.querySelector(".form_message-error-wrapper"),
      successText: formBlock.querySelector(".success-text"),
      errorText: formBlock.querySelector(".error-text"),
      title: container.querySelector(".heading-style-h1"),
      subtitle: container.querySelector(".text-size-medium-4"),
      loginLink: form.querySelector('a[href*="view=login"], a[href="/sign-up-login?view=login"]')
    };
  }

  function setContainerState(container, state) {
    if (!container) return;

    container.classList.remove("is-initializing", "is-ready", "is-invalid-link");
    container.classList.add(state);
  }

  function setElementVisible(el, isVisible) {
    if (!el) return;

    if (isVisible) {
      const originalDisplay = el.dataset.primedOriginalDisplay;
      el.style.display = typeof originalDisplay === "string" ? originalDisplay : "";
      el.classList.remove("primed-reset-hidden");
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(el.dataset, "primedOriginalDisplay")) {
      el.dataset.primedOriginalDisplay = el.style.display || "";
    }

    el.style.display = "none";
    el.classList.add("primed-reset-hidden");
  }

  function setFormSectionsVisible(form, isVisible) {
    if (!form) return;

    form.querySelectorAll(".form_field-wrapper, .form_field-2col, .form-button-wrapper").forEach(function (el) {
      setElementVisible(el, isVisible);
    });
  }

  function getErrorHost(input) {
    if (!input) return null;

    return (
      input.closest(".form_field-wrapper") ||
      input.closest(".field-label-wrapper") ||
      input.parentElement
    );
  }

  function getErrorId(input) {
    const base = input.id || input.name || input.type || "field";
    return "field-error-" + String(base).replace(/[^a-zA-Z0-9\-_:.]/g, "");
  }

  function getOrCreateErrorNode(input) {
    if (!input) return null;

    const host = getErrorHost(input);
    if (!host) return null;

    const errorId = getErrorId(input);
    let err = document.getElementById(errorId);

    if (!err) {
      err = document.createElement("div");
      err.id = errorId;
      err.className = "field-error";
      err.setAttribute("role", "alert");
      host.classList.add("field-error-host");
      host.appendChild(err);
    }

    return err;
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

  function clearPasswordValidationState(passwordInput, confirmInput) {
    [passwordInput, confirmInput].forEach(function (input) {
      if (!input) return;
      input.classList.remove("is-invalid");
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
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

  function setError(input, message) {
    if (!input) return;

    const err = getOrCreateErrorNode(input);
    if (!err) return;

    input.classList.add("is-invalid");
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", err.id);
    err.textContent = message;
    err.classList.add("is-visible");
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

  function requireValue(input, message) {
    if (!input) return true;

    const value = (input.value || "").trim();
    if (!value) {
      setError(input, message);
      return false;
    }

    clearError(input);
    return true;
  }

  function isStrongPassword(password) {
    if (!password || password.length < 8) return false;
    if (!/[A-Z]/.test(password)) return false;
    if (!/[0-9]/.test(password)) return false;
    if (!/[a-zA-Z]/.test(password)) return false;
    return true;
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

    const passwordValue = passwordInput && passwordInput.value ? passwordInput.value : "";
    const confirmValue = confirmInput && confirmInput.value ? confirmInput.value : "";

    if (!passwordValue) {
      hint.classList.remove("is-visible");
      hint.classList.remove("show-invalid");
      hint.querySelectorAll("[data-password-rule]").forEach(function (el) {
        el.classList.remove("is-met");
      });
      return;
    }

    const ruleState = getPasswordRuleState(passwordValue);
    hint.classList.add("is-visible");
    hint.classList.toggle("show-invalid", showInvalid);

    hint.querySelectorAll("[data-password-rule]").forEach(function (el) {
      const ruleName = el.getAttribute("data-password-rule");
      const isMet = ruleName === "match"
        ? getPasswordMatchState(passwordValue, confirmValue)
        : !!ruleState[ruleName];
      el.classList.toggle("is-met", isMet);
    });
  }

  function validatePassword(passwordInput, confirmInput) {
    if (!passwordInput) return false;
    if (!requireValue(passwordInput, "Password is required.")) return false;

    if (!isStrongPassword(passwordInput.value || "")) {
      renderPasswordHint(passwordInput, confirmInput, { showInvalid: true });
      clearError(passwordInput);
      markInvalidWithoutError(passwordInput, "field-hint-password-rules");
      return false;
    }

    clearError(passwordInput);
    return true;
  }

  function validateConfirmPassword(passwordInput, confirmInput) {
    if (!confirmInput) return false;
    if (!requireValue(confirmInput, "Please confirm your password.")) return false;

    if ((passwordInput && passwordInput.value ? passwordInput.value : "") !== (confirmInput.value || "")) {
      renderPasswordHint(passwordInput, confirmInput, { showInvalid: true });
      clearError(confirmInput);
      markInvalidWithoutError(confirmInput, "field-hint-password-rules");
      return false;
    }

    clearPasswordValidationState(passwordInput, confirmInput);
    clearError(confirmInput);
    return true;
  }

  function focusFirstInvalid(form) {
    if (!form) return;
    const firstInvalid = form.querySelector(".is-invalid");
    if (firstInvalid) firstInvalid.focus();
  }

  function hideMessages(ctx) {
    if (ctx.successWrapper) {
      ctx.successWrapper.style.display = "none";
      ctx.successWrapper.classList.remove("w-form-done");
    }

    if (ctx.errorWrapper) {
      ctx.errorWrapper.style.display = "none";
      ctx.errorWrapper.classList.remove("w-form-fail");
    }
  }

  function showMessage(ctx, type, message) {
    hideMessages(ctx);

    if (type === "success") {
      if (ctx.successText) ctx.successText.textContent = message;
      if (ctx.successWrapper) {
        ctx.successWrapper.style.display = "block";
        ctx.successWrapper.classList.add("w-form-done");
      }
      return;
    }

    if (ctx.errorText) ctx.errorText.textContent = message;
    if (ctx.errorWrapper) {
      ctx.errorWrapper.style.display = "block";
      ctx.errorWrapper.classList.add("w-form-fail");
    }
  }

  function setSubmitState(ctx, loading) {
    if (!ctx.submitButton) return;

    if (!ctx.submitButton.dataset.defaultLabel) {
      ctx.submitButton.dataset.defaultLabel = ctx.submitButton.tagName === "INPUT"
        ? ctx.submitButton.value
        : ctx.submitButton.textContent;
    }

    ctx.submitButton.disabled = !!loading;

    const label = loading
      ? (ctx.submitButton.dataset.loadingLabel || "Resetting password...")
      : ctx.submitButton.dataset.defaultLabel;

    if (ctx.submitButton.tagName === "INPUT") {
      ctx.submitButton.value = label;
    } else {
      ctx.submitButton.textContent = label;
    }
  }

  function getFieldValue(input) {
    return ((input ? input.value : "") || "").trim();
  }

  function getEmailFromUrl() {
    try {
      return (new URLSearchParams(window.location.search).get("email") || "").trim();
    } catch (_err) {
      return "";
    }
  }

  function getTokenFromUrl() {
    try {
      const tokenParam = (new URLSearchParams(window.location.search).get("token") || "").trim();
      if (tokenParam) return tokenParam;

      const parts = window.location.pathname.split("/").filter(Boolean);
      const resetIndex = parts.indexOf("password-reset");
      return resetIndex !== -1 && parts[resetIndex + 1]
        ? decodeURIComponent(parts[resetIndex + 1])
        : "";
    } catch (_err) {
      return "";
    }
  }

  function isValidEmail(email) {
    return EMAIL_PATTERN.test(email || "");
  }

  function isValidToken(token) {
    return TOKEN_PATTERN.test(token || "");
  }

  function getResetLinkState() {
    const email = getEmailFromUrl();
    const token = getTokenFromUrl();

    return {
      email: email,
      token: token,
      hasValidFormat: isValidEmail(email) && isValidToken(token)
    };
  }

  function ensureHiddenField(form, name, value) {
    let input = form.querySelector('input[name="' + name + '"]');
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      form.appendChild(input);
    }

    input.value = value || "";
    return input;
  }

  function lockEmailField(emailInput, email) {
    if (!emailInput) return;

    emailInput.value = email;
    emailInput.defaultValue = email;
    emailInput.readOnly = true;
    emailInput.disabled = true;
    emailInput.setAttribute("readonly", "readonly");
    emailInput.setAttribute("disabled", "disabled");
    emailInput.setAttribute("aria-readonly", "true");
    emailInput.setAttribute("aria-disabled", "true");
    emailInput.setAttribute("autocomplete", "off");
    emailInput.setAttribute("spellcheck", "false");
    emailInput.tabIndex = -1;
    emailInput.classList.add("primed-reset-email-locked");
  }

  function bindLockedEmailField(emailInput, email) {
    if (!emailInput || emailInput.__primedResetEmailLocked) return;

    emailInput.__primedResetEmailLocked = true;

    function restoreLockedValue() {
      if (emailInput.value !== email) {
        emailInput.value = email;
      }
    }

    emailInput.addEventListener("input", restoreLockedValue);
    emailInput.addEventListener("change", restoreLockedValue);
    emailInput.addEventListener("paste", function (e) {
      e.preventDefault();
      restoreLockedValue();
    });
    emailInput.addEventListener("drop", function (e) {
      e.preventDefault();
      restoreLockedValue();
    });
  }

  function setInvalidLinkState(ctx, message) {
    setContainerState(ctx.container, "is-invalid-link");
    hideMessages(ctx);
    setFormSectionsVisible(ctx.form, false);

    if (ctx.passwordInput) ctx.passwordInput.disabled = true;
    if (ctx.confirmInput) ctx.confirmInput.disabled = true;
    if (ctx.submitButton) ctx.submitButton.disabled = true;

    if (ctx.subtitle) {
      const normalizedMessage = (message || "This password reset link is invalid or incomplete.").trim();
      const endsWithPunctuation = /[.!?]$/.test(normalizedMessage);
      ctx.subtitle.textContent =
        normalizedMessage +
        (endsWithPunctuation ? "" : ".") +
        " Please request a new password reset link and try again.";
    }

    if (ctx.loginLink && !ctx.loginLink.getAttribute("href")) {
      ctx.loginLink.setAttribute("href", LOGIN_URL);
    }
  }

  function revealReadyState(ctx) {
    setContainerState(ctx.container, "is-ready");
    setFormSectionsVisible(ctx.form, true);
    if (ctx.passwordInput) ctx.passwordInput.disabled = false;
    if (ctx.confirmInput) ctx.confirmInput.disabled = false;
    if (ctx.submitButton) ctx.submitButton.disabled = false;
  }

  function getPayload(ctx) {
    const email = getEmailFromUrl();
    const token = getFieldValue(ctx.form.querySelector('input[name="token"]')) || getTokenFromUrl();

    ensureHiddenField(ctx.form, "email", email);
    ensureHiddenField(ctx.form, "token", token);

    return {
      email: email,
      token: token,
      password: ctx.passwordInput ? ctx.passwordInput.value || "" : "",
      password_confirmation: ctx.confirmInput ? ctx.confirmInput.value || "" : ""
    };
  }

  async function parseResponse(res) {
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (contentType.indexOf("application/json") !== -1) {
      return res.json().catch(function () {
        return {};
      });
    }

    const text = await res.text().catch(function () {
      return "";
    });

    return text ? { message: text } : {};
  }

  function getFirstError(errors) {
    if (!errors || typeof errors !== "object") return "";

    const keys = Object.keys(errors);
    for (let i = 0; i < keys.length; i += 1) {
      const value = errors[keys[i]];
      if (Array.isArray(value) && value.length) return String(value[0]);
      if (typeof value === "string" && value) return value;
    }

    return "";
  }

  function looksLikeInvalidLinkResponse(data) {
    if (!data) return false;

    const messages = [];

    if (typeof data.message === "string") messages.push(data.message);
    if (typeof data.error === "string") messages.push(data.error);

    if (data.errors && typeof data.errors === "object") {
      Object.keys(data.errors).forEach(function (key) {
        const value = data.errors[key];
        if (Array.isArray(value)) {
          value.forEach(function (item) {
            messages.push(String(item));
          });
        } else if (value) {
          messages.push(String(value));
        }
        messages.push(String(key));
      });
    }

    const combined = messages.join(" ").toLowerCase();
    return (
      combined.indexOf("reset link") !== -1 ||
      combined.indexOf("invalid token") !== -1 ||
      combined.indexOf("expired") !== -1 ||
      combined.indexOf("password reset token") !== -1 ||
      combined.indexOf("can't find a user") !== -1 ||
      combined.indexOf("email address") !== -1
    );
  }

  async function handleSubmit(ctx) {
    hideMessages(ctx);
    clearAllErrors(ctx.form);

    let ok = true;
    ok = validatePassword(ctx.passwordInput, ctx.confirmInput) && ok;
    ok = validateConfirmPassword(ctx.passwordInput, ctx.confirmInput) && ok;

    const payload = getPayload(ctx);

    if (!isValidEmail(payload.email)) {
      setError(ctx.emailInput, "Reset email is missing or invalid.");
      ok = false;
    }

    if (!isValidToken(payload.token)) {
      showMessage(ctx, "error", "This password reset link is invalid or has expired.");
      ok = false;
    }

    if (!ok) {
      focusFirstInvalid(ctx.form);
      return;
    }

    setSubmitState(ctx, true);

    try {
      const res = await fetch(PROD_RESET_PASSWORD_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await parseResponse(res);

      if (!res.ok) {
        if (data && data.errors && data.errors.password && ctx.passwordInput) {
          setError(ctx.passwordInput, Array.isArray(data.errors.password) ? data.errors.password[0] : String(data.errors.password));
        }

        if (data && data.errors && data.errors.password_confirmation && ctx.confirmInput) {
          setError(
            ctx.confirmInput,
            Array.isArray(data.errors.password_confirmation)
              ? data.errors.password_confirmation[0]
              : String(data.errors.password_confirmation)
          );
        }

        const message =
          (data && data.message) ||
          (data && data.error) ||
          getFirstError(data && data.errors) ||
          "Password reset failed. Please try again.";

        if (looksLikeInvalidLinkResponse(data)) {
          setInvalidLinkState(ctx, message);
          return;
        }

        showMessage(ctx, "error", message);
        focusFirstInvalid(ctx.form);
        return;
      }

      ctx.form.reset();
      lockEmailField(ctx.emailInput, payload.email);
      ensureHiddenField(ctx.form, "email", payload.email);
      ensureHiddenField(ctx.form, "token", payload.token);
      renderPasswordHint(ctx.passwordInput, ctx.confirmInput);
      showMessage(ctx, "success", (data && data.message) || "Password reset successfully. You can now log in with your new password.");
    } catch (err) {
      showMessage(ctx, "error", (err && err.message) || "Password reset failed due to a network error.");
      console.error("[PasswordResetForm] Reset error:", err);
    } finally {
      setSubmitState(ctx, false);
    }
  }

  function bindLiveValidation(ctx) {
    if (ctx.passwordInput && !ctx.passwordInput.__primedResetBound) {
      ctx.passwordInput.__primedResetBound = true;
      ctx.passwordInput.addEventListener("input", function () {
        hideMessages(ctx);
        clearPasswordValidationState(ctx.passwordInput, ctx.confirmInput);
        clearError(ctx.passwordInput);
        clearError(ctx.confirmInput);
        renderPasswordHint(ctx.passwordInput, ctx.confirmInput);
      });
    }

    if (ctx.confirmInput && !ctx.confirmInput.__primedResetBound) {
      ctx.confirmInput.__primedResetBound = true;
      ctx.confirmInput.addEventListener("input", function () {
        hideMessages(ctx);
        clearPasswordValidationState(ctx.passwordInput, ctx.confirmInput);
        clearError(ctx.passwordInput);
        clearError(ctx.confirmInput);
        renderPasswordHint(ctx.passwordInput, ctx.confirmInput);
      });
    }
  }

  function initForm(ctx) {
    if (!ctx || ctx.form.__primedPasswordResetBound) return;
    if (!ctx.emailInput || !ctx.passwordInput || !ctx.confirmInput) return;

    ctx.form.__primedPasswordResetBound = true;
    ctx.form.setAttribute("novalidate", "novalidate");

    hideMessages(ctx);
    setContainerState(ctx.container, "is-initializing");
    setFormSectionsVisible(ctx.form, false);

    const linkState = getResetLinkState();

    lockEmailField(ctx.emailInput, linkState.email);
    bindLockedEmailField(ctx.emailInput, linkState.email);
    ensureHiddenField(ctx.form, "email", linkState.email);
    ensureHiddenField(ctx.form, "token", linkState.token);
    renderPasswordHint(ctx.passwordInput, ctx.confirmInput);

    bindLiveValidation(ctx);

    if (!linkState.hasValidFormat) {
      setInvalidLinkState(ctx, "This password reset link is invalid or incomplete.");
    } else {
      revealReadyState(ctx);
    }

    ctx.form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (!ctx.container.classList.contains("is-ready")) {
        return false;
      }

      handleSubmit(ctx);
      return false;
    }, true);
  }

  function boot() {
    if (!/password-reset/i.test(window.location.pathname)) return;

    injectStyles();
    const ctx = getResetContext();
    if (!ctx) return;

    initForm(ctx);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
