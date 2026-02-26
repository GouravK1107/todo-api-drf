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
   GET EMAIL FROM URL
══════════════════════════════════ */
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email') || '';
document.getElementById('displayEmail').textContent = email;

if (!email) {
    window.location.href = '/useraccounts/forgot-password/';
}

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
    toast.style.display = 'block';
    
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

/* ══════════════════════════════════
   OTP INPUT HANDLING
══════════════════════════════════ */
const otpInputs = document.querySelectorAll('.otp-digit');
const otpErr = document.getElementById('otpErr');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const btnArrow = document.getElementById('btnArrow');
const resendBtn = document.getElementById('resendBtn');
const timerDisplay = document.getElementById('timerDisplay');

let timeLeft = 300; // 5 minutes in seconds
let timerInterval;

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = '00:00';
            resendBtn.disabled = false;
            otpInputs.forEach(input => {
                input.disabled = true;
                input.classList.add('error');
            });
            otpErr.textContent = '⚠ Code expired. Please request a new one.';
            otpErr.classList.add('show');
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}
startTimer();

// OTP input navigation
otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        // Remove error class when typing
        input.classList.remove('error');
        otpErr.classList.remove('show');
        otpErr.textContent = '';

        // Only allow numbers
        e.target.value = e.target.value.replace(/[^0-9]/g, '');

        // Add valid class if has value
        if (e.target.value) {
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
        }

        // Auto-focus next input
        if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }

        // If all 6 digits entered, auto-submit
        const allFilled = Array.from(otpInputs).every(inp => inp.value);
        if (allFilled) {
            document.getElementById('otpForm').dispatchEvent(new Event('submit'));
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
        }
    });

    input.addEventListener('paste', (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData('text');
        const digits = paste.replace(/[^0-9]/g, '').split('');

        digits.forEach((digit, i) => {
            if (i < otpInputs.length) {
                otpInputs[i].value = digit;
                otpInputs[i].classList.add('valid');
            }
        });

        // Focus last filled input or next empty
        const lastFilled = Math.min(digits.length, otpInputs.length) - 1;
        if (lastFilled >= 0 && lastFilled < otpInputs.length - 1) {
            otpInputs[lastFilled + 1].focus();
        }

        // Auto-submit if all filled
        const allFilled = Array.from(otpInputs).every(inp => inp.value);
        if (allFilled) {
            document.getElementById('otpForm').dispatchEvent(new Event('submit'));
        }
    });
});

// Get full OTP
function getOTP() {
    return Array.from(otpInputs).map(input => input.value).join('');
}

/* ══════════════════════════════════
   FORM SUBMIT
══════════════════════════════════ */
document.getElementById('otpForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const otp = getOTP();

    // Validate OTP
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        otpInputs.forEach(input => input.classList.add('error'));
        otpErr.textContent = '⚠ Please enter a valid 6-digit code';
        otpErr.classList.add('show');
        return;
    }

    // Check if expired
    if (timeLeft <= 0) {
        otpErr.textContent = '⚠ Code expired. Please request a new one.';
        otpErr.classList.add('show');
        return;
    }

    // Loading state
    const originalText = btnText.textContent;
    submitBtn.classList.add('loading');
    btnText.textContent = 'Verifying...';
    submitBtn.disabled = true;

    try {
        const csrfToken = await getCsrfToken();

        const response = await fetch('/useraccounts/api/auth/forgot-password/verify-otp/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({ email, otp })
        });

        const data = await response.json();

        if (data.success) {
            // Success!
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            btnText.textContent = '✓ Verified!';

            // Clear timer
            clearInterval(timerInterval);

            // Redirect to reset password page
            setTimeout(() => {
                window.location.href = `/useraccounts/reset-password/?email=${encodeURIComponent(email)}`;
            }, 1500);
        } else {
            // Error
            submitBtn.classList.remove('loading');
            btnText.textContent = originalText;
            submitBtn.disabled = false;

            otpInputs.forEach(input => input.classList.add('error'));
            otpErr.textContent = data.error || 'Invalid verification code';
            otpErr.classList.add('show');
        }
    } catch (error) {
        console.error('Error:', error);
        submitBtn.classList.remove('loading');
        btnText.textContent = originalText;
        submitBtn.disabled = false;
        otpErr.textContent = 'Network error. Please try again.';
        otpErr.classList.add('show');
    }
});

/* ══════════════════════════════════
   RESEND CODE
══════════════════════════════════ */
resendBtn.addEventListener('click', async function() {
    // Disable button and show loading
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    try {
        const csrfToken = await getCsrfToken();

        const response = await fetch('/useraccounts/api/auth/forgot-password/resend-otp/', {
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
            // Reset timer
            timeLeft = 300;
            clearInterval(timerInterval);
            startTimer();

            // Clear inputs
            otpInputs.forEach(input => {
                input.disabled = false;
                input.value = '';
                input.classList.remove('error', 'valid');
            });
            otpInputs[0].focus();
            otpErr.classList.remove('show');

            // Show success toast
            showToast('New code sent! Check your email.');
        } else {
            resendBtn.textContent = 'Resend';
            resendBtn.disabled = false;
            showToast(data.error || 'Failed to resend code', true);
        }
    } catch (error) {
        console.error('Error:', error);
        resendBtn.textContent = 'Resend';
        resendBtn.disabled = false;
        showToast('Network error. Please try again.', true);
    }
});

// Focus first input on page load
window.addEventListener('load', () => {
    setTimeout(() => {
        otpInputs[0].focus();
    }, 100);
});