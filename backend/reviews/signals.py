from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Avg
from .models import Review
from products.models import Ingredient

@receiver([post_save, post_delete], sender=Review)
def update_ingredient_rating(sender, instance, **kwargs):
    """Обновление среднего рейтинга ингредиента"""
    ingredient = instance.ingredient
    avg_rating = ingredient.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
    
    # В реальном проекте здесь можно сохранить средний рейтинг в модель Ingredient
    # ingredient.average_rating = avg_rating or 0
    # ingredient.save()