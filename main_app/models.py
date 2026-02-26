from django.db import models
from django.utils import timezone
from useraccount.models import AppUser

class Task(models.Model):
    """Main Task model matching dashboard.js structure"""
    PRIORITY_CHOICES = [
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]
    
    PROJECT_CHOICES = [
        ('work', 'Work'),
        ('personal', 'Personal'),
        ('health', 'Health'),
    ]
    
    # Core fields
    title = models.CharField(max_length=200)
    desc = models.TextField(blank=True)
    date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    done = models.BooleanField(default=False)
    important = models.BooleanField(default=False)
    
    # Project as a string field
    project = models.CharField(max_length=20, choices=PROJECT_CHOICES, blank=True, null=True)
    
    # Relationship
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='tasks')
    
    # Metadata
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.date and not self.done:
            return self.date < timezone.now().date()
        return False
    
    def save(self, *args, **kwargs):
        """Override save to track if this is a new task"""
        if not self.pk:
            # This is a new task
            self._is_new = True
        else:
            self._is_new = False
        super().save(*args, **kwargs)

class Notification(models.Model):
    """User notifications model"""
    NOTIFICATION_TYPES = [
        ('overdue', 'Task Overdue'),
        ('task_created', 'Task Created'),
        ('task_updated', 'Task Updated'),
        ('task_deleted', 'Task Deleted'),
        ('task_completed', 'Task Completed'),
        ('task_uncompleted', 'Task Uncompleted'),
        ('task_important', 'Task Marked Important'),
        ('task_unimportant', 'Task Unmarked Important'),
        ('project_assigned', 'Project Assigned'),
        ('project_changed', 'Project Changed'),
        ('due_soon', 'Due Soon'),
    ]
    
    title = models.CharField(max_length=100)
    desc = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    icon = models.CharField(max_length=10, default="🔔")
    read = models.BooleanField(default=False)
    user = models.ForeignKey(AppUser, on_delete=models.CASCADE, related_name='notifications')
    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'read', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.email}"
    
    @property
    def time_ago(self):
        """Human readable time ago"""
        delta = timezone.now() - self.created_at
        
        if delta.days > 0:
            return f"{delta.days} day{'s' if delta.days > 1 else ''} ago"
        elif delta.seconds >= 3600:
            hours = delta.seconds // 3600
            return f"{hours} hour{'s' if hours > 1 else ''} ago"
        elif delta.seconds >= 60:
            minutes = delta.seconds // 60
            return f"{minutes} minute{'s' if minutes > 1 else ''} ago"
        else:
            return "Just now"