# Models for API Endpoints

from django.db import models
from django.contrib.auth.hashers import make_password, check_password as django_check_password


class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    email = models.CharField(max_length=100, unique=True)
    password_hash = models.TextField()
    full_name = models.CharField(max_length=100, blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='n/a')
    country = models.CharField(max_length=100, blank=True, default='n/a')
    city = models.CharField(max_length=100, blank=True, default='n/a')
    address = models.TextField(blank=True, default='n/a')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return django_check_password(raw_password, self.password_hash)

    def __str__(self):
        return self.username


class Product(models.Model):
    product_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=50)
    brand = models.CharField(max_length=50, blank=True, default='')
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)
    image_url = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name


class CartItem(models.Model):
    cart_item_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='cart_items')
    product_name = models.CharField(max_length=150)
    product_category = models.CharField(max_length=50, blank=True, default='')
    product_image = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'cart_items'

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class Order(models.Model):
    order_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_date = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending')
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping_address = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'orders'

    def __str__(self):
        return f"Order #{self.order_id}"


class OrderItem(models.Model):
    order_item_id = models.AutoField(primary_key=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=150)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"{self.product_name} x{self.quantity}"


class SupportTicket(models.Model):
    ticket_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    name = models.CharField(max_length=100, blank=True, default='')
    email = models.CharField(max_length=100, blank=True, default='')
    subject = models.CharField(max_length=150, blank=True, default='')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, default='open')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'support_tickets'

    def __str__(self):
        return self.subject