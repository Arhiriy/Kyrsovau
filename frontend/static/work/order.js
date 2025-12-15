// order.js - Проверка и отправка формы заказа

document.addEventListener('DOMContentLoaded', function() {
    // Загрузка данных корзины
    loadCartData();
    
    // Инициализация формы заказа
    initOrderForm();
    
    // Инициализация способов доставки и оплаты
    initDeliveryOptions();
    initPaymentOptions();
    
    // Инициализация калькулятора доставки
    initDeliveryCalculator();

    function loadCartData() {
        // Проверяем, есть ли данные в localStorage
        const cartData = localStorage.getItem('cart_data');
        
        if (cartData) {
            try {
                const parsedData = JSON.parse(cartData);
                displayOrderItems(parsedData);
                calculateOrderTotal(parsedData);
            } catch (error) {
                console.error('Error parsing cart data:', error);
                showError('Ошибка загрузки данных заказа');
            }
        } else {
            // Если нет данных, загружаем из API
            fetch('/api/cart/')
                .then(response => response.json())
                .then(data => {
                    localStorage.setItem('cart_data', JSON.stringify(data));
                    displayOrderItems(data);
                    calculateOrderTotal(data);
                })
                .catch(error => {
                    console.error('Error loading cart:', error);
                    showError('Ошибка загрузки данных заказа');
                });
        }
    }

    function displayOrderItems(cartData) {
        const orderItemsContainer = document.getElementById('order-items');
        
        if (!orderItemsContainer) return;
        
        if (cartData.items && cartData.items.length > 0) {
            let html = '';
            
            cartData.items.forEach(item => {
                html += `
                    <div class="order-item">
                        <div class="order-item-image">
                            <img src="${item.image || '/static/img/default-product.jpg'}" alt="${item.name}" loading="lazy">
                        </div>
                        <div class="order-item-info">
                            <div class="order-item-name">${item.name}</div>
                            <div class="order-item-details">
                                ${item.measure_unit} × ${item.quantity}
                            </div>
                        </div>
                        <div class="order-item-price">
                            ${formatPrice(item.total_price)} ₽
                        </div>
                    </div>
                `;
            });
            
            orderItemsContainer.innerHTML = html;
        } else {
            orderItemsContainer.innerHTML = `
                <div class="empty-order">
                    <i class="fas fa-shopping-bag"></i>
                    <p>Нет товаров для заказа</p>
                    <a href="{% url 'catalog' %}" class="btn btn-primary">Вернуться в каталог</a>
                </div>
            `;
            
            // Блокируем форму заказа
            disableOrderForm();
        }
    }

    function calculateOrderTotal(cartData) {
        const subtotal = cartData.total_price || 0;
        const deliveryCost = parseFloat(localStorage.getItem('delivery_cost')) || 0;
        const total = subtotal + deliveryCost;
        
        // Обновляем отображение сумм
        updateOrderSummary(subtotal, deliveryCost, total);
        
        // Сохраняем итоговую сумму для использования в форме
        document.getElementById('order-total-input').value = total;
        document.getElementById('order-subtotal-input').value = subtotal;
        document.getElementById('order-delivery-input').value = deliveryCost;
    }

    function updateOrderSummary(subtotal, deliveryCost, total) {
        const summaryElement = document.getElementById('order-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div class="summary-row">
                    <span>Товары</span>
                    <span>${formatPrice(subtotal)} ₽</span>
                </div>
                <div class="summary-row">
                    <span>Доставка</span>
                    <span id="delivery-summary">
                        ${deliveryCost === 0 ? 'Бесплатно' : formatPrice(deliveryCost) + ' ₽'}
                    </span>
                </div>
                <div class="summary-row total">
                    <strong>Итого к оплате</strong>
                    <strong id="total-summary">${formatPrice(total)} ₽</strong>
                </div>
            `;
        }
    }

    function initOrderForm() {
        const orderForm = document.getElementById('order-form');
        
        if (orderForm) {
            // Автозаполнение данных пользователя
            autofillUserData();
            
            // Валидация формы
            initFormValidation(orderForm);
            
            // Обработка отправки формы
            orderForm.addEventListener('submit', function(e) {
                e.preventDefault();
                submitOrder(this);
            });
        }
        
        // Загрузка сохраненных адресов
        loadSavedAddresses();
    }

    function autofillUserData() {
        if (window.IS_AUTHENTICATED) {
        // Загружаем данные пользователя
        fetch('/api/users/me/')
            .then(response => response.json())
            .then(user => {
                // Автозаполнение полей
                document.getElementById('first_name').value = user.first_name || '';
                document.getElementById('last_name').value = user.last_name || '';
                document.getElementById('email').value = user.email || '';
                document.getElementById('phone').value = user.phone || '';
                
                // Автозаполнение адреса, если есть
                if (user.address) {
                    document.getElementById('address').value = user.address || '';
                }
                if (user.city) {
                    document.getElementById('city').value = user.city || '';
                }
                if (user.postal_code) {
                    document.getElementById('postal_code').value = user.postal_code || '';
                }
            })
            .catch(error => console.error('Error loading user data:', error));
        }
    }

    function loadSavedAddresses() {
        if (window.IS_AUTHENTICATED) {
        fetch('/api/addresses/')
            .then(response => response.json())
            .then(addresses => {
                const addressSelect = document.getElementById('saved-addresses');
                if (addressSelect && addresses.length > 0) {
                    addressSelect.innerHTML = '<option value="">Выберите сохраненный адрес</option>';
                    
                    addresses.forEach(address => {
                        const option = document.createElement('option');
                        option.value = address.id;
                        option.textContent = `${address.title} - ${address.city}, ${address.street}`;
                        option.dataset.address = JSON.stringify(address);
                        addressSelect.appendChild(option);
                    });
                    
                    // Обработчик выбора адреса
                    addressSelect.addEventListener('change', function() {
                        const selectedOption = this.options[this.selectedIndex];
                        if (selectedOption.value && selectedOption.dataset.address) {
                            const address = JSON.parse(selectedOption.dataset.address);
                            fillAddressFields(address);
                        }
                    });
                }
            })
            .catch(error => console.error('Error loading addresses:', error));
        }
    }

    function fillAddressFields(address) {
        document.getElementById('first_name').value = address.first_name || '';
        document.getElementById('last_name').value = address.last_name || '';
        document.getElementById('phone').value = address.phone || '';
        document.getElementById('city').value = address.city || '';
        document.getElementById('address').value = `${address.street}, ${address.building}${address.apartment ? ', кв. ' + address.apartment : ''}`;
        document.getElementById('postal_code').value = address.postal_code || '';
    }

    function initFormValidation(form) {
        // Валидация телефона
        const phoneInput = form.querySelector('#phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^\d+]/g, '');
                
                // Маска телефона
                if (this.value.length === 1 && this.value !== '+') {
                    this.value = '+7' + this.value;
                }
            });
            
            phoneInput.addEventListener('blur', function() {
                if (this.value && !validatePhone(this.value)) {
                    showFieldError(this, 'Введите корректный номер телефона');
                } else {
                    clearFieldError(this);
                }
            });
        }
        
        // Валидация email
        const emailInput = form.querySelector('#email');
        if (emailInput) {
            emailInput.addEventListener('blur', function() {
                if (this.value && !validateEmail(this.value)) {
                    showFieldError(this, 'Введите корректный email');
                } else {
                    clearFieldError(this);
                }
            });
        }
        
        // Валидация почтового индекса
        const postalCodeInput = form.querySelector('#postal_code');
        if (postalCodeInput) {
            postalCodeInput.addEventListener('input', function() {
                this.value = this.value.replace(/\D/g, '');
            });
        }
        
        // Валидация при вводе
        form.querySelectorAll('input[required], textarea[required]').forEach(input => {
            input.addEventListener('blur', function() {
                if (!this.value.trim()) {
                    showFieldError(this, 'Это поле обязательно для заполнения');
                } else {
                    clearFieldError(this);
                }
            });
        });
    }

    function initDeliveryOptions() {
        const deliveryOptions = document.querySelectorAll('input[name="delivery_method"]');
        
        deliveryOptions.forEach(option => {
            option.addEventListener('change', function() {
                const deliveryMethod = this.value;
                
                // Сохраняем выбранный метод доставки
                localStorage.setItem('delivery_method', deliveryMethod);
                
                // Показываем/скрываем дополнительные поля
                toggleDeliveryFields(deliveryMethod);
                
                // Пересчитываем стоимость доставки
                calculateDeliveryCost();
            });
        });
        
        // Устанавливаем значение по умолчанию
        const savedMethod = localStorage.getItem('delivery_method') || 'courier';
        const defaultOption = document.querySelector(`input[name="delivery_method"][value="${savedMethod}"]`);
        if (defaultOption) {
            defaultOption.checked = true;
            toggleDeliveryFields(savedMethod);
        }
    }

    function toggleDeliveryFields(deliveryMethod) {
        const addressFields = document.getElementById('address-fields');
        const pickupInfo = document.getElementById('pickup-info');
        
        if (deliveryMethod === 'pickup') {
            if (addressFields) addressFields.style.display = 'none';
            if (pickupInfo) pickupInfo.style.display = 'block';
        } else {
            if (addressFields) addressFields.style.display = 'block';
            if (pickupInfo) pickupInfo.style.display = 'none';
        }
    }

    function initPaymentOptions() {
        const paymentOptions = document.querySelectorAll('input[name="payment_method"]');
        
        paymentOptions.forEach(option => {
            option.addEventListener('change', function() {
                const paymentMethod = this.value;
                
                // Показываем/скрываем дополнительные поля для оплаты
                togglePaymentFields(paymentMethod);
                
                // Сохраняем выбранный метод оплаты
                localStorage.setItem('payment_method', paymentMethod);
            });
        });
        
        // Устанавливаем значение по умолчанию
        const savedPayment = localStorage.getItem('payment_method') || 'card_online';
        const defaultPayment = document.querySelector(`input[name="payment_method"][value="${savedPayment}"]`);
        if (defaultPayment) {
            defaultPayment.checked = true;
            togglePaymentFields(savedPayment);
        }
    }

    function togglePaymentFields(paymentMethod) {
        // Скрываем все дополнительные поля оплаты
        document.querySelectorAll('.payment-extra').forEach(el => {
            el.style.display = 'none';
        });
        
        // Показываем нужные поля
        if (paymentMethod === 'card_online') {
            document.getElementById('card-online-info')?.style.display = 'block';
        } else if (paymentMethod === 'sbp') {
            document.getElementById('sbp-info')?.style.display = 'block';
        }
    }

    function initDeliveryCalculator() {
        const calculateBtn = document.getElementById('calculate-delivery');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', calculateDeliveryCost);
        }
        
        // Автоматический расчет при изменении города
        const cityInput = document.getElementById('city');
        if (cityInput) {
            cityInput.addEventListener('blur', function() {
                if (this.value.trim()) {
                    calculateDeliveryCost();
                }
            });
        }
    }

    function calculateDeliveryCost() {
        const city = document.getElementById('city').value;
        const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked')?.value || 'courier';
        const cartData = JSON.parse(localStorage.getItem('cart_data') || '{}');
        const subtotal = cartData.total_price || 0;
        
        if (!city && deliveryMethod !== 'pickup') {
            showNotification('Укажите город для расчета доставки', 'warning');
            return;
        }
        
        if (deliveryMethod === 'pickup') {
            // Самовывоз бесплатно
            updateDeliveryCost(0, true);
            return;
        }
        
        // Показываем индикатор загрузки
        const calculateBtn = document.getElementById('calculate-delivery');
        if (calculateBtn) {
            const originalText = calculateBtn.innerHTML;
            calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Расчет...';
            calculateBtn.disabled = true;
        }
        
        fetch(`/api/orders/delivery-costs/calculate/?city=${encodeURIComponent(city)}&method=${deliveryMethod}&total=${subtotal}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    showNotification(data.error, 'error');
                    updateDeliveryCost(300, false); // Стоимость по умолчанию
                } else {
                    updateDeliveryCost(data.cost, data.is_free);
                    
                    if (data.is_free) {
                        showNotification(`Доставка бесплатно при заказе от ${formatPrice(data.min_for_free)} ₽`, 'success');
                    } else {
                        showNotification(`Стоимость доставки: ${formatPrice(data.cost)} ₽`, 'info');
                    }
                }
            })
            .catch(error => {
                console.error('Error calculating delivery:', error);
                showNotification('Ошибка расчета доставки', 'error');
                updateDeliveryCost(300, false); // Стоимость по умолчанию
            })
            .finally(() => {
                // Восстанавливаем кнопку
                if (calculateBtn) {
                    calculateBtn.innerHTML = 'Рассчитать';
                    calculateBtn.disabled = false;
                }
            });
    }

    function updateDeliveryCost(cost, isFree = false) {
        const deliveryCost = isFree ? 0 : cost;
        
        // Сохраняем в localStorage
        localStorage.setItem('delivery_cost', deliveryCost);
        
        // Обновляем отображение
        const deliverySummary = document.getElementById('delivery-summary');
        const totalSummary = document.getElementById('total-summary');
        
        if (deliverySummary) {
            deliverySummary.textContent = isFree ? 'Бесплатно' : `${formatPrice(deliveryCost)} ₽`;
        }
        
        // Пересчитываем общую сумму
        const cartData = JSON.parse(localStorage.getItem('cart_data') || '{}');
        const subtotal = cartData.total_price || 0;
        const total = subtotal + deliveryCost;
        
        if (totalSummary) {
            totalSummary.textContent = `${formatPrice(total)} ₽`;
        }
        
        // Обновляем скрытые поля формы
        document.getElementById('order-delivery-input').value = deliveryCost;
        document.getElementById('order-total-input').value = total;
    }

    function submitOrder(form) {
        // Валидация формы перед отправкой
        if (!validateForm(form)) {
            showNotification('Заполните все обязательные поля правильно', 'error');
            return;
        }
        
        // Проверяем, что корзина не пуста
        const cartData = JSON.parse(localStorage.getItem('cart_data') || '{}');
        if (!cartData.items || cartData.items.length === 0) {
            showNotification('Корзина пуста', 'error');
            return;
        }
        
        // Собираем данные формы
        const formData = new FormData(form);
        const orderData = Object.fromEntries(formData);
        
        // Добавляем данные доставки и оплаты
        orderData.delivery_method = localStorage.getItem('delivery_method') || 'courier';
        orderData.delivery_cost = parseFloat(localStorage.getItem('delivery_cost')) || 0;
        orderData.payment_method = localStorage.getItem('payment_method') || 'card_online';
        orderData.subtotal = parseFloat(document.getElementById('order-subtotal-input').value) || 0;
        orderData.total = parseFloat(document.getElementById('order-total-input').value) || 0;
        
        // Добавляем дополнительные поля
        orderData.notes = document.getElementById('order-notes').value || '';
        orderData.is_gift = document.getElementById('is-gift').checked || false;
        orderData.gift_message = document.getElementById('gift-message').value || '';
        
        // Показываем индикатор загрузки
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Оформление...';
        submitBtn.disabled = true;
        
        // Отправляем заказ на сервер
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
                return response.json().then(errorData => {
                    throw new Error(errorData.error || 'Ошибка сервера');
                });
            }
            return response.json();
        })
        .then(order => {
            // Очищаем localStorage
            clearOrderData();
            
            // Показываем успешное сообщение
            showSuccessMessage(order);
            
            // Перенаправляем на страницу подтверждения
            setTimeout(() => {
                window.location.href = `/order-confirmation/${order.order_number}/`;
            }, 3000);
        })
        .catch(error => {
            console.error('Error submitting order:', error);
            
            // Восстанавливаем кнопку
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Показываем ошибку
            showNotification(error.message || 'Ошибка оформления заказа. Попробуйте еще раз.', 'error');
        });
    }

    function validateForm(form) {
        let isValid = true;
        
        // Проверяем обязательные поля
        const requiredFields = [
            'first_name', 'last_name', 'email', 'phone',
            'delivery_method', 'payment_method'
        ];
        
        requiredFields.forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                if (field.type === 'radio') {
                    const radioChecked = form.querySelector(`[name="${fieldName}"]:checked`);
                    if (!radioChecked) {
                        showFieldError(field, `Выберите ${getFieldLabel(fieldName)}`);
                        isValid = false;
                    }
                } else if (!field.value.trim()) {
                    showFieldError(field, `Заполните поле "${getFieldLabel(fieldName)}"`);
                    isValid = false;
                }
            }
        });
        
        // Проверяем email
        const emailField = form.querySelector('[name="email"]');
        if (emailField && emailField.value.trim()) {
            if (!validateEmail(emailField.value)) {
                showFieldError(emailField, 'Введите корректный email');
                isValid = false;
            }
        }
        
        // Проверяем телефон
        const phoneField = form.querySelector('[name="phone"]');
        if (phoneField && phoneField.value.trim()) {
            if (!validatePhone(phoneField.value)) {
                showFieldError(phoneField, 'Введите корректный номер телефона');
                isValid = false;
            }
        }
        
        // Проверяем адрес доставки (если не самовывоз)
        const deliveryMethod = document.querySelector('input[name="delivery_method"]:checked');
        if (deliveryMethod && deliveryMethod.value !== 'pickup') {
            const cityField = form.querySelector('[name="city"]');
            const addressField = form.querySelector('[name="address"]');
            
            if (!cityField || !cityField.value.trim()) {
                showFieldError(cityField, 'Укажите город доставки');
                isValid = false;
            }
            
            if (!addressField || !addressField.value.trim()) {
                showFieldError(addressField, 'Укажите адрес доставки');
                isValid = false;
            }
        }
        
        return isValid;
    }

    function showSuccessMessage(order) {
        // Создаем модальное окно с подтверждением
        const modal = document.createElement('div');
        modal.className = 'order-success-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>Заказ успешно оформлен!</h2>
                <div class="order-details">
                    <p><strong>Номер заказа:</strong> ${order.order_number}</p>
                    <p><strong>Сумма:</strong> ${formatPrice(order.total)} ₽</p>
                    <p><strong>Способ оплаты:</strong> ${getPaymentMethodDisplay(order.payment_method)}</p>
                    <p><strong>Статус:</strong> ${order.status_display || 'Ожидает обработки'}</p>
                </div>
                <div class="success-message">
                    <p>На ваш email отправлено подтверждение заказа.</p>
                    <p>Менеджер свяжется с вами для уточнения деталей.</p>
                </div>
                <div class="modal-actions">
                    <button id="continue-shopping" class="btn btn-primary">Продолжить покупки</button>
                    <a href="/order-confirmation/${order.order_number}/" class="btn btn-outline">Детали заказа</a>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчики для модального окна
        document.getElementById('continue-shopping').addEventListener('click', () => {
            modal.remove();
            window.location.href = '{% url "catalog" %}';
        });
        
        // Автоматическое закрытие через 10 секунд
        setTimeout(() => {
            if (document.body.contains(modal)) {
                modal.remove();
                window.location.href = '{% url "catalog" %}';
            }
        }, 10000);
    }

    function clearOrderData() {
        // Очищаем localStorage
        localStorage.removeItem('cart_data');
        localStorage.removeItem('delivery_method');
        localStorage.removeItem('delivery_cost');
        localStorage.removeItem('delivery_city');
        localStorage.removeItem('payment_method');
        
        // Очищаем корзину на сервере
        fetch('/api/cart/', {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        }).catch(error => console.error('Error clearing cart:', error));
    }

    function disableOrderForm() {
        const form = document.getElementById('order-form');
        if (form) {
            form.querySelectorAll('input, select, textarea, button').forEach(element => {
                element.disabled = true;
            });
        }
        
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<i class="fas fa-ban"></i> Нет товаров для заказа';
        }
    }

    // Вспомогательные функции валидации
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        const re = /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
        return re.test(phone.replace(/\s/g, ''));
    }

    function showFieldError(field, message) {
        // Очищаем предыдущие ошибки
        clearFieldError(field);
        
        // Добавляем класс ошибки
        field.classList.add('error');
        
        // Создаем элемент с сообщением об ошибке
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        // Вставляем после поля
        field.parentNode.insertBefore(errorElement, field.nextSibling);
        
        // Фокусируемся на поле с ошибкой
        field.focus();
    }

    function clearFieldError(field) {
        field.classList.remove('error');
        
        // Удаляем сообщение об ошибке
        const errorElement = field.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    function getFieldLabel(fieldName) {
        const labels = {
            'first_name': 'Имя',
            'last_name': 'Фамилия',
            'email': 'Email',
            'phone': 'Телефон',
            'city': 'Город',
            'address': 'Адрес',
            'delivery_method': 'Способ доставки',
            'payment_method': 'Способ оплаты'
        };
        return labels[fieldName] || fieldName;
    }

    function getPaymentMethodDisplay(method) {
        const methods = {
            'cash': 'Наличные при получении',
            'card_online': 'Карта онлайн',
            'card_courier': 'Карта курьеру',
            'sbp': 'СБП'
        };
        return methods[method] || method;
    }

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
        }, 5000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        });
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'order-error';
        errorDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${message}</h3>
            <div class="error-actions">
                <button onclick="loadCartData()" class="btn btn-primary">
                    <i class="fas fa-redo"></i> Попробовать снова
                </button>
                <a href="{% url 'catalog' %}" class="btn btn-outline">Вернуться в каталог</a>
            </div>
        `;
        
        const orderContainer = document.querySelector('.order-container');
        if (orderContainer) {
            orderContainer.innerHTML = '';
            orderContainer.appendChild(errorDiv);
        }
    }
});