import django_filters
from .models import Ingredient, Category

class IngredientFilter(django_filters.FilterSet):
    category = django_filters.ModelChoiceFilter(queryset=Category.objects.all())
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    available = django_filters.BooleanFilter(field_name='available')
    
    class Meta:
        model = Ingredient
        fields = ['category', 'available']