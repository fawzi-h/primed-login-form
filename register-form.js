(function () {
  "use strict";

  // =========================
  // CONFIG
  // =========================
  const LOOKUP_ID = "register-address";
  const DETAILS_WRAPPER_ID = "address-details-wrapper";

  const FIELD_IDS = {
    streetNumber: "streetNumber",
    streetName: "streetName",
    suburb: "suburb",
    state: "state",
    postcode: "postcode",
  };

  // =========================
  // CSS injection (animation + errors)
  // =========================
  function injectStyles() {
    if (document.getElementById("primed-address-anim-styles")) return;

    const style = document.createElement("style");
    style.id = "primed-address-anim-styles";
    style.textContent = `
      /* Reveal animation */
      .addr-hidden {
        display: none !important;
      }

      .addr-collapsed {
        display: block !important;
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        pointer-events: none;
        transition: max-height 260ms ease, opacity 220ms ease;
      }

      .addr-expanded {
        display: block !important;
        max-height: 900px; /* large enough for the group */
        opacity: 1;
        overflow: visible;
        pointer-events: auto;
      }

      /* Validation styling */
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

  function $(id) {
    return document.getElementById(id);
  }

  // =========================
  // Animated show/hide
  // =========================
  function hideAnimated(el) {
    if (!el) return;

    // Start from expanded -> collapsed
    el.classList.remove("addr-expanded");
    el.classList.add("addr-collapsed");

    // After transition, set display none
    window.setTimeout(function () {
      el.classList.add("addr-hidden");
    }, 280);
  }

  function showAnimated(el) {
    if (!el) return;

    // Ensure it can animate from collapsed state
    el.classList.remove("addr-hidden");
    el.classList.add("addr-collapsed");

    // Trigger reflow so transition applies
    void el.offsetHeight;

    el.classList.add("addr-expanded");
    el.classList.remove("addr-collapsed");
  }

  // =========================
  // Address parsing helpers
  // =========================
  function getComponent(place, type) {
    if (!place || !place.address_components) return null;
    for (const c of place.address_components) {
      if (c.types && c.types.indexOf(type) > -1) return c;
    }
    return null;
  }

  function populateAddress(place) {
    const streetNumberC = getComponent(place, "street_number");
    const routeC = getComponent(place, "route");

    const suburbC =
      getComponent(place, "locality") ||
      getComponent(place, "postal_town") ||
      getComponent(place, "sublocality") ||
      getComponent(place, "sublocality_level_1");

    const stateC = getComponent(place, "administrative_area_level_1");
    const postcodeC = getComponent(place, "postal_code");

    const streetNumberEl = $(FIELD_IDS.streetNumber);
    const streetNameEl = $(FIELD_IDS.streetName);
    const suburbEl = $(FIELD_IDS.suburb);
    const stateEl = $(FIELD_IDS.state);
    const postcodeEl = $(FIELD_IDS.postcode);

    if (streetNumberEl) streetNumberEl.value = streetNumberC ? streetNumberC.long_name : "";
    if (streetNameEl) streetNameEl.value = routeC ? routeC.long_name : "";
    if (suburbEl) suburbEl.value = suburbC ? suburbC.long_name : "";
    if (stateEl) stateEl.value = stateC ? (stateC.short_name || stateC.long_name) : "";
    if (postcodeEl) postcodeEl.value = postcodeC ? postcodeC.long_name : "";
  }

  function clearAddressFields() {
    const ids = Object.values(FIELD_IDS);
    ids.forEach(function (id) {
      const el = $(id);
      if (el) el.value = "";
    });
  }

  // =========================
  // Wait for Google Places
  // =========================
  function waitForPlaces(onReady, onFail) {
    const start = Date.now();
    const maxWaitMs = 15000;

    (function tick() {
      const ready =
        window.google &&
        google.maps &&
        google.maps.places &&
        typeof google.maps.places.Autocomplete === "function";

      if (ready) return onReady();

      if (Date.now() - start > maxWaitMs) {
        if (typeof onFail === "function") onFail();
        return;
      }

      setTimeout(tick, 200);
    })();
  }

  // =========================
  // Init
  // =========================
  function init() {
    injectStyles();

    const lookupInput = $(LOOKUP_ID);
    const detailsWrapper = $(DETAILS_WRAPPER_ID);

    if (!lookupInput || !detailsWrapper) return;

    // Ensure initial hidden state (even if designer accidentally shows it)
    detailsWrapper.classList.add("addr-hidden");
    detailsWrapper.classList.remove("addr-expanded", "addr-collapsed");

    waitForPlaces(
      function () {
        const autocomplete = new google.maps.places.Autocomplete(lookupInput, {
          types: ["address"],
          componentRestrictions: { country: "au" },
          fields: ["address_components", "formatted_address"],
        });

        autocomplete.addListener("place_changed", function () {
          const place = autocomplete.getPlace();
          if (!place || !place.address_components) return;

          if (place.formatted_address) lookupInput.value = place.formatted_address;

          populateAddress(place);
          showAnimated(detailsWrapper);
        });

        // Hide and clear if user deletes the lookup field value
        lookupInput.addEventListener("input", function () {
          if (!lookupInput.value.trim()) {
            clearAddressFields();
            hideAnimated(detailsWrapper);
          }
        });
      },
      function () {
        // If Places never loads, do not block the user: show fields for manual entry
        showAnimated(detailsWrapper);
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();



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
  name="wf-form-Register-Form"
  method="get"
  class="sign-up-login_header_form"
  aria-label="Register Form"
  id="register-form-el"
  novalidate
>
  <!-- First Name + Last Name -->
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

  <!-- Email -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Register-Email"
      placeholder="Email" type="email" id="register-email" required />
  </div>

  <!-- Phone -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Phone"
      placeholder="Phone Number" type="tel" id="register-phone" required />
  </div>

  <!-- Residential Address -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Address"
      placeholder="Address" type="text" id="register-address" required />
  </div>
<div id="address-details-wrapper" style="display: none;">
  <!-- Street Number + Street Name -->
  <div class="form_field-2col">
    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="streetNumber"
        placeholder="Street Number" type="text" id="streetNumber"
        autocomplete="address-line1" required aria-required="true">
    </div>

    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="streetName"
        placeholder="Street Name" type="text" id="streetName"
        required aria-required="true">
    </div>
  </div>

  <!-- Suburb + State + Postcode -->
  <div class="form_field-2col">
    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="suburb"
        placeholder="Suburb" type="text" id="suburb"
        autocomplete="address-level2" required aria-required="true">
    </div>

    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="state"
        placeholder="State" type="text" id="state"
        autocomplete="address-level1" required aria-required="true">
    </div>

    <div class="form_field-wrapper">
      <input class="form_input w-input" maxlength="256" name="postcode"
        placeholder="Postcode" type="text" id="postcode"
        autocomplete="postal-code" inputmode="numeric"
        required aria-required="true">
    </div>
    </div>
  </div>

  <!-- Password + Confirm Password -->
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

  <!-- Referral Code -->
  <div class="form_field-wrapper">
    <input class="form_input w-input" maxlength="256" name="Referral-Code"
      placeholder="Referral Code" type="text" id="register-referral-code" />
  </div>

  <!-- Error message -->
  <div class="form_message-error-wrapper w-form-fail"
       data-register-error-wrapper="true"
       style="display:none">
    <div class="form_message-error">
      <div data-register-error="true"></div>
    </div>
  </div>

  <!-- Buttons -->
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

  <!-- Turnstile (must be inside form) -->
  <input type="hidden"
    name="cf-turnstile-response"
    id="cf-chl-widget-a8hv1_response"
    value="...">

  <!-- Optional: place for inline errors -->
  <div class="sr-only" aria-live="polite" id="form-status"></div>

  <!-- Success / Error wrappers (keep inside the form block if Webflow expects it) -->
  <div class="form_message-success-wrapper w-form-done" tabindex="-1" role="region">
    <div class="form_message-success">
      <div class="success-text">
        Welcome back. You'll be redirected back to the home page.
      </div>
    </div>
  </div>

  <div class="form_message-error-wrapper w-form-fail" tabindex="-1" role="region">
    <div class="form_message-error">
      <div class="error-text">
        Login failed. Check your details and try again.
      </div>
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
