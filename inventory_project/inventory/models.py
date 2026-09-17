from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal

class Product(models.Model):
    """
    Product Model representing items in the Inventory Management System.
    """
    name = models.CharField(
        max_length=200, 
        unique=True, 
        help_text="Unique name of the product"
    )
    category = models.CharField(
        max_length=100, 
        help_text="Category of the product"
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(0)], 
        help_text="Current stock quantity (must be >= 0)"
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.00'))], 
        help_text="Unit price of the product (must be >= 0)"
    )
    low_stock_threshold = models.IntegerField(
        default=10, 
        validators=[MinValueValidator(0)], 
        help_text="Threshold below which item is flagged as low stock"
    )
    description = models.TextField(
        blank=True, 
        null=True, 
        help_text="Optional detailed description"
    )
    created_at = models.DateTimeField(
        auto_now_add=True, 
        help_text="Timestamp when the product was added"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Product'
        verbose_name_plural = 'Products'

    def __str__(self):
        return f"{self.name} ({self.category}) - Stock: {self.quantity}"

    @property
    def is_low_stock(self):
        return self.quantity <= self.low_stock_threshold
