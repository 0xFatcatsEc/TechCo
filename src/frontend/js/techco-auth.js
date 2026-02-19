// ===== TECHXCO AUTH & CART SHARED UTILITY =====
// API_BASE is set in config.js (loaded before this file)

// --- AUTH STATE ---
function isLoggedIn() {
    return localStorage.getItem('techxco_user') !== null;
}

function getUser() {
    const data = localStorage.getItem('techxco_user');
    return data ? JSON.parse(data) : null;
}

function getUserId() {
    const user = getUser();
    return user ? user.user_id : null;
}

function saveUser(userData) {
    localStorage.setItem('techxco_user', JSON.stringify(userData));
    updateNavbar();
    updateCartBadge();
}

async function registerUser(username, email, password, fullName) {
    const res = await fetch(`${API_BASE}/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, full_name: fullName }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    saveUser(data);
    return data;
}

async function loginUserAPI(email, password) {
    const res = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    saveUser(data);
    return data;
}

// Kept for backward compat with simple pages
function loginUser(name, email) {
    saveUser({ full_name: name, email, user_id: null });
}

function logoutUser() {
    localStorage.removeItem('techxco_user');
    localStorage.removeItem('techxco_cart');
    updateNavbar();
    updateCartBadge();
    const path = window.location.pathname;
    if (path.includes('/pages/funnels/')) {
        window.location.href = '../../index.html';
    } else if (path.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

// --- PROFILE API ---
async function fetchProfile() {
    const uid = getUserId();
    if (!uid) return getUser();
    const res = await fetch(`${API_BASE}/auth/profile/${uid}/`);
    const data = await res.json();
    if (res.ok) saveUser(data);
    return data;
}

async function updateProfile(fields) {
    const uid = getUserId();
    if (!uid) return null;
    const res = await fetch(`${API_BASE}/auth/profile/${uid}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (res.ok) saveUser(data);
    return data;
}

async function changePasswordAPI(currentPassword, newPassword) {
    const uid = getUserId();
    if (!uid) throw { error: 'Not logged in' };
    const res = await fetch(`${API_BASE}/auth/change-password/${uid}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    return data;
}

async function deleteAccount() {
    const uid = getUserId();
    if (!uid) return;
    await fetch(`${API_BASE}/auth/delete/${uid}/`, { method: 'DELETE' });
    localStorage.removeItem('techxco_user');
    localStorage.removeItem('techxco_cart');
    const path = window.location.pathname;
    if (path.includes('/pages/funnels/')) {
        window.location.href = '../../index.html';
    } else if (path.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

// --- CART API ---
async function fetchCart() {
    const uid = getUserId();
    if (!uid) return getCartLocal();
    try {
        const res = await fetch(`${API_BASE}/cart/${uid}/`);
        if (!res.ok) return getCartLocal();
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) return data;
        // API returned empty — check local storage in case items were saved locally as fallback
        const local = getCartLocal();
        return local.length > 0 ? local : (Array.isArray(data) ? data : []);
    } catch {
        return getCartLocal();
    }
}

async function addToCartAPI(productName, price, category, image) {
    const uid = getUserId();
    if (!uid) {
        addToCartLocal(productName, price, category, image);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/cart/${uid}/add/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_name: productName,
                price: price,
                product_category: category || '',
                product_image: image || '',
            }),
        });
        if (!res.ok) {
            console.warn('API add-to-cart failed, using local fallback');
            addToCartLocal(productName, price, category, image);
        }
    } catch {
        console.warn('API unreachable, using local fallback');
        addToCartLocal(productName, price, category, image);
    }
}

async function updateCartItemAPI(itemId, quantity) {
    const uid = getUserId();
    if (!uid) {
        updateCartItemLocal(itemId, quantity);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/cart/${uid}/update/${itemId}/`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity }),
        });
        if (!res.ok) updateCartItemLocal(itemId, quantity);
    } catch {
        updateCartItemLocal(itemId, quantity);
    }
}

async function removeCartItemAPI(itemId) {
    const uid = getUserId();
    if (!uid) {
        removeCartItemLocal(itemId);
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/cart/${uid}/remove/${itemId}/`, { method: 'DELETE' });
        if (!res.ok) removeCartItemLocal(itemId);
    } catch {
        removeCartItemLocal(itemId);
    }
}

async function checkoutAPI() {
    const uid = getUserId();
    if (!uid) {
        // Local checkout: create a fake order from local cart
        const cart = getCartLocal();
        if (cart.length === 0) return { error: 'Cart is empty' };
        const subtotal = cart.reduce((s, i) => s + (Number(i.price) * i.quantity), 0);
        const tax = Math.round(subtotal * 0.10 * 100) / 100;
        const order = {
            order_id: Date.now(),
            items: cart.map(i => ({ product_name: i.product_name, quantity: i.quantity, price: i.price })),
            subtotal, tax, total: subtotal + tax, status: 'pending',
            order_date: new Date().toISOString(),
        };
        // Save to local orders
        const orders = JSON.parse(localStorage.getItem('techxco_orders') || '[]');
        orders.unshift(order);
        localStorage.setItem('techxco_orders', JSON.stringify(orders));
        clearCartLocal();
        return order;
    }
    const res = await fetch(`${API_BASE}/orders/${uid}/checkout/`, { method: 'POST' });
    return await res.json();
}

async function fetchOrders() {
    const uid = getUserId();
    if (!uid) return [];
    const res = await fetch(`${API_BASE}/orders/${uid}/`);
    return await res.json();
}

async function getCartCountAPI() {
    try {
        const items = await fetchCart();
        if (items && items.length > 0) {
            return items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        }
        // API returned empty, check local as fallback
        return getCartCountLocal();
    } catch {
        return getCartCountLocal();
    }
}

// --- LOCAL CART FALLBACK (for non-API users) ---
function getCartLocal() {
    const data = localStorage.getItem('techxco_cart');
    if (!data) return [];
    // Normalize old format {name,qty} to API format {product_name,quantity}
    return JSON.parse(data).map((item, i) => ({
        cart_item_id: item.cart_item_id || ('local_' + i),
        product_name: item.product_name || item.name || 'Product',
        product_category: item.product_category || item.category || '',
        product_image: item.product_image || '',
        price: item.price || 0,
        quantity: item.quantity || item.qty || 1,
    }));
}

function saveCartLocal(cart) {
    localStorage.setItem('techxco_cart', JSON.stringify(cart));
}

function addToCartLocal(productName, price, category, image) {
    const cart = getCartLocal();
    const existing = cart.find(item => item.product_name === productName);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            cart_item_id: 'local_' + Date.now(),
            product_name: productName,
            product_category: category || '',
            product_image: image || '',
            price: price,
            quantity: 1,
        });
    }
    saveCartLocal(cart);
    updateCartBadge();
}

function updateCartItemLocal(itemId, quantity) {
    let cart = getCartLocal();
    if (quantity <= 0) {
        cart = cart.filter(item => item.cart_item_id !== itemId);
    } else {
        const item = cart.find(item => item.cart_item_id === itemId);
        if (item) item.quantity = quantity;
    }
    saveCartLocal(cart);
}

function removeCartItemLocal(itemId) {
    const cart = getCartLocal().filter(item => item.cart_item_id !== itemId);
    saveCartLocal(cart);
}

function clearCartLocal() {
    localStorage.removeItem('techxco_cart');
}

function getCartCountLocal() {
    const cart = getCartLocal();
    return cart.reduce((sum, item) => sum + item.quantity, 0);
}

// --- TOAST ---
function showToastError(title, message) {
    const existing = document.querySelector('.toast-error');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-error';
    toast.innerHTML = `<strong class="toast-title">${title}</strong><p class="toast-msg">${message}</p>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

function showToastSuccess(title, message) {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<strong class="toast-title">${title}</strong><p class="toast-msg">${message}</p>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

// --- NAVBAR UPDATE ---
function updateNavbar() {
    const loggedIn = isLoggedIn();
    const path = window.location.pathname;

    // Determine relative path prefix based on current page location
    let prefix = '';
    if (path.includes('/pages/funnels/')) {
        prefix = '../';           // from /pages/funnels/ → go up to /pages/
    } else if (path.includes('/pages/')) {
        prefix = '';              // already in /pages/
    } else {
        prefix = 'pages/';       // from /src/frontend/index.html → go into pages/
        // Check if we need src/frontend prefix
        if (!path.includes('/src/frontend/pages/') && path.includes('/src/frontend/')) {
            prefix = 'pages/';
        }
    }

    const profileBtn = document.getElementById('nav-profile-btn');
    if (profileBtn) {
        if (loggedIn) {
            profileBtn.setAttribute('onclick', "window.location.href='" + prefix + "profile.html'");
        } else {
            profileBtn.setAttribute('onclick', "window.location.href='" + prefix + "login.html'");
        }
    }

    const logoutBtn = document.getElementById('nav-logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = loggedIn ? '' : 'none';
    }
}

async function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    if (!isLoggedIn()) {
        badge.style.display = 'none';
        return;
    }
    try {
        const count = await getCartCountAPI();
        if (count > 0) {
            badge.textContent = count;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    } catch {
        badge.style.display = 'none';
    }
}

// --- HANDLE ADD-TO-CART CLICK ---
async function handleAddToCart(productName, price, category, image) {
    if (!isLoggedIn()) {
        showToastError('Please sign in', 'You need to be signed in to add items to cart');
        return;
    }
    try {
        await addToCartAPI(productName, price, category, image);
        await updateCartBadge();
        showToastSuccess('Added to cart', `${productName} has been added to your cart`);
    } catch (err) {
        console.error('Add to cart error:', err);
        showToastError('Error', 'Failed to add item to cart');
    }
}

// --- INIT ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    updateCartBadge();
});
