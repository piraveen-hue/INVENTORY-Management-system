from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django.db.models import Q
from .models import Product
from .serializers import ProductSerializer

class ProductViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows products to be viewed, created, edited, searched, or deleted.
    Supports:
      - GET /api/products/
      - POST /api/products/
      - GET /api/products/{id}/
      - PUT /api/products/{id}/
      - PATCH /api/products/{id}/
      - DELETE /api/products/{id}/
      - GET /api/products/?search=xyz (case-insensitive partial match on name)
      - GET /api/products/?category=xyz (exact match on category)
    """
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all().order_by('-created_at')
        
        # Search by product name (case-insensitive, partial match)
        search_query = self.request.query_params.get('search', None)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query.strip()) |
                Q(description__icontains=search_query.strip())
            )

        # Filter by category (exact match, case-insensitive match for robust UX)
        category_query = self.request.query_params.get('category', None)
        if category_query and category_query.strip() and category_query.lower() != 'all':
            queryset = queryset.filter(category__iexact=category_query.strip())

        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if serializer.is_valid():
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": f"Product '{instance.name}' deleted successfully."},
            status=status.HTTP_200_OK
        )
