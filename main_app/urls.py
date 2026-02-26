from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'tasks', views.TaskViewSet, basename='task')
router.register(r'notifications', views.NotificationViewSet, basename='notification')  # Remove projects

urlpatterns = [
    # Page rendering view
    path('dashboard/', views.dashboard, name='dashboard'),  
    # API endpoints (via router)
    path('api/', include(router.urls)),
    
    # Additional API endpoints
    path('api/stats/', views.task_stats, name='task_stats'),
    path('api/dashboard-stats/', views.get_dashboard_stats, name='dashboard_stats'),
    path('api/bulk-operations/', views.bulk_task_operations, name='bulk_operations'),
]