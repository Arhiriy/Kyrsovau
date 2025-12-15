from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _

class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField('Телефон', max_length=20, blank=True)
    address = models.TextField('Адрес', blank=True)
    
    class Meta:
        verbose_name = 'Пользователь'
        verbose_name_plural = 'Пользователи'
    
    def __str__(self):
        return self.email

class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='Пользователь'
    )
    date_of_birth = models.DateField('Дата рождения', blank=True, null=True)
    photo = models.ImageField('Фото', upload_to='users/%Y/%m/%d/', blank=True)
    newsletter_subscription = models.BooleanField('Подписка на новости', default=True)
    created = models.DateTimeField('Создан', auto_now_add=True)
    updated = models.DateTimeField('Обновлен', auto_now=True)
    
    class Meta:
        verbose_name = 'Профиль'
        verbose_name_plural = 'Профили'
    
    def __str__(self):
        return f'Профиль {self.user.username}'