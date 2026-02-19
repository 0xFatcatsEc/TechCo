// ===== CART PAGE LOGIC =====

const cartPage = document.getElementById('cart-page');
const cartEmpty = document.getElementById('cart-empty');
const cartItemsList = document.getElementById('cart-items-list');
const cartCountText = document.getElementById('cart-count-text');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTaxEl = document.getElementById('cart-tax');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        cartPage.style.display = 'none';
        cartEmpty.style.display = '';
        return;
    }

    await loadCart();
});

// --- Load cart from API ---
async function loadCart() {
    try {
        const items = await fetchCart();

        if (!items || items.length === 0) {
            showEmptyState();
            return;
        }

        cartEmpty.style.display = 'none';
        cartPage.style.display = '';

        renderCartItems(items);
        updateSummary(items);
    } catch (err) {
        console.error('Error loading cart:', err);
        showEmptyState();
    }
}

function showEmptyState() {
    cartPage.style.display = 'none';
    cartEmpty.style.display = '';
    document.getElementById('cart-empty-title').textContent = 'Your cart is empty';
    document.getElementById('cart-empty-msg').textContent = 'Browse our products and add items to your cart';
    const actionBtn = document.getElementById('cart-empty-action');
    actionBtn.textContent = 'Browse Products';
    actionBtn.href = 'funnels/components.html';
}

// --- Render cart items ---
function renderCartItems(items) {
    const uniqueCount = items.length;
    cartCountText.textContent = `${uniqueCount} item${uniqueCount !== 1 ? 's' : ''} in your cart`;

    cartItemsList.innerHTML = items.map(item => `
        <div class="cart-item-card" data-id="${item.cart_item_id}">
            <div class="cart-item-image">
                ${item.product_image
                    ? `<img src="${item.product_image}" alt="${item.product_name}">`
                    : `<svg fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24" style="width:40px;height:40px;color:#4a5568">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"/>
                       </svg>`
                }
            </div>
            <div class="cart-item-info">
                <span class="cart-item-category">${item.product_category || 'Product'}</span>
                <h3 class="cart-item-name">${item.product_name}</h3>
                <p class="cart-item-price">$${Number(item.price).toLocaleString()}</p>
            </div>
            <button class="cart-item-delete" onclick="removeItem('${item.cart_item_id}')">
                <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="width:20px;height:20px">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
            </button>
            <div class="cart-item-qty">
                <button class="qty-btn" onclick="changeQty('${item.cart_item_id}', ${item.quantity - 1})">&#8722;</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty('${item.cart_item_id}', ${item.quantity + 1})">+</button>
            </div>
        </div>
    `).join('');
}

// --- Update order summary ---
function updateSummary(items) {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    const tax = Math.round(subtotal * 0.10 * 100) / 100;
    const total = subtotal + tax;

    cartSubtotalEl.textContent = `$${subtotal.toLocaleString()}`;
    cartTaxEl.textContent = `$${tax.toLocaleString()}`;
    cartTotalEl.textContent = `$${total.toLocaleString()}`;
}

// --- Change quantity ---
async function changeQty(itemId, newQty) {
    if (newQty <= 0) {
        await removeItem(itemId);
        return;
    }
    // Convert to number for API calls if it's a numeric ID
    const id = isNaN(itemId) ? itemId : Number(itemId);
    await updateCartItemAPI(id, newQty);
    await loadCart();
    await updateCartBadge();
}

// --- Remove item ---
async function removeItem(itemId) {
    const id = isNaN(itemId) ? itemId : Number(itemId);
    await removeCartItemAPI(id);
    await loadCart();
    await updateCartBadge();
}

// --- Checkout ---
checkoutBtn.addEventListener('click', async () => {
    try {
        const order = await checkoutAPI();
        if (order && order.order_id) {
            showToastSuccess('Order placed!', `Order #${order.order_id} — Total: $${Number(order.total).toLocaleString()}`);
            await updateCartBadge();
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 2000);
        } else if (order && order.error) {
            showToastError('Checkout failed', order.error);
        }
    } catch (err) {
        showToastError('Error', 'Something went wrong during checkout');
    }
});
