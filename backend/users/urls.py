from django.urls import path, include
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('orders/', views.UserOrdersView.as_view(), name='orders'),
    path('profile/', views.ProfileView.as_view(), name='profile'),

    path('wishlist/', include('wishlist.urls')),
    
    path('me/', views.UserView.as_view(), name='user_detail'),
]