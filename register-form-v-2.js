/* register-form.js */
class RegisterForm extends HTMLElement {

  static CSRF_TTL_SECONDS   = 7200;
  static CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  static REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/register/guest",
  };

  static LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/api/login",
  };

  static SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };

  // ── Host resolver ────────────────────────────────────────────────────────
  static _resolveEndpoint(map) {
    const hostname = window.location.hostname;
    console.log("[RegisterForm] Resolving endpoint for hostname:", hostname);

    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) {
        console.log("[RegisterForm] Endpoint matched:", url);
        return url;
      }
    }

    console.error("[RegisterForm] No endpoint configured for host:", hostname);
    throw new Error(`No endpoint configured for host: ${hostname}`);
  }

  static get REGISTER_ENDPOINT() {
    return this._resolveEndpoint(this.REGISTER_ENDPOINT_MAP);
  }

  static get LOGIN_ENDPOINT() {
    return this._resolveEndpoint(this.LOGIN_ENDPOINT_MAP);
  }

  static get SANCTUM_CSRF_ENDPOINT() {
    return this._resolveEndpoint(this.SANCTUM_CSRF_ENDPOINT_MAP);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  connectedCallback() {
    console.log("[RegisterForm] Component connected");

    this.innerHTML = `...`; // (kept same)

    const ref = this._getReferralCodeFromUrl();
    console.log("[RegisterForm] Referral code from URL:", ref);

    const refInput = this.querySelector("#register-referral-code");
    if (refInput && ref) {
      refInput.value = ref;
      console.log("[RegisterForm] Referral code applied to form");
    }

    this._bindEvents();
  }

  // ── Referral code ────────────────────────────────────────────────────────
  _getReferralCodeFromUrl() {
    console.log("[RegisterForm] Reading referral code from URL");

    try {
      const code = (new URLSearchParams(window.location.search)
        .get("referral_code") || "").trim();

      console.log("[RegisterForm] Referral code detected:", code);
      return code;

    } catch (err) {
      console.warn("[RegisterForm] Failed to read referral code", err);
      return "";
    }
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    const value = match ? decodeURIComponent(match[2]) : null;

    console.log("[RegisterForm] Get cookie:", name, value);

    return value;
  }

  _setCookie(name, value, maxAgeSeconds) {
    console.log("[RegisterForm] Setting cookie:", name, value);

    const secure = location.protocol === "https:" ? "; Secure" : "";

    document.cookie =
      `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ─────────────────────────────────────────────────────────────────
  _csrfIsValid() {
    console.log("[RegisterForm] Checking CSRF validity");

    const xsrfToken = this._getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(this._getCookie(RegisterForm.CSRF_EXPIRY_COOKIE) || "", 10);

    if (!xsrfToken || !Number.isFinite(expiresAt)) {
      console.log("[RegisterForm] CSRF invalid");
      return false;
    }

    const valid = Math.floor(Date.now() / 1000) < expiresAt;

    console.log("[RegisterForm] CSRF valid:", valid);
    return valid;
  }

  async _ensureCsrfCookie() {

    console.log("[RegisterForm] Ensuring CSRF cookie");

    if (this._csrfIsValid()) {
      console.log("[RegisterForm] Existing CSRF still valid");
      return;
    }

    console.log("[RegisterForm] Fetching new CSRF cookie");

    await fetch(RegisterForm.SANCTUM_CSRF_ENDPOINT, {
      method: "GET",
      credentials: "include"
    });

    const expiresAt =
      Math.floor(Date.now() / 1000) + RegisterForm.CSRF_TTL_SECONDS;

    this._setCookie(
      RegisterForm.CSRF_EXPIRY_COOKIE,
      String(expiresAt),
      RegisterForm.CSRF_TTL_SECONDS
    );

    console.log("[RegisterForm] CSRF cookie refreshed");
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  _showError(message) {

    console.warn("[RegisterForm] Showing error:", message);

    const wrapper = this.querySelector("[data-register-error-wrapper]");
    const el      = this.querySelector("[data-register-error]");

    if (el) el.textContent = message;

    if (wrapper) {
      wrapper.classList.add("w-form-fail");
      wrapper.style.display = "block";
    }
  }

  _hideError() {
    console.log("[RegisterForm] Hiding error");

    const wrapper = this.querySelector("[data-register-error-wrapper");

    if (wrapper) {
      wrapper.classList.remove("w-form-fail");
      wrapper.style.display = "none";
    }
  }

  _setSubmitState(submitBtn, loading) {

    console.log("[RegisterForm] Submit button state:", loading);

    if (!submitBtn) return;

    submitBtn.disabled = loading;
    submitBtn.value = loading
      ? "Please wait..."
      : "Create account & Continue";
  }

  // ── JWT / session cookie ─────────────────────────────────────────────────
  async _generateUserToken() {

    console.log("[RegisterForm] Generating user session token");

    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const encode  = (obj) =>
      b64url(new TextEncoder().encode(JSON.stringify(obj)));

    const header  = encode({ alg: "HS256", typ: "JWT" });

    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      session: true
    });

    const signingKey =
      await crypto.subtle.generateKey(
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

    const sigBuf =
      await crypto.subtle.sign(
        "HMAC",
        signingKey,
        new TextEncoder().encode(`${header}.${payload}`)
      );

    const token = `${header}.${payload}.${b64url(sigBuf)}`;

    console.log("[RegisterForm] Token generated");

    return token;
  }

  async _setUserSessionCookie() {

    console.log("[RegisterForm] Setting user session cookie");

    const token = await this._generateUserToken();

    const secure =
      location.protocol === "https:" ? "; Secure" : "";

    document.cookie =
      `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  // ── Survey display ───────────────────────────────────────────────────────
  _showSurvey(userId, dashboardUrl) {

    console.log("[RegisterForm] Showing survey", {
      userId,
      dashboardUrl
    });

    if (userId) {
      sessionStorage.setItem("userId", String(userId));
    }

    this.style.display = "none";

    const surveyDiv = document.querySelector("#primed-survey");

    if (surveyDiv) {

      if (dashboardUrl) {
        surveyDiv.setAttribute("data-dashboard-url", dashboardUrl);
      }

      surveyDiv.style.display = "block";
    }
  }

  // ── Auto login ───────────────────────────────────────────────────────────
  async _autoLogin(email, password, userId) {

    console.log("[RegisterForm] Starting auto-login");

    let dashboardUrl = null;

    try {

      await this._ensureCsrfCookie();

      const xsrfToken = this._getCookie("XSRF-TOKEN");

      console.log("[RegisterForm] Login request sending");

      const res = await fetch(RegisterForm.LOGIN_ENDPOINT, {

        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
        },

        body: JSON.stringify({ email, password })

      });

      const data = await res.json().catch(() => ({}));

      console.log("[RegisterForm] Login response:", data);

      if (res.ok) {

        await this._setUserSessionCookie();

        dashboardUrl =
          this._safeRedirectUrl(data?.panel?.url);

        console.log("[RegisterForm] Auto-login success");

      } else {

        console.warn("[RegisterForm] Auto-login failed");

      }

    } catch (err) {

      console.error("[RegisterForm] Auto-login error", err);

    }

    this._showSurvey(userId, dashboardUrl);
  }

  // ── Register handler ─────────────────────────────────────────────────────
  async _handleSubmit(e) {

    console.log("[RegisterForm] Form submit triggered");

    e.preventDefault();
    e.stopPropagation();

    const form      = e.currentTarget;
    const password  = this.querySelector("#register-password");
    const confirm   = this.querySelector("#register-confirm-password");
    const pwError   = this.querySelector("#password-error");
    const submitBtn = form.querySelector('input[type="submit"]');

    if (password.value !== confirm.value) {

      console.warn("[RegisterForm] Password mismatch");

      pwError.style.display = "block";
      confirm.classList.add("is-error");
      password.classList.add("is-error");

      confirm.focus();
      return;
    }

    this._hideError();
    this._setSubmitState(submitBtn, true);

    try {

      await this._ensureCsrfCookie();

      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const email =
        (this.querySelector("#register-email")?.value || "").trim();

      const payload = {

        first_name:
          (this.querySelector("#register-first-name")?.value || "").trim(),

        last_name:
          (this.querySelector("#register-last-name")?.value || "").trim(),

        email,

        phone:
          (this.querySelector("#register-phone")?.value || "").trim(),

        address:
          (this.querySelector("#register-address")?.value || "").trim(),

        streetNumber: "",
        streetName: "",
        suburb: "",
        state: "",
        postcode: "",

        password: password.value,

        referral_code: this._getReferralCodeFromUrl()
      };

      console.log("[RegisterForm] Sending register request:", payload);

      const res = await fetch(RegisterForm.REGISTER_ENDPOINT, {

        method: "POST",
        credentials: "include",

        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
        },

        body: JSON.stringify(payload)

      });

      const data = await res.json().catch(() => ({}));

      console.log("[RegisterForm] Register response:", data);

      if (!res.ok) {

        const msg =
          data?.message ||
          data?.error ||
          "Registration failed.";

        this._showError(msg);
        return;
      }

      console.log("[RegisterForm] Registration successful");

      await this._autoLogin(email, password.value, data.user_id);

    } catch (err) {

      console.error("[RegisterForm] Register error:", err);

      this._showError(
        err.message ||
        "Registration failed due to a network error."
      );

    } finally {

      this._setSubmitState(submitBtn, false);

    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {

    console.log("[RegisterForm] Binding form events");

    const form     = this.querySelector("#register-form-el");
    const password = this.querySelector("#register-password");
    const confirm  = this.querySelector("#register-confirm-password");
    const pwError  = this.querySelector("#password-error");
    const backBtn  = this.querySelector("#back-to-login");

    confirm.addEventListener("input", () => {

      if (pwError.style.display === "block") {

        console.log("[RegisterForm] Password mismatch cleared");

        pwError.style.display = "none";

        confirm.classList.remove("is-error");
        password.classList.remove("is-error");
      }
    });

    form.addEventListener("submit", (e) => this._handleSubmit(e));

    backBtn.addEventListener("click", (e) => {

      console.log("[RegisterForm] Back to login clicked");

      e.preventDefault();

      const url = new URL(window.location.href);

      url.searchParams.delete("view");

      if (url.hash === "#register") url.hash = "";

      history.replaceState(null, "", url.toString());

      const loginForm = document.createElement("login-form");

      this.replaceWith(loginForm);
    });
  }
}

customElements.define("register-form", RegisterForm);
