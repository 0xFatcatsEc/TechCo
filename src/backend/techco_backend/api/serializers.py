from rest_framework import serializers
from .models import User, Product, CartItem, Order, OrderItem, SupportTicket


# ===== AUTH =====
class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=50)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(max_length=100, required=False, default='')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken")
        return value

    def create(self, validated_data):
        user = User(
            username=validated_data['username'],
            email=validated_data['email'],
            full_name=validated_data.get('full_name', validated_data['username']),
        )
        user.set_password(validated_data['password'])
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'email', 'full_name', 'phone', 'country', 'city', 'address', 'created_at']
        read_only_fields = ['user_id', 'username', 'created_at']


# ===== PRODUCTS =====
class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'


# ===== CART =====
class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['cart_item_id', 'product_name', 'product_category', 'product_image', 'price', 'quantity', 'added_at']
        read_only_fields = ['cart_item_id', 'added_at']


class AddToCartSerializer(serializers.Serializer):
    product_name = serializers.CharField(max_length=150)
    product_category = serializers.CharField(max_length=50, required=False, default='', allow_blank=True)
    product_image = serializers.CharField(required=False, default='', allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField(required=False, default=1)


# ===== ORDERS =====
class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['order_item_id', 'product_name', 'quantity', 'price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['order_id', 'order_date', 'status', 'subtotal', 'tax', 'total', 'shipping_address', 'items']
        read_only_fields = ['order_id', 'order_date']


# ===== SUPPORT =====
class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = '__all__'
