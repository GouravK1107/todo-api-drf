from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from .models import AppUser

class AppUserSessionAuthentication(BaseAuthentication):
    """
    Custom authentication class that authenticates based on session data
    """
    def authenticate(self, request):
        # Get the user ID from session
        user_id = request.session.get('app_user_id')
        
        if not user_id:
            # No user ID in session - not authenticated
            return None
        
        try:
            # Fetch the user from your custom model
            user = AppUser.objects.get(id=user_id)
            return (user, None)
        except AppUser.DoesNotExist:
            # User doesn't exist - clear invalid session
            request.session.flush()
            return None
    
    def authenticate_header(self, request):
        return 'Session'