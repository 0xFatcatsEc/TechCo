from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)

urlpatterns = [
    # Router-based
    path('', include(router.urls)),

    # Auth
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/profile/<int:user_id>/', views.profile, name='profile'),
    path('auth/delete/<int:user_id>/', views.delete_account, name='delete-account'),
    path('auth/change-password/<int:user_id>/', views.change_password, name='change-password'),

    # Cart
    path('cart/<int:user_id>/', views.get_cart, name='get-cart'),
    path('cart/<int:user_id>/add/', views.add_to_cart, name='add-to-cart'),
    path('cart/<int:user_id>/update/<int:item_id>/', views.update_cart_item, name='update-cart-item'),
    path('cart/<int:user_id>/remove/<int:item_id>/', views.remove_cart_item, name='remove-cart-item'),
    path('cart/<int:user_id>/clear/', views.clear_cart, name='clear-cart'),

    # Orders
    path('orders/<int:user_id>/', views.get_orders, name='get-orders'),
    path('orders/<int:user_id>/checkout/', views.checkout, name='checkout'),

    # Support
    path('support/', views.create_support_ticket, name='create-support-ticket'),
]
