// Мобильное меню
document.addEventListener('DOMContentLoaded', function() {
    // Элементы мобильного меню
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    const mobileMenuClose = document.querySelector('.mobile-menu-close');
    const mobileMenuLinks = document.querySelectorAll('.mobile-nav-menu a');
    
    // Открытие/закрытие мобильного меню
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        mobileMenuClose.addEventListener('click', function() {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
        
        // Закрытие меню при клике на ссылку
        mobileMenuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Закрытие меню при клике вне его
        mobileMenu.addEventListener('click', function(e) {
            if (e.target === mobileMenu) {
                mobileMenu.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Выпадающие меню
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('a');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                
                // Закрыть все другие выпадающие меню
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                    }
                });
                
                // Переключить текущее меню
                dropdown.classList.toggle('active');
            }
        });
    });
    
    // Закрытие выпадающих меню при клике вне их
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            dropdowns.forEach(dropdown => {
                if (!dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });
        }
    });
    
    // Поиск
    const searchForm = document.querySelector('.search-box form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            const searchInput = this.querySelector('input[name="q"]');
            if (!searchInput.value.trim()) {
                e.preventDefault();
                searchInput.focus();
                showNotification('Введите поисковый запрос', 'warning');
            }
        });
    }
    
    // Обновление счетчиков
    updateCartCount();
    updateWishlistCount();
    
    // Обновление счетчиков каждые 30 секунд
    setInterval(updateCartCount, 30000);
    if (isUserAuthenticated()) {
        setInterval(updateWishlistCount, 30000);
    }
    
    // Обработка ошибок сети
    window.addEventListener('online', function() {
        showNotification('Соединение восстановлено', 'success');
        updateCartCount();
        if (isUserAuthenticated()) {
            updateWishlistCount();
        }
    });
    
    window.addEventListener('offline', function() {
        showNotification('Отсутствует подключение к интернету', 'warning');
    });
});

// Вспомогательные функции
function isUserAuthenticated() {
    return document.cookie.includes('sessionid') || 
           document.cookie.includes('csrftoken');
}

function updateCartCount() {
    fetch('/api/cart/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            cartCount.textContent = data.total_items || 0;
            cartCount.style.display = data.total_items > 0 ? 'flex' : 'none';
        }
    })
    .catch(error => {
        console.error('Error updating cart count:', error);
    });
}

function updateWishlistCount() {
    if (!isUserAuthenticated()) return;
    
    fetch('/api/wishlist/', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        const wishlistCount = document.getElementById('wishlist-count');
        if (wishlistCount) {
            const count = data.products_count || 0;
            wishlistCount.textContent = count;
            wishlistCount.style.display = count > 0 ? 'flex' : 'none';
        }
    })
    .catch(error => {
        console.error('Error updating wishlist count:', error);
    });
}

function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Автоматическое скрытие
    const autoHide = setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
    
    // Закрытие по клику
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        clearTimeout(autoHide);
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Глобальные вспомогательные функции
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Обработка формы поиска (общая для всех страниц)
document.addEventListener('DOMContentLoaded', function() {
    const searchInputs = document.querySelectorAll('input[name="q"]');
    
    searchInputs.forEach(input => {
        // Автодополнение поиска
        input.addEventListener('input', debounce(function() {
            if (this.value.length > 2) {
                fetch(`/api/products/?search=${encodeURIComponent(this.value)}&limit=5`)
                    .then(response => response.json())
                    .then(data => {
                        showSearchSuggestions(this, data.results || []);
                    })
                    .catch(error => console.error('Search error:', error));
            }
        }, 300));
        
        // Очистка автодополнения при потере фокуса
        input.addEventListener('blur', function() {
            setTimeout(() => {
                const suggestions = document.querySelector('.search-suggestions');
                if (suggestions) {
                    suggestions.remove();
                }
            }, 200);
        });
    });
});

function showSearchSuggestions(input, products) {
    // Удаляем старые подсказки
    const oldSuggestions = document.querySelector('.search-suggestions');
    if (oldSuggestions) {
        oldSuggestions.remove();
    }
    
    if (products.length === 0) return;
    
    // Создаем контейнер для подсказок
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    
    // Добавляем подсказки
    products.forEach(product => {
        const suggestion = document.createElement('a');
        suggestion.href = `/ingredient/${product.slug}/`;
        suggestion.className = 'search-suggestion';
        suggestion.innerHTML = `
            <div class="suggestion-image">
                <img src="${product.images?.[0]?.image || '/static/img/default-product.jpg'}" 
                     alt="${product.name}">
            </div>
            <div class="suggestion-info">
                <div class="suggestion-name">${product.name}</div>
                <div class="suggestion-price">${formatPrice(product.price)}</div>
            </div>
        `;
        suggestions.appendChild(suggestion);
    });
    
    // Позиционируем подсказки
    const rect = input.getBoundingClientRect();
    suggestions.style.position = 'absolute';
    suggestions.style.top = `${rect.bottom + window.scrollY}px`;
    suggestions.style.left = `${rect.left + window.scrollX}px`;
    suggestions.style.width = `${rect.width}px`;
    
    document.body.appendChild(suggestions);
    
    // Добавляем стили для подсказок
    if (!document.querySelector('#search-suggestions-styles')) {
        const styles = document.createElement('style');
        styles.id = 'search-suggestions-styles';
        styles.textContent = `
            .search-suggestions {
                background: white;
                border: 1px solid #ddd;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                max-height: 300px;
                overflow-y: auto;
                z-index: 1000;
            }
            .search-suggestion {
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #eee;
                text-decoration: none;
                color: inherit;
                transition: background-color 0.2s;
            }
            .search-suggestion:hover {
                background-color: #f5f5f5;
            }
            .search-suggestion:last-child {
                border-bottom: none;
            }
            .suggestion-image {
                width: 40px;
                height: 40px;
                margin-right: 10px;
            }
            .suggestion-image img {
                width: 100%;
                height: 100%;
                object-fit: contain;
                border-radius: 4px;
            }
            .suggestion-info {
                flex: 1;
            }
            .suggestion-name {
                font-size: 14px;
                margin-bottom: 2px;
                color: #333;
            }
            .suggestion-price {
                font-size: 12px;
                color: #e74c3c;
                font-weight: 500;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Анимация счетчиков корзины
function animateCounter(element, newValue) {
    const oldValue = parseInt(element.textContent) || 0;
    if (oldValue === newValue) return;
    
    element.style.transform = 'scale(1.2)';
    element.style.transition = 'transform 0.2s';
    
    setTimeout(() => {
        element.textContent = newValue;
        element.style.transform = 'scale(1)';
    }, 200);
}

// Проверка состояния сети
function checkNetworkStatus() {
    if (!navigator.onLine) {
        showNotification('Отсутствует подключение к интернету', 'warning');
    }
}

// Инициализация при загрузке
window.addEventListener('load', function() {
    checkNetworkStatus();
    
    // Добавляем индикатор загрузки при переходе по ссылкам
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes('#')) {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
                // Показываем индикатор загрузки
                showLoadingIndicator();
            }
        }
    });
});

function showLoadingIndicator() {
    // Создаем индикатор загрузки
    let indicator = document.querySelector('.loading-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'loading-indicator';
        indicator.innerHTML = '<div class="loading-bar"></div>';
        document.body.appendChild(indicator);
        
        // Добавляем стили
        const styles = document.createElement('style');
        styles.textContent = `
            .loading-indicator {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 3px;
                background-color: #f0f0f0;
                z-index: 9999;
            }
            .loading-bar {
                height: 100%;
                background-color: var(--primary-color);
                width: 0%;
                animation: loading 2s infinite;
            }
            @keyframes loading {
                0% { width: 0%; }
                50% { width: 70%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    indicator.style.display = 'block';
    
    // Скрываем через 2 секунды (на случай, если страница не перезагрузилась)
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.display = 'none';
        }
    }, 2000);
}