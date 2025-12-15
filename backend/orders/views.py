from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Order, OrderItem
from .serializers import OrderSerializer
from cart.cart import Cart

@api_view(['POST'])
def order_create(request):
    cart = Cart(request)
    
    if len(cart) == 0:
        return Response({'error': 'Корзина пуста'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    serializer = OrderSerializer(data=request.data)
    if serializer.is_valid():
        order = serializer.save()
        
        # Создаем элементы заказа из корзины
        for item in cart:
            OrderItem.objects.create(
                order=order,
                ingredient=item['ingredient'],
                price=item['price'],
                quantity=item['quantity']
            )
        
        # Очищаем корзину
        cart.clear()
        
        return Response(OrderSerializer(order).data, 
                       status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return Order.objects.filter(user=self.request.user)
        return Order.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.is_authenticated:
            serializer.save(user=self.request.user)
        else:
            serializer.save()