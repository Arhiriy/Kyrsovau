// Основной JavaScript для главной страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация слайдера отзывов
    initReviewsSlider();
    
    // Инициализация категорий
    initCategories();
    
    // Загрузка рекомендуемых товаров
    loadFeaturedProducts();
    
    // Загрузка новинок
    loadNewProducts();
    
    // Инициализация рассылки
    initNewsletter();
    
    // Инициализация анимаций
    initAnimations();
    
    // Инициализация быстрого просмотра товаров
    initQuickView();
});

function initReviewsSlider() {
    const slider = document.querySelector('.reviews-slider');
    if (!slider) return;
    
    let currentIndex = 0;
    const reviews = slider.querySelectorAll('.review-card');
    const totalReviews = reviews.length;
    
    if (totalReviews <= 1) return;
    
    // УБРАЛИ СОЗДАНИЕ НАВИГАЦИИ ВООБЩЕ
    // const nav = document.createElement('div');
    // nav.className = 'reviews-slider-nav';
    // nav.innerHTML = `
    //     <button class="slider-prev"><i class="fas fa-chevron-left"></i></button>
    //     <div class="slider-dots"></div>
    //     <button class="slider-next"><i class="fas fa-chevron-right"></i></button>
    // `;
    // slider.parentNode.appendChild(nav);
    
    // УБРАЛИ СОЗДАНИЕ ТОЧЕК
    // const dotsContainer = nav.querySelector('.slider-dots');
    // for (let i = 0; i < totalReviews; i++) {
    //     const dot = document.createElement('span');
    //     dot.className = 'slider-dot';
    //     if (i === 0) dot.classList.add('active');
    //     dot.addEventListener('click', () => goToSlide(i));
    //     dotsContainer.appendChild(dot);
    // }
    
    // Функция перехода к слайду (оставляем, так как автопрокрутка еще работает)
    function goToSlide(index) {
        if (index < 0) index = totalReviews - 1;
        if (index >= totalReviews) index = 0;
        
        currentIndex = index;
        
        // Обновляем видимые отзывы
        reviews.forEach((review, i) => {
            if (i >= index && i < index + 3) {
                review.style.display = 'block';
            } else {
                review.style.display = 'none';
            }
        });
        
        // УБРАЛИ ОБНОВЛЕНИЕ ТОЧЕК
        // document.querySelectorAll('.slider-dot').forEach((dot, i) => {
        //     dot.classList.toggle('active', i === index);
        // });
    }
    
    // УБРАЛИ НАВИГАЦИЮ СТРЕЛКАМИ
    // nav.querySelector('.slider-prev').addEventListener('click', () => {
    //     goToSlide(currentIndex - 1);
    // });
    // 
    // nav.querySelector('.slider-next').addEventListener('click', () => {
    //     goToSlide(currentIndex + 1);
    // });
    
    // Автопрокрутка (оставляем)
    let autoSlide = setInterval(() => {
        goToSlide(currentIndex + 1);
    }, 5000);
    
    // Остановка автопрокрутки при наведении (оставляем)
    slider.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
    });
    
    slider.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 5000);
    });
    
    // Инициализация первого слайда
    goToSlide(0);
}

function initCategories() {
    const categoryCards = document.querySelectorAll('.category-card');
    
    categoryCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            const image = this.querySelector('.category-image img');
            image.style.transform = 'scale(1.05)';
        });
        
        card.addEventListener('mouseleave', function() {
            const image = this.querySelector('.category-image img');
            image.style.transform = 'scale(1)';
        });
    });
}

function loadFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    fetch('/api/products/featured/')
        .then(response => response.json())
        .then(products => {
            if (products.length > 0) {
                container.innerHTML = '';
                products.forEach(product => {
                    container.appendChild(createProductCard(product));
                });
            } else {
                container.innerHTML = '<p class="no-products">Нет рекомендуемых товаров</p>';
            }
        })
        .catch(error => {
            console.error('Error loading featured products:', error);
            container.innerHTML = '<p class="error">Ошибка загрузки товаров</p>';
        });
}

function loadNewProducts() {
    const container = document.getElementById('new-products');
    if (!container) return;
    
    fetch('/api/products/new_arrivals/')
        .then(response => response.json())
        .then(products => {
            if (products.length > 0) {
                container.innerHTML = '';
                products.forEach(product => {
                    container.appendChild(createProductCard(product));
                });
            } else {
                container.innerHTML = '<p class="no-products">Нет новых товаров</p>';
            }
        })
        .catch(error => {
            console.error('Error loading new products:', error);
            container.innerHTML = '<p class="error">Ошибка загрузки товаров</p>';
        });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const image = product.images && product.images.length > 0 
        ? product.images[0].image 
        : '/static/img/default-product.jpg';
    
    div.innerHTML = `
        <a href="/ingredient/${product.slug}/" class="product-link">
            <div class="product-image">
                <img src="${image}" alt="${product.name}" loading="lazy">
                ${product.is_featured ? '<span class="featured-badge">Рекомендуем</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-category">${product.category ? product.category.name : ''}</div>
                <div class="product-price">${formatPrice(product.price)}</div>
                <div class="product-measure">${product.measure_with_weight}</div>
            </div>
        </a>
        <button class="add-to-cart-btn" data-product-id="${product.id}">
            <i class="fas fa-shopping-cart"></i> В корзину
        </button>
    `;
    
    // Обработчик кнопки "В корзину"
    const addToCartBtn = div.querySelector('.add-to-cart-btn');
    addToCartBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const productId = this.getAttribute('data-product-id');
        addToCart(productId);
    });
    
    // Быстрый просмотр
    const productLink = div.querySelector('.product-link');
    productLink.addEventListener('click', function(e) {
        // Если клик был по кнопке корзины, не открываем быстрый просмотр
        if (e.target.closest('.add-to-cart-btn')) {
            return;
        }
        
        // На мобильных устройствах сразу переходим на страницу товара
        if (window.innerWidth <= 768) {
            return;
        }
        
        e.preventDefault();
        showQuickView(product.slug);
    });
    
    return div;
}

function addToCart(productId, quantity = 1) {
    fetch('/api/cart/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
            product_id: productId,
            quantity: quantity
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            showNotification('Товар добавлен в корзину!', 'success');
            updateCartCount();
        } else if (data.error) {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка добавления в корзину', 'error');
    });
}

function initNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = this.querySelector('input[type="email"]').value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            showNotification('Введите корректный email', 'error');
            return;
        }
        
        // Здесь должен быть AJAX запрос на сервер
        // Временно имитируем успешную подписку
        showNotification('Спасибо за подписку!', 'success');
        this.reset();
    });
}

function initAnimations() {
    // Анимация появления элементов при скролле
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
            }
        });
    }, observerOptions);
    
    // Наблюдаем за элементами, которые нужно анимировать
    document.querySelectorAll('.advantage-card, .category-card, .product-card').forEach(el => {
        observer.observe(el);
    });
}

function initQuickView() {
    // Создаем контейнер для быстрого просмотра
    if (!document.getElementById('quick-view-modal')) {
        const modal = document.createElement('div');
        modal.id = 'quick-view-modal';
        modal.className = 'modal quick-view-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Быстрый просмотр</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="quick-view-content">
                        <div class="loading-quick-view">
                            <i class="fas fa-spinner fa-spin"></i>
                            <p>Загрузка товара...</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики закрытия
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Добавляем стили
        const styles = document.createElement('style');
        styles.textContent = `
            .quick-view-modal .modal-content {
                max-width: 900px;
                width: 95%;
                max-height: 90vh;
                overflow-y: auto;
            }
            .quick-view-content {
                padding: 20px;
            }
            .quick-view-product {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
            }
            .quick-view-image img {
                width: 100%;
                max-height: 400px;
                object-fit: contain;
            }
            .quick-view-info h2 {
                margin-bottom: 15px;
                font-size: 24px;
            }
            .quick-view-price {
                font-size: 28px;
                color: var(--primary-color);
                font-weight: 700;
                margin: 15px 0;
            }
            .loading-quick-view {
                text-align: center;
                padding: 60px 20px;
                color: var(--gray-color);
            }
            @media (max-width: 768px) {
                .quick-view-product {
                    grid-template-columns: 1fr;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

function showQuickView(productSlug) {
    const modal = document.getElementById('quick-view-modal');
    const content = modal.querySelector('.quick-view-content');
    
    // Показываем загрузку
    content.innerHTML = `
        <div class="loading-quick-view">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка товара...</p>
        </div>
    `;
    
    // Открываем модальное окно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Загружаем данные товара
    fetch(`/api/products/${productSlug}/`)
        .then(response => response.json())
        .then(product => {
            const image = product.images && product.images.length > 0 
                ? product.images[0].image 
                : '/static/img/default-product.jpg';
            
            content.innerHTML = `
                <div class="quick-view-product">
                    <div class="quick-view-image">
                        <img src="${image}" alt="${product.name}">
                    </div>
                    <div class="quick-view-info">
                        <h2>${product.name}</h2>
                        <div class="product-category">${product.category ? product.category.name : ''}</div>
                        <div class="quick-view-price">${formatPrice(product.price)}</div>
                        <div class="product-measure">${product.measure_with_weight}</div>
                        <p class="product-description">${product.description.substring(0, 200)}...</p>
                        <div class="quick-view-actions">
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">
                                <i class="fas fa-shopping-cart"></i> В корзину
                            </button>
                            <a href="/ingredient/${product.slug}/" class="btn btn-outline">
                                Подробнее
                            </a>
                        </div>
                    </div>
                </div>
            `;
        })
        .catch(error => {
            console.error('Error loading quick view:', error);
            content.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ошибка загрузки товара</p>
                </div>
            `;
        });
}

// Вспомогательные функции (должны быть в глобальной области видимости)
function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

// Инициализация счетчика посещений
function initVisitCounter() {
    let visitCount = localStorage.getItem('visitCount') || 0;
    visitCount = parseInt(visitCount) + 1;
    localStorage.setItem('visitCount', visitCount);
    
    // Показываем приветствие для новых посетителей
    if (visitCount === 1) {
        setTimeout(() => {
            showNotification('Добро пожаловать в наш магазин!', 'info');
        }, 1000);
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    initVisitCounter();
    
    // Проверяем, есть ли товары в корзине при первом посещении
    if (!localStorage.getItem('cartChecked')) {
        updateCartCount();
        localStorage.setItem('cartChecked', 'true');
    }
    
    // Добавляем класс для анимаций
    document.body.classList.add('page-loaded');
});

// Добавляем обработчик для всех кнопок добавления в корзину
document.addEventListener('click', function(e) {
    const addToCartBtn = e.target.closest('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.dataset.initialized) {
        addToCartBtn.dataset.initialized = 'true';
        
        const productId = addToCartBtn.getAttribute('data-product-id');
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addToCart(productId);
        });
    }
});