# backend/reviews/views.py
from django.shortcuts import get_object_or_404
from django.db.models import Avg
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from .models import Review
from .serializers import ReviewSerializer
from products.models import Ingredient

class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления отзывами
    """
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        """
        Возвращает queryset отзывов с фильтрацией по ингредиенту
        """
        queryset = Review.objects.select_related('user', 'ingredient')
        
        # Фильтрация по ингредиенту
        ingredient_id = self.request.query_params.get('ingredient_id')
        if ingredient_id:
            queryset = queryset.filter(ingredient_id=ingredient_id)
        
        # Фильтрация по пользователю (для личного кабинета)
        user_id = self.request.query_params.get('user_id')
        if user_id and self.request.user.is_staff:
            queryset = queryset.filter(user_id=user_id)
        elif self.request.user.is_authenticated:
            # Пользователь видит только свои отзывы
            if 'my' in self.request.query_params:
                queryset = queryset.filter(user=self.request.user)
        
        return queryset.order_by('-created')
    
    def perform_create(self, serializer):
        """
        Сохраняет отзыв с текущим пользователем
        """
        # Проверяем, не оставлял ли пользователь уже отзыв на этот товар
        ingredient_id = self.request.data.get('ingredient')
        if Review.objects.filter(
            user=self.request.user, 
            ingredient_id=ingredient_id
        ).exists():
            raise serializers.ValidationError({
                'detail': 'Вы уже оставляли отзыв на этот товар'
            })
        
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def ingredient_stats(self, request):
        """
        Получение статистики отзывов для ингредиента
        """
        ingredient_id = request.query_params.get('ingredient_id')
        if not ingredient_id:
            return Response(
                {'error': 'ingredient_id обязателен'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Получаем ингредиент
        ingredient = get_object_or_404(Ingredient, id=ingredient_id)
        
        # Получаем статистику
        reviews = Review.objects.filter(ingredient=ingredient)
        total_reviews = reviews.count()
        
        if total_reviews > 0:
            avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
            rating_distribution = reviews.values('rating').annotate(count=models.Count('id'))
            
            stats = {
                'ingredient_id': ingredient_id,
                'ingredient_name': ingredient.name,
                'total_reviews': total_reviews,
                'average_rating': round(avg_rating, 1),
                'rating_distribution': list(rating_distribution),
            }
        else:
            stats = {
                'ingredient_id': ingredient_id,
                'ingredient_name': ingredient.name,
                'total_reviews': 0,
                'average_rating': 0,
                'rating_distribution': [],
            }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def report(self, request, pk=None):
        """
        Пожаловаться на отзыв
        """
        review = self.get_object()
        
        # Проверяем, не жаловался ли уже пользователь на этот отзыв
        if review.reported_by.filter(id=request.user.id).exists():
            return Response(
                {'error': 'Вы уже пожаловались на этот отзыв'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Добавляем пользователя в список пожаловавшихся
        review.reported_by.add(request.user)
        
        # Если много жалоб, скрываем отзыв
        if review.reported_by.count() >= 5:
            review.is_hidden = True
            review.save()
        
        return Response({'success': True, 'message': 'Жалоба отправлена'})

@api_view(['GET'])
def ingredient_reviews(request, ingredient_id):
    """
    Получение всех отзывов для конкретного ингредиента
    """
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    reviews = Review.objects.filter(ingredient=ingredient, is_hidden=False)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def user_reviews(request):
    """
    Получение всех отзывов текущего пользователя
    """
    if not request.user.is_authenticated:
        return Response(
            {'error': 'Требуется авторизация'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    reviews = Review.objects.filter(user=request.user)
    serializer = ReviewSerializer(reviews, many=True)
    return Response(serializer.data)