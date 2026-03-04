/* register-form-v-2.js — works with existing Webflow div#signup-form structure */

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────
  const CSRF_TTL_SECONDS   = 7200;
  const CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  const REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/register/guest",
  };
  const LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/login",
  };
  const SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };

  // ── Endpoint resolver ────────────────────────────────────────────────────
  function resolveEndpoint(map) {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return Object.values(map)[0];
  }

  // ── Cookie helpers ────────────────────────────────────────────────────────
  function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ──────────────────────────────────────────────────────────────────
  function csrfIsValid() {
    const xsrfToken = getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(getCookie(CSRF_EXPIRY_COOKIE) || "", 10);
    if (!xsrfToken || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async function ensureCsrfCookie() {
    if (csrfIsValid()) return;
    await fetch(resolveEndpoint(SANCTUM_CSRF_ENDPOINT_MAP), { method: "GET", credentials: "include" });
    const expiresAt = Math.floor(Date.now() / 1000) + CSRF_TTL_SECONDS;
    setCookie(CSRF_EXPIRY_COOKIE, String(expiresAt), CSRF_TTL_SECONDS);
  }

  // ── JWT / session cookie ──────────────────────────────────────────────────
  async function generateUserToken() {
    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
    const header  = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({ iat: Math.floor(Date.now() / 1000), jti: crypto.randomUUID(), session: true });
    const signingKey = await crypto.subtle.generateKey({ name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("HMAC", signingKey, new TextEncoder().encode(`${header}.${payload}`));
    return `${header}.${payload}.${b64url(sigBuf)}`;
  }

  async function setUserSessionCookie() {
    const token  = await generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  // ── Safe redirect validator ───────────────────────────────────────────────
  function safeRedirectUrl(rawUrl) {
    if (!rawUrl) return null;
    try {
      const u = new URL(rawUrl, window.location.origin);
      const allowedHosts = new Set([
        "app.primedclinic.com.au",
        "primedclinic.com.au",
        "www.primedclinic.com.au",
        "dev-frontend.primedclinic.com.au",
        "api.dev.primedclinic.com.au",
      ]);
      if (!allowedHosts.has(u.hostname)) return null;
      return u.toString();
    } catch {
      return null;
    }
  }

  // ── Referral code from URL ────────────────────────────────────────────────
  function getReferralCodeFromUrl() {
    try {
      return (new URLSearchParams(window.location.search).get("referral_code") || "").trim();
    } catch {
      return "";
    }
  }

  // ── DOM injection ─────────────────────────────────────────────────────────
  // Replaces the existing Webflow signup form content with the controlled markup.
  function injectRegisterForm(container) {
    container.innerHTML = `
      <div id="get-started" class="margin-bottom margin-medium get-started">
        <div class="text-align-center">
          <div class="max-width-large align-center">
            <div class="margin-bottom margin-small">
              <h1 class="heading-style-h1 text-align-center margin-bottom margin-small">Get Started</h1>
            </div>
            <p class="text-size-medium">Your health data stays private. Create an account to get started.</p>
          </div>
        </div>
      </div>

      <div class="max-width-small align-center">
        <div class="sign-up-login_header_form-block w-form">
          <form
            name="wf-form-Register-Form"
            method="get"
            class="sign-up-login_header_form"
            aria-label="Register Form"
            id="register-form-el"
            novalidate
          >
            <div class="form_field-2col">
              <div class="form_field-wrapper">
                <input class="form_input w-input" maxlength="256" name="First-Name"
                  placeholder="First Name" type="text" id="register-first-name" required />
              </div>
              <div class="form_field-wrapper">
                <input class="form_input w-input" maxlength="256" name="Last-Name"
                  placeholder="Last Name" type="text" id="register-last-name" required />
              </div>
            </div>

            <div class="form_field-wrapper">
              <input class="form_input w-input" maxlength="256" name="Register-Email"
                placeholder="Email" type="email" id="register-email" required />
            </div>

            <div class="form_field-wrapper">
              <input class="form_input w-input" maxlength="256" name="Phone"
                placeholder="Phone Number" type="tel" id="register-phone" required />
            </div>

            <div class="form_field-wrapper">
              <input class="form_input w-input" maxlength="256" name="Address"
                placeholder="Address" type="text" id="register-address" required />
            </div>

            <div id="address-details-wrapper" style="display:none;">
              <div class="form_field-2col">
                <div class="form_field-wrapper">
                  <input class="form_input w-input" maxlength="256" name="streetNumber"
                    placeholder="Street Number" type="text" id="streetNumber"
                    autocomplete="address-line1" required aria-required="true" />
                </div>
                <div class="form_field-wrapper">
                  <input class="form_input w-input" maxlength="256" name="streetName"
                    placeholder="Street Name" type="text" id="streetName"
                    required aria-required="true" />
                </div>
              </div>
              <div class="form_field-2col">
                <div class="form_field-wrapper">
                  <input class="form_input w-input" maxlength="256" name="suburb"
                    placeholder="Suburb" type="text" id="suburb"
                    autocomplete="address-level2" required aria-required="true" />
                </div>
                <div class="form_field-wrapper">
                  <input class="form_input w-input" maxlength="256" name="state"
                    placeholder="State" type="text" id="state"
                    autocomplete="address-level1" required aria-required="true" />
                </div>
                <div class="form_field-wrapper">
                  <input class="form_input w-input" maxlength="256" name="postcode"
                    placeholder="Postcode" type="text" id="postcode"
                    autocomplete="postal-code" inputmode="numeric"
                    required aria-required="true" />
                </div>
              </div>
            </div>

            <div class="form_field-2col">
              <div class="form_field-wrapper">
                <input class="form_input w-input" maxlength="256" name="Register-Password"
                  placeholder="Password" type="password" id="register-password" required />
              </div>
              <div class="form_field-wrapper">
                <input class="form_input w-input" maxlength="256" name="Register-Confirm-Password"
                  placeholder="Confirm Password" type="password"
                  id="register-confirm-password" required />
              </div>
            </div>

            <div class="form_field-error" id="password-error" style="display:none;">
              Passwords do not match.
            </div>

            <div class="form_field-wrapper">
              <input class="form_input w-input" maxlength="256" name="Referral-Code"
                placeholder="Referral Code" type="text" id="register-referral-code" />
            </div>

            <div class="form_message-error-wrapper w-form-fail"
                data-register-error-wrapper="true"
                style="display:none;">
              <div class="form_message-error">
                <div data-register-error="true"></div>
              </div>
            </div>

            <div class="w-layout-grid form-button-wrapper align-center">
              <input type="submit" class="button is-full-width w-button"
                value="Create account & Continue" id="register-submit" />
            </div>

            <div class="button-group is-center">
              <a href="#" class="button-glide-over w-inline-block" id="back-to-login">
                <span class="button-glide-over__container">
                  <span class="button-glide-over__icon is-first">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path>
                    </svg>
                  </span>
                  <span class="button-glide-over__text">Back to Login</span>
                  <span class="button-glide-over__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path>
                    </svg>
                  </span>
                </span>
                <div class="button-glide-over__background"></div>
              </a>
            </div>

            <div class="sr-only" aria-live="polite" id="form-status"></div>
          </form>
        </div>
      </div>
    `;

    // Pre-fill referral code if in URL
    const ref      = getReferralCodeFromUrl();
    const refInput = container.querySelector("#register-referral-code");
    if (refInput && ref) refInput.value = ref;

    console.log("[RegisterForm] HTML injected into #signup-form");
  }

  // ── Main controller ───────────────────────────────────────────────────────
  class RegisterFormController {
    constructor(container) {
      this.container = container;
    }

    init() {
      injectRegisterForm(this.container);
      this._bindEvents();
    }

    // ── UI helpers ────────────────────────────────────────────────────────
    _showError(message) {
      const wrapper = this.container.querySelector("[data-register-error-wrapper]");
      const el      = this.container.querySelector("[data-register-error]");
      if (el)      el.textContent = message;
      if (wrapper) { wrapper.classList.add("w-form-fail"); wrapper.style.display = "block"; }
    }

    _hideError() {
      const wrapper = this.container.querySelector("[data-register-error-wrapper]");
      if (wrapper)  { wrapper.classList.remove("w-form-fail"); wrapper.style.display = "none"; }
    }

    _setSubmitState(loading) {
      const btn = this.container.querySelector("#register-submit");
      if (!btn) return;
      btn.disabled = loading;
      btn.value    = loading ? "Please wait..." : "Create account & Continue";
    }

    // ── Survey ────────────────────────────────────────────────────────────
    _showSurvey(userId, dashboardUrl) {
      if (userId) sessionStorage.setItem("userId", String(userId));
      this.container.style.display = "none";
      const surveyDiv = document.querySelector("#primed-survey");
      if (surveyDiv) {
        if (dashboardUrl) surveyDiv.setAttribute("data-dashboard-url", dashboardUrl);
        surveyDiv.style.display = "block";
      } else {
        console.warn("[RegisterForm] #primed-survey not found");
      }
    }

    // ── Auto-login after registration ─────────────────────────────────────
    async _autoLogin(email, password, userId) {
      let dashboardUrl = null;
      try {
        await ensureCsrfCookie();
        const xsrfToken = getCookie("XSRF-TOKEN");
        const res  = await fetch(resolveEndpoint(LOGIN_ENDPOINT_MAP), {
          method: "POST", credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          await setUserSessionCookie();
          dashboardUrl = safeRedirectUrl(data?.panel?.url);
        } else {
          console.warn("[RegisterForm] Auto-login failed, continuing without session");
        }
      } catch (err) {
        console.warn("[RegisterForm] Auto-login error, continuing without session", err);
      }
      this._showSurvey(userId, dashboardUrl);
    }

    // ── Register submit handler ───────────────────────────────────────────
    async _handleSubmit(e) {
      e.preventDefault();
      e.stopPropagation();

      const password = this.container.querySelector("#register-password");
      const confirm  = this.container.querySelector("#register-confirm-password");
      const pwError  = this.container.querySelector("#password-error");

      if (!password || !confirm || !pwError) {
        this._showError("Form is missing required fields. Please refresh the page.");
        return;
      }

      if (password.value !== confirm.value) {
        pwError.style.display = "block";
        confirm.classList.add("is-error");
        password.classList.add("is-error");
        confirm.focus();
        return;
      }

      this._hideError();
      this._setSubmitState(true);

      try {
        await ensureCsrfCookie();
        const xsrfToken = getCookie("XSRF-TOKEN");
        const email     = (this.container.querySelector("#register-email")?.value || "").trim();

        const payload = {
          first_name:    (this.container.querySelector("#register-first-name")?.value  || "").trim(),
          last_name:     (this.container.querySelector("#register-last-name")?.value   || "").trim(),
          email,
          phone:         (this.container.querySelector("#register-phone")?.value       || "").trim(),
          address:       (this.container.querySelector("#register-address")?.value     || "").trim(),
          streetNumber:  (this.container.querySelector("#streetNumber")?.value         || "").trim(),
          streetName:    (this.container.querySelector("#streetName")?.value           || "").trim(),
          suburb:        (this.container.querySelector("#suburb")?.value               || "").trim(),
          state:         (this.container.querySelector("#state")?.value                || "").trim(),
          postcode:      (this.container.querySelector("#postcode")?.value             || "").trim(),
          password:      password.value,
          referral_code: getReferralCodeFromUrl(),
        };

        const res  = await fetch(resolveEndpoint(REGISTER_ENDPOINT_MAP), {
          method: "POST", credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          this._showError(data?.message || data?.error || "Registration failed. Please check your details and try again.");
          return;
        }

        await this._autoLogin(email, password.value, data.user_id);

      } catch (err) {
        this._showError(err?.message || "Registration failed due to a network error.");
        console.error("[RegisterForm] Register error:", err);
      } finally {
        this._setSubmitState(false);
      }
    }

    // ── Back to login ─────────────────────────────────────────────────────
    _handleBackToLogin() {
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      if (url.hash === "#register") url.hash = "";
      history.replaceState(null, "", url.toString());

      this.container.style.display = "none";

      const loginContainer = document.querySelector("#login-form");
      if (!loginContainer) {
        console.error("[RegisterForm] #login-form not found");
        return;
      }

      loginContainer.style.display = "block";
      loginContainer.querySelector('[data-login-email="true"]')?.focus();
    }

    // ── Event binding ─────────────────────────────────────────────────────
    _bindEvents() {
      const form    = this.container.querySelector("#register-form-el");
      const confirm = this.container.querySelector("#register-confirm-password");
      const pwError = this.container.querySelector("#password-error");
      const backBtn = this.container.querySelector("#back-to-login");

      if (!form) {
        console.error("[RegisterForm] #register-form-el not found, cannot bind events");
        return;
      }

      // Clear password mismatch error on re-type
      confirm?.addEventListener("input", () => {
        if (pwError?.style.display === "block") {
          pwError.style.display = "none";
          confirm.classList.remove("is-error");
          this.container.querySelector("#register-password")?.classList.remove("is-error");
        }
      });

      form.addEventListener("submit", (e) => this._handleSubmit(e));

      backBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        this._handleBackToLogin();
      });
    }
  }

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  function init() {
    const container = document.querySelector("#signup-form");
    if (!container) {
      console.warn("[RegisterForm] #signup-form not found in DOM.");
      return;
    }
    const ctrl = new RegisterFormController(container);
    ctrl.init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
