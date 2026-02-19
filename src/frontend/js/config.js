// ===== API BASE URL CONFIG =====
// Automatically switches between local dev and production (Render)
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000/api'
    : 'https://YOUR-APP-NAME.onrender.com/api';  // <- PALITAN MO ITO ng actual Render URL mo
