/* ── THEME TOGGLE ── */
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

/* ── PASSWORD TOGGLES ── */
function makeToggle(btnId, inputEl, iconId) {
  document.getElementById(btnId).addEventListener("click", () => {
    const h = inputEl.type === "password";
    inputEl.type = h ? "text" : "password";
    document.getElementById(iconId).innerHTML = h
      ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
      : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
  });
}
const pwInput = document.getElementById("password");
const cpwInput = document.getElementById("confirmPw");
makeToggle("togglePw1", pwInput, "eyeIcon1");
makeToggle("togglePw2", cpwInput, "eyeIcon2");

/* ── PASSWORD STRENGTH ── */
const levels = [
  { label: "Too weak", cls: "weak", bars: 1, color: "#EF4444" },
  { label: "Fair", cls: "fair", bars: 2, color: "#f59e0b" },
  { label: "Good", cls: "good", bars: 3, color: "#10B981" },
  { label: "Strong 💪", cls: "strong", bars: 4, color: "#059669" },
];
const bars = [1, 2, 3, 4].map((n) => document.getElementById("bar" + n));
const strengthLabel = document.getElementById("strengthLabel");
const pwStrengthEl = document.getElementById("pwStrength");

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
pwInput.addEventListener("input", () => {
  const v = pwInput.value;
  if (!v) {
    pwStrengthEl.style.display = "none";
    return;
  }
  pwStrengthEl.style.display = "block";
  const lvl = levels[Math.max(getStrength(v) - 1, 0)];
  bars.forEach((b, i) => {
    b.className = "strength-bar";
    if (i < lvl.bars) b.classList.add(lvl.cls);
  });
  strengthLabel.textContent = lvl.label;
  strengthLabel.style.color = lvl.color;
  if (cpwInput.value) checkConfirm();
});

/* ── CONFIRM PASSWORD ── */
function checkConfirm() {
  const err = document.getElementById("confirmPwError");
  if (cpwInput.value && cpwInput.value !== pwInput.value) {
    cpwInput.classList.add("error");
    cpwInput.classList.remove("success");
    err.textContent = "Passwords do not match.";
    err.className = "field-hint error-msg show";
  } else if (cpwInput.value) {
    cpwInput.classList.remove("error");
    cpwInput.classList.add("success");
    err.textContent = "Passwords match ✓";
    err.className = "field-hint success-msg show";
  } else {
    cpwInput.classList.remove("error", "success");
    err.className = "field-hint";
  }
}
cpwInput.addEventListener("input", checkConfirm);

/* ── EMAIL VALIDATION ── */
const emailEl = document.getElementById("email");
emailEl.addEventListener("blur", () => {
  const err = document.getElementById("emailError");
  const st = document.getElementById("emailStatus");
  if (!emailEl.value) {
    emailEl.classList.remove("error", "success");
    err.className = "field-hint";
    st.className = "input-status";
    return;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.remove("error");
    emailEl.classList.add("success");
    err.className = "field-hint";
    st.innerHTML = `<svg class="status-ok" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>`;
    st.className = "input-status show";
  } else {
    emailEl.classList.add("error");
    emailEl.classList.remove("success");
    err.textContent = "Please enter a valid email address.";
    err.className = "field-hint error-msg show";
    st.innerHTML = `<svg class="status-error" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`;
    st.className = "input-status show";
  }
});
emailEl.addEventListener("input", () => {
  emailEl.classList.remove("error", "success");
  document.getElementById("emailError").className = "field-hint";
  document.getElementById("emailStatus").className = "input-status";
});

/* ── STEP INDICATOR (enhanced with glow) ── */
function updateSteps(n) {
  document.getElementById("step1").className =
    "step" + (n >= 1 ? " done" : " active");
  document.getElementById("step2").className =
    "step" + (n >= 2 ? " done" : n >= 1 ? " active" : "");
  document.getElementById("step3").className =
    "step" + (n >= 3 ? " done" : n >= 2 ? " active" : "");
  document.getElementById("line2").className =
    "step-line" + (n >= 2 ? " done" : "");
}
document
  .getElementById("firstName")
  .addEventListener("input", () => updateSteps(1));
document
  .getElementById("lastName")
  .addEventListener("input", () => updateSteps(1));
pwInput.addEventListener("input", () => updateSteps(2));
cpwInput.addEventListener("input", () => {
  if (cpwInput.value === pwInput.value && cpwInput.value) updateSteps(3);
});

// Add this function for CSRF token
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

// Update the form submit handler - NOW REDIRECTS TO EMAIL VERIFICATION
const form = document.getElementById("registerForm");
const submitBtn = document.getElementById("submitBtn");
const termsCheckbox = document.getElementById("terms");

// Create a general error container if it doesn't exist
let generalError = document.getElementById("generalError");
if (!generalError) {
  generalError = document.createElement("div");
  generalError.id = "generalError";
  generalError.className = "error-message";
  generalError.style.display = "none";
  form.insertBefore(generalError, submitBtn);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  generalError.style.display = "none";

  let valid = true;

  const fn = document.getElementById("firstName");
  const ln = document.getElementById("lastName");
  const emailEl = document.getElementById("email");
  const pwInput = document.getElementById("password");
  const cpwInput = document.getElementById("confirmPw");
  const terms = document.getElementById("terms");

  // Clear previous errors
  document.querySelectorAll('.error-msg').forEach(el => {
    el.className = 'field-hint';
  });
  document.querySelectorAll('input').forEach(el => {
    el.classList.remove('error', 'success');
  });

  // Validate fields
  if (!fn.value.trim()) {
    fn.classList.add("error");
    valid = false;
  }
  
  if (!ln.value.trim()) {
    ln.classList.add("error");
    valid = false;
  }
  
  if (!emailEl.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value)) {
    emailEl.classList.add("error");
    document.getElementById("emailError").textContent = "Please enter a valid email address.";
    document.getElementById("emailError").className = "field-hint error-msg show";
    valid = false;
  }
  
  if (!pwInput.value || pwInput.value.length < 8) {
    pwInput.classList.add("error");
    document.getElementById("passwordError").textContent = "Password must be at least 8 characters.";
    document.getElementById("passwordError").className = "field-hint error-msg show";
    valid = false;
  }
  
  if (cpwInput.value !== pwInput.value) {
    cpwInput.classList.add("error");
    document.getElementById("confirmPwError").textContent = "Passwords do not match.";
    document.getElementById("confirmPwError").className = "field-hint error-msg show";
    valid = false;
  }
  
  if (!terms.checked) {
    terms.style.outline = "2px solid #EF4444";
    setTimeout(() => terms.style.outline = "none", 3000);
    valid = false;
  }

  if (!valid) return;

  submitBtn.textContent = "Preparing verification...";
  submitBtn.disabled = true;

  try {
    // Store user data in sessionStorage temporarily
    const userData = {
      email: emailEl.value,
      first_name: fn.value,
      last_name: ln.value,
      password: pwInput.value
    };
    
    // Store in sessionStorage to use after OTP verification
    sessionStorage.setItem('pending_signup', JSON.stringify(userData));
    
    // Redirect to email verification page with just the email
    setTimeout(() => {
      window.location.href = `/useraccounts/email-enter/?email=${encodeURIComponent(emailEl.value)}&from_signup=true`;
    }, 500);
    
  } catch (error) {
    console.error("Signup preparation error:", error);
    generalError.textContent = "Network error. Please check your connection.";
    generalError.style.display = "block";
    submitBtn.textContent = "Create my account";
    submitBtn.disabled = false;
  }
});

// Add some CSS for error messages
const style = document.createElement('style');
style.textContent = `
  .error-message {
    background: #FEE2E2;
    border: 1px solid #F87171;
    color: #991B1B;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    margin: 1rem 0;
    font-size: 0.875rem;
  }
  
  .dark .error-message {
    background: #7F1D1D;
    border-color: #DC2626;
    color: #FEE2E2;
  }
  
  .loading {
    position: relative;
    color: transparent !important;
  }
  
  .loading::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    top: 50%;
    left: 50%;
    margin-left: -8px;
    margin-top: -8px;
    border: 2px solid white;
    border-radius: 50%;
    border-right-color: transparent;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);