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
document.getElementById('email').value = email;

if (!email) {
    // No email, redirect to forgot password page
    window.location.href = '/useraccounts/forgot-password/';
}

/* ══════════════════════════════════
   PASSWORD TOGGLE
══════════════════════════════════ */
function setupPasswordToggle(btnId, inputId, iconId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);
    
    if (!btn || !input || !icon) return;
    
    btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        icon.innerHTML = isPassword
            ? `<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
            : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
    });
}

setupPasswordToggle('togglePw1', 'newPassword', 'eyeIcon1');
setupPasswordToggle('togglePw2', 'confirmPassword', 'eyeIcon2');

/* ══════════════════════════════════
   PASSWORD STRENGTH METER
══════════════════════════════════ */
const newPassword = document.getElementById('newPassword');
const pwStrength = document.getElementById('pwStrength');
const strengthLabel = document.getElementById('strengthLabel');
const bars = [1, 2, 3, 4].map(n => document.getElementById('bar' + n));

const strengthLevels = [
    { label: 'Too weak', class: 'weak', minScore: 0 },
    { label: 'Fair', class: 'fair', minScore: 1 },
    { label: 'Good', class: 'good', minScore: 2 },
    { label: 'Strong', class: 'strong', minScore: 3 },
    { label: 'Very strong', class: 'strong', minScore: 4 }
];

function checkPasswordStrength(password) {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    
    // Character variety
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    
    return Math.min(score, 4);
}

newPassword.addEventListener('input', () => {
    const password = newPassword.value;
    
    if (!password) {
        pwStrength.style.display = 'none';
        return;
    }
    
    pwStrength.style.display = 'block';
    
    const score = checkPasswordStrength(password);
    const level = strengthLevels[Math.min(score, 4)];
    
    // Update bars
    bars.forEach((bar, index) => {
        bar.className = 'strength-bar';
        if (index < score) {
            bar.classList.add(level.class);
        }
    });
    
    // Update label
    strengthLabel.textContent = level.label;
    strengthLabel.style.color = 
        score === 0 ? '#EF4444' :
        score === 1 ? '#f59e0b' :
        score === 2 ? '#10B981' :
        '#059669';
    
    // Validate confirm password if it has value
    if (confirmPassword.value) {
        validateConfirmPassword();
    }
});

/* ══════════════════════════════════
   CONFIRM PASSWORD VALIDATION
══════════════════════════════════ */
const confirmPassword = document.getElementById('confirmPassword');
const confirmError = document.getElementById('confirmPasswordError');

function validateConfirmPassword() {
    if (!confirmPassword.value) {
        confirmPassword.classList.remove('error', 'valid');
        confirmError.classList.remove('show');
        return false;
    }
    
    if (confirmPassword.value === newPassword.value) {
        confirmPassword.classList.remove('error');
        confirmPassword.classList.add('valid');
        confirmError.classList.remove('show');
        return true;
    } else {
        confirmPassword.classList.add('error');
        confirmPassword.classList.remove('valid');
        confirmError.textContent = 'Passwords do not match';
        confirmError.classList.add('show');
        return false;
    }
}

confirmPassword.addEventListener('input', validateConfirmPassword);

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
   FORM SUBMIT
══════════════════════════════════ */
const form = document.getElementById('resetPasswordForm');
const submitBtn = document.getElementById('submitBtn');
const btnText = document.getElementById('btnText');
const btnSpinner = document.getElementById('btnSpinner');
const btnArrow = document.getElementById('btnArrow');
const newPasswordError = document.getElementById('newPasswordError');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    let isValid = true;
    
    // Validate new password
    if (!newPassword.value) {
        newPassword.classList.add('error');
        newPasswordError.textContent = 'Password is required';
        newPasswordError.classList.add('show');
        isValid = false;
    } else if (newPassword.value.length < 8) {
        newPassword.classList.add('error');
        newPasswordError.textContent = 'Password must be at least 8 characters';
        newPasswordError.classList.add('show');
        isValid = false;
    } else {
        newPassword.classList.remove('error');
        newPasswordError.classList.remove('show');
    }
    
    // Validate confirm password
    if (!confirmPassword.value) {
        confirmPassword.classList.add('error');
        confirmError.textContent = 'Please confirm your password';
        confirmError.classList.add('show');
        isValid = false;
    } else if (confirmPassword.value !== newPassword.value) {
        confirmPassword.classList.add('error');
        confirmError.textContent = 'Passwords do not match';
        confirmError.classList.add('show');
        isValid = false;
    } else {
        confirmPassword.classList.remove('error');
        confirmError.classList.remove('show');
    }
    
    if (!isValid) return;
    
    // Loading state
    const originalText = btnText.textContent;
    submitBtn.classList.add('loading');
    btnText.textContent = 'Resetting...';
    submitBtn.disabled = true;
    
    try {
        const csrfToken = await getCsrfToken();
        
        const response = await fetch('/useraccounts/api/auth/reset-password/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                email: email,
                password: newPassword.value,
                confirm_password: confirmPassword.value
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Success!
            submitBtn.classList.remove('loading');
            submitBtn.classList.add('success');
            btnText.textContent = '✓ Password Reset!';
            
            showToast('Password reset successfully! Redirecting to login...');
            
            setTimeout(() => {
                window.location.href = '/useraccounts/user/login/?reset=success';
            }, 2000);
        } else {
            // Error
            submitBtn.classList.remove('loading');
            btnText.textContent = originalText;
            submitBtn.disabled = false;
            
            if (data.errors) {
                if (data.errors.password) {
                    newPassword.classList.add('error');
                    newPasswordError.textContent = data.errors.password[0];
                    newPasswordError.classList.add('show');
                }
            } else if (data.error) {
                showToast(data.error, true);
            } else {
                showToast('Failed to reset password. Please try again.', true);
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

// Check URL for reset success parameter
if (window.location.search.includes('reset=success')) {
    showToast('Password reset successfully! Please sign in with your new password.');
}