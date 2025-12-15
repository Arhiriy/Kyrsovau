from decimal import Decimal
from django.conf import settings
from products.models import Ingredient

class Cart:
    def __init__(self, request):
        self.session = request.session
        cart = self.session.get(settings.CART_SESSION_ID)
        if not cart:
            cart = self.session[settings.CART_SESSION_ID] = {}
        self.cart = cart
    
    def add(self, ingredient, quantity=1, override_quantity=False):
        ingredient_id = str(ingredient.id)
        if ingredient_id not in self.cart:
            self.cart[ingredient_id] = {
                'quantity': 0,
                'price': str(ingredient.price)
            }
        
        if override_quantity:
            self.cart[ingredient_id]['quantity'] = quantity
        else:
            self.cart[ingredient_id]['quantity'] += quantity
        
        self.save()
    
    def save(self):
        self.session.modified = True
    
    def remove(self, ingredient):
        ingredient_id = str(ingredient.id)
        if ingredient_id in self.cart:
            del self.cart[ingredient_id]
            self.save()
    
    def __iter__(self):
        ingredient_ids = self.cart.keys()
        ingredients = Ingredient.objects.filter(id__in=ingredient_ids)
        cart = self.cart.copy()
        
        for ingredient in ingredients:
            cart[str(ingredient.id)]['ingredient'] = ingredient
        
        for item in cart.values():
            item['price'] = Decimal(item['price'])
            item['total_price'] = item['price'] * item['quantity']
            yield item
    
    def __len__(self):
        return sum(item['quantity'] for item in self.cart.values())
    
    def get_total_price(self):
        return sum(
            Decimal(item['price']) * item['quantity']
            for item in self.cart.values()
        )
    
    def clear(self):
        del self.session[settings.CART_SESSION_ID]
        self.save()