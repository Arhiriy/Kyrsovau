from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from products.models import Ingredient

class Review(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Пользователь'
    )
    ingredient = models.ForeignKey(
        Ingredient,
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Ингредиент'
    )
    rating = models.PositiveSmallIntegerField(
        'Рейтинг',
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField('Комментарий', blank=True)
    created = models.DateTimeField('Создан', auto_now_add=True)
    updated = models.DateTimeField('Обновлен', auto_now=True)
    
    # Дополнительные поля для модерации
    is_hidden = models.BooleanField('Скрыт', default=False)
    reported_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='reported_reviews',
        blank=True,
        verbose_name='Пожаловались'
    )
    
    class Meta:
        unique_together = ['user', 'ingredient']
        ordering = ['-created']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'
        indexes = [
            models.Index(fields=['ingredient', 'created']),
            models.Index(fields=['user', 'created']),
            models.Index(fields=['is_hidden']),
        ]
    
    def __str__(self):
        return f'Отзыв от {self.user} на {self.ingredient}'
    
    def save(self, *args, **kwargs):
        # Автоматически обновляем updated при изменении
        if self.pk:
            self.updated = models.DateTimeField(auto_now=True)
        super().save(*args, **kwargs)