class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        login-form {
          display: block;
        }

        /* ── Form wrapper ── */
        .sign-up-login_header_form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 48px 40px;
          width: 380px;
          max-width: 95vw;
          box-shadow: 0 24px 60px rgba(0,0,0,.5);
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* ── Field wrapper ── */
        .form_field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ── Label row (label + reset link) ── */
        .field-label-wrapper {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .form_field-label {
          font-size: .75rem;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* ── Reset password link ── */
        .text-style-link {
          font-size: .75rem;
          color: var(--accent);
          text-decoration: none;
          opacity: .8;
          transition: opacity .2s;
        }

        .text-style-link:hover { opacity: 1; }

        /* ── Inputs ── */
        .form_input.w-input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px 14px;
          font-family: 'Sora', sans-serif;
          font-size: .9rem;
          color: var(--text);
          outline: none;
          transition: border-color .2s;
          width: 100%;
        }

        .form_input.w-input:focus {
          border-color: var(--accent);
        }

        .form_input.w-input::placeholder {
          color: var(--muted);
        }

        /* ── Button grid ── */
        .w-layout-grid.form-button-wrapper {
          display: grid;
          gap: 12px;
          margin-top: 10px;
        }

        /* ── Login submit button ── */
        .button.is-full-width.w-button {
          width: 100%;
          padding: 12px;
          background: var(--accent);
          color: #0d0d10;
          border: none;
          border-radius: 8px;
          font-family: 'Sora', sans-serif;
          font-size: .9rem;
          font-weight: 600;
          letter-spacing: .04em;
          cursor: pointer;
          transition: opacity .2s, transform .15s;
        }

        .button.is-full-width.w-button:hover  { opacity: .88; transform: translateY(-1px); }
        .button.is-full-width.w-button:active { transform: translateY(0); }

        /* ── Button group (Register) ── */
        .button-group.is-center {
          display: flex;
          justify-content: center;
        }

        /* ── Glide-over register button ── */
        .button-glide-over.w-inline-block {
          position: relative;
          display: inline-flex;
          align-items: center;
          overflow: hidden;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 20px;
          text-decoration: none;
          color: var(--text);
          font-size: .85rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color .2s, color .2s;
        }

        .button-glide-over.w-inline-block:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .button-glide-over__background {
          position: absolute;
          inset: 0;
          background: var(--accent);
          opacity: 0;
          transition: opacity .25s;
          z-index: 0;
          border-radius: inherit;
        }

        .button-glide-over.w-inline-block:hover .button-glide-over__background {
          opacity: .08;
        }

        .button-glide-over__container {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .button-glide-over__text {
          position: relative;
          z-index: 1;
        }

        /* ── Stacked arrow icons ── */
        .button-glide-over__icon {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          width: 18px;
          height: 18px;
        }

        .button-glide-over__icon.is-first {
          margin-right: 2px;
        }

        .button-glide-over__icon-item {
          position: absolute;
          width: 18px;
          height: 18px;
          opacity: calc(1 - var(--index) * 0.22);
          transform: translateX(calc(var(--index) * -4px));
          transition: transform .25s ease, opacity .25s ease;
        }

        .button-glide-over.w-inline-block:hover .button-glide-over__icon-item {
          transform: translateX(calc((3 - var(--index)) * 4px));
          opacity: calc(1 - (3 - var(--index)) * 0.22);
        }
      </style>

      <form
        name="wf-form-Log-in-Form-14"
        method="get"
        class="sign-up-login_header_form"
        aria-label="Log in Form 14"
      >
        <!-- Email -->
        <div class="form_field-wrapper">
          <div class="form_field-label">Email</div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Email"
            placeholder=""
            type="email"
            required
          />
        </div>

        <!-- Password -->
        <div class="form_field-wrapper">
          <div class="field-label-wrapper">
            <div class="form_field-label">Password</div>
            <a href="#" class="text-style-link">Reset your password</a>
          </div>
          <input
            class="form_input w-input"
            maxlength="256"
            name="Log-In-Form-7-Password"
            placeholder=""
            type="password"
            required
          />
        </div>

        <!-- Buttons -->
        <div class="w-layout-grid form-button-wrapper">
          <input
            type="submit"
            class="button is-full-width w-button"
            value="Login"
          />

          <div class="button-group is-center">
            <a href="/client-onboarding" class="button-glide-over w-inline-block">
              <span class="button-glide-over__container">
                <span class="button-glide-over__icon is-first">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
                <span class="button-glide-over__text">Register</span>
                <span class="button-glide-over__icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:3;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:2;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:1;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" aria-hidden="true" style="--index:0;" class="button-glide-over__icon-item"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="20" d="M40 128h176M144 56l72 72-72 72"></path></svg>
                </span>
              </span>
              <div class="button-glide-over__background"></div>
            </a>
          </div>
        </div>
      </form>
    `;
  }
}

customElements.define('login-form', LoginForm);