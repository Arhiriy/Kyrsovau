// JavaScript для страницы товара
document.addEventListener('DOMContentLoaded', function() {
    // Получаем slug товара из URL
    const pathParts = window.location.pathname.split('/').filter(part => part);
    const productSlug = pathParts[pathParts.length - 1];
    
    if (!productSlug) {
        window.location.href = '/catalog/';
        return;
    }
    
    // Загружаем данные товара
    loadProductData(productSlug);
    
    // Инициализация элементов управления
    initControls();
    
    // Инициализация отзывов
    initReviews();
    
    // Загрузка похожих товаров
    loadSimilarProducts(productSlug);
    
    // Загрузка недавно просмотренных
    loadRecentlyViewed();
});

function loadProductData(slug) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnails = document.getElementById('image-thumbnails');
    const title = document.getElementById('product-title');
    const description = document.getElementById('product-description');
    const fullDescription = document.getElementById('full-description');
    
    // Показываем индикатор загрузки
    if (mainImage) mainImage.src = '';
    if (title) title.textContent = 'Загрузка...';
    if (description) description.innerHTML = '<p>Загрузка описания...</p>';
    if (fullDescription) fullDescription.innerHTML = '<p>Загрузка описания...</p>';
    
    fetch(`/api/products/${slug}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Товар не найден');
            }
            return response.json();
        })
        .then(product => {
            updateProductUI(product);
            updateRecentlyViewed(product);
        })
        .catch(error => {
            console.error('Error loading product:', error);
            showNotification('Товар не найден', 'error');
            
            setTimeout(() => {
                window.location.href = '/catalog/';
            }, 2000);
        });
}

function updateProductUI(product) {
    // Обновляем мета-теги
    updateMetaTags(product);
    
    // Обновляем основную информацию
    updateBasicInfo(product);
    
    // Обновляем изображения
    updateImages(product);
    
    // Обновляем характеристики
    updateSpecifications(product);
    
    // Обновляем цену и наличие
    updatePriceAndAvailability(product);
    
    // Обновляем описание
    updateDescription(product);
    
    // Обновляем пищевую ценность
    updateNutritionInfo(product);
    
    // Обновляем применение
    updateUsageInfo(product);
}

function updateMetaTags(product) {
    // Заголовок страницы
    document.title = `${product.name} - Магазин кулинарных ингредиентов`;
    
    // Meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        document.head.appendChild(metaDescription);
    }
    metaDescription.content = product.description.substring(0, 160) + '...';
    
    // Open Graph теги
    const ogTags = {
        'og:title': product.name,
        'og:description': product.description.substring(0, 160) + '...',
        'og:type': 'product',
        'og:url': window.location.href,
        'og:image': product.images?.[0]?.image || '/static/img/default-product.jpg',
        'og:price:amount': product.price,
        'og:price:currency': 'RUB',
        'product:availability': product.stock > 0 ? 'in stock' : 'out of stock'
    };
    
    Object.entries(ogTags).forEach(([property, content]) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    });
}

function updateBasicInfo(product) {
    // Название
    const title = document.getElementById('product-title');
    if (title) title.textContent = product.name;
    
    // Артикул
    const sku = document.getElementById('product-id');
    if (sku) sku.textContent = product.id;
    
    // Категория (обновляем хлебные крошки)
    if (product.category) {
        const categoryLink = document.querySelector('.breadcrumbs a[href*="catalog"]');
        if (categoryLink) {
            categoryLink.href = `/catalog/?category=${product.category.slug}`;
            categoryLink.textContent = product.category.name;
        }
        
        const categoryElement = document.getElementById('product-category');
        if (categoryElement) categoryElement.textContent = product.category.name;
        
        const specCategory = document.getElementById('spec-category');
        if (specCategory) specCategory.textContent = product.category.name;
    }
    
    // Кухня
    const cuisineMap = {
        'italian': 'Итальянская',
        'french': 'Французская',
        'asian': 'Азиатская',
        'mexican': 'Мексиканская',
        'indian': 'Индийская',
        'russian': 'Русская',
        'universal': 'Универсальная'
    };
    
    const cuisineText = cuisineMap[product.cuisine] || product.cuisine;
    const cuisineElement = document.getElementById('product-cuisine');
    if (cuisineElement) cuisineElement.textContent = cuisineText;
    
    const specCuisine = document.getElementById('spec-cuisine');
    if (specCuisine) specCuisine.textContent = cuisineText;
    
    // Дата добавления
    const createdDate = new Date(product.created_at);
    const specCreated = document.getElementById('spec-created');
    if (specCreated) {
        specCreated.textContent = createdDate.toLocaleDateString('ru-RU');
    }
}

function updateImages(product) {
    const mainImage = document.getElementById('main-product-image');
    const thumbnailsContainer = document.getElementById('image-thumbnails');
    
    if (!mainImage || !thumbnailsContainer) return;
    
    // Очищаем миниатюры
    thumbnailsContainer.innerHTML = '';
    
    if (product.images && product.images.length > 0) {
        // Основное изображение
        mainImage.src = product.images[0].image;
        mainImage.alt = product.name;
        
        // Миниатюры
        product.images.forEach((image, index) => {
            const thumbnail = document.createElement('div');
            thumbnail.className = 'thumbnail' + (index === 0 ? ' active' : '');
            thumbnail.innerHTML = `
                <img src="${image.image}" 
                     alt="${product.name} - изображение ${index + 1}"
                     loading="lazy">
            `;
            
            thumbnail.addEventListener('click', () => {
                // Обновляем основное изображение
                mainImage.src = image.image;
                
                // Обновляем активную миниатюру
                document.querySelectorAll('.thumbnail').forEach(t => {
                    t.classList.remove('active');
                });
                thumbnail.classList.add('active');
                
                // Анимация перехода
                mainImage.style.opacity = '0.5';
                setTimeout(() => {
                    mainImage.style.opacity = '1';
                }, 150);
            });
            
            thumbnailsContainer.appendChild(thumbnail);
        });
    } else {
        // Изображение по умолчанию
        mainImage.src = '/static/img/default-product.jpg';
        mainImage.alt = product.name;
    }
}

function updateSpecifications(product) {
    // Единица измерения
    const measureElement = document.getElementById('product-measure');
    if (measureElement) {
        measureElement.textContent = product.measure_unit_display || '---';
    }
    
    const specMeasure = document.getElementById('spec-measure');
    if (specMeasure) {
        specMeasure.textContent = product.measure_unit_display || '---';
    }
    
    // Вес/объем
    const weightElement = document.getElementById('product-weight');
    if (weightElement) {
        const weight = product.weight_per_unit || 0;
        const unit = product.measure_unit in ['kg', 'g'] ? 'г' : 'мл';
        weightElement.textContent = `${weight}${unit}`;
    }
    
    const specWeight = document.getElementById('spec-weight');
    if (specWeight) {
        const weight = product.weight_per_unit || 0;
        const unit = product.measure_unit in ['kg', 'g'] ? 'г' : 'мл';
        specWeight.textContent = `${weight}${unit}`;
    }
    
    // Минимальный заказ
    const minOrder = document.getElementById('spec-min-order');
    if (minOrder) {
        minOrder.textContent = product.min_order_quantity || 1;
    }
}

function updatePriceAndAvailability(product) {
    // Цена
    const priceElement = document.getElementById('current-price');
    if (priceElement) {
        priceElement.textContent = formatPrice(product.price);
    }
    
    const priceMeasure = document.getElementById('price-measure');
    if (priceMeasure) {
        priceMeasure.textContent = `за ${product.measure_with_weight || '---'}`;
    }
    
    // Наличие
    const stockStatus = document.getElementById('stock-status');
    const inStockIcon = document.getElementById('in-stock-icon');
    const outOfStockIcon = document.getElementById('out-of-stock-icon');
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const buyNowBtn = document.getElementById('buy-now-btn');
    const quantityInput = document.getElementById('product-quantity');
    
    if (product.stock > 0) {
        // Товар в наличии
        if (stockStatus) {
            stockStatus.textContent = `В наличии (${product.stock} шт.)`;
            stockStatus.style.color = '';
        }
        
        if (inStockIcon) inStockIcon.style.display = 'inline-block';
        if (outOfStockIcon) outOfStockIcon.style.display = 'none';
        
        if (addToCartBtn) {
            addToCartBtn.disabled = false;
            addToCartBtn.innerHTML = '<i class="fas fa-shopping-cart"></i><span>В корзину</span>';
        }
        
        if (buyNowBtn) buyNowBtn.disabled = false;
        
        if (quantityInput) {
            const minOrder = product.min_order_quantity || 1;
            const maxOrder = Math.min(product.stock, 100);
            
            quantityInput.min = minOrder;
            quantityInput.max = maxOrder;
            quantityInput.value = minOrder;
            
            // Обновляем кнопки управления количеством
            const minusBtn = document.getElementById('quantity-minus');
            const plusBtn = document.getElementById('quantity-plus');
            
            if (minusBtn) minusBtn.disabled = minOrder <= minOrder;
            if (plusBtn) plusBtn.disabled = minOrder >= maxOrder;
    } else {
        // Товара нет в наличии
        if (stockStatus) {
            stockStatus.textContent = 'Нет в наличии';
            stockStatus.style.color = 'var(--danger-color)';
        }
        
        if (inStockIcon) inStockIcon.style.display = 'none';
        if (outOfStockIcon) outOfStockIcon.style.display = 'inline-block';
        
        if (addToCartBtn) {
            addToCartBtn.disabled = true;
            addToCartBtn.innerHTML = '<i class="fas fa-times"></i><span>Нет в наличии</span>';
        }
        
        if (buyNowBtn) buyNowBtn.disabled = true;
        
        if (quantityInput) {
            quantityInput.disabled = true;
            quantityInput.value = '0';
        }
    }
    
    // Бейдж "Нет в наличии" на изображении
    const outOfStockBadge = document.querySelector('.out-of-stock-badge');
    const featuredBadge = document.querySelector('.featured-badge');
    
    if (product.stock <= 0) {
        if (outOfStockBadge) {
            outOfStockBadge.style.display = 'block';
        } else {
            // Создаем бейдж, если его нет
            const mainImage = document.querySelector('.main-image');
            if (mainImage) {
                const badge = document.createElement('div');
                badge.className = 'out-of-stock-badge';
                badge.textContent = 'Нет в наличии';
                mainImage.appendChild(badge);
            }
        }
        
        if (featuredBadge) {
            featuredBadge.style.display = 'none';
        }
    } else {
        if (outOfStockBadge) {
            outOfStockBadge.style.display = 'none';
        }
        
        // Бейдж "Рекомендуем"
        if (product.is_featured) {
            if (featuredBadge) {
                featuredBadge.style.display = 'block';
            } else {
                const mainImage = document.querySelector('.main-image');
                if (mainImage) {
                    const badge = document.createElement('div');
                    badge.className = 'featured-badge';
                    badge.textContent = 'Рекомендуем';
                    mainImage.appendChild(badge);
                }
            }
        } else if (featuredBadge) {
            featuredBadge.style.display = 'none';
        }
    }
}

function updateDescription(product) {
    const descriptionElement = document.getElementById('product-description');
    const fullDescriptionElement = document.getElementById('full-description');
    
    if (descriptionElement) {
        descriptionElement.innerHTML = `<p>${product.description}</p>`;
    }
    
    if (fullDescriptionElement) {
        fullDescriptionElement.innerHTML = `<p>${product.description}</p>`;
    }
}

function updateNutritionInfo(product) {
    const nutritionCalories = document.getElementById('nutrition-calories');
    const productCalories = document.getElementById('product-calories');
    const nutritionInfo = document.getElementById('nutrition-info');
    
    if (product.nutrition_info && product.nutrition_info.calories) {
        // Показываем блок с пищевой ценностью
        if (nutritionCalories) {
            nutritionCalories.style.display = 'table-row';
        }
        
        if (productCalories) {
            productCalories.textContent = `${product.nutrition_info.calories} ккал/100г`;
        }
        
        if (nutritionInfo) {
            nutritionInfo.innerHTML = `
                <table class="nutrition-table">
                    <tr>
                        <td>Калорийность:</td>
                        <td><strong>${product.nutrition_info.calories}</strong> ккал</td>
                    </tr>
                    ${product.nutrition_info.protein ? `
                    <tr>
                        <td>Белки:</td>
                        <td><strong>${product.nutrition_info.protein}</strong> г</td>
                    </tr>
                    ` : ''}
                    ${product.nutrition_info.carbs ? `
                    <tr>
                        <td>Углеводы:</td>
                        <td><strong>${product.nutrition_info.carbs}</strong> г</td>
                    </tr>
                    ` : ''}
                    ${product.nutrition_info.fat ? `
                    <tr>
                        <td>Жиры:</td>
                        <td><strong>${product.nutrition_info.fat}</strong> г</td>
                    </tr>
                    ` : ''}
                </table>
                <p class="nutrition-note">* Значения указаны на 100 г/мл продукта</p>
            `;
        }
    } else {
        // Скрываем блок с пищевой ценностью
        if (nutritionCalories) {
            nutritionCalories.style.display = 'none';
        }
        
        if (nutritionInfo) {
            nutritionInfo.innerHTML = '<p>Информация о пищевой ценности отсутствует</p>';
        }
    }
}

function updateUsageInfo(product) {
    const usageContent = document.getElementById('usage-content');
    if (!usageContent) return;
    
    const cuisineUsage = {
        'italian': 'Идеально подходит для итальянских блюд: паст, пицц, соусов.',
        'french': 'Используется в классической французской кухне для соусов и маринадов.',
        'asian': 'Основной ингредиент в азиатской кухне для супов и жаркого.',
        'mexican': 'Ключевой компонент мексиканских блюд: тако, сальса, гуакамоле.',
        'indian': 'Важная специя в индийской кухне для карри и масала.',
        'russian': 'Традиционно используется в русской кухне.',
        'universal': 'Универсальный ингредиент для различных кухонь мира.'
    };
    
    const usageText = cuisineUsage[product.cuisine] || 'Универсальный ингредиент для различных блюд.';
    
    usageContent.innerHTML = `
        <p>${usageText}</p>
        <ul>
            <li>Добавляйте в блюда по вкусу</li>
            <li>Храните в сухом прохладном месте</li>
            <li>Используйте в свежем виде для максимального аромата</li>
            <li>Можно комбинировать с другими специями для создания уникальных вкусовых сочетаний</li>
        </ul>
    `;
}

function initControls() {
    // Управление количеством
    const quantityInput = document.getElementById('product-quantity');
    const minusBtn = document.getElementById('quantity-minus');
    const plusBtn = document.getElementById('quantity-plus');
    
    if (quantityInput && minusBtn && plusBtn) {
        minusBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            const min = parseInt(quantityInput.min);
            
            if (current > min) {
                quantityInput.value = current - 1;
                updateQuantityControls();
            }
        });
        
        plusBtn.addEventListener('click', () => {
            const current = parseInt(quantityInput.value);
            const max = parseInt(quantityInput.max);
            
            if (current < max) {
                quantityInput.value = current + 1;
                updateQuantityControls();
            }
        });
        
        quantityInput.addEventListener('input', function() {
            let value = parseInt(this.value);
            const min = parseInt(this.min);
            const max = parseInt(this.max);
            
            if (isNaN(value) || value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            
            this.value = value;
            updateQuantityControls();
        });
    }
    
    // Добавление в корзину
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function() {
            const pathParts = window.location.pathname.split('/').filter(part => part);
            const productSlug = pathParts[pathParts.length - 1];
            const quantity = parseInt(document.getElementById('product-quantity').value);
            
            fetch(`/api/products/${productSlug}/`)
                .then(response => response.json())
                .then(product => {
                    addToCart(product.id, quantity);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Ошибка добавления в корзину', 'error');
                });
        });
    }
    
    // Купить сейчас
    const buyNowBtn = document.getElementById('buy-now-btn');
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', function() {
            const pathParts = window.location.pathname.split('/').filter(part => part);
            const productSlug = pathParts[pathParts.length - 1];
            const quantity = parseInt(document.getElementById('product-quantity').value);
            
            fetch(`/api/products/${productSlug}/`)
                .then(response => response.json())
                .then(product => {
                    addToCart(product.id, quantity, true);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Ошибка', 'error');
                });
        });
    }
    
    // Добавление в список желаний
    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
    if (wishlistBtn) {
        wishlistBtn.addEventListener('click', function() {
            const pathParts = window.location.pathname.split('/').filter(part => part);
            const productSlug = pathParts[pathParts.length - 1];
            
            fetch(`/api/products/${productSlug}/`)
                .then(response => response.json())
                .then(product => {
                    toggleWishlist(product.id);
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Ошибка', 'error');
                });
        });
        
        // Проверяем, есть ли товар в списке желаний
        checkWishlistStatus();
    }
    
    // Переключение вкладок
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Обновляем активные классы
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            tabPanes.forEach(pane => {
                pane.classList.remove('active');
                if (pane.id === `tab-${tabId}`) {
                    pane.classList.add('active');
                    
                    // Загружаем отзывы, если перешли на вкладку с отзывами
                    if (tabId === 'reviews') {
                        const pathParts = window.location.pathname.split('/').filter(part => part);
                        const productSlug = pathParts[pathParts.length - 1];
                        loadReviews(productSlug);
                    }
                }
            });
            
            // Прокручиваем к вкладкам
            const tabsSection = document.querySelector('.product-tabs');
            if (tabsSection) {
                tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    
    // Модальное окно отзыва
    const writeReviewBtn = document.getElementById('write-review-btn');
    const reviewModal = document.getElementById('review-modal');
    
    if (writeReviewBtn && reviewModal) {
        writeReviewBtn.addEventListener('click', function() {
            if (!isUserAuthenticated()) {
                showNotification('Войдите в систему, чтобы оставить отзыв', 'warning');
                return;
            }
            
            reviewModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        // Закрытие модального окна
        const modalClose = reviewModal.querySelector('.modal-close');
        const cancelReview = reviewModal.querySelector('.cancel-review');
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                reviewModal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        if (cancelReview) {
            cancelReview.addEventListener('click', () => {
                reviewModal.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Закрытие при клике вне модального окна
        reviewModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Звезды рейтинга
        const stars = reviewModal.querySelectorAll('.stars-input i');
        const ratingInput = document.getElementById('review-rating');
        
        stars.forEach(star => {
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                updateStars(stars, rating);
            });
            
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                ratingInput.value = rating;
                updateStars(stars, rating, true);
            });
        });
        
        // Сброс звезд при уходе мыши
        reviewModal.querySelector('.stars-input').addEventListener('mouseleave', function() {
            const currentRating = parseInt(ratingInput.value);
            updateStars(stars, currentRating, true);
        });
        
        // Отправка отзыва
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                const pathParts = window.location.pathname.split('/').filter(part => part);
                const productSlug = pathParts[pathParts.length - 1];
                const formData = new FormData(this);
                
                const reviewData = {
                    product: productSlug,
                    rating: parseInt(formData.get('rating')),
                    title: formData.get('title'),
                    comment: formData.get('comment'),
                    pros: formData.get('pros'),
                    cons: formData.get('cons')
                };
                
                fetch('/api/reviews/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify(reviewData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.id) {
                        showNotification('Отзыв успешно отправлен!', 'success');
                        reviewModal.classList.remove('active');
                        document.body.style.overflow = '';
                        reviewForm.reset();
                        ratingInput.value = 5;
                        updateStars(stars, 5, true);
                        
                        // Перезагружаем отзывы
                        loadReviews(productSlug);
                    } else {
                        showNotification(data.error || 'Ошибка отправки отзыва', 'error');
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Ошибка отправки отзыва', 'error');
                });
            });
        }
    }
}

function updateQuantityControls() {
    const quantityInput = document.getElementById('product-quantity');
    const minusBtn = document.getElementById('quantity-minus');
    const plusBtn = document.getElementById('quantity-plus');
    
    if (!quantityInput || !minusBtn || !plusBtn) return;
    
    const current = parseInt(quantityInput.value);
    const min = parseInt(quantityInput.min);
    const max = parseInt(quantityInput.max);
    
    minusBtn.disabled = current <= min;
    plusBtn.disabled = current >= max;
}

function checkWishlistStatus() {
    if (!isUserAuthenticated()) return;
    
    const pathParts = window.location.pathname.split('/').filter(part => part);
    const productSlug = pathParts[pathParts.length - 1];
    
    fetch(`/api/products/${productSlug}/`)
        .then(response => response.json())
        .then(product => {
            fetch(`/api/wishlist/check_product/?product_id=${product.id}`)
                .then(response => response.json())
                .then(data => {
                    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
                    if (wishlistBtn) {
                        const icon = wishlistBtn.querySelector('i');
                        const text = wishlistBtn.querySelector('span');
                        
                        if (data.in_wishlist) {
                            icon.className = 'fas fa-heart';
                            text.textContent = 'В списке желаний';
                            wishlistBtn.classList.add('active');
                        } else {
                            icon.className = 'far fa-heart';
                            text.textContent = 'В список желаний';
                            wishlistBtn.classList.remove('active');
                        }
                    }
                })
                .catch(error => console.error('Error checking wishlist:', error));
        })
        .catch(error => console.error('Error:', error));
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
                    
                    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
                    if (wishlistBtn) {
                        const icon = wishlistBtn.querySelector('i');
                        const text = wishlistBtn.querySelector('span');
                        icon.className = 'far fa-heart';
                        text.textContent = 'В список желаний';
                        wishlistBtn.classList.remove('active');
                    }
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
                    
                    const wishlistBtn = document.getElementById('add-to-wishlist-btn');
                    if (wishlistBtn) {
                        const icon = wishlistBtn.querySelector('i');
                        const text = wishlistBtn.querySelector('span');
                        icon.className = 'fas fa-heart';
                        text.textContent = 'В списке желаний';
                        wishlistBtn.classList.add('active');
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('Ошибка работы со списком желаний', 'error');
        });
}

function updateStars(stars, rating, permanent = false) {
    stars.forEach((star, index) => {
        if (index < rating) {
            star.className = 'fas fa-star';
        } else {
            star.className = 'far fa-star';
        }
    });
    
    if (permanent) {
        stars.forEach(star => {
            star.style.color = '';
        });
    } else {
        stars.forEach((star, index) => {
            if (index < rating) {
                star.style.color = '#ffc107';
            }
        });
    }
}

function initReviews() {
    // Загрузка отзывов будет происходить при переходе на вкладку
    // Здесь только инициализируем обработчики для кнопок "Полезно"/"Не полезно"
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.helpful-btn')) {
            const btn = e.target.closest('.helpful-btn');
            const reviewId = btn.getAttribute('data-review-id');
            const helpful = btn.getAttribute('data-helpful') === 'true';
            
            if (!isUserAuthenticated()) {
                showNotification('Войдите в систему, чтобы оценить отзыв', 'warning');
                return;
            }
            
            fetch(`/api/reviews/${reviewId}/mark_helpful/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({ helpful: helpful })
            })
            .then(response => response.json())
            .then(data => {
                if (data.id) {
                    showNotification('Спасибо за оценку!', 'success');
                    
                    // Обновляем счетчики
                    const reviewCard = btn.closest('.review-card');
                    if (helpful) {
                        const helpfulBtn = reviewCard.querySelector('[data-helpful="true"]');
                        const countMatch = helpfulBtn.textContent.match(/\((\d+)\)/);
                        if (countMatch) {
                            const count = parseInt(countMatch[1]);
                            helpfulBtn.innerHTML = `<i class="fas fa-thumbs-up"></i> Полезно (${count + 1})`;
                        }
                    } else {
                        const notHelpfulBtn = reviewCard.querySelector('[data-helpful="false"]');
                        const countMatch = notHelpfulBtn.textContent.match(/\((\d+)\)/);
                        if (countMatch) {
                            const count = parseInt(countMatch[1]);
                            notHelpfulBtn.innerHTML = `<i class="fas fa-thumbs-down"></i> Не полезно (${count + 1})`;
                        }
                    }
                    btn.disabled = true;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Ошибка оценки отзыва', 'error');
            });
        }
    });
}

function loadReviews(productSlug) {
    const reviewsList = document.getElementById('reviews-list');
    const reviewsCount = document.getElementById('reviews-count');
    const reviewCount = document.getElementById('review-count');
    
    if (!reviewsList) return;
    
    // Показываем индикатор загрузки
    reviewsList.innerHTML = `
        <div class="loading-reviews">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка отзывов...</p>
        </div>
    `;
    
    fetch(`/api/reviews/?product__slug=${productSlug}`)
        .then(response => response.json())
        .then(data => {
            updateReviewsUI(data);
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            reviewsList.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Ошибка загрузки отзывов</p>
                </div>
            `;
        });
}

function updateReviewsUI(data) {
    const reviews = data.results || [];
    const reviewCountElement = document.getElementById('review-count');
    const reviewsCountElement = document.getElementById('reviews-count');
    const averageRating = document.getElementById('average-rating');
    const averageStars = document.getElementById('average-stars');
    const totalReviewsText = document.getElementById('total-reviews-text');
    const reviewsList = document.getElementById('reviews-list');
    const loadMoreBtn = document.getElementById('load-more-reviews');
    
    // Обновляем счетчики
    if (reviewCountElement) reviewCountElement.textContent = reviews.length;
    if (reviewsCountElement) reviewsCountElement.textContent = reviews.length;
    if (totalReviewsText) totalReviewsText.textContent = `на основе ${reviews.length} отзывов`;
    
    // Рассчитываем средний рейтинг
    let totalRating = 0;
    const ratingCounts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    
    reviews.forEach(review => {
        totalRating += review.rating;
        ratingCounts[review.rating]++;
    });
    
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
    
    // Обновляем средний рейтинг
    if (averageRating) averageRating.textContent = avgRating.toFixed(1);
    if (averageStars) averageStars.innerHTML = generateStars(avgRating);
    
    // Обновляем распределение рейтингов
    for (let i = 5; i >= 1; i--) {
        const percentage = reviews.length > 0 ? (ratingCounts[i] / reviews.length) * 100 : 0;
        const bar = document.getElementById(`rating-${i}-bar`);
        const percent = document.getElementById(`rating-${i}-percent`);
        
        if (bar) bar.style.width = `${percentage}%`;
        if (percent) percent.textContent = `${percentage.toFixed(0)}%`;
    }
    
    // Отображаем отзывы
    if (reviewsList) {
        if (reviews.length > 0) {
            reviewsList.innerHTML = '';
            reviews.slice(0, 5).forEach(review => {
                reviewsList.appendChild(createReviewCard(review));
            });
            
            // Показываем кнопку "Загрузить еще" если есть больше отзывов
            if (loadMoreBtn && reviews.length > 5) {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.onclick = function() {
                    // Здесь можно реализовать пагинацию отзывов
                    showNotification('Загрузка дополнительных отзывов...', 'info');
                };
            } else if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        } else {
            reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="far fa-comment-alt"></i>
                    <h3>Пока нет отзывов</h3>
                    <p>Будьте первым, кто оставит отзыв об этом товаре!</p>
                </div>
            `;
            
            if (loadMoreBtn) {
                loadMoreBtn.style.display = 'none';
            }
        }
    }
}

function createReviewCard(review) {
    const div = document.createElement('div');
    div.className = 'review-card';
    
    const date = new Date(review.created_at).toLocaleDateString('ru-RU');
    
    div.innerHTML = `
        <div class="review-header">
            <div class="reviewer">
                <div class="reviewer-avatar">
                    <img src="${review.user.avatar || '/static/img/default-avatar.jpg'}" alt="${review.user.first_name}">
                </div>
                <div class="reviewer-info">
                    <h4>${review.user.first_name} ${review.user.last_name}</h4>
                    <div class="review-date">${date}</div>
                </div>
            </div>
            <div class="review-rating">
                ${generateStars(review.rating)}
            </div>
        </div>
        
        <div class="review-title">${review.title}</div>
        
        <div class="review-content">
            <p>${review.comment}</p>
        </div>
        
        ${review.pros ? `
        <div class="review-pros">
            <strong>Достоинства:</strong> ${review.pros}
        </div>
        ` : ''}
        
        ${review.cons ? `
        <div class="review-cons">
            <strong>Недостатки:</strong> ${review.cons}
        </div>
        ` : ''}
        
        <div class="review-actions">
            <button class="helpful-btn" data-review-id="${review.id}" data-helpful="true">
                <i class="fas fa-thumbs-up"></i> Полезно (${review.helpful_yes || 0})
            </button>
            <button class="helpful-btn" data-review-id="${review.id}" data-helpful="false">
                <i class="fas fa-thumbs-down"></i> Не полезно (${review.helpful_no || 0})
            </button>
            ${review.images && review.images.length > 0 ? `
            <button class="view-images-btn" onclick="showReviewImages(${review.id})">
                Фото (${review.images.length})
            </button>
            ` : ''}
        </div>
    `;
    
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

function loadSimilarProducts(productSlug) {
    const container = document.getElementById('similar-products');
    if (!container) return;
    
    fetch(`/api/products/${productSlug}/similar/`)
        .then(response => response.json())
        .then(products => {
            if (products.length > 0) {
                container.innerHTML = '';
                products.forEach(product => {
                    container.appendChild(createProductCardForSlider(product));
                });
                
                // Инициализируем слайдер
                initSimilarProductsSlider(container);
            } else {
                container.innerHTML = '<p class="no-products">Нет похожих товаров</p>';
            }
        })
        .catch(error => {
            console.error('Error loading similar products:', error);
            container.innerHTML = '<p class="error">Ошибка загрузки похожих товаров</p>';
        });
}

function createProductCardForSlider(product) {
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
        addToCart(product.id);
    });
    
    return div;
}

function initSimilarProductsSlider(container) {
    const products = container.querySelectorAll('.product-card');
    if (products.length <= 4) return;
    
    let currentSlide = 0;
    const slidesPerView = 4;
    const totalSlides = Math.ceil(products.length / slidesPerView);
    
    // Создаем навигацию
    const nav = document.createElement('div');
    nav.className = 'slider-nav';
    nav.innerHTML = `
        <button class="slider-prev"><i class="fas fa-chevron-left"></i></button>
        <button class="slider-next"><i class="fas fa-chevron-right"></i></button>
    `;
    
    container.parentNode.appendChild(nav);
    
    // Функция обновления слайдера
    function updateSlider() {
        products.forEach((product, index) => {
            if (index >= currentSlide * slidesPerView && index < (currentSlide + 1) * slidesPerView) {
                product.style.display = 'block';
            } else {
                product.style.display = 'none';
            }
        });
        
        // Обновляем состояние кнопок
        nav.querySelector('.slider-prev').disabled = currentSlide === 0;
        nav.querySelector('.slider-next').disabled = currentSlide >= totalSlides - 1;
    }
    
    // Навигация
    nav.querySelector('.slider-prev').addEventListener('click', () => {
        if (currentSlide > 0) {
            currentSlide--;
            updateSlider();
        }
    });
    
    nav.querySelector('.slider-next').addEventListener('click', () => {
        if (currentSlide < totalSlides - 1) {
            currentSlide++;
            updateSlider();
        }
    });
    
    // Автопрокрутка
    let autoSlide = setInterval(() => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    }, 5000);
    
    // Остановка автопрокрутки при наведении
    container.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
    });
    
    container.addEventListener('mouseleave', () => {
        autoSlide = setInterval(() => {
            currentSlide = (currentSlide + 1) % totalSlides;
            updateSlider();
        }, 5000);
    });
    
    // Инициализация
    updateSlider();
}

function loadRecentlyViewed() {
    const container = document.getElementById('recently-viewed');
    if (!container) return;
    
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    if (recentlyViewed.length > 0) {
        // Загружаем последние 4 просмотренных товара
        const recentProducts = recentlyViewed.slice(0, 4);
        
        // Загружаем информацию о каждом товаре
        const promises = recentProducts.map(productId => 
            fetch(`/api/products/${productId}/`)
                .then(response => response.json())
                .catch(() => null)
        );
        
        Promise.all(promises)
            .then(products => {
                const validProducts = products.filter(p => p !== null);
                
                if (validProducts.length > 0) {
                    container.innerHTML = '';
                    validProducts.forEach(product => {
                        container.appendChild(createRecentlyViewedCard(product));
                    });
                } else {
                    container.innerHTML = '<p class="no-products">Нет недавно просмотренных товаров</p>';
                }
            })
            .catch(error => {
                console.error('Error loading recently viewed:', error);
                container.innerHTML = '<p class="error">Ошибка загрузки</p>';
            });
    } else {
        container.innerHTML = '<p class="no-products">Вы еще не просматривали товары</p>';
    }
}

function createRecentlyViewedCard(product) {
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
        addToCart(product.id);
    });
    
    return div;
}

function updateRecentlyViewed(product) {
    let recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    
    // Удаляем товар, если он уже есть в списке
    recentlyViewed = recentlyViewed.filter(id => id !== product.id);
    
    // Добавляем товар в начало списка
    recentlyViewed.unshift(product.id);
    
    // Ограничиваем количество записей
    if (recentlyViewed.length > 10) {
        recentlyViewed = recentlyViewed.slice(0, 10);
    }
    
    localStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
}

// Глобальные вспомогательные функции
function addToCart(productId, quantity = 1, redirectToCart = false) {
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
            
            if (redirectToCart) {
                setTimeout(() => {
                    window.location.href = '/cart/';
                }, 1000);
            }
        } else if (data.error) {
            showNotification(data.error, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Ошибка добавления в корзину', 'error');
    });
}

function formatPrice(price) {
    return parseFloat(price).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
}

// Функции из header.js (должны быть доступны)
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

function isUserAuthenticated() {
    return document.cookie.includes('sessionid') || 
           document.cookie.includes('csrftoken');
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    // Проверяем, есть ли товар в корзине
    checkCartStatus();
    
    // Инициализируем модальное окно для изображений отзывов
    initReviewImagesModal();
});

function checkCartStatus() {
    const productSlug = window.location.pathname.split('/').filter(part => part).pop();
    
    fetch(`/api/products/${productSlug}/`)
        .then(response => response.json())
        .then(product => {
            fetch('/api/cart/')
                .then(response => response.json())
                .then(cart => {
                    const cartItem = cart.items?.find(item => item.id === product.id);
                    if (cartItem) {
                        const quantityInput = document.getElementById('product-quantity');
                        const addToCartBtn = document.getElementById('add-to-cart-btn');
                        
                        if (quantityInput) {
                            quantityInput.value = cartItem.quantity;
                            updateQuantityControls();
                        }
                        
                        if (addToCartBtn) {
                            addToCartBtn.innerHTML = '<i class="fas fa-check"></i><span>В корзине</span>';
                            addToCartBtn.classList.add('in-cart');
                            
                            // Меняем обработчик на увеличение количества
                            addToCartBtn.addEventListener('click', function(e) {
                                e.preventDefault();
                                const newQuantity = parseInt(quantityInput.value) + 1;
                                const max = parseInt(quantityInput.max);
                                
                                if (newQuantity <= max) {
                                    quantityInput.value = newQuantity;
                                    addToCart(product.id, newQuantity);
                                } else {
                                    showNotification('Достигнуто максимальное количество', 'warning');
                                }
                            });
                        }
                    }
                })
                .catch(error => console.error('Error checking cart:', error));
        })
        .catch(error => console.error('Error:', error));
}

function initReviewImagesModal() {
    // Создаем модальное окно для изображений отзывов
    if (!document.getElementById('review-images-modal')) {
        const modal = document.createElement('div');
        modal.id = 'review-images-modal';
        modal.className = 'modal review-images-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Фотографии отзыва</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="review-images-slider"></div>
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
            .review-images-modal .modal-content {
                max-width: 800px;
                width: 95%;
                max-height: 90vh;
            }
            .review-images-slider {
                position: relative;
            }
            .review-image-slide {
                display: none;
                text-align: center;
            }
            .review-image-slide.active {
                display: block;
            }
            .review-image-slide img {
                max-width: 100%;
                max-height: 70vh;
                object-fit: contain;
            }
            .review-images-nav {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }
            .review-image-caption {
                text-align: center;
                margin-top: 10px;
                color: #666;
                font-style: italic;
            }
        `;
        document.head.appendChild(styles);
    }
}

function showReviewImages(reviewId) {
    const modal = document.getElementById('review-images-modal');
    const slider = modal.querySelector('.review-images-slider');
    
    // Показываем загрузку
    slider.innerHTML = '<div class="loading">Загрузка изображений...</div>';
    
    // Открываем модальное окно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Загружаем изображения отзыва
    fetch(`/api/reviews/${reviewId}/`)
        .then(response => response.json())
        .then(review => {
            if (review.images && review.images.length > 0) {
                slider.innerHTML = '';
                
                review.images.forEach((image, index) => {
                    const slide = document.createElement('div');
                    slide.className = 'review-image-slide' + (index === 0 ? ' active' : '');
                    slide.innerHTML = `
                        <img src="${image.image}" alt="Изображение отзыва">
                        ${image.caption ? `<div class="review-image-caption">${image.caption}</div>` : ''}
                    `;
                    slider.appendChild(slide);
                });
                
                // Добавляем навигацию, если изображений больше одного
                if (review.images.length > 1) {
                    const nav = document.createElement('div');
                    nav.className = 'review-images-nav';
                    nav.innerHTML = `
                        <button class="btn btn-outline prev-image"><i class="fas fa-chevron-left"></i> Назад</button>
                        <span class="image-counter">1 / ${review.images.length}</span>
                        <button class="btn btn-outline next-image">Вперед <i class="fas fa-chevron-right"></i></button>
                    `;
                    slider.appendChild(nav);
                    
                    // Навигация по изображениям
                    let currentImage = 0;
                    
                    function updateImage() {
                        document.querySelectorAll('.review-image-slide').forEach((slide, index) => {
                            slide.classList.toggle('active', index === currentImage);
                        });
                        nav.querySelector('.image-counter').textContent = `${currentImage + 1} / ${review.images.length}`;
                    }
                    
                    nav.querySelector('.prev-image').addEventListener('click', () => {
                        currentImage = (currentImage - 1 + review.images.length) % review.images.length;
                        updateImage();
                    });
                    
                    nav.querySelector('.next-image').addEventListener('click', () => {
                        currentImage = (currentImage + 1) % review.images.length;
                        updateImage();
                    });
                }
            } else {
                slider.innerHTML = '<div class="no-images">Нет изображений</div>';
            }
        })
        .catch(error => {
            console.error('Error loading review images:', error);
            slider.innerHTML = '<div class="error">Ошибка загрузки изображений</div>';
        });
}

// Дополнительные функции для улучшения UX
function initProductSharing() {
    const shareBtn = document.createElement('button');
    shareBtn.className = 'share-btn';
    shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Поделиться';
    shareBtn.style.position = 'fixed';
    shareBtn.style.bottom = '80px';
    shareBtn.style.right = '20px';
    shareBtn.style.zIndex = '100';
    
    document.body.appendChild(shareBtn);
    
    shareBtn.addEventListener('click', function() {
        if (navigator.share) {
            // Используем Web Share API
            navigator.share({
                title: document.title,
                text: document.querySelector('meta[name="description"]')?.content || '',
                url: window.location.href
            })
            .then(() => showNotification('Спасибо за распространение!', 'success'))
            .catch(error => console.error('Error sharing:', error));
        } else {
            // Фолбэк для браузеров без поддержки Web Share API
            showShareOptions();
        }
    });
}

function showShareOptions() {
    const modal = document.createElement('div');
    modal.className = 'modal share-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Поделиться товаром</h3>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="share-options">
                    <button class="share-option" data-platform="vkontakte">
                        <i class="fab fa-vk"></i>
                        <span>ВКонтакте</span>
                    </button>
                    <button class="share-option" data-platform="telegram">
                        <i class="fab fa-telegram"></i>
                        <span>Telegram</span>
                    </button>
                    <button class="share-option" data-platform="whatsapp">
                        <i class="fab fa-whatsapp"></i>
                        <span>WhatsApp</span>
                    </button>
                    <button class="share-option" data-platform="copy">
                        <i class="fas fa-link"></i>
                        <span>Скопировать ссылку</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Открываем модальное окно
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Обработчики закрытия
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.remove();
        document.body.style.overflow = '';
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    });
    
    // Обработчики кнопок поделиться
    modal.querySelectorAll('.share-option').forEach(btn => {
        btn.addEventListener('click', function() {
            const platform = this.getAttribute('data-platform');
            shareToPlatform(platform);
        });
    });
}

function shareToPlatform(platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const text = encodeURIComponent(document.querySelector('meta[name="description"]')?.content || '');
    
    let shareUrl = '';
    
    switch(platform) {
        case 'vkontakte':
            shareUrl = `https://vk.com/share.php?url=${url}&title=${title}&comment=${text}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${title}%20${url}`;
            break;
        case 'copy':
            navigator.clipboard.writeText(window.location.href)
                .then(() => showNotification('Ссылка скопирована в буфер обмена', 'success'))
                .catch(() => {
                    // Фолбэк для старых браузеров
                    const textarea = document.createElement('textarea');
                    textarea.value = window.location.href;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    showNotification('Ссылка скопирована в буфер обмена', 'success');
                });
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

// Инициализация дополнительных функций
window.addEventListener('load', function() {
    // Показываем кнопку "Наверх" при скролле
    initBackToTop();
    
    // Инициализируем кнопку поделиться
    initProductSharing();
    
    // Показываем рекомендации на основе просмотренных товаров
    showPersonalizedRecommendations();
});

function initBackToTop() {
    const backToTopBtn = document.createElement('button');
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '20px';
    backToTopBtn.style.right = '20px';
    backToTopBtn.style.zIndex = '100';
    backToTopBtn.style.display = 'none';
    
    document.body.appendChild(backToTopBtn);
    
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function showPersonalizedRecommendations() {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (recentlyViewed.length === 0) return;
    
    // Загружаем информацию о последнем просмотренном товаре
    const lastViewedId = recentlyViewed[0];
    
    fetch(`/api/products/${lastViewedId}/similar/`)
        .then(response => response.json())
        .then(products => {
            if (products.length > 0) {
                // Показываем рекомендации
                showRecommendationsPopup(products.slice(0, 3));
            }
        })
        .catch(error => console.error('Error loading recommendations:', error));
}

function showRecommendationsPopup(products) {
    // Проверяем, не показывали ли уже рекомендации сегодня
    const lastShown = localStorage.getItem('recommendationsLastShown');
    const today = new Date().toDateString();
    
    if (lastShown === today) return;
    
    // Создаем попап с рекомендациями
    const popup = document.createElement('div');
    popup.className = 'recommendations-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Рекомендуем попробовать</h3>
                <button class="popup-close">&times;</button>
            </div>
            <div class="popup-body">
                <div class="recommendations-grid">
                    ${products.map(product => `
                        <div class="recommendation-item">
                            <img src="${product.images?.[0]?.image || '/static/img/default-product.jpg'}" 
                                 alt="${product.name}">
                            <div class="recommendation-info">
                                <div class="recommendation-name">${product.name}</div>
                                <div class="recommendation-price">${formatPrice(product.price)}</div>
                                <button class="btn btn-small add-to-cart" 
                                        data-product-id="${product.id}">
                                    В корзину
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="popup-footer">
                <button class="btn btn-outline btn-small close-popup">Закрыть</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Показываем попап с задержкой
    setTimeout(() => {
        popup.classList.add('active');
    }, 5000);
    
    // Обработчики событий
    popup.querySelector('.popup-close').addEventListener('click', () => {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    });
    
    popup.querySelector('.close-popup').addEventListener('click', () => {
        popup.classList.remove('active');
        setTimeout(() => popup.remove(), 300);
    });
    
    // Кнопки "В корзину"
    popup.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', function() {
            const productId = this.getAttribute('data-product-id');
            addToCart(productId);
            popup.classList.remove('active');
            setTimeout(() => popup.remove(), 300);
        });
    });
    
    // Сохраняем дату показа
    localStorage.setItem('recommendationsLastShown', today);
    
    // Добавляем стили
    const styles = document.createElement('style');
    styles.textContent = `
        .recommendations-popup {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 350px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 1000;
            transform: translateX(150%);
            transition: transform 0.3s ease;
        }
        .recommendations-popup.active {
            transform: translateX(0);
        }
        .popup-content {
            padding: 15px;
        }
        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .popup-header h3 {
            margin: 0;
            font-size: 16px;
        }
        .popup-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #999;
        }
        .recommendations-grid {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .recommendation-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border: 1px solid #eee;
            border-radius: 6px;
        }
        .recommendation-item img {
            width: 50px;
            height: 50px;
            object-fit: contain;
            border-radius: 4px;
        }
        .recommendation-info {
            flex: 1;
        }
        .recommendation-name {
            font-size: 14px;
            margin-bottom: 5px;
            line-height: 1.3;
        }
        .recommendation-price {
            color: var(--primary-color);
            font-weight: 500;
            font-size: 14px;
        }
        .popup-footer {
            margin-top: 15px;
            text-align: center;
        }
    `;
    document.head.appendChild(styles);
  }
}