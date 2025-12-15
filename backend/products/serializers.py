from rest_framework import serializers
from .models import Category, Ingredient

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image', 'created']

class IngredientSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    
    class Meta:
        model = Ingredient
        fields = [
            'id', 'name', 'slug', 'category',
            'description', 'price', 'unit', 'weight_per_unit',
            'image', 'available', 'stock', 'created', 'updated'
        ]