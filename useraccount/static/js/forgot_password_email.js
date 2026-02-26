/* ══════════════════════════════════
   THEME TOGGLE
══════════════════════════════════ */
const root = document.documentElement;
const themeBtn = document.getElementById("themeBtn");
const themeIco = document.getElementById("themeIco");
const SUN = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
let dark = localStorage.getItem('tasko-theme') === 'dark' ||
    (!localStorage.getItem('tasko-theme') && window.matchMedia('(prefers-color-scheme:dark)').matches);

function applyTheme(d) {
    root.setAttribute('data-theme', d ? 'dark' : 'light');
    themeIco.innerHTML = d ? SUN : MOON;
    localStorage.setItem('tasko-theme', d ? 'dark' : 'light');
    dark = d;
}
applyTheme(dark);
themeBtn.addEventListener('click', () => applyTheme(!dark));

/* ══════════════════════════════════
   EMAIL VALIDATION
══════════════════════════════════ */
const emailInp = document.getElementById('emailInp');
const emailErr = document.getElementById('emailErr');
const emailHint = document.getElementById('emailHint');
const emailCheck = document.getElementById('emailCheck');

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function setError(msg) {
    emailInp.classList.remove('valid');
    emailInp.classList.add('error');
    emailErr.textContent = '⚠ ' + msg;
    emailErr.classList.add('show');
    emailHint.style.display = 'none';
    emailCheck.style.opacity = '0';
}

function setValid() {
    emailInp.classList.remove('error');
    emailInp.classList.add('valid');
    emailErr.classList.remove('show');
    emailErr.textContent = '';
    emailHint.style.display = 'none';
    emailCheck.style.opacity = '1';
}

function clearState() {
    emailInp.classList.remove('valid', 'error');
    emailErr.classList.remove('show');
    emailErr.textContent = '';
    emailHint.style.display = '';
    emailCheck.style.opacity = '0';
}

emailInp.addEventListener('input', () => {
    const v = emailInp.value;
    if (!v) {
        clearState();
        return;
    }
    if (isValidEmail(v)) {
        setValid();
    } else {
        emailInp.classList.remove('valid', 'error');
        emailCheck.style.opacity = '0';
        emailErr.classList.remove('show');
        emailHint.style.display = '';
    }
});

emailInp.addEventListener('blur', () => {
    const v = emailInp.value.trim();
    if (!v) {
        clearState();
        return;
    }
    if (!isValidEmail(v)) {
        setError('Please enter a valid email address.');
    } else {
        setValid();
    }
});

/* ══════════════════════════════════
   CSRF TOKEN
══════════════════════════════════ */
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

/* ══════════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════════ */
let toastTimer;
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastTxt = document.getElementById('toastTxt');
    
    toastTxt.textContent = message;
    toast.style.background = isError ? '#FEE2E2' : 'var(--card)';
    toast.style.color = isError ? '#991B1B' : 'var(--text)';
    toast.style.border = isError ? '1px solid #F87171' : '1px solid var(--border)';
    toast.classList.add('show');
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/* ══════════════════════════════════
   FORM SUBMIT
══════════════════════════════════ */
const form = document.getElementById('resetEmailForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const btnArrow = document.getElementById('btnArrow');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInp.value.trim();

    if (!email) {
        setError('Email address is required.');
        emailInp.focus();
        return;
    }
    
    if (!isValidEmail(email)) {
        setError('Please enter a valid email address.');
        emailInp.focus();
        return;
    }

    // Loading state
    const originalText = btnText.textContent;
    submitBtn.classList.add('loading');
    btnText.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        const csrfToken = await getCsrfToken();

        const response = await fetch('/useraccounts/api/auth/forgot-password/send-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (data.success) {
            // Success!
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            btnText.textContent = '✓ Code Sent!';
            
            showToast('Reset code sent! Check your email.');
            
            setTimeout(() => {
                window.location.href = `/useraccounts/forgot-password/otp/?email=${encodeURIComponent(email)}`;
            }, 1500);
        } else {
            // Error
            submitBtn.classList.remove('loading');
            btnText.textContent = originalText;
            submitBtn.disabled = false;
            
            if (data.errors?.email) {
                setError(data.errors.email[0]);
            } else if (data.error) {
                showToast(data.error, true);
            } else {
                showToast('Failed to send code. Please try again.', true);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        btnText.textContent = originalText;
        submitBtn.disabled = false;
        showToast('Network error. Please check your connection.', true);
    }
});

// Enter key to submit
emailInp.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        form.dispatchEvent(new Event('submit'));
    }
});

// Focus input on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        emailInp.focus();
    }, 100);
});