class RegisterForm extends HTMLElement {

  // ── Config ──────────────────────────────────────────────────────────────
  static REGISTER_ENDPOINT     = "https://api.dev.primedclinic.com.au/api/register/guest";
  static SANCTUM_CSRF_ENDPOINT = "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie";
  static CSRF_TTL_SECONDS      = 7200;
  static CSRF_EXPIRY_COOKIE    = "wf_csrf_expires_at";

  // Domain → login endpoint map (mirrors login-form.js)
  static REGISTER_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/register/guest",
    "www.primedclinic.com.au":              "https://app.primedclinic.com.au/api/register/guest",
  };

  // Domain → login endpoint map (mirrors login-form.js)
  static LOGIN_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/api/login",
    "www.primedclinic.com.au":              "https://app.primedclinic.com.au/api/login",
  };

  // Domain → onboarding redirect map
  static ONBOARDING_URL_MAP = {
    "dev-frontend.primedclinic.com.au": "https://dev-frontend.primedclinic.com.au/client-onboarding",
    "www.primedclinic.com.au":              "https://primedclinic.com.au/client-onboarding",
  };
  static SANCTUM_CSRF_ENDPOINT_MAP = {
    "dev-frontend.primedclinic.com.au": "https://api.dev.primedclinic.com.au/sanctum/csrf-cookie",
    "www.primedclinic.com.au":          "https://app.primedclinic.com.au/sanctum/csrf-cookie",
  };
  // ── Lifecycle ────────────────────────────────────────────────────────────
  connectedCallback() {
    this.innerHTML = `
<form
  id="register-form-el"
  name="wf-form-Register-Form"
  method="post"
  class="sign-up-login_header_form"
  aria-label="Register Form"
  novalidate
>

  <p id="form-help" class="sr-only">
    All fields are required unless marked optional.
  </p>

  <!-- Name -->
  <fieldset class="form_field-2col" aria-describedby="form-help">
    <legend class="sr-only">Your name</legend>

    <div class="form_field-wrapper">
      <label class="sr-only" for="First-Name">First name</label>
      <input
        class="form_input w-input"
        maxlength="256"
        name="First-Name"
        placeholder="First Name"
        type="text"
        id="First-Name"
        autocomplete="given-name"
        required
        aria-required="true"
      >
    </div>

    <div class="form_field-wrapper">
      <label class="sr-only" for="Last-Name">Last name</label>
      <input
        class="form_input w-input"
        maxlength="256"
        name="Last-Name"
        placeholder="Last Name"
        type="text"
        id="Last-Name"
        autocomplete="family-name"
        required
        aria-required="true"
      >
    </div>
  </fieldset>

  <!-- Contact -->
  <div class="form_field-wrapper">
    <label class="sr-only" for="Email">Email</label>
    <input
      class="form_input w-input"
      maxlength="256"
      name="Email"
      placeholder="Email"
      type="email"
      id="Email"
      autocomplete="email"
      required
      aria-required="true"
    >
  </div>

  <div class="form_field-wrapper">
    <label class="sr-only" for="Phone">Phone number</label>
    <input
      class="form_input w-input"
      maxlength="256"
      name="Phone"
      placeholder="Phone Number"
      type="tel"
      id="Phone"
      autocomplete="tel"
      inputmode="tel"
      required
      aria-required="true"
    >
  </div>

  <!-- Address -->
  <fieldset aria-describedby="address-help">
    <legend class="sr-only">Address</legend>
    <p id="address-help" class="sr-only">
      Enter your street number and street name, then suburb, state, and postcode.
    </p>

    <div class="form_field-wrapper">
      <label class="sr-only" for="Address">Address line</label>
      <input
        class="form_input w-input"
        maxlength="256"
        name="Address"
        placeholder="Address"
        type="text"
        id="Address"
        autocomplete="street-address"
        required
        aria-required="true"
      >
    </div>

    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <label class="sr-only" for="streetNumber">Street number</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="streetNumber"
          placeholder="Street Number"
          type="text"
          id="streetNumber"
          autocomplete="address-line1"
          required
          aria-required="true"
        >
      </div>

      <div class="form_field-wrapper">
        <label class="sr-only" for="streetName">Street name</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="streetName"
          placeholder="Street Name"
          type="text"
          id="streetName"
          required
          aria-required="true"
        >
      </div>
    </div>

    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <label class="sr-only" for="suburb">Suburb</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="suburb"
          placeholder="Suburb"
          type="text"
          id="suburb"
          autocomplete="address-level2"
          required
          aria-required="true"
        >
      </div>

      <div class="form_field-wrapper">
        <label class="sr-only" for="state">State</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="state"
          placeholder="State"
          type="text"
          id="state"
          autocomplete="address-level1"
          required
          aria-required="true"
        >
      </div>

      <div class="form_field-wrapper">
        <label class="sr-only" for="postcode">Postcode</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="postcode"
          placeholder="Postcode"
          type="text"
          id="postcode"
          autocomplete="postal-code"
          inputmode="numeric"
          required
          aria-required="true"
        >
      </div>
    </div>
  </fieldset>

  <!-- Password -->
  <fieldset aria-describedby="password-help">
    <legend class="sr-only">Create a password</legend>
    <p id="password-help" class="sr-only">
      Password should be at least 8 characters. Use a mix of letters and numbers if possible.
    </p>

    <div class="form_field-2col">
      <div class="form_field-wrapper">
        <label class="sr-only" for="Password">Password</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="Password"
          placeholder="Password"
          type="password"
          id="Password"
          autocomplete="new-password"
          required
          aria-required="true"
        >
      </div>

      <div class="form_field-wrapper">
        <label class="sr-only" for="Confirm-Password">Confirm password</label>
        <input
          class="form_input w-input"
          maxlength="256"
          name="Confirm-Password"
          placeholder="Confirm Password"
          type="password"
          id="Confirm-Password"
          autocomplete="new-password"
          required
          aria-required="true"
        >
      </div>
    </div>
  </fieldset>

  <!-- Referral (make optional if it is optional) -->
  <div class="form_field-wrapper">
    <label class="sr-only" for="Referral-Code">Referral code</label>
    <input
      class="form_input w-input"
      maxlength="256"
      name="Referral-Code"
      placeholder="Referral Code"
      type="text"
      id="Referral-Code"
      autocomplete="off"
    >
  </div>

  <!-- Submit -->
  <div class="w-layout-grid form-button-wrapper">
    <input
      type="submit"
      data-wait="Please wait..."
      class="button is-full-width w-button"
      value="Create account & Continue"
      aria-describedby="form-help"
    >
  </div>

  <!-- Turnstile -->
  <input
    type="hidden"
    name="cf-turnstile-response"
    id="cf-chl-widget-a8hv1_response"
    value="..."
  >

  <!-- Optional: place for inline errors -->
  <div class="sr-only" aria-live="polite" id="form-status"></div>

</form>

    <!-- Success -->
    <div class="form_message-success-wrapper w-form-done" tabindex="-1" role="region">
      <div class="form_message-success">
        <div class="success-text">
          Welcome back. You'll be redirected back to the home page.
        </div>
      </div>
    </div>

    <!-- Error -->
    <div class="form_message-error-wrapper w-form-fail" tabindex="-1" role="region">
      <div class="form_message-error">
        <div class="error-text">
          Login failed. Check your details and try again.
        </div>
      </div>
    </div>
  </div>
</div>
      
      

        <div class="form_field-error" id="password-error" style="display:none">Passwords do not match.</div>

        <!-- Referral Code -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Referral Code</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Referral-Code"
            placeholder="Referral Code"
            type="text"
            id="register-referral-code"
          />
        </div>

        <!-- Error message -->
        <div class="form_message-error-wrapper w-form-fail" data-register-error-wrapper="true" style="display:none">
          <div class="form_message-error">
            <div data-register-error="true"></div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            value="Create account & Continue"
            id="register-submit"
          />

          <div class="button-group is-center">
            <a href="#" class="button-glide-over w-inline-block" id="back-to-login">
              <span class="button-glide-over__container">
                <span class="button-glide-over__icon is-first">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                </span>
                <span class="button-glide-over__text">Back to Login</span>
                <span class="button-glide-over__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M216 128H40M112 56L40 128l72 72"></path></svg>
                </span>
              </span>
              <div class="button-glide-over__background"></div>
            </a>
          </div>
        </div>
      </form>
    `;

    this._bindEvents();
  }

  // ── Cookie helpers ───────────────────────────────────────────────────────
  _getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? decodeURIComponent(match[2]) : null;
  }

  _setCookie(name, value, maxAgeSeconds) {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
  }

  // ── CSRF ─────────────────────────────────────────────────────────────────
  _csrfIsValid() {
    const xsrfToken = this._getCookie("XSRF-TOKEN");
    const expiresAt = parseInt(this._getCookie(RegisterForm.CSRF_EXPIRY_COOKIE) || "", 10);
    if (!xsrfToken || !Number.isFinite(expiresAt)) return false;
    return Math.floor(Date.now() / 1000) < expiresAt;
  }

  async _ensureCsrfCookie() {
    if (this._csrfIsValid()) return;

    await fetch(this._getCsrfEndpoint(), {
      method: "GET",
      credentials: "include"
    });

    const expiresAt = Math.floor(Date.now() / 1000) + RegisterForm.CSRF_TTL_SECONDS;
    this._setCookie(RegisterForm.CSRF_EXPIRY_COOKIE, String(expiresAt), RegisterForm.CSRF_TTL_SECONDS);
  }

  // ── UI helpers ───────────────────────────────────────────────────────────
  _showError(message) {
    const wrapper = this.querySelector("[data-register-error-wrapper]");
    const el      = this.querySelector("[data-register-error]");
    if (el)      el.textContent = message;
    if (wrapper) {
      wrapper.classList.add("w-form-fail");
      wrapper.style.display = "block";
    }
  }

  _hideError() {
    const wrapper = this.querySelector("[data-register-error-wrapper]");
    if (wrapper) {
      wrapper.classList.remove("w-form-fail");
      wrapper.style.display = "none";
    }
  }

  _setSubmitState(submitBtn, loading) {
    if (!submitBtn) return;
    submitBtn.disabled = loading;
    submitBtn.value = loading ? "Please wait..." : "Create account & Continue";
  }

  _getOnboardingUrl() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(RegisterForm.ONBOARDING_URL_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return "/client-onboarding"; // fallback
  }

  _getLoginEndpoint() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(RegisterForm.LOGIN_ENDPOINT_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return RegisterForm.REGISTER_ENDPOINT.replace("/register/guest", "/login"); // fallback
  }

  _getRegisterEndpoint() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(RegisterForm.REGISTER_ENDPOINT_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return RegisterForm.REGISTER_ENDPOINT; // fallback
  }
  // helper to resolve CSRF endpoint
  _getCsrfEndpoint() {
    const hostname = window.location.hostname;
    for (const [key, url] of Object.entries(RegisterForm.SANCTUM_CSRF_ENDPOINT_MAP)) {
      if (hostname === key || hostname.endsWith("." + key)) return url;
    }
    return RegisterForm.SANCTUM_CSRF_ENDPOINT; // fallback
  }
  // ── JWT / session cookie (mirrors login-form.js) ─────────────────────────
  async _generateUserToken() {
    const b64url = (buf) =>
      btoa(String.fromCharCode(...new Uint8Array(buf)))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

    const encode = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

    const header  = encode({ alg: "HS256", typ: "JWT" });
    const payload = encode({
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
      session: true
    });

    const signingKey = await crypto.subtle.generateKey(
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const sigBuf = await crypto.subtle.sign(
      "HMAC",
      signingKey,
      new TextEncoder().encode(`${header}.${payload}`)
    );

    return `${header}.${payload}.${b64url(sigBuf)}`;
  }

  async _setUserSessionCookie() {
    const token  = await this._generateUserToken();
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `__user=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}`;
  }

  _showSuccess(userId) {
    const url = new URL(this._getOnboardingUrl());
    if (userId) url.searchParams.set("user_id", userId);
    window.location.href = url.toString();
  }

  // ── Auto-login after registration ───────────────────────────────────────────
  async _autoLogin(email, password, userId) {
    try {
      await this._ensureCsrfCookie();
      const xsrfToken = this._getCookie("XSRF-TOKEN");

      const res = await fetch(this._getLoginEndpoint(), {
        method:      "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "Accept":        "application/json",
          ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {})
        },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        await this._setUserSessionCookie();
        console.log("register-form: auto-login successful.");
      } else {
        // Login failed — still redirect, but without the session cookie.
        // The user can log in manually on the next page.
        console.warn("register-form: auto-login failed, continuing without session.");
      }
    } catch (err) {
      console.warn("register-form: auto-login error, continuing without session.", err);
    }

    this._showSuccess(userId);
  }

  // ── Register handler ─────────────────────────────────────────────────────
  async _handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    const form      = e.currentTarget;
    const password  = this.querySelector("#register-password");
    const confirm   = this.querySelector("#register-confirm-password");
    const pwError   = this.querySelector("#password-error");
    const submitBtn = form.querySelector('input[type="submit"]');

    // Client-side password match check
    if (password.value !== confirm.value) {
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

      const email   = (this.querySelector("#register-email")?.value || "").trim();

      const payload = {
        first_name:   (this.querySelector("#register-first-name")?.value   || "").trim(),
        last_name:    (this.querySelector("#register-last-name")?.value    || "").trim(),
        email,
        phone:        (this.querySelector("#register-phone")?.value        || "").trim(),
        address:      (this.querySelector("#register-address")?.value      || "").trim(),
        streetNumber: "",
        streetName:   "",
        suburb:       "",
        state:        "",
        postcode:     "",
        password:     password.value,
        referral_code: (this.querySelector("#register-referral-code")?.value || "").trim()
      };

      const res = await fetch(this._getRegisterEndpoint(), {
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

      if (!res.ok) {
        const msg = data?.message || data?.error || "Registration failed. Please check your details and try again.";
        this._showError(msg);
        return;
      }

      // Success — auto-login with the credentials just used, then redirect
      await this._autoLogin(email, password.value, data.user_id);

    } catch (err) {
      this._showError(err.message || "Registration failed due to a network error.");
      console.error("Register error:", err);
    } finally {
      this._setSubmitState(submitBtn, false);
    }
  }

  // ── Event binding ────────────────────────────────────────────────────────
  _bindEvents() {
    const form     = this.querySelector('#register-form-el');
    const password = this.querySelector('#register-password');
    const confirm  = this.querySelector('#register-confirm-password');
    const pwError  = this.querySelector('#password-error');
    const backBtn  = this.querySelector('#back-to-login');

    // Clear password mismatch error as user re-types
    confirm.addEventListener('input', () => {
      if (pwError.style.display === 'block') {
        pwError.style.display = 'none';
        confirm.classList.remove('is-error');
        password.classList.remove('is-error');
      }
    });

    form.addEventListener('submit', (e) => this._handleSubmit(e));

    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Strip the register param/hash from the URL so the login form
      // doesn't immediately detect it and swap back to register.
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      if (url.hash === "#register") url.hash = "";
      history.replaceState(null, "", url.toString());
      const loginForm = document.createElement('login-form');
      this.replaceWith(loginForm);
    });
  }
}

customElements.define('register-form', RegisterForm);
