# Кулинарный магазин ингредиентов

Интернет-магазин специализированных кулинарных ингредиентов.

## Технологии
- **Backend**: Django 4.2, Django REST Framework
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript
- **Containerization**: Docker, Docker Compose

## Установка и запуск

### Локальная разработка
```bash
# Клонирование репозитория
git clone <repository-url>
cd culinary_ingredients_store

# Установка зависимостей
pip install -r requirements.txt

# Настройка переменных окружения
cp .env.example .env
# Отредактируйте .env файл

# Миграции базы данных
python manage.py migrate

# Запуск сервера
python manage.py runserver

# =======================================

# Запуск с Docker
# Сборка и запуск контейнеров
docker-compose up --build

# Остановка контейнеров
docker-compose down

#Структура проекта
#    backend/ - Django приложение
#    frontend/ - HTML шаблоны и статические файлы
#    docker/ - файлы для контейнеризации

#Функционал
#    Каталог товаров с фильтрацией
#    Корзина покупок
#    Оформление заказов
#    Система отзывов и рейтингов
#    Управление пользователями

