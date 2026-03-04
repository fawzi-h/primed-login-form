_bindEvents() {
  console.log("[RegisterForm] Binding form events");

  const form     = this.querySelector("#register-form-el");
  const password = this.querySelector("#register-password");
  const confirm  = this.querySelector("#register-confirm-password");
  const pwError  = this.querySelector("#password-error");
  const backBtn  = this.querySelector("#back-to-login");

  console.log("[RegisterForm] Elements found:", {
    form: !!form,
    password: !!password,
    confirm: !!confirm,
    pwError: !!pwError,
    backBtn: !!backBtn,
  });

  // Hard guard: if critical elements missing, do not bind
  const missing = [];
  if (!form) missing.push("#register-form-el");
  if (!confirm) missing.push("#register-confirm-password");
  if (!backBtn) missing.push("#back-to-login");
  if (!password) missing.push("#register-password");
  if (!pwError) missing.push("#password-error");

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
