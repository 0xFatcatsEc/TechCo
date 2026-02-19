from rest_framework import status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import User, Product, CartItem, Order, OrderItem, SupportTicket
from .serializers import (
    RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    UserProfileSerializer,
    ProductSerializer, CartItemSerializer, AddToCartSerializer,
    OrderSerializer, OrderItemSerializer, SupportTicketSerializer
)
from decimal import Decimal


# ===== AUTH ENDPOINTS =====

@api_view(['POST'])
def register(request):
    """POST /api/auth/register/"""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'full_name': user.full_name,
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login(request):
    """POST /api/auth/login/"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'error': 'Invalid email or password'}, status=status.HTTP_401_UNAUTHORIZED)

        profile = UserProfileSerializer(user)
        return Response(profile.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
def profile(request, user_id):
    """GET/PUT /api/auth/profile/<user_id>/"""
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UserProfileSerializer(user)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UserProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def delete_account(request, user_id):
    """DELETE /api/auth/delete/<user_id>/"""
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    user.delete()
    return Response({'message': 'Account deleted'}, status=status.HTTP_200_OK)


@api_view(['PUT'])
def change_password(request, user_id):
    """PUT /api/auth/change-password/<user_id>/"""
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        if not user.check_password(serializer.validated_data['current_password']):
            return Response({'error': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password updated successfully'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ===== CART ENDPOINTS =====

@api_view(['GET'])
def get_cart(request, user_id):
    """GET /api/cart/<user_id>/"""
    items = CartItem.objects.filter(user_id=user_id).order_by('-added_at')
    serializer = CartItemSerializer(items, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def add_to_cart(request, user_id):
    """POST /api/cart/<user_id>/add/"""
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = AddToCartSerializer(data=request.data)
    if serializer.is_valid():
        product_name = serializer.validated_data['product_name']
        # Check if product already in cart
        existing = CartItem.objects.filter(user=user, product_name=product_name).first()
        if existing:
            existing.quantity += serializer.validated_data.get('quantity', 1)
            existing.save()
            return Response(CartItemSerializer(existing).data, status=status.HTTP_200_OK)
        else:
            item = CartItem.objects.create(
                user=user,
                product_name=product_name,
                product_category=serializer.validated_data.get('product_category', ''),
                product_image=serializer.validated_data.get('product_image', ''),
                price=serializer.validated_data['price'],
                quantity=serializer.validated_data.get('quantity', 1),
            )
            return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
def update_cart_item(request, user_id, item_id):
    """PUT /api/cart/<user_id>/update/<item_id>/"""
    try:
        item = CartItem.objects.get(cart_item_id=item_id, user_id=user_id)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    quantity = request.data.get('quantity', item.quantity)
    if int(quantity) <= 0:
        item.delete()
        return Response({'message': 'Item removed from cart'}, status=status.HTTP_200_OK)

    item.quantity = int(quantity)
    item.save()
    return Response(CartItemSerializer(item).data)


@api_view(['DELETE'])
def remove_cart_item(request, user_id, item_id):
    """DELETE /api/cart/<user_id>/remove/<item_id>/"""
    try:
        item = CartItem.objects.get(cart_item_id=item_id, user_id=user_id)
    except CartItem.DoesNotExist:
        return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)

    item.delete()
    return Response({'message': 'Item removed'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
def clear_cart(request, user_id):
    """DELETE /api/cart/<user_id>/clear/"""
    CartItem.objects.filter(user_id=user_id).delete()
    return Response({'message': 'Cart cleared'}, status=status.HTTP_200_OK)


# ===== ORDER ENDPOINTS =====

@api_view(['GET'])
def get_orders(request, user_id):
    """GET /api/orders/<user_id>/"""
    orders = Order.objects.filter(user_id=user_id).order_by('-order_date')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)


@api_view(['POST'])
def checkout(request, user_id):
    """POST /api/orders/<user_id>/checkout/ — creates order from cart"""
    try:
        user = User.objects.get(user_id=user_id)
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    cart_items = CartItem.objects.filter(user=user)
    if not cart_items.exists():
        return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

    # Calculate totals
    subtotal = sum(item.price * item.quantity for item in cart_items)
    tax = round(subtotal * Decimal('0.10'), 2)
    total = subtotal + tax

    # Create order
    order = Order.objects.create(
        user=user,
        subtotal=subtotal,
        tax=tax,
        total=total,
        shipping_address=user.address,
    )

    # Create order items from cart
    for item in cart_items:
        OrderItem.objects.create(
            order=order,
            product_name=item.product_name,
            quantity=item.quantity,
            price=item.price,
        )

    # Clear cart
    cart_items.delete()

    serializer = OrderSerializer(order)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


# ===== PRODUCT ENDPOINTS =====

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


# ===== SUPPORT ENDPOINTS =====

@api_view(['POST'])
def create_support_ticket(request):
    """POST /api/support/"""
    serializer = SupportTicketSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
