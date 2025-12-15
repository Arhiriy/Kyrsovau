from rest_framework import serializers
from .models import Order, OrderItem

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['ingredient', 'price', 'quantity']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'first_name', 'last_name', 'email',
            'address', 'postal_code', 'city', 'phone',
            'status', 'paid', 'created', 'updated', 'items'
        ]
        read_only_fields = ['status', 'paid', 'created', 'updated', 'items']