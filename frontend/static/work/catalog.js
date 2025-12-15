// JavaScript для страницы каталога
document.addEventListener('DOMContentLoaded', function() {
    // Инициализация фильтров
    initFilters();
    
    // Инициализация сортировки
    initSorting();
    
    // Инициализация просмотра (сетка/список)
    initViewMode();
    
    // Инициализация пагинации
    initPagination();
    
    // Инициализация мобильных фильтров
    initMobileFilters();
    
    // Загрузка товаров
    loadProducts();
    
    // Инициализация поиска в каталоге
    initCatalogSearch();
});

function initFilters() {
    // Фильтр по цене
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const priceRangeMin = document.getElementById('price-range-min');
    const priceRangeMax = document.getElementById('price-range-max');
    const applyPriceBtn = document.getElementById('apply-price-filter');
    
    if (minPriceInput && maxPriceInput && priceRangeMin && priceRangeMax) {
        // Синхронизация полей ввода и ползунков
        minPriceInput.addEventListener('input', function() {
            priceRangeMin.value = this.value || 0;
        });
        
        maxPriceInput.addEventListener('input', function() {
            priceRangeMax.value = this.value || 10000;
        });
        
        priceRangeMin.addEventListener('input', function() {
            minPriceInput.value = this.value;
        });
        
        priceRangeMax.addEventListener('input', function() {
            maxPriceInput.value = this.value;
        });
        
        // Применение фильтра по цене
        applyPriceBtn.addEventListener('click', function() {
            const minPrice = minPriceInput.value || null;
            const maxPrice = maxPriceInput.value || null;
            
            if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
                showNotification('Минимальная цена не может быть больше максимальной', 'error');
                return;
            }
            
            updateFilter('min_price', minPrice);
            updateFilter('max_price', maxPrice);
            loadProducts();
        });
    }
    
    // Фильтр по категориям
    const categoryRadios = document.querySelectorAll('input[name="category"]');
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateFilter('category', this.value || null);
            loadProducts();
        });
    });
    
    // Фильтр по кухне
    const cuisineCheckboxes = document.querySelectorAll('input[name="cuisine"]');
    cuisineCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const selectedCuisines = Array.from(document.querySelectorAll('input[name="cuisine"]:checked'))
                .map(cb => cb.value);
            updateFilter('cuisine', selectedCuisines);
            loadProducts();
        });
    });
    
    // Фильтр по наличию
    const inStockCheckbox = document.getElementById('in-stock');
    if (inStockCheckbox) {
        inStockCheckbox.addEventListener('change', function() {
            updateFilter('in_stock', this.checked);
            loadProducts();
        });
    }
    
    // Сброс фильтров
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetFilters();
            loadProducts();
        });
    }
}

function initSorting() {
    const sortSelect = document.getElementById('sort-by');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            updateFilter('ordering', this.value);
            loadProducts();
        });
    }
}

function initViewMode() {
    const viewBtns = document.querySelectorAll('.view-btn');
    const productsContainer = document.getElementById('products-container');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            
            // Обновляем активную кнопку
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Изменяем отображение
            productsContainer.className = 'products-container ' + view + '-view';
            
            // Сохраняем выбор в localStorage
            localStorage.setItem('preferredView', view);
        });
    });
    
    // Восстанавливаем сохраненный вид
    const savedView = localStorage.getItem('preferredView') || 'grid';
    const savedBtn = document.querySelector(`.view-btn[data-view="${savedView}"]`);
    if (savedBtn) {
        savedBtn.click();
    }
}

function initPagination() {
    // Пагинация инициализируется динамически при загрузке товаров
}

function initMobileFilters() {
    const mobileFiltersBtn = document.querySelector('.mobile-filters-btn');
    const mobileFiltersOverlay = document.querySelector('.mobile-filters-overlay');
    const mobileFiltersSidebar = document.querySelector('.mobile-filters-sidebar');
    const mobileFiltersClose = document.querySelector('.mobile-filters-close');
    const applyFiltersBtn = document.querySelector('.apply-filters-btn');
    
    if (mobileFiltersBtn && mobileFiltersSidebar) {
        // Открытие мобильных фильтров
        mobileFiltersBtn.addEventListener('click', function() {
            mobileFiltersOverlay.style.display = 'block';
            mobileFiltersSidebar.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Закрытие мобильных фильтров
        function closeMobileFilters() {
            mobileFiltersOverlay.style.display = 'none';
            mobileFiltersSidebar.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (mobileFiltersOverlay) {
            mobileFiltersOverlay.addEventListener('click', closeMobileFilters);
        }
        
        // Применение фильтров
        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', function() {
                // Копируем значения из мобильных фильтров в основные
                const mobileCategory = mobileFiltersSidebar.querySelector('input[name="category"]:checked');
                if (mobileCategory) {
                    document.querySelector(`input[name="category"][value="${mobileCategory.value}"]`).checked = true;
                }
                
                const mobileMinPrice = mobileFiltersSidebar.querySelector('#mobile-min-price');
                const mobileMaxPrice = mobileFiltersSidebar.querySelector('#mobile-max-price');
                if (mobileMinPrice && mobileMaxPrice) {
                    document.getElementById('min-price').value = mobileMinPrice.value;
                    document.getElementById('max-price').value = mobileMaxPrice.value;
                }
                
                // Применяем фильтры и закрываем панель
                loadProducts();
                closeMobileFilters();
            });
        }
    }
}

function initCatalogSearch() {
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        // Восстанавливаем поисковый запрос из URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('q')) {
            searchInput.value = urlParams.get('q');
        }
        
        // Очистка поиска
        const clearSearchBtn = document.createElement('button');
        clearSearchBtn.type = 'button';
        clearSearchBtn.className = 'clear-search';
        clearSearchBtn.innerHTML = '<i class="fas fa-times"></i>';
        clearSearchBtn.style.display = searchInput.value ? 'block' : 'none';
        
        searchInput.parentNode.insertBefore(clearSearchBtn, searchInput.nextSibling);
        
        clearSearchBtn.addEventListener('click', function() {
            searchInput.value = '';
            this.style.display = 'none';
            updateFilter('search', '');
            loadProducts();
        });
        
        searchInput.addEventListener('input', function() {
            clearSearchBtn.style.display = this.value ? 'block' : 'none';
        });
        
        // Автоматический поиск при вводе (с задержкой)
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                updateFilter('search', this.value);
                updateFilter('page', 1);
                loadProducts();
            }, 500);
        });
    }
}

// Текущие фильтры
let currentFilters = {
    category: null,
    min_price: null,
    max_price: null,
    cuisine: [],
    in_stock: false,
    search: '',
    ordering: 'popular',
    page: 1
};

function updateFilter(key, value) {
    currentFilters[key] = value;
    
    // Обновляем URL (без перезагрузки страницы)
    updateURL();
    
    // Сохраняем фильтры в localStorage
    saveFiltersToLocalStorage();
}

function updateURL() {
    const params = new URLSearchParams();
    
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
            if (Array.isArray(value) && value.length > 0) {
                value.forEach(v => params.append(key, v));
            } else if (!Array.isArray(value)) {
                params.set(key, value);
            }
        }
    });
    
    const newURL = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', newURL);
}

function saveFiltersToLocalStorage() {
    localStorage.setItem('catalogFilters', JSON.stringify(currentFilters));
}

function loadFiltersFromLocalStorage() {
    try {
        const saved = JSON.parse(localStorage.getItem('catalogFilters'));
        if (saved) {
            currentFilters = { ...currentFilters, ...saved };
            
            // Обновляем UI
            updateFiltersUI();
        }
    } catch (e) {
        console.error('Error loading filters:', e);
    }
}

function updateFiltersUI() {
    // Категория
    if (currentFilters.category) {
        const categoryRadio = document.querySelector(`input[name="category"][value="${currentFilters.category}"]`);
        if (categoryRadio) {
            categoryRadio.checked = true;
        }
    }
    
    // Цена
    if (currentFilters.min_price) {
        document.getElementById('min-price').value = currentFilters.min_price;
        document.getElementById('price-range-min').value = currentFilters.min_price;
    }
    
    if (currentFilters.max_price) {
        document.getElementById('max-price').value = currentFilters.max_price;
        document.getElementById('price-range-max').value = currentFilters.max_price;
    }
    
    // Кухня
    document.querySelectorAll('input[name="cuisine"]').forEach(checkbox => {
        checkbox.checked = currentFilters.cuisine.includes(checkbox.value);
    });
    
    // Наличие
    document.getElementById('in-stock').checked = currentFilters.in_stock;
    
    // Сортировка
    document.getElementById('sort-by').value = currentFilters.ordering;
    
    // Поиск
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        searchInput.value = currentFilters.search;
    }
}

function resetFilters() {
    currentFilters = {
        category: null,
        min_price: null,
        max_price: null,
        cuisine: [],
        in_stock: false,
        search: '',
        ordering: 'popular',
        page: 1
    };
    
    // Обновляем UI
    document.querySelector('input[name="category"][value=""]').checked = true;
    document.getElementById('min-price').value = '';
    document.getElementById('max-price').value = '';
    document.getElementById('price-range-min').value = 0;
    document.getElementById('price-range-max').value = 10000;
    
    document.querySelectorAll('input[name="cuisine"]').forEach(cb => cb.checked = false);
    document.getElementById('in-stock').checked = false;
    document.getElementById('sort-by').value = 'popular';
    
    const searchInput = document.querySelector('input[name="q"]');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Очищаем localStorage
    localStorage.removeItem('catalogFilters');
    
    // Обновляем URL
    updateURL();
}

function loadProducts() {
    const container = document.getElementById('products-container');
    const pagination = document.getElementById('pagination');
    const productsCount = document.getElementById('products-count');
    
    // Показываем индикатор загрузки
    container.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка товаров...</p>
        </div>
    `;
    
    // Формируем URL с фильтрами
    let url = '/api/products/?';
    const params = [];
    
    Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
            if (Array.isArray(value) && value.length > 0) {
                value.forEach(v => params.push(`${key}=${encodeURIComponent(v)}`));
            } else if (!Array.isArray(value) && value !== '' && value !== false) {
                params.push(`${key}=${encodeURIComponent(value)}`);
            }
        }
    });
    
    url += params.join('&');
    
    // Загружаем товары
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Обновляем количество товаров
            if (productsCount) {
                productsCount.textContent = data.count || 0;
            }
            
            // Очищаем контейнер
            container.innerHTML = '';
            
            if (data.results && data.results.length > 0) {
                // Добавляем товары
                data.results.forEach(product => {
                    container.appendChild(createProductCard(product));
                });
                
                // Добавляем пагинацию
                renderPagination(data, pagination);
            } else {
                container.innerHTML = `
                    <div class="no-products">
                        <i class="fas fa-search"></i>
                        <h3>Товары не найдены</h3>
                        <p>Попробуйте изменить параметры фильтрации</p>
                        <button class="btn btn-primary" onclick="resetFilters(); loadProducts();">
                            Сбросить все фильтры
                        </button>
                    </div>
                `;
                
                // Очищаем пагинацию
                if (pagination) {
                    pagination.innerHTML = '';
                }
            }
        })
        .catch(error => {
            console.error('Error loading products:', error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Ошибка загрузки</h3>
                    <p>Пожалуйста, попробуйте позже</p>
                </div>
            `;
        });
}

function createProductCard(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const image = product.images && product.images.length > 0 
        ? product.images[0].image 
        : '/static/img/default-product.jpg';
    
    const rating = product.average_rating || 0;
    const reviewCount = product.review_count || 0;
    
    div.innerHTML = `
        <div class="product-card-inner">
            <a href="/ingredient/${product.slug}/" class="product-image-link">
                <div class="product-image">
                    <img src="${image}" alt="${product.name}" loading="lazy">
                    ${product.stock <= 0 ? '<span class="out-of-stock">Нет в наличии</span>' : ''}
                    ${product.is_featured ? '<span class="featured-badge">Рекомендуем</span>' : ''}
                </div>
            </a>
            
            <div class="product-info">
                <a href="/ingredient/${product.slug}/" class="product-name">${product.name}</a>
                
                <div class="product-category">${product.category ? product.category.name : ''}</div>
                
                <div class="product-rating">
                    <div class="stars">
                        ${generateStars(rating)}
                    </div>
                    <span class="review-count">(${reviewCount})</span>
                </div>
                
                <div class="product-description-short">
                    ${product.description.length > 100 ? product.description.substring(0, 100) + '...' : product.description}
                </div>
                
                <div class="product-price-block">
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-measure">${product.measure_with_weight}</div>
                </div>
                
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart-btn" 
                            data-product-id="${product.id}"
                            ${product.stock <= 0 ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart"></i>
                        ${product.stock <= 0 ? 'Нет в наличии' : 'В корзину'}
                    </button>
                    
                    <button class="wishlist-btn" data-product-id="${product.id}" title="В список желаний">
                        <i class="fas fa-heart"></i>
                    </button>
                    
                    <button class="compare-btn" data-product-id="${product.id}" title="Сравнить">
                        <i class="fas fa-exchange-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Обработчики событий
    const addToCartBtn = div.querySelector('.add-to-cart-btn');
    if (addToCartBtn && !addToCartBtn.disabled) {
        addToCartBtn.addEventListener('click', function(e) {
            e.preventDefault();
            addToCart(product.id);
        });
    }
    
    const wishlistBtn = div.querySelector('.wishlist-btn');
    wishlistBtn.addEventListener('click', function(e) {
        e.preventDefault();
        toggleWishlist(product.id);
    });
    
    const compareBtn = div.querySelector('.compare-btn');
    compareBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addToCompare(product);
    });
    
    return div;
}

function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
        if (i <= fullStars) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === fullStars + 1 && hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    
    return stars;
}

function renderPagination(data, container) {
    if (!container) return;
    
    if (!data.previous && !data.next) {
        container.innerHTML = '';
        return;
    }
    
    const totalPages = Math.ceil(data.count / 20); // PAGE_SIZE = 20
    const currentPage = currentFilters.page;
    
    let html = '<div class="pagination-inner">';
    
    // Кнопка "Назад"
    if (data.previous) {
        html += `
            <a href="#" class="page-link prev" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i> Назад
            </a>
        `;
    }
    
    // Номера страниц
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<a href="#" class="page-link" data-page="1">1</a>`;
        if (startPage > 2) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `
            <a href="#" class="page-link ${i === currentPage ? 'active' : ''}" data-page="${i}">
                ${i}
            </a>
        `;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="page-dots">...</span>`;
        }
        html += `<a href="#" class="page-link" data-page="${totalPages}">${totalPages}</a>`;
    }
    
    // Кнопка "Вперед"
    if (data.next) {
        html += `
            <a href="#" class="page-link next" data-page="${currentPage + 1}">
                Вперед <i class="fas fa-chevron-right"></i>
            </a>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Обработчики для пагинации
    container.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = parseInt(this.getAttribute('data-page'));
            if (page && page !== currentFilters.page) {
                currentFilters.page = page;
                loadProducts();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    });
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

function toggleWishlist(productId) {
    if (!isUserAuthenticated()) {
        showNotification('Войдите в систему, чтобы использовать список желаний', 'warning');
        return;
    }
    
    fetch('/api/wishlist/check_product/?product_id=' + productId)
        .then(response => response.json())
        .then(data => {
            if (data.in_wishlist) {
                // Удалить из списка желаний
                fetch('/api/wishlist/remove_product/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ product_id: productId })
                })
                .then(() => {
                    showNotification('Удалено из списка желаний', 'info');
                    updateWishlistCount();
                });
            } else {
                // Добавить в список желаний
                fetch('/api/wishlist/add_product/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({ product_id: productId })
                })
                .then(() => {
                    showNotification('Добавлено в список желаний!', 'success');
                    updateWishlistCount();
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка работы со списком желаний', 'error');
        });
}

function addToCompare(product) {
    let compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    
    // Проверяем, не добавлен ли уже товар
    if (compareList.find(item => item.id === product.id)) {
        showNotification('Товар уже в списке сравнения', 'info');
        return;
    }
    
    // Ограничиваем количество товаров для сравнения
    if (compareList.length >= 4) {
        showNotification('Можно сравнивать не более 4 товаров', 'warning');
        return;
    }
    
    // Добавляем товар
    compareList.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0]?.image || '/static/img/default-product.jpg',
        slug: product.slug
    });
    
    localStorage.setItem('compareList', JSON.stringify(compareList));
    showNotification('Товар добавлен для сравнения', 'success');
    
    // Показываем панель сравнения
    showComparePanel();
}

function showComparePanel() {
    let panel = document.querySelector('.compare-panel');
    
    if (!panel) {
        panel = document.createElement('div');
        panel.className = 'compare-panel';
        panel.innerHTML = `
            <div class="compare-panel-header">
                <h4>Сравнение товаров</h4>
                <button class="compare-panel-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="compare-items"></div>
            <div class="compare-actions">
                <a href="/compare/" class="btn btn-primary btn-small">Сравнить</a>
                <button class="btn btn-outline btn-small clear-compare">Очистить</button>
            </div>
        `;
        document.body.appendChild(panel);
        
        // Обработчики событий
        panel.querySelector('.compare-panel-close').addEventListener('click', () => {
            panel.classList.remove('active');
        });
        
        panel.querySelector('.clear-compare').addEventListener('click', () => {
            localStorage.removeItem('compareList');
            panel.classList.remove('active');
            showNotification('Список сравнения очищен', 'info');
        });
        
        // Добавляем стили
        const styles = document.createElement('style');
        styles.textContent = `
            .compare-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 1000;
                transform: translateY(150%);
                transition: transform 0.3s ease;
            }
            .compare-panel.active {
                transform: translateY(0);
            }
            .compare-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid #eee;
            }
            .compare-panel-header h4 {
                margin: 0;
                font-size: 16px;
            }
            .compare-panel-close {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
                font-size: 18px;
            }
            .compare-items {
                padding: 15px;
                max-height: 200px;
                overflow-y: auto;
            }
            .compare-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 0;
                border-bottom: 1px solid #f5f5f5;
            }
            .compare-item:last-child {
                border-bottom: none;
            }
            .compare-item img {
                width: 40px;
                height: 40px;
                object-fit: contain;
                border-radius: 4px;
            }
            .compare-item-info {
                flex: 1;
            }
            .compare-item-name {
                font-size: 14px;
                margin-bottom: 5px;
            }
            .compare-item-price {
                color: var(--primary-color);
                font-size: 14px;
                font-weight: 500;
            }
            .compare-remove {
                background: none;
                border: none;
                color: #999;
                cursor: pointer;
            }
            .compare-actions {
                padding: 15px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 10px;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Обновляем список товаров
    const compareList = JSON.parse(localStorage.getItem('compareList') || '[]');
    const itemsContainer = panel.querySelector('.compare-items');
    
    if (compareList.length > 0) {
        itemsContainer.innerHTML = '';
        
        compareList.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'compare-item';
            itemDiv.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="compare-item-info">
                    <div class="compare-item-name">${item.name}</div>
                    <div class="compare-item-price">${formatPrice(item.price)}</div>
                </div>
                <button class="compare-remove" data-id="${item.id}">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // Обработчик удаления
            itemDiv.querySelector('.compare-remove').addEventListener('click', function() {
                const productId = parseInt(this.getAttribute('data-id'));
                const updatedList = compareList.filter(item => item.id !== productId);
                localStorage.setItem('compareList', JSON.stringify(updatedList));
                showComparePanel();
            });
            
            itemsContainer.appendChild(itemDiv);
        });
        
        panel.classList.add('active');
    } else {
        panel.classList.remove('active');
    }
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    // Загружаем сохраненные фильтры
    loadFiltersFromLocalStorage();
    
    // Парсим фильтры из URL
    parseURLFilters();
    
    // Загружаем товары с текущими фильтрами
    loadProducts();
    
    // Показываем панель сравнения, если есть товары
    setTimeout(showComparePanel, 1000);
});

function parseURLFilters() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('category')) {
        currentFilters.category = params.get('category');
    }
    if (params.has('min_price')) {
        currentFilters.min_price = params.get('min_price');
    }
    if (params.has('max_price')) {
        currentFilters.max_price = params.get('max_price');
    }
    if (params.has('cuisine')) {
        currentFilters.cuisine = params.getAll('cuisine');
    }
    if (params.has('in_stock')) {
        currentFilters.in_stock = params.get('in_stock') === 'true';
    }
    if (params.has('search')) {
        currentFilters.search = params.get('search');
    }
    if (params.has('ordering')) {
        currentFilters.ordering = params.get('ordering');
    }
    if (params.has('page')) {
        currentFilters.page = parseInt(params.get('page')) || 1;
    }
}

// Вспомогательные функции из header.js
function isUserAuthenticated() {
    return document.cookie.includes('sessionid') || 
           document.cookie.includes('csrftoken');
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

// Глобальные функции для использования в HTML
window.resetFilters = resetFilters;
window.loadProducts = loadProducts;