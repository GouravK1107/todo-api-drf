/* ══════════════════════════════════
   THEME
══════════════════════════════════ */
const root = document.documentElement;
const SUN = `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
const MOON = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`;
let dark = localStorage.getItem('tasko-theme') === 'dark' ||
    (!localStorage.getItem('tasko-theme') && window.matchMedia('(prefers-color-scheme:dark)').matches);

function applyTheme(d) {
    root.setAttribute('data-theme', d ? 'dark' : 'light');
    document.getElementById('themeIco').innerHTML = d ? SUN : MOON;
    localStorage.setItem('tasko-theme', d ? 'dark' : 'light');
    dark = d;
}
applyTheme(dark);
document.getElementById('themeBtn').addEventListener('click', () => applyTheme(!dark));

/* ══════════════════════════════════
   GET EMAIL FROM URL
══════════════════════════════════ */
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email') || '';
document.getElementById('displayEmail').textContent = email;

if (!email) {
    window.location.href = '/useraccounts/email-enter/';
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
   OTP INPUT HANDLING
══════════════════════════════════ */
const otpInputs = document.querySelectorAll('.otp-digit');
const otpErr = document.getElementById('otpErr');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const resendBtn = document.getElementById('resendBtn');
const timerDisplay = document.getElementById('timerDisplay');

let timeLeft = 300;
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

otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
        input.classList.remove('error');
        otpErr.classList.remove('show');
        otpErr.textContent = '';

        e.target.value = e.target.value.replace(/[^0-9]/g, '');

        if (e.target.value) {
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
        }

        if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
        }

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

        const lastFilled = Math.min(digits.length, otpInputs.length) - 1;
        if (lastFilled >= 0 && lastFilled < otpInputs.length - 1) {
            otpInputs[lastFilled + 1].focus();
        }

        const allFilled = Array.from(otpInputs).every(inp => inp.value);
        if (allFilled) {
            document.getElementById('otpForm').dispatchEvent(new Event('submit'));
        }
    });
});

function getOTP() {
    return Array.from(otpInputs).map(input => input.value).join('');
}

/* ══════════════════════════════════
   FORM SUBMIT
══════════════════════════════════ */
document.getElementById('otpForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const otp = getOTP();

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
        otpInputs.forEach(input => input.classList.add('error'));
        otpErr.textContent = '⚠ Please enter a valid 6-digit code';
        otpErr.classList.add('show');
        return;
    }

    if (timeLeft <= 0) {
        otpErr.textContent = '⚠ Code expired. Please request a new one.';
        otpErr.classList.add('show');
        return;
    }

    const originalText = btnText.textContent;
    submitBtn.classList.add('loading');
    btnText.textContent = 'Verifying...';
    submitBtn.disabled = true;

    try {
        const csrfToken = await getCsrfToken();

        const response = await fetch('/useraccounts/api/auth/verify-otp/', {
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
            // Check if we have pending signup data
            const pendingSignup = sessionStorage.getItem('pending_signup');
            
            if (pendingSignup) {
                // We came from signup page, complete the signup
                await completeSignup(JSON.parse(pendingSignup));
            } else {
                // Direct email verification flow
                submitBtn.classList.remove('loading');
                submitBtn.classList.add('success');
                btnText.textContent = '✓ Verified!';
                
                clearInterval(timerInterval);
                
                setTimeout(() => {
                    window.location.href = `/useraccounts/signup-success/?email=${encodeURIComponent(email)}`;
                }, 1500);
            }
        } else {
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

// Add this new function to complete signup
async function completeSignup(userData) {
    try {
        const csrfToken = await getCsrfToken();
        
        const response = await fetch('/useraccounts/api/auth/complete-signup/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                email: userData.email,
                first_name: userData.first_name,
                last_name: userData.last_name,
                password: userData.password,
                confirm_password: userData.password
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear stored data
            sessionStorage.removeItem('pending_signup');
            
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            btnText.textContent = '✓ Account Created!';
            
            clearInterval(timerInterval);
            
            // Redirect to success page
            setTimeout(() => {
                window.location.href = `/useraccounts/signup-success/?email=${encodeURIComponent(userData.email)}`;
            }, 1500);
        } else {
            console.error('Signup completion failed:', data);
            submitBtn.classList.remove('loading');
            btnText.textContent = 'Verification failed';
            submitBtn.disabled = false;
            otpErr.textContent = data.error || 'Failed to create account';
            otpErr.classList.add('show');
        }
    } catch (error) {
        console.error('Error completing signup:', error);
        submitBtn.classList.remove('loading');
        btnText.textContent = 'Verification failed';
        submitBtn.disabled = false;
        otpErr.textContent = 'Network error. Please try again.';
        otpErr.classList.add('show');
    }
}