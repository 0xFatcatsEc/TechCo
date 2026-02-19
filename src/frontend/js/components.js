// ====== COMPONENTS PAGE - Search, Filter, Sort & View Toggle ======

const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');
const productGrid = document.getElementById('product-grid');
const productCount = document.getElementById('product-count');
const gridViewBtn = document.getElementById('grid-view-btn');
const listViewBtn = document.getElementById('list-view-btn');

function getProducts() {
    return Array.from(productGrid.querySelectorAll('.product-card'));
}

function filterAndSort() {
    const query = searchInput.value.toLowerCase().trim();
    const category = categoryFilter.value;
    const sort = sortFilter.value;
    const cards = getProducts();
    let visible = 0;

    cards.forEach(card => {
        const name = card.dataset.name.toLowerCase();
        const cat = card.dataset.category;
        const matchSearch = name.includes(query);
        const matchCategory = category === 'all' || cat === category;

    if (matchSearch && matchCategory) {
        card.style.display = '';
        visible++;
    } else {
        card.style.display = 'none';
    }
});

  // Sort visible cards
    const visibleCards = cards.filter(c => c.style.display !== 'none');
    visibleCards.sort((a, b) => {
    switch (sort) {
        case 'name': return a.dataset.name.localeCompare(b.dataset.name);
        case 'price-low': return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
        case 'price-high': return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
        case 'rating': return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
    default: return 0;
    }
});

    visibleCards.forEach(card => productGrid.appendChild(card));
    cards.filter(c => c.style.display === 'none').forEach(card => productGrid.appendChild(card));
    productCount.textContent = visible;
}

searchInput.addEventListener('input', filterAndSort);
categoryFilter.addEventListener('change', filterAndSort);
sortFilter.addEventListener('change', filterAndSort);

// View Toggle
gridViewBtn.addEventListener('click', () => {
    productGrid.classList.remove('list-view');
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
});

listViewBtn.addEventListener('click', () => {
    productGrid.classList.add('list-view');
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
});

// ===== CART BUTTON HANDLER =====
document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const card = btn.closest('.product-card');
        const name = card ? card.dataset.name : 'Product';
        const price = card ? parseFloat(card.dataset.price) : 0;
        const category = card ? (card.dataset.category || '') : '';
        handleAddToCart(name, price, category, '');
    });
});
