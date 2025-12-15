from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Category(models.Model):
    """Модель категории товаров"""
    name = models.CharField('Название', max_length=200, db_index=True)
    slug = models.SlugField('Слаг', max_length=200, unique=True)
    description = models.TextField('Описание', blank=True)
    image = models.ImageField('Изображение', upload_to='categories/', blank=True)
    created = models.DateTimeField('Создано', auto_now_add=True)
    updated = models.DateTimeField('Обновлено', auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Категория'
        verbose_name_plural = 'Категории'
    
    def __str__(self):
        return self.name

class Ingredient(models.Model):
    """Модель ингредиента"""
    UNIT_CHOICES = [
        ('g', 'Граммы'),
        ('kg', 'Килограммы'),
        ('ml', 'Миллилитры'),
        ('l', 'Литр'),
        ('pcs', 'Штуки'),
        ('pack', 'Упаковка'),
    ]
    
    name = models.CharField('Название', max_length=200, db_index=True)
    slug = models.SlugField('Слаг', max_length=200, unique=True)
    category = models.ForeignKey(
        Category, 
        related_name='ingredients',
        on_delete=models.CASCADE,
        verbose_name='Категория'
    )
    description = models.TextField('Описание')
    price = models.DecimalField(
        'Цена', 
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    unit = models.CharField('Единица измерения', max_length=10, choices=UNIT_CHOICES)
    weight_per_unit = models.DecimalField(
        'Вес/объем на единицу', 
        max_digits=10, 
        decimal_places=3,
        help_text='Например: 100 для 100г, 0.5 для 500мл',
        validators=[MinValueValidator(Decimal('0.001'))]
    )
    image = models.ImageField('Изображение', upload_to='ingredients/', blank=True)
    available = models.BooleanField('В наличии', default=True)
    stock = models.PositiveIntegerField('Количество на складе', default=0)
    created = models.DateTimeField('Создано', auto_now_add=True)
    updated = models.DateTimeField('Обновлено', auto_now=True)
    
    class Meta:
        ordering = ['name']
        verbose_name = 'Ингредиент'
        verbose_name_plural = 'Ингредиенты'
        indexes = [
            models.Index(fields=['id', 'slug']),
            models.Index(fields=['name']),
            models.Index(fields=['-created']),
        ]
    
    def __str__(self):
        return f'{self.name} ({self.category.name})'