from rest_framework import serializers
from .models import Task, Notification  # Remove Project

class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'desc', 'date', 'priority', 
            'done', 'important', 'project', 'project_name',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user']
    
    def get_project_name(self, obj):
        # Return proper display name for project
        project_display = {
            'work': 'Work',
            'personal': 'Personal',
            'health': 'Health'
        }
        return project_display.get(obj.project, obj.project)

class NotificationSerializer(serializers.ModelSerializer):
    time = serializers.CharField(source='time_ago', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'desc', 'notification_type', 'icon', 'read', 'time', 'created_at']
        read_only_fields = ['user']