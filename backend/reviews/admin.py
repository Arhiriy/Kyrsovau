from django.contrib import admin
from .models import Review

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['user', 'ingredient', 'rating', 'created']
    list_filter = ['rating', 'created']
    search_fields = ['user__email', 'ingredient__name', 'comment']
    raw_id_fields = ['user', 'ingredient']