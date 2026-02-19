// ===== AUTH TAB SWITCHING =====
const tabs = document.querySelectorAll('.auth-tab');
const signinForm = document.getElementById('signin-form');
const signupForm = document.getElementById('signup-form');
const switchLinks = document.querySelectorAll('.auth-switch-link');

function switchTab(target) {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.auth-tab[data-tab="${target}"]`).classList.add('active');

    if (target === 'signin') {
        signinForm.style.display = 'flex';
        signupForm.style.display = 'none';
    } else {
        signinForm.style.display = 'none';
        signupForm.style.display = 'flex';
    }
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
});

switchLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.dataset.switch);
    });
});

// ===== PASSWORD VISIBILITY TOGGLE =====
document.querySelectorAll('.auth-eye-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const eyeOpen = btn.querySelector('.eye-open');
        const eyeClosed = btn.querySelector('.eye-closed');

        if (input.type === 'password') {
            input.type = 'text';
            eyeOpen.style.display = 'none';
            eyeClosed.style.display = 'block';
        } else {
            input.type = 'password';
            eyeOpen.style.display = 'block';
            eyeClosed.style.display = 'none';
        }
    });
});

// ===== FORM SUBMISSIONS =====
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    if (!email || !password) return;

    try {
        await loginUserAPI(email, password);
        window.location.href = '../index.html';
    } catch (err) {
        const msg = err.error || err.email || 'Invalid email or password';
        showToastError('Sign in failed', typeof msg === 'object' ? msg[0] : msg);
    }
});

signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (!name || !email || !password) return;

    // Use email prefix as username
    const username = email.split('@')[0] + '_' + Date.now().toString(36);

    try {
        await registerUser(username, email, password, name);
        window.location.href = '../index.html';
    } catch (err) {
        const msg = err.email || err.username || err.password || 'Registration failed';
        showToastError('Sign up failed', typeof msg === 'object' ? msg[0] : msg);
    }
});
