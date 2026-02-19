// ===== API BASE URL CONFIG =====
// Automatically switches between local dev and production (Render)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : 'https://techco-backend-m6sm.onrender.com/api';
