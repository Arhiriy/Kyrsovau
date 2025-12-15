from django.shortcuts import get_object_or_404, render
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Category, Ingredient
from .serializers import CategorySerializer, IngredientSerializer
from .filters import IngredientFilter

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class IngredientViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ingredient.objects.filter(available=True)
    serializer_class = IngredientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = IngredientFilter
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'name', 'created']
    
    @action(detail=False)
    def featured(self, request):
        """Популярные ингредиенты"""
        ingredients = self.queryset.order_by('-created')[:8]
        serializer = self.get_serializer(ingredients, many=True)
        return Response(serializer.data)
    
def main_page(request):
    return render(request, 'main/main.html')

def catalog_page(request):
    return render(request, 'main/catalog.html')

def cart_page(request):
    return render(request, 'main/cart.html')

def order_page(request):
    return render(request, 'main/order.html')

def ingredient_page(request):
    return render(request, 'main/ingredient.html')

