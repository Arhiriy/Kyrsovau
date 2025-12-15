# backend/cart/models.py
from django.db import models
from django.conf import settings
from products.models import Ingredient

class CartItem(models.Model):
    """Модель для хранения элементов корзины в базе данных (опционально)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='Пользователь'
    )
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        verbose_name='Ингредиент'
    )
    quantity = models.PositiveIntegerField('Количество', default=1)
    added_at = models.DateTimeField('Добавлено', auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'ingredient']
        verbose_name = 'Элемент корзины'
        verbose_name_plural = 'Элементы корзины'
        ordering = ['-added_at']
    
    def __str__(self):
        return f'{self.ingredient.name} ({self.quantity})'
    
    def get_total_price(self):
        return self.ingredient.price * self.quantity