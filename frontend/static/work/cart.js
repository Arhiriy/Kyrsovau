// cart.js - Работа корзины (добавление, удаление)

document.addEventListener('DOMContentLoaded', function() {
    // Инициализация корзины
    loadCart();
    
    // Инициализация элементов управления
    initCartControls();
    
    // Инициализация формы оформления заказа
    initCheckoutForm();

    function loadCart() {
        fetch('/api/cart/')
            .then(response => response.json())
            .then(data => {
                updateCartUI(data);
                updateSummary(data);
            })
            .catch(error => {
                console.error('Error loading cart:', error);
                showError('Ошибка загрузки корзины');
            });
    }

    function updateCartUI(cartData) {
        const cartItemsContainer = document.getElementById('cart-items');
        
        if (!cartItemsContainer) return;
        
        if (cartData.items && cartData.items.length > 0) {
            cartItemsContainer.innerHTML = '';
            
            cartData.items.forEach(item => {
                const cartItem = createCartItemElement(item);
                cartItemsContainer.appendChild(cartItem);
            });
            
            // Обновляем общую информацию
            updateCartSummary(cartData);
        } else {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <h3>Корзина пуста</h3>
                    <p>Добавьте товары из каталога</p>
                    <a href="{% url 'catalog' %}" class="btn btn-primary">В каталог</a>
                </div>
            `;
            
            // Скрываем форму оформления заказа
            const checkoutSection = document.querySelector('.checkout-section');
            if (checkoutSection) {
                checkoutSection.style.display = 'none';
            }
        }
    }

    function createCartItemElement(item) {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.dataset.productId = item.id;
        
        div.innerHTML = `
            <div class="cart-item-left">
                <div class="cart-item-image">
                    <a href="/ingredient/${item.slug}/">
                        <img src="${item.image || '/static/img/default-product.jpg'}" alt="${item.name}" loading="lazy">
                    </a>
                </div>
                <div class="cart-item-info">
                    <a href="/ingredient/${item.slug}/" class="cart-item-name">${item.name}</a>
                    <div class="cart-item-details">
                        <span class="cart-item-measure">${item.measure_unit}</span>
                        <span class="cart-item-stock ${item.available ? 'in-stock' : 'out-of-stock'}">
                            ${item.available ? 'В наличии' : 'Недостаточно'}
                        </span>
                    </div>
                    <div class="cart-item-price">${formatPrice(item.price)} ₽/${item.measure_unit}</div>
                </div>
            </div>
            <div class="cart-item-right">
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-action="decrease">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           min="${item.min_order_quantity}" max="${item.stock}" 
                           data-product-id="${item.id}">
                    <button class="quantity-btn plus" data-action="increase">+</button>
                </div>
                <div class="cart-item-total">
                    <span class="total-price">${formatPrice(item.total_price)} ₽</span>
                </div>
                <button class="cart-item-remove" data-product-id="${item.id}" title="Удалить">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Обработчики событий для элемента корзины
        const quantityInput = div.querySelector('.quantity-input');
        const minusBtn = div.querySelector('.quantity-btn.minus');
        const plusBtn = div.querySelector('.quantity-btn.plus');
        const removeBtn = div.querySelector('.cart-item-remove');
        
        // Изменение количества через input
        quantityInput.addEventListener('change', function() {
            const productId = this.dataset.productId;
            const quantity = parseInt(this.value);
            updateCartItemQuantity(productId, quantity);
        });
        
        // Уменьшение количества
        minusBtn.addEventListener('click', function() {
            const productId = this.closest('.cart-item').dataset.productId;
            const quantityInput = this.nextElementSibling;
            let quantity = parseInt(quantityInput.value);
            
            if (quantity > parseInt(quantityInput.min)) {
                quantity--;
                quantityInput.value = quantity;
                updateCartItemQuantity(productId, quantity);
            }
        });
        
        // Увеличение количества
        plusBtn.addEventListener('click', function() {
            const productId = this.closest('.cart-item').dataset.productId;
            const quantityInput = this.previousElementSibling;
            let quantity = parseInt(quantityInput.value);
            
            if (quantity < parseInt(quantityInput.max)) {
                quantity++;
                quantityInput.value = quantity;
                updateCartItemQuantity(productId, quantity);
            } else {
                showNotification(`Максимальное количество: ${quantityInput.max}`, 'warning');
            }
        });
        
        // Удаление товара
        removeBtn.addEventListener('click', function() {
            const productId = this.dataset.productId;
            removeCartItem(productId);
        });
        
        return div;
    }

    function updateCartItemQuantity(productId, quantity) {
        fetch('/api/cart/', {
            method: 'PUT',
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
                loadCart(); // Перезагружаем всю корзину
                showNotification('Количество обновлено', 'success');
            } else if (data.error) {
                showNotification(data.error, 'error');
                loadCart(); // Перезагружаем для синхронизации
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка обновления количества', 'error');
        });
    }

    function removeCartItem(productId) {
        if (confirm('Удалить товар из корзины?')) {
            fetch('/api/cart/', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    product_id: productId
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    loadCart();
                    showNotification('Товар удален из корзины', 'success');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Ошибка удаления товара', 'error');
            });
        }
    }

    function updateCartSummary(cartData) {
        // Обновляем информацию в боковой панели
        const summaryElement = document.querySelector('.cart-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div class="summary-row">
                    <span>Товары (${cartData.total_quantity || 0} шт.)</span>
                    <span>${formatPrice(cartData.total_price || 0)} ₽</span>
                </div>
                <div class="summary-row">
                    <span>Доставка</span>
                    <span id="delivery-cost">Рассчитывается</span>
                </div>
                <div class="summary-row total">
                    <span>Итого</span>
                    <span id="total-cost">${formatPrice(cartData.total_price || 0)} ₽</span>
                </div>
            `;
        }
        
        // Показываем раздел оформления заказа
        const checkoutSection = document.querySelector('.checkout-section');
        if (checkoutSection) {
            checkoutSection.style.display = 'block';
        }
        
        // Обновляем счетчик в шапке
        updateCartCount();
    }

    function initCartControls() {
        // Кнопка "Очистить корзину"
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', function() {
                if (confirm('Очистить всю корзину?')) {
                    clearCart();
                }
            });
        }
        
        // Кнопка "Продолжить покупки"
        const continueShoppingBtn = document.getElementById('continue-shopping-btn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', function() {
                window.location.href = '{% url "catalog" %}';
            });
        }
        
        // Кнопка "Оформить заказ"
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function() {
                proceedToCheckout();
            });
        }
        
        // Расчет стоимости доставки
        const deliveryForm = document.getElementById('delivery-calculator');
        if (deliveryForm) {
            deliveryForm.addEventListener('submit', function(e) {
                e.preventDefault();
                calculateDelivery();
            });
        }
    }

    function clearCart() {
        fetch('/api/cart/', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                loadCart();
                showNotification('Корзина очищена', 'success');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка очистки корзины', 'error');
        });
    }

    function calculateDelivery() {
        const city = document.getElementById('delivery-city').value;
        const method = document.getElementById('delivery-method').value;
        const cartTotal = parseFloat(document.querySelector('.cart-summary .summary-row.total span:last-child').textContent.replace(/[^\d.]/g, '')) || 0;
        
        if (!city) {
            showNotification('Укажите город для расчета доставки', 'warning');
            return;
        }
        
        fetch(`/api/orders/delivery-costs/calculate/?city=${encodeURIComponent(city)}&method=${method}&total=${cartTotal}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                } else {
                    const deliveryCostElement = document.getElementById('delivery-cost');
                    const totalCostElement = document.getElementById('total-cost');
                    
                    const deliveryCost = data.is_free ? 0 : data.cost;
                    const totalCost = cartTotal + deliveryCost;
                    
                    deliveryCostElement.innerHTML = data.is_free ? 
                        '<span class="free-delivery">Бесплатно!</span>' : 
                        `${formatPrice(deliveryCost)} ₽`;
                    
                    totalCostElement.textContent = `${formatPrice(totalCost)} ₽`;
                    
                    // Сохраняем стоимость доставки в localStorage для использования при оформлении
                    localStorage.setItem('delivery_cost', deliveryCost);
                    localStorage.setItem('delivery_method', method);
                    localStorage.setItem('delivery_city', city);
                    
                    showNotification(`Стоимость доставки: ${data.is_free ? 'бесплатно' : formatPrice(deliveryCost) + ' ₽'}`, 'info');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Ошибка расчета доставки', 'error');
            });
    }

    function proceedToCheckout() {
        // Проверяем наличие товаров
        fetch('/api/cart/')
            .then(response => response.json())
            .then(cartData => {
                if (!cartData.items || cartData.items.length === 0) {
                    showNotification('Корзина пуста', 'warning');
                    return;
                }
                
                // Проверяем наличие всех товаров
                const unavailableItems = cartData.items.filter(item => !item.available);
                if (unavailableItems.length > 0) {
                    showNotification('Некоторые товары недоступны в нужном количестве', 'error');
                    return;
                }
                
                // Сохраняем данные корзины для оформления заказа
                localStorage.setItem('cart_data', JSON.stringify(cartData));
                
                // Переходим к оформлению заказа
                window.location.href = '{% url "order" %}';
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Ошибка проверки корзины', 'error');
            });
    }

    function initCheckoutForm() {
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitOrder(this);
            });
        }
        
        // Загрузка сохраненных адресов пользователя
        loadUserAddresses();
        
        // Валидация формы
        initFormValidation();
    }

    function loadUserAddresses() {
        if (window.IS_AUTHENTICATED) {
        fetch('/api/addresses/')
            .then(response => response.json())
            .then(addresses => {
                const addressSelect = document.getElementById('user-addresses');
                if (addressSelect && addresses.length > 0) {
                    addressSelect.innerHTML = '<option value="">Выберите сохраненный адрес</option>';
                    
                    addresses.forEach(address => {
                        const option = document.createElement('option');
                        option.value = address.id;
                        option.textContent = address.title + ' - ' + address.short_address;
                        option.dataset.address = JSON.stringify(address);
                        addressSelect.appendChild(option);
                    });
                    
                    // Обработчик выбора адреса
                    addressSelect.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption.value && selectedOption.dataset.address) {
                            const address = JSON.parse(selectedOption.dataset.address);
                            fillAddressForm(address);
                        }
                    });
                }
            })
            .catch(error => console.error('Error loading addresses:', error));
        }
    }

    function fillAddressForm(address) {
        document.getElementById('first_name').value = address.first_name || '';
        document.getElementById('last_name').value = address.last_name || '';
        document.getElementById('phone').value = address.phone || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('address').value = address.street + ', ' + address.building + (address.apartment ? ', кв. ' + address.apartment : '');
        document.getElementById('postal_code').value = address.postal_code || '';
    }

    function initFormValidation() {
        // Валидация телефона
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^\d+]/g, '');
            });
        }
        
        // Валидация почтового индекса
        const postalCodeInput = document.getElementById('postal_code');
        if (postalCodeInput) {
            postalCodeInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
            });
        }
    }

    function submitOrder(form) {
        // Собираем данные формы
        const formData = new FormData(form);
        const orderData = Object.fromEntries(formData);
        
        // Добавляем данные корзины
        orderData.delivery_method = localStorage.getItem('delivery_method') || 'courier';
        orderData.delivery_cost = parseFloat(localStorage.getItem('delivery_cost')) || 0;
        
        // Валидация
        if (!validateOrderData(orderData)) {
            return;
        }
        
        // Показываем индикатор загрузки
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Оформление...';
        submitBtn.disabled = true;
        
        // Отправляем заказ
        fetch('/api/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(orderData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Ошибка сервера');
            }
            return response.json();
        })
        .then(order => {
            // Очищаем корзину
            localStorage.removeItem('cart_data');
            localStorage.removeItem('delivery_cost');
            localStorage.removeItem('delivery_method');
            localStorage.removeItem('delivery_city');
            
            // Показываем успешное сообщение
            showNotification('Заказ успешно оформлен!', 'success');
            
            // Перенаправляем на страницу подтверждения
            setTimeout(() => {
                window.location.href = `/order-confirmation/${order.order_number}/`;
            }, 2000);
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка оформления заказа', 'error');
            
            // Восстанавливаем кнопку
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }

    function validateOrderData(data) {
        // Проверка обязательных полей
        const requiredFields = ['first_name', 'last_name', 'email', 'phone', 'city', 'address'];
        for (const field of requiredFields) {
            if (!data[field] || data[field].trim() === '') {
                showNotification(`Заполните поле: ${getFieldLabel(field)}`, 'error');
                return false;
            }
        }
        
        // Валидация email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('Введите корректный email', 'error');
            return false;
        }
        
        // Валидация телефона
        const phoneRegex = /^\+?[78][-\s]?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{2}[-\s]?\d{2}$/;
        if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
            showNotification('Введите корректный номер телефона', 'error');
            return false;
        }
        
        return true;
    }

    function getFieldLabel(fieldName) {
        const labels = {
            'first_name': 'Имя',
            'last_name': 'Фамилия',
            'email': 'Email',
            'phone': 'Телефон',
            'city': 'Город',
            'address': 'Адрес'
        };
        return labels[fieldName] || fieldName;
    }

    // Вспомогательные функции
    function formatPrice(price) {
        return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

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

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => notification.classList.add('show'), 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    function updateCartCount() {
        fetch('/api/cart/')
            .then(response => response.json())
            .then(data => {
                const cartCount = document.getElementById('cart-count');
                if (cartCount) {
                    cartCount.textContent = data.total_items || 0;
                }
            })
            .catch(error => console.error('Error:', error));
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'cart-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${message}</h3>
            <button onclick="location.reload()" class="btn btn-primary">Обновить</button>
        `;
        
        const cartContainer = document.querySelector('.cart-container');
        if (cartContainer) {
            cartContainer.innerHTML = '';
            cartContainer.appendChild(errorDiv);
        }
    }
});