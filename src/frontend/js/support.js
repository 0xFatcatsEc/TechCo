// ===== FAQ ACCORDION =====
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
    const button = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');

button.addEventListener('click', () => {
    const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

    // Close all
    faqItems.forEach(other => {
        const otherAnswer = other.querySelector('.faq-answer');
        const otherIcon = other.querySelector('.faq-icon');
        otherAnswer.style.maxHeight = '0px';
        otherIcon.style.transform = 'rotate(0deg)';
        other.classList.remove('active');
    });

    // Toggle current
    if (!isOpen) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
        item.classList.add('active');
    }
    });
});

// ===== FAQ CATEGORY FILTER =====
const categoryBtns = document.querySelectorAll('.faq-category-btn');
const searchFaqInput = document.getElementById('faq-search');

function getActiveCategory() {
    const activeBtn = document.querySelector('.faq-category-btn.active');
    return activeBtn ? activeBtn.dataset.category : 'all';
}

function filterFaqs() {
    const query = searchFaqInput.value.toLowerCase().trim();
    const category = getActiveCategory();
    let visibleCount = 0;

faqItems.forEach(item => {
    const text = item.querySelector('.faq-question span').textContent.toLowerCase();
    const cat = item.dataset.category;
    const matchSearch = text.includes(query);
    const matchCategory = category === 'all' || cat === category;

    if (matchSearch && matchCategory) {
        item.style.display = '';
        visibleCount++;
    } else {
        item.style.display = 'none';
      // Close hidden items
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-icon');
    answer.style.maxHeight = '0px';
    icon.style.transform = 'rotate(0deg)';
    item.classList.remove('active');
    }
});
}

categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
    categoryBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    filterFaqs();
    });
});

searchFaqInput.addEventListener('input', filterFaqs);

// ===== TOAST NOTIFICATION =====
function showToast(title, message) {
    // Remove existing toast if any
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <strong class="toast-title">${title}</strong>
        <p class="toast-msg">${message}</p>
    `;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => toast.classList.add('show'));

    // Auto dismiss after 4s
    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
}

// ===== CONTACT FORM =====
const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('contact-email').value;
    const subject = document.getElementById('contact-subject').value;
    const message = document.getElementById('contact-message').value;

if (!email || !subject || !message) {
    showToast('Missing fields', 'Please fill in all fields.');
    return;
}

    showToast('Request submitted', "We'll get back to you within 24 hours.");
    contactForm.reset();
});
