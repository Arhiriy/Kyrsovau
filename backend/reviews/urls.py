from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
    path('ingredient/<int:ingredient_id>/', views.ingredient_reviews, name='ingredient_reviews'),
    path('my/', views.user_reviews, name='user_reviews'),
    path('stats/', views.ReviewViewSet.as_view({'get': 'ingredient_stats'}), name='review_stats'),
]