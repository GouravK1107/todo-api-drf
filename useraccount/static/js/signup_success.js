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
   GET USER DATA FROM API
══════════════════════════════════ */
const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get('email') || '';

// If email is provided in URL, prefill it
if (email) {
    document.getElementById('userEmail').textContent = email;
}

async function fetchUserData(retryCount = 0) {
    try {
        const response = await fetch('/useraccounts/api/user/me/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin',
        });

        if (response.ok) {
            const data = await response.json();
            if (data.authenticated) {
                updateUserUI(data.user);
                return true;
            }
        }
        
        // If not authenticated and we haven't retried too many times, retry
        if (retryCount < 5) {
            console.log(`User not authenticated yet, retrying (${retryCount + 1}/5)...`);
            setTimeout(() => fetchUserData(retryCount + 1), 1000);
        } else {
            // Fallback to URL parameters
            useUrlFallback();
        }
    } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (retryCount < 5) {
            setTimeout(() => fetchUserData(retryCount + 1), 1000);
        } else {
            useUrlFallback();
        }
    }
}

function useUrlFallback() {
    // Try to get name from session storage or URL
    const pendingSignup = sessionStorage.getItem('pending_signup');
    if (pendingSignup) {
        const userData = JSON.parse(pendingSignup);
        document.getElementById('displayFirstName').textContent = userData.first_name || 'Friend';
        document.getElementById('userFullName').textContent = `${userData.first_name} ${userData.last_name}`.trim() || 'New User';
        document.getElementById('userInitials').textContent = 
            (userData.first_name?.[0] || '') + (userData.last_name?.[0] || '') || 'JD';
    }
    
    // Clear pending signup data
    sessionStorage.removeItem('pending_signup');
}

function updateUserUI(user) {
    document.getElementById('displayFirstName').textContent = user.first_name || 'Friend';
    document.getElementById('userFullName').textContent = user.full_name || user.email;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userInitials').textContent = user.initials || 'JD';
    
    // Clear pending signup data if it exists
    sessionStorage.removeItem('pending_signup');
}

// Member since (today's date)
const today = new Date();
const formattedDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
});
document.getElementById('memberSince').textContent = formattedDate;

/* ══════════════════════════════════
   CONFETTI ANIMATION
══════════════════════════════════ */
function createConfetti() {
    const container = document.getElementById('confettiContainer');
    if (!container) return;

    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#34d399', '#818cf8', '#c084fc'];

    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        const left = Math.random() * 100;
        const width = Math.random() * 8 + 4;
        const height = Math.random() * 6 + 4;
        const bg = colors[Math.floor(Math.random() * colors.length)];
        const delay = Math.random() * 3;
        const duration = Math.random() * 3 + 3;

        confetti.style.left = left + '%';
        confetti.style.width = width + 'px';
        confetti.style.height = height + 'px';
        confetti.style.background = bg;
        confetti.style.animationDelay = delay + 's';
        confetti.style.animationDuration = duration + 's';
        confetti.style.opacity = Math.random() * 0.7 + 0.3;

        container.appendChild(confetti);
    }
}

setTimeout(createConfetti, 200);

setTimeout(() => {
    const container = document.getElementById('confettiContainer');
    if (container) container.innerHTML = '';
}, 8000);

/* ══════════════════════════════════
   BUTTON HANDLERS
══════════════════════════════════ */
document.getElementById('tourBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    alert('Tour feature coming soon! For now, explore the dashboard.');
});

document.getElementById('inviteBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').textContent;
    navigator.clipboard.writeText('https://tasko.app/join?ref=' + email.split('@')[0])
        .then(() => alert('Invite link copied to clipboard!'))
        .catch(() => alert('Share Tasko with your team!'));
});

// Fix dashboard URL
document.getElementById('goToDashboard')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/tasko/dashboard/';
});

// Start fetching user data
fetchUserData();