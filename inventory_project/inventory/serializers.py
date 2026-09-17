from rest_framework import serializers
from .models import Product
from decimal import Decimal

class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for the Product model with comprehensive server-side validation.
    """
    is_low_stock = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'category',
            'quantity',
            'price',
            'low_stock_threshold',
            'description',
            'created_at',
            'is_low_stock',
        ]
        read_only_fields = ['id', 'created_at', 'is_low_stock']

    def validate_name(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Product name cannot be empty.")
        trimmed = value.strip()
        # Check uniqueness on create or when name is changed on update
        instance = getattr(self, 'instance', None)
        existing = Product.objects.filter(name__iexact=trimmed)
        if instance:
            existing = existing.exclude(pk=instance.pk)
        if existing.exists():
            raise serializers.ValidationError(f"A product with the name '{trimmed}' already exists.")
        return trimmed

    def validate_category(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("Category cannot be empty.")
        return value.strip()

    def validate_quantity(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Quantity must be a positive integer or zero (>= 0).")
        return value

    def validate_price(self, value):
        if value is None or value < Decimal('0.00'):
            raise serializers.ValidationError("Price must be greater than or equal to 0.00.")
        return value

    def validate_low_stock_threshold(self, value):
        if value is None or value < 0:
            raise serializers.ValidationError("Low stock threshold must be >= 0.")
        return value
