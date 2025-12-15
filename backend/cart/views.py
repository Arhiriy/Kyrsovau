from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from products.models import Ingredient
from .cart import Cart

@api_view(['GET'])
def cart_detail(request):
    cart = Cart(request)
    return Response({
        'items': list(cart),
        'total_price': cart.get_total_price()
    })

@api_view(['POST'])
def cart_add(request, ingredient_id):
    cart = Cart(request)
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    
    quantity = request.data.get('quantity', 1)
    cart.add(ingredient, quantity)
    
    return Response({'success': True})

@api_view(['DELETE'])
def cart_remove(request, ingredient_id):
    cart = Cart(request)
    ingredient = get_object_or_404(Ingredient, id=ingredient_id)
    cart.remove(ingredient)
    
    return Response({'success': True})

@api_view(['DELETE'])
def cart_clear(request):
    cart = Cart(request)
    cart.clear()
    
    return Response({'success': True})