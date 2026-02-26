(function () {
  const root = document.documentElement;
  const btn = document.getElementById("themeToggle");
  const icon = document.getElementById("themeIcon");
  const SUN = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;

  const sys = window.matchMedia("(prefers-color-scheme: dark)").matches;
  let dark =
    localStorage.getItem("tasko-theme") === "dark" ||
    (!localStorage.getItem("tasko-theme") && sys);

  function applyTheme(d) {
    root.setAttribute("data-theme", d ? "dark" : "light");
    icon.innerHTML = d ? SUN : MOON;
    localStorage.setItem("tasko-theme", d ? "dark" : "light");
    dark = d;
  }
  applyTheme(dark);
  btn.addEventListener("click", () => applyTheme(!dark));

  const togglePw = document.getElementById("togglePw");
  const pwInput = document.getElementById("password");
  const eyeIcon = document.getElementById("eyeIcon");

  togglePw.addEventListener("click", () => {
    const isPassword = pwInput.type === "password";
    pwInput.type = isPassword ? "text" : "password";
    eyeIcon.innerHTML = isPassword
      ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });

  const form = document.getElementById("loginForm");
  const emailEl = document.getElementById("email");
  const submitBtn = document.getElementById("submitBtn");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const generalError = document.getElementById("generalError") || createGeneralError();

  function createGeneralError() {
    const div = document.createElement("div");
    div.id = "generalError";
    div.className = "error-message";
    div.style.display = "none";
    form.insertBefore(div, submitBtn);
    return div;
  }

  emailEl.addEventListener("input", () => {
    emailEl.classList.remove("error");
    emailError.style.display = "none";
  });

  pwInput.addEventListener("input", () => {
    pwInput.classList.remove("error");
    passwordError.style.display = "none";
  });

  // Get CSRF token first
  async function getCsrfToken() {
    try {
      const response = await fetch('/useraccounts/api/auth/csrf/');
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let valid = true;

    if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
      emailEl.classList.add("error");
      emailError.style.display = "block";
      valid = false;
    }

    if (!pwInput.value || pwInput.value.length < 6) {
      pwInput.classList.add("error");
      passwordError.style.display = "block";
      valid = false;
    }

    if (!valid) return;

    submitBtn.classList.add("loading");
    submitBtn.disabled = true;
    generalError.style.display = "none";

    try {
      // Get CSRF token
      const csrfResponse = await getCsrfToken();
      
      const response = await fetch('/useraccounts/api/user/login/', {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrfResponse || document.querySelector("[name=csrfmiddlewaretoken]")?.value,
        },
        body: JSON.stringify({
          email: emailEl.value,
          password: pwInput.value
        }),
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = "/tasko/dashboard/";
      } else {
        if (data.errors?.non_field_errors) {
          passwordError.textContent = data.errors.non_field_errors[0];
          passwordError.style.display = "block";
        } else if (data.errors) {
          // Handle field-specific errors
          if (data.errors.email) {
            emailError.textContent = data.errors.email[0];
            emailError.style.display = "block";
          }
          if (data.errors.password) {
            passwordError.textContent = data.errors.password[0];
            passwordError.style.display = "block";
          }
        } else {
          generalError.textContent = "Login failed. Please try again.";
          generalError.style.display = "block";
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      generalError.textContent = "Network error. Please check your connection.";
      generalError.style.display = "block";
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  });

  // Add styled error messages CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Validation Messages Styling */
    .validation-message {
      display: none;
      font-size: 0.75rem;
      margin-top: 0.25rem;
      padding-left: 0.5rem;
      color: #EF4444;
      font-weight: 400;
      letter-spacing: 0.01em;
      transition: all 0.2s ease;
    }

    /* Error state for input fields */
    .input-wrap input.error {
      border-color: #EF4444 !important;
      background-color: rgba(239, 68, 68, 0.02);
    }

    .dark .input-wrap input.error {
      background-color: rgba(239, 68, 68, 0.1);
    }

    /* General error message styling */
    .error-message {
      background: #FEF2F2;
      border: 1px solid #FCA5A5;
      color: #991B1B;
      padding: 0.875rem 1rem;
      border-radius: 0.75rem;
      margin: 1.25rem 0 0.5rem 0;
      font-size: 0.875rem;
      font-weight: 500;
      line-height: 1.4;
      animation: slideDown 0.3s ease;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
    }

    /* Dark mode error message */
    .dark .error-message {
      background: #451A1A;
      border-color: #991B1B;
      color: #FECACA;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Field-specific error hints */
    .field-hint.error-msg {
      color: #EF4444;
      font-size: 0.75rem;
      margin-top: 0.375rem;
      padding-left: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .field-hint.error-msg::before {
      content: "⚠️";
      font-size: 0.75rem;
      opacity: 0.8;
    }

    /* Dark mode field error */
    .dark .field-hint.error-msg {
      color: #F87171;
    }

    /* Password error specific */
    #passwordError {
      margin-top: 0.375rem;
    }

    /* Email error specific */
    #emailError {
      margin-top: 0.375rem;
    }

    /* Animation for error messages */
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Loading state for button */
    .loading {
      position: relative;
      color: transparent !important;
      pointer-events: none;
      opacity: 0.8;
    }

    .loading::after {
      content: '';
      position: absolute;
      width: 18px;
      height: 18px;
      top: 50%;
      left: 50%;
      margin-left: -9px;
      margin-top: -9px;
      border: 2px solid white;
      border-radius: 50%;
      border-right-color: transparent;
      animation: spin 0.6s linear infinite;
    }

    .dark .loading::after {
      border-color: #E5E7EB;
      border-right-color: transparent;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Success state for form submission */
    .btn-submit.success {
      background: linear-gradient(135deg, #10B981, #059669) !important;
    }

    /* Improve input focus states with error */
    .input-wrap input.error:focus {
      border-color: #EF4444 !important;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }

    .dark .input-wrap input.error:focus {
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
    }

    /* Style for the password visibility toggle when input has error */
    .input-wrap input.error + .toggle-pw {
      border-color: #EF4444;
    }

    /* General error message icons */
    .error-message::before {
      content: "!";
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      background: #EF4444;
      color: white;
      border-radius: 50%;
      font-size: 12px;
      font-weight: bold;
      margin-right: 8px;
      float: left;
    }

    /* Dark mode general error icon */
    .dark .error-message::before {
      background: #DC2626;
    }
  `;

  document.head.appendChild(style);
})();