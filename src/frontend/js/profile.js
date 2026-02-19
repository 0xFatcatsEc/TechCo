// ===== PROFILE PAGE - Tab Switching & CRUD =====

// Redirect to login if not logged in
if (!isLoggedIn()) {
    window.location.href = 'login.html';
}

// --- Elements ---
const acctTabs = document.querySelectorAll('.acct-tab:not(.acct-tab-signout)');
const acctContents = document.querySelectorAll('.acct-content');
const editBtn = document.getElementById('edit-profile-btn');
const editBtnText = document.getElementById('edit-btn-text');
const profileForm = document.getElementById('profile-form');
const deleteBtn = document.getElementById('delete-account-btn');

// --- Profile Fields ---
const pfName = document.getElementById('pf-name');
const pfEmail = document.getElementById('pf-email');
const pfPhone = document.getElementById('pf-phone');
const pfCountry = document.getElementById('pf-country');
const pfCity = document.getElementById('pf-city');
const pfAddress = document.getElementById('pf-address');

// ===== TAB SWITCHING =====
acctTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        // Update active tab
        acctTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Show correct content
        acctContents.forEach(c => c.classList.remove('active'));
        document.getElementById('tab-' + target).classList.add('active');

        // Load data for tab
        if (target === 'orders') loadOrders();
    });
});

// ===== READ - Load Profile from API =====
async function loadProfile() {
    try {
        const user = await fetchProfile();
        if (!user) return;

        document.getElementById('acct-user-name').textContent = user.full_name || user.username || 'User';
        pfName.value = user.full_name || '';
        pfEmail.value = user.email || '';
        pfPhone.value = user.phone || 'n/a';
        pfCountry.value = user.country || 'n/a';
        pfCity.value = user.city || 'n/a';
        pfAddress.value = user.address || 'n/a';
    } catch (err) {
        console.error('Error loading profile:', err);
        // Fallback to localStorage
        const user = getUser();
        if (!user) return;
        document.getElementById('acct-user-name').textContent = user.full_name || user.username || 'User';
        pfName.value = user.full_name || '';
        pfEmail.value = user.email || '';
        pfPhone.value = user.phone || 'n/a';
        pfCountry.value = user.country || 'n/a';
        pfCity.value = user.city || 'n/a';
        pfAddress.value = user.address || 'n/a';
    }
}

// ===== UPDATE - Edit/Save Profile via API =====
let isEditing = false;

editBtn.addEventListener('click', async () => {
    if (!isEditing) {
        // Enable editing
        isEditing = true;
        editBtnText.textContent = 'Save Profile';
        pfName.disabled = false;
        pfEmail.disabled = false;
        pfPhone.disabled = false;
        pfCountry.disabled = false;
        pfCity.disabled = false;
        pfAddress.disabled = false;
        profileForm.classList.add('editing');
    } else {
        // Save profile via API
        try {
            const updatedData = {
                full_name: pfName.value.trim() || 'User',
                email: pfEmail.value.trim(),
                phone: pfPhone.value.trim() || 'n/a',
                country: pfCountry.value.trim() || 'n/a',
                city: pfCity.value.trim() || 'n/a',
                address: pfAddress.value.trim() || 'n/a',
            };

            const result = await updateProfile(updatedData);
            if (result) {
                document.getElementById('acct-user-name').textContent = result.full_name || result.username;
                showToastSuccess('Profile updated', 'Your profile information has been saved');
            }
        } catch (err) {
            showToastError('Error', 'Failed to update profile');
        }

        // Disable editing
        isEditing = false;
        editBtnText.textContent = 'Edit Profile';
        pfName.disabled = true;
        pfEmail.disabled = true;
        pfPhone.disabled = true;
        pfCountry.disabled = true;
        pfCity.disabled = true;
        pfAddress.disabled = true;
        profileForm.classList.remove('editing');
    }
});

// ===== READ - Load Orders from API =====
async function loadOrders() {
    const ordersList = document.getElementById('orders-list');

    try {
        const orders = await fetchOrders();

        if (!orders || orders.length === 0) {
            ordersList.innerHTML = `
                <div class="acct-orders-empty">
                    <svg fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24" style="width:48px;height:48px;color:#4a5568;margin-bottom:12px;">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                    </svg>
                    <p>No orders yet</p>
                </div>`;
            return;
        }

        ordersList.innerHTML = orders.map(order => {
            const itemsHtml = order.items.map(item =>
                `<div class="order-item-row">
                    <span>${item.product_name} &times; ${item.quantity}</span>
                    <span>$${(Number(item.price) * item.quantity).toLocaleString()}</span>
                </div>`
            ).join('');

            const orderDate = new Date(order.order_date).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });

            return `
            <div class="order-card">
                <div class="order-card-header">
                    <div class="order-status">
                        <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="width:18px;height:18px;color:#eab308;">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span>${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </div>
                    <span class="order-date">${orderDate}</span>
                </div>
                <div class="order-items">
                    ${itemsHtml}
                </div>
                <div class="order-total">
                    <span>Total</span>
                    <span class="order-total-amount">$${Number(order.total).toLocaleString()}</span>
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        console.error('Error loading orders:', err);
        ordersList.innerHTML = `<div class="acct-orders-empty"><p>Failed to load orders</p></div>`;
    }
}

// ===== DELETE - Delete Account via Custom Modal =====
const deleteModal = document.getElementById('delete-modal');
const closeDeleteModal = document.getElementById('close-delete-modal');
const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

deleteBtn.addEventListener('click', () => {
    deleteModal.style.display = 'flex';
});

function closeDeleteModalFn() {
    deleteModal.style.display = 'none';
}

closeDeleteModal.addEventListener('click', closeDeleteModalFn);
cancelDeleteBtn.addEventListener('click', closeDeleteModalFn);
deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModalFn();
});

confirmDeleteBtn.addEventListener('click', async () => {
    try {
        confirmDeleteBtn.textContent = 'Deleting...';
        confirmDeleteBtn.disabled = true;
        await deleteAccount();
    } catch (err) {
        showToastError('Error', 'Failed to delete account');
        confirmDeleteBtn.textContent = 'Yes, Delete Account';
        confirmDeleteBtn.disabled = false;
    }
});

// ===== PASSWORD CHANGE MODAL =====
const passwordModal = document.getElementById('password-modal');
const changePasswordBtn = document.getElementById('change-password-btn');
const closePasswordModal = document.getElementById('close-password-modal');
const cancelPasswordBtn = document.getElementById('cancel-password-btn');
const passwordForm = document.getElementById('password-form');

function openPasswordModal() {
    passwordModal.style.display = 'flex';
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
}

function closePasswordModalFn() {
    passwordModal.style.display = 'none';
}

changePasswordBtn.addEventListener('click', openPasswordModal);
closePasswordModal.addEventListener('click', closePasswordModalFn);
cancelPasswordBtn.addEventListener('click', closePasswordModalFn);

// Close modal when clicking outside
passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) closePasswordModalFn();
});

passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPw = document.getElementById('current-password').value;
    const newPw = document.getElementById('new-password').value;
    const confirmPw = document.getElementById('confirm-password').value;

    if (newPw !== confirmPw) {
        showToastError('Error', 'New passwords do not match');
        return;
    }
    if (newPw.length < 6) {
        showToastError('Error', 'Password must be at least 6 characters');
        return;
    }
    try {
        await changePasswordAPI(currentPw, newPw);
        showToastSuccess('Success', 'Password updated successfully');
        closePasswordModalFn();
    } catch (err) {
        const msg = err.error || 'Failed to change password';
        showToastError('Error', msg);
    }
});

// ===== INIT =====
loadProfile();
