from django.shortcuts import render, redirect
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count
from rest_framework import viewsets, status, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, Notification  # Remove Project from imports
from .serializers import (
    TaskSerializer, NotificationSerializer  # Remove ProjectSerializer
)
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# PAGE RENDERING VIEW
# =============================================================================

def dashboard(request):
    """Render the main dashboard page"""
    user_id = request.session.get('app_user_id')
    
    if not user_id:
        return redirect('login')
    
    return render(request, 'main_app/dashboard.html')
# =============================================================================
# TASK VIEWSET
# =============================================================================

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint for Task CRUD operations.
    """
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'desc']
    ordering_fields = ['date', 'priority', 'title', 'created_at']
    
    def get_queryset(self):
        """Filter tasks by current user"""
        user = self.request.user
        logger.info(f"Fetching tasks for user: {user.email}")
        
        queryset = Task.objects.filter(user=user)
        
        # Apply filters from query params
        project = self.request.query_params.get('project')
        priority = self.request.query_params.get('priority')
        done = self.request.query_params.get('done')
        important = self.request.query_params.get('important')
        
        if project:
            # Project is a string, not an ID
            queryset = queryset.filter(project=project)
        if priority and priority != 'all':
            queryset = queryset.filter(priority=priority)
        if done is not None:
            queryset = queryset.filter(done=done.lower() == 'true')
        if important is not None:
            queryset = queryset.filter(important=important.lower() == 'true')
        
        logger.info(f"Found {queryset.count()} tasks")
        return queryset
    
    def perform_create(self, serializer):
        """Set the user when creating a task"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update tasks"""
        task_ids = request.data.get('task_ids', [])
        action_type = request.data.get('action')
        
        if not task_ids or not action_type:
            return Response({
                'error': 'task_ids and action are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        tasks = Task.objects.filter(id__in=task_ids, user=request.user)
        
        if action_type == 'mark_done':
            tasks.update(done=True)
        elif action_type == 'mark_undone':
            tasks.update(done=False)
        elif action_type == 'mark_important':
            tasks.update(important=True)
        elif action_type == 'mark_unimportant':
            tasks.update(important=False)
        elif action_type == 'delete':
            tasks.delete()
            return Response({'message': f'{len(task_ids)} tasks deleted'})
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'message': f'{len(task_ids)} tasks updated'})

# =============================================================================
# NOTIFICATION VIEWSET
# =============================================================================

class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for Notification CRUD operations"""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        count = Notification.objects.filter(user=request.user, read=False).update(read=True)
        return Response({'message': f'{count} notifications marked as read'})
    
    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        """Clear all notifications"""
        count = Notification.objects.filter(user=request.user).delete()[0]
        return Response({'message': f'{count} notifications cleared'})

# =============================================================================
# ADDITIONAL API VIEWS
# =============================================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_dashboard_stats(request):
    """Get comprehensive dashboard statistics"""
    user = request.user
    
    # Get date range from query params (default: last 7 days)
    days = int(request.query_params.get('days', 7))
    start_date = timezone.now().date() - timedelta(days=days)
    
    tasks = Task.objects.filter(user=user)
    
    # Weekly progress
    weekly_tasks = tasks.filter(created_at__date__gte=start_date)
    weekly_completed = weekly_tasks.filter(done=True).count()
    weekly_total = weekly_tasks.count()
    
    # Stats by priority
    priority_stats = {
        'high': tasks.filter(priority='high').count(),
        'medium': tasks.filter(priority='medium').count(),
        'low': tasks.filter(priority='low').count(),
    }
    
    # Project stats - group by project string
    project_stats = {}
    for task in tasks:
        if task.project:
            project_stats[task.project] = project_stats.get(task.project, 0) + 1
    
    # Tasks due soon (next 3 days)
    due_soon = tasks.filter(
        done=False,
        date__gte=timezone.now().date(),
        date__lte=timezone.now().date() + timedelta(days=3)
    ).count()
    
    return Response({
        'weekly': {
            'total': weekly_total,
            'completed': weekly_completed,
            'completion_rate': round((weekly_completed / weekly_total * 100) if weekly_total > 0 else 0, 1)
        },
        'priority_stats': priority_stats,
        'project_stats': project_stats,
        'due_soon': due_soon,
        'total_overdue': tasks.filter(done=False, date__lt=timezone.now().date()).count(),
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_task_operations(request):
    """Handle bulk operations on tasks"""
    operation = request.data.get('operation')
    user = request.user
    
    if operation == 'delete_completed':
        count = Task.objects.filter(user=user, done=True).delete()[0]
        return Response({'message': f'{count} completed tasks deleted'})
    
    elif operation == 'clear_all':
        count = Task.objects.filter(user=user).delete()[0]
        return Response({'message': f'{count} tasks deleted'})
    
    elif operation == 'mark_all_done':
        count = Task.objects.filter(user=user, done=False).update(done=True)
        return Response({'message': f'{count} tasks marked as done'})
    
    return Response({'error': 'Invalid operation'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test_auth(request):
    """Test endpoint to verify authentication"""
    return Response({
        'authenticated': True,
        'user_id': request.user.id,
        'user_email': request.user.email,
        'session_id': request.session.session_key,
        'session_data': dict(request.session.items())
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def task_stats(request):
    """Get task statistics for the current user"""
    tasks = Task.objects.filter(user=request.user)
    
    total = tasks.count()
    completed = tasks.filter(done=True).count()
    pending = tasks.filter(done=False).count()
    overdue = tasks.filter(
        done=False, 
        date__lt=timezone.now().date()
    ).count()
    important = tasks.filter(important=True).count()
    
    # Project wise stats - group by project string
    project_stats = {}
    for task in tasks:
        if task.project:
            project_stats[task.project] = project_stats.get(task.project, 0) + 1
    
    return Response({
        'total_tasks': total,
        'completed_tasks': completed,
        'pending_tasks': pending,
        'overdue_tasks': overdue,
        'important_tasks': important,
        'completion_rate': round((completed / total * 100) if total > 0 else 0, 1),
        'project_stats': project_stats
    })