from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'name',
        'category',
        'quantity',
        'price',
        'low_stock_threshold',
        'is_low_stock_display',
        'created_at',
    )
    list_filter = ('category', 'created_at')
    search_fields = ('name', 'category', 'description')
    ordering = ('-created_at',)
    readonly_fields = ('created_at',)

    @admin.display(description='Low Stock Alert', boolean=True)
    def is_low_stock_display(self, obj):
        return obj.quantity <= obj.low_stock_threshold
