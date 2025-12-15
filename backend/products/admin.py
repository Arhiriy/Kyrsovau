from django.contrib import admin
from .models import Category, Ingredient

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'created', 'updated']
    list_filter = ['created', 'updated']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'category', 'price', 'unit', 
        'weight_per_unit', 'available', 'stock'
    ]
    list_filter = ['available', 'created', 'updated', 'category']
    list_editable = ['price', 'available', 'stock']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    raw_id_fields = ['category']
    date_hierarchy = 'created'