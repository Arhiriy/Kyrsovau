from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.views.generic import TemplateView
from products.views import main_page, catalog_page, cart_page, order_page, ingredient_page
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # HTML страницы
    path('', main_page, name='home'),
    path('catalog/', catalog_page, name='catalog'),
    path('cart/', cart_page, name='cart'),
    path('order/', order_page, name='order'),
    path('ingredient/', ingredient_page, name='ingredient'),

    # API
    path('api/products/', include('products.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/users/', include('users.urls')),
    path('api/reviews/', include('reviews.urls')),
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)