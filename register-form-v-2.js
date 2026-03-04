/* register-form-v-2.js */
class RegisterForm extends HTMLElement {
  // ── Config ──────────────────────────────────────────────────────────────
  static CSRF_TTL_SECONDS = 7200;
  static CSRF_EXPIRY_COOKIE = "wf_csrf_expires_at";

  static REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/register/guest",
  };

  static LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/api/login",
  };

  static SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au": "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };

  // ── Host resolver ───────────────────────────────────────────────────────
  static _resolveEndpoint(map) {
    const hostname = window.location.hostname;
    console.log("[RegisterForm] Resolving endpoint for hostname:", hostname);

    for (const [key, url] of Object.entries(map)) {
      if (hostname === key || hostname.endsWith("." + key)) {
        console.log("[RegisterForm] Endpoint matched for key:", key, "=>", url);
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

  // ── Lifecycle ───────────────────────────────────────────────────────────
  connectedCallback() {
    console.log("[RegisterForm] Component connected");

    this.innerHTML = `
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
          autocomplete="address-line1" required aria-required="true">
      </div>
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="streetName"
          placeholder="Street Name" type="text" id="streetName" required aria-required="true">
      </div>
    </div>

    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="suburb"
          placeholder="Suburb" type="text" id="suburb" autocomplete="address-level2" required aria-required="true">
      </div>
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="state"
          placeholder="State" type="text" id="state" autocomplete="address-level1" required aria-required="true">
      </div>
      <div class="form_field-wrapper">
        <input class="form_input w-input" maxlength="256" name="postcode"
          placeholder="Postcode" type="text" id="postcode" autocomplete="postal-code"
          inputmode="numeric" required aria-required="true">
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
        placeholder="Confirm Password" type="password" id="register-confirm-password" required />
    </div>
  </div>

  <div class="form_field-error" id="password-error" style="display:none">
    Passwords do not match.
  </div>

  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Referral-Code"
      placeholder="Referral Code" type="text" id="register-referral-code" />
  </div>

  <div class="form_message-error-wrapper w-form-fail"
       data-register-error-wrapper="true"
       style="display:none">
    <div class="form_message-error">
      <div data-register-error="true"></div>
    </div>
  </div>

  <div class="w-layout-grid form-button-wrapper">
    <input type="submit" class="button is-full-width w-button"
      value="Create account & Continue" id="register-submit" />
  </div>

  <div class="button-group is-center">
    <a href="#" class="button-glide-over w-inline-block" id="back-to-login">
      <span class="button-glide-over__container">
        <span class="button-glide-over__text">Back to Login</span>
      </span>
      <div class="button-glide-over__background"></div>
    </a>
  </div>

  <input type="hidden" name="cf-turnstile-response" id="cf-chl-widget-a8hv1_response" value="...">
  <div class="sr-only" aria-live="polite" id="form-status"></div>
</form>
    `;

    console.log("[RegisterForm] HTML injected. register-form-el exists?", !!this.querySelector("#register-form-el"));

    const ref = this._getReferralCodeFromUrl();
    console.log("[RegisterForm] Referral code from URL:", ref);

    const refInput = this.querySelector("#register-referral-code");
    if (refInput && ref) {
      refInput.value = ref;
      console.log("[RegisterForm] Referral code applied to input");
    }

    this._bindEvents();
  }

  // ── Referral code ───────────────────────────────────────────────────────
  _getReferralCodeFromUrl() {
    console.log("[RegisterForm] Reading referral code from URL");
    try {
      const code = (new URLSearchParams(window.location.search).get("referral_code") || "").trim();
      console.log("[RegisterForm] Referral code detected:", code);
      return code;
    } catch (err) {
      console.warn("[RegisterForm] Failed to read referral code", err);
      return "";
    }
  }

  // ── Cookie helpers ──────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    const value = match ? decodeURIComponent(match[2]) : null;
    console.log("[RegisterForm] Get cookie:", name, value ? "(present)" : "(missing)");
    return value;
  }

  _setCookie(name, value, maxAgeSeconds) {
    console.log("[RegisterForm] Setting cookie:", name, "maxAgeSeconds:", maxAgeSeconds);
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ────────────────────────────────────────────────────────────────
  _csrfIsValid() {
    console.log("[RegisterForm] Checking CSRF validity");
    const xsrfToken = this._getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(this._getCookie(RegisterForm.CSRF_EXPIRY_COOKIE) || "", 10);

    if (!xsrfToken || !Number.isFinite(expiresAt)) {
      console.log("[RegisterForm] CSRF invalid: missing token or expiry");
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const valid = now < expiresAt;

    console.log("[RegisterForm] CSRF expiry check:", { now, expiresAt, valid });
    return valid;
  }

  async _ensureCsrfCookie() {
    console.log("[RegisterForm] Ensuring CSRF cookie");
    if (this._csrfIsValid()) {
      console.log("[RegisterForm] CSRF already valid, skipping fetch");
      return;
    }

    const endpoint = RegisterForm.SANCTUM_CSRF_ENDPOINT;
    console.log("[RegisterForm] Fetching CSRF cookie from:", endpoint);

    await fetch(endpoint, { method: "GET", credentials: "include" });

    const expiresAt = Math.floor(Date.now() / 1000) + RegisterForm.CSRF_TTL_SECONDS;
    this._setCookie(RegisterForm.CSRF_EXPIRY_COOKIE, String(expiresAt), RegisterForm.CSRF_TTL_SECONDS);

    console.log("[RegisterForm] CSRF refreshed. ExpiresAt:", expiresAt);
  }

  // ── UI helpers ──────────────────────────────────────────────────────────
  _showError(message) {
    console.warn("[RegisterForm] Showing error:", message);

    const wrapper = this.querySelector("[data-register-error-wrapper]");
    const el = this.querySelector("[data-register-error]");

    if (el) el.textContent = message;

    if (wrapper) {
      wrapper.classList.add("w-form-fail");
      wrapper.style.display = "block";
    }
  }

  _hideError() {
    console.log("[RegisterForm] Hiding error");
    const wrapper = this.querySelector("[data-register-error-wrapper]");
    if (wrapper) {
      wrapper.classList.remove("w-form-fail");
      wrapper.style.display = "none";
    }
  }

  _setSubmitState(submitBtn, loading) {
    console.log("[RegisterForm] Submit state:", loading ? "loading" : "idle");
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.value = loading ? "Please wait..." : "Create account & Continue";
  }

  // ── JWT / session cookie ────────────────────────────────────────────────
  async _generateUserToken() {
    console.log("[RegisterForm] Generating user token");

    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

    const header = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      session: true,
    });

    console.log("[RegisterForm] Token header/payload ready");

    const signingKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    console.log("[RegisterForm] Signing key generated");

    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    console.log("[RegisterForm] Token signature created");

    return `${header}.${payload}.${b64url(sigBuf)}`;
  }

  async _setUserSessionCookie() {
    console.log("[RegisterForm] Setting __user session cookie");

    const token = await this._generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";

    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;

    console.log("[RegisterForm] __user cookie set");
  }

  // ── Safe redirect validator ─────────────────────────────────────────────
  _safeRedirectUrl(rawUrl) {
    console.log("[RegisterForm] Validating redirect URL:", rawUrl);

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

      if (!allowedHosts.has(u.hostname)) {
        console.warn("[RegisterForm] Redirect blocked due to host:", u.hostname);
        return null;
      }

      console.log("[RegisterForm] Redirect allowed:", u.toString());
      return u.toString();
    } catch (err) {
      console.warn("[RegisterForm] Redirect URL invalid:", err);
      return null;
    }
  }

  // ── Show survey widget ───────────────────────────────────────────────────
  _showSurvey(userId, dashboardUrl) {
    console.log("[RegisterForm] Showing survey:", { userId, dashboardUrl });

    if (userId) {
      sessionStorage.setItem("userId", String(userId));
      console.log("[RegisterForm] userId saved to sessionStorage");
    } else {
      console.warn("[RegisterForm] userId missing, survey will still show");
    }

    this.style.display = "none";
    console.log("[RegisterForm] Register form hidden");

    const surveyDiv = document.querySelector("#primed-survey");
    if (surveyDiv) {
      if (dashboardUrl) {
        surveyDiv.setAttribute("data-dashboard-url", dashboardUrl);
        console.log("[RegisterForm] Survey data-dashboard-url set:", dashboardUrl);
      }
      surveyDiv.style.display = "block";
      console.log("[RegisterForm] Survey shown");
    } else {
      console.warn("[RegisterForm] Survey container #primed-survey not found");
    }
  }

  // ── Auto-login ──────────────────────────────────────────────────────────
  async _autoLogin(email, password, userId) {
    console.log("[RegisterForm] Auto-login started:", { email, userId });

    let dashboardUrl = null;

    try {
      await this._ensureCsrfCookie();

      const xsrfToken = this._getCookie("XSRF-TOKEN");
      const endpoint = RegisterForm.LOGIN_ENDPOINT;

      console.log("[RegisterForm] Sending login request to:", endpoint);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("[RegisterForm] Login response status:", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("[RegisterForm] Login response body:", data);

      if (res.ok) {
        await this._setUserSessionCookie();
        dashboardUrl = this._safeRedirectUrl(data?.panel?.url);
        console.log("[RegisterForm] Auto-login successful. dashboardUrl:", dashboardUrl);
      } else {
        console.warn("[RegisterForm] Auto-login failed, continuing without session");
      }
    } catch (err) {
      console.warn("[RegisterForm] Auto-login error, continuing without session", err);
    }

    this._showSurvey(userId, dashboardUrl);
  }

  // ── Register handler ────────────────────────────────────────────────────
  async _handleSubmit(e) {
    console.log("[RegisterForm] Submit handler triggered");

    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    const password = this.querySelector("#register-password");
    const confirm = this.querySelector("#register-confirm-password");
    const pwError = this.querySelector("#password-error");
    const submitBtn = form.querySelector('input[type="submit"]');

    console.log("[RegisterForm] Submit elements:", {
      form: !!form,
      password: !!password,
      confirm: !!confirm,
      pwError: !!pwError,
      submitBtn: !!submitBtn,
    });

    if (!password || !confirm || !pwError) {
      this._showError("Form is missing required fields. Please refresh the page.");
      console.error("[RegisterForm] Missing password/confirm/pwError elements");
      return;
    }

    if (password.value !== confirm.value) {
      console.warn("[RegisterForm] Passwords do not match");
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
      const email = (this.querySelector("#register-email")?.value || "").trim();

      const payload = {
        first_name: (this.querySelector("#register-first-name")?.value || "").trim(),
        last_name: (this.querySelector("#register-last-name")?.value || "").trim(),
        email,
        phone: (this.querySelector("#register-phone")?.value || "").trim(),
        address: (this.querySelector("#register-address")?.value || "").trim(),
        streetNumber: "",
        streetName: "",
        suburb: "",
        state: "",
        postcode: "",
        password: password.value,
        referral_code: this._getReferralCodeFromUrl(),
      };

      const endpoint = RegisterForm.REGISTER_ENDPOINT;
      console.log("[RegisterForm] Sending register request to:", endpoint);
      console.log("[RegisterForm] Register payload:", payload);

      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        body: JSON.stringify(payload),
      });

      console.log("[RegisterForm] Register response status:", res.status);

      const data = await res.json().catch(() => ({}));
      console.log("[RegisterForm] Register response body:", data);

      if (!res.ok) {
        const msg =
          data?.message ||
          data?.error ||
          "Registration failed. Please check your details and try again.";
        this._showError(msg);
        console.warn("[RegisterForm] Registration failed with message:", msg);
        return;
      }

      console.log("[RegisterForm] Registration successful. user_id:", data.user_id);

      await this._autoLogin(email, password.value, data.user_id);
    } catch (err) {
      this._showError(err?.message || "Registration failed due to a network error.");
      console.error("[RegisterForm] Register error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  // ── Event binding ───────────────────────────────────────────────────────
  _bindEvents() {
    console.log("[RegisterForm] Binding form events");

    const form = this.querySelector("#register-form-el");
    const password = this.querySelector("#register-password");
    const confirm = this.querySelector("#register-confirm-password");
    const pwError = this.querySelector("#password-error");
    const backBtn = this.querySelector("#back-to-login");

    console.log("[RegisterForm] Elements found:", {
      form: !!form,
      password: !!password,
      confirm: !!confirm,
      pwError: !!pwError,
      backBtn: !!backBtn,
    });

    const missing = [];
    if (!form) missing.push("#register-form-el");
    if (!password) missing.push("#register-password");
    if (!confirm) missing.push("#register-confirm-password");
    if (!pwError) missing.push("#password-error");
    if (!backBtn) missing.push("#back-to-login");

    if (missing.length) {
      console.error("[RegisterForm] Cannot bind events. Missing elements:", missing);
      return;
    }

    confirm.addEventListener("input", () => {
      if (pwError.style.display === "block") {
        console.log("[RegisterForm] Password mismatch cleared");
        pwError.style.display = "none";
        confirm.classList.remove("is-error");
        password.classList.remove("is-error");
      }
    });

    form.addEventListener("submit", (e) => {
      console.log("[RegisterForm] Submit event fired");
      this._handleSubmit(e);
    });

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

    console.log("[RegisterForm] Event binding complete");
  }
}

customElements.define("register-form", RegisterForm);
