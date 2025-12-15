from rest_framework import serializers
from .models import Review
from users.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'ingredient', 'rating', 'comment', 'created', 'updated']
        read_only_fields = ['user', 'created', 'updated']
    
    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)