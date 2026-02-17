class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        login-form {
          display: block;
        }

        .lf-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 48px 40px;
          width: 380px;
          max-width: 95vw;
          box-shadow: 0 24px 60px rgba(0,0,0,.5);
        }

        .lf-heading {
          font-family: 'Playfair Display', serif;
          font-size: 1.85rem;
          color: var(--text);
          margin-bottom: 6px;
        }

        .lf-sub {
          font-size: .82rem;
          color: var(--muted);
          margin-bottom: 32px;
          font-weight: 300;
        }

        .lf-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 18px;
        }

        .lf-label {
          font-size: .75rem;
          font-weight: 500;
          letter-spacing: .08em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .lf-input {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 11px 14px;
          font-family: 'Sora', sans-serif;
          font-size: .9rem;
          color: var(--text);
          outline: none;
          transition: border-color .2s;
        }

        .lf-input:focus {
          border-color: var(--accent);
        }

        .lf-input::placeholder {
          color: var(--muted);
        }

        .lf-divider {
          height: 1px;
          background: var(--border);
          margin: 28px 0;
        }

        .lf-btn {
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

        .lf-btn:hover  { opacity: .88; transform: translateY(-1px); }
        .lf-btn:active { transform: translateY(0); }

        .lf-footer {
          text-align: center;
          margin-top: 20px;
          font-size: .8rem;
          color: var(--muted);
        }

        .lf-footer a {
          color: var(--accent);
          text-decoration: none;
        }
      </style>

      <div class="lf-card">
        <h1 class="lf-heading">Welcome back</h1>
        <p class="lf-sub">Sign in to continue</p>

        <div class="lf-field">
          <label class="lf-label" for="lf-email">Email</label>
          <input
            class="lf-input"
            id="lf-email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>

        <div class="lf-field">
          <label class="lf-label" for="lf-password">Password</label>
          <input
            class="lf-input"
            id="lf-password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>

        <div class="lf-divider"></div>

        <button class="lf-btn" type="button">Sign In</button>

        <p class="lf-footer">
          Don't have an account? <a href="#">Create one</a>
        </p>
      </div>
    `;
  }
}

customElements.define('login-form', LoginForm);
