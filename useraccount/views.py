from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.renderers import JSONRenderer, TemplateHTMLRenderer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from django.shortcuts import render, redirect
from django.utils import timezone
from datetime import timedelta
from .models import *
from .serializers import *
from .utils.email_utils import *

# ==================== PAGE RENDERING VIEWS ====================

def homepage(request):
    return render(request, 'useraccount/homepage.html')

def user_login(request):
    return render(request, 'useraccount/login.html')

def user_signup(request):
    return render(request, 'useraccount/signup.html')

def email_enter_page(request):
    """Render email entry page"""
    return render(request, 'useraccount/email_enter.html')

def otp_verify_page(request):
    """Render OTP verification page"""
    email = request.GET.get('email', '')
    return render(request, 'useraccount/otp_verify.html', {'email': email})

def signup_success_page(request):
    """Render signup success page"""
    return render(request, 'useraccount/signup_success.html')


# ==================== REST API VIEWS ====================

import logging
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_send_otp(request):
    """
    Step 1: Submit email, generate OTP, store in PendingUser
    """
    try:
        logger.info(f"api_send_otp called with data: {request.data}")
        
        serializer = EmailSubmitSerializer(data=request.data)
        
        if not serializer.is_valid():
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        logger.info(f"Processing OTP request for email: {email}")
        
        # Generate OTP
        otp = generate_otp()
        logger.info(f"Generated OTP for {email}: {otp}")
        
        # Store or update pending user
        try:
            # Delete any existing pending user
            PendingUser.objects.filter(email=email).delete()
            
            # Create new pending user
            pending_user = PendingUser.objects.create(
                email=email,
                first_name=request.data.get('first_name', ''),
                last_name=request.data.get('last_name', ''),
                password='',  # Will be set in complete signup
                otp=otp
            )
            logger.info(f"Created pending user: {pending_user.id} for {email}")
        except Exception as db_error:
            logger.error(f"Database error creating pending user: {str(db_error)}")
            return Response({
                'success': False,
                'error': 'Failed to create pending user record.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Send OTP email
        try:
            send_otp_email(email, otp)
            logger.info(f"OTP email sent to {email}")
        except Exception as e:
            logger.error(f"Email sending failed: {str(e)}")
            # Delete pending user if email fails
            pending_user.delete()
            return Response({
                'success': False,
                'error': 'Failed to send email. Please try again.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            'success': True,
            'message': 'OTP sent successfully',
            'email': email
        })
        
    except Exception as e:
        logger.error(f"Unexpected error in api_send_otp: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'An unexpected error occurred. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_verify_otp(request):
    """
    Step 2: Verify OTP
    """
    serializer = OTPVerifySerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']
    
    # Check if OTP exists and is valid
    try:
        pending_user = PendingUser.objects.get(email=email, otp=otp)
    except PendingUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Invalid OTP'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if OTP is expired (10 minutes)
    time_diff = timezone.now() - pending_user.created_at
    if time_diff > timedelta(minutes=10):
        pending_user.delete()
        return Response({
            'success': False,
            'error': 'OTP expired. Please request a new one.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Send OTP confirmed email
    send_otp_confirmed_email(email, pending_user.first_name)
    
    return Response({
        'success': True,
        'message': 'OTP verified successfully',
        'email': email
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_resend_otp(request):
    """
    Resend OTP to email
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        pending_user = PendingUser.objects.get(email=email)
    except PendingUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'No pending registration found for this email'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate new OTP
    new_otp = generate_otp()
    pending_user.otp = new_otp
    pending_user.created_at = timezone.now()  # Reset timer
    pending_user.save()
    
    # Send new OTP
    send_otp_email(email, new_otp, pending_user.first_name)
    
    return Response({
        'success': True,
        'message': 'OTP resent successfully'
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_complete_signup(request):
    """
    Step 3: Complete signup with user details and create actual user
    """
    serializer = CompleteSignupSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    # Check if pending user exists
    try:
        pending_user = PendingUser.objects.get(email=email)
    except PendingUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'No pending registration found. Please start over.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if user already exists
    if AppUser.objects.filter(email=email).exists():
        pending_user.delete()
        return Response({
            'success': False,
            'error': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Create actual user
    user = AppUser(
        email=email,
        first_name=serializer.validated_data['first_name'],
        last_name=serializer.validated_data['last_name']
    )
    user.set_password(serializer.validated_data['password'])
    user.save()
    
    # Send welcome email
    send_welcome_complete_email(user)
    
    # Delete pending user
    pending_user.delete()
    
    # Set session for auto-login
    request.session['app_user_id'] = user.id
    request.session['app_user_email'] = user.email
    request.session['app_user_first_name'] = user.first_name
    request.session['app_user_last_name'] = user.last_name
    
    return Response({
        'success': True,
        'message': 'Account created successfully',
        'user': {
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': f"{user.first_name} {user.last_name}".strip(),
            'initials': f"{user.first_name[0] if user.first_name else ''}{user.last_name[0] if user.last_name else ''}"
        }
    })


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_signup(request):
    """
    REST API endpoint for user registration (direct signup)
    """
    serializer = AppUserSignupSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Set user session
        request.session['app_user_id'] = user.id
        request.session['app_user_email'] = user.email
        request.session['app_user_first_name'] = user.first_name
        request.session['app_user_last_name'] = user.last_name
        
        return Response({
            'success': True,
            'message': 'Account created successfully',
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_login(request):
    """
    REST API endpoint for user login
    """
    serializer = AppUserLoginSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Store comprehensive user data in session
        request.session['app_user_id'] = user.id
        request.session['app_user_email'] = user.email
        request.session['app_user_first_name'] = user.first_name
        request.session['app_user_last_name'] = user.last_name
        
        # Force session save
        request.session.save()
        
        # Set session expiry to 2 weeks
        request.session.set_expiry(1209600)  # 2 weeks in seconds
        
        return Response({
            'success': True,
            'message': 'Logged in successfully',
            'user': {
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'full_name': f"{user.first_name} {user.last_name}".strip(),
                'initials': f"{user.first_name[0] if user.first_name else ''}{user.last_name[0] if user.last_name else ''}"
            }
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
def api_logout(request):
    """
    REST API endpoint for user logout
    """
    request.session.flush()
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
def api_check_session(request):
    """
    REST API endpoint to check if user is authenticated
    """
    if request.session.get('app_user_id'):
        return Response({
            'authenticated': True,
            'user': {
                'id': request.session.get('app_user_id'),
                'email': request.session.get('app_user_email')
            }
        })
    
    return Response({
        'authenticated': False
    }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@ensure_csrf_cookie
def get_csrf_token(request):
    """
    View to set CSRF cookie
    """
    return Response({'csrfToken': get_token(request)})


from rest_framework.permissions import IsAuthenticated
from .authentication import AppUserSessionAuthentication  # Import your custom auth

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def api_get_current_user(request):
    """
    REST API endpoint to get current logged-in user data
    """
    user = request.user  # This comes from your custom authentication
    
    return Response({
        'authenticated': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'initials': f"{user.first_name[0] if user.first_name else ''}{user.last_name[0] if user.last_name else ''}",
            'full_name': f"{user.first_name} {user.last_name}".strip()
        }
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def api_logout(request):
    """REST API endpoint for user logout"""
    request.session.flush()
    return Response({
        'success': True,
        'message': 'Logged out successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def api_check_session(request):
    """REST API endpoint to check if user is authenticated"""
    return Response({
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'email': request.user.email
        }
    })

# ==================== PASSWORD RESET PAGE RENDERING VIEWS ====================

def forgot_password_email_page(request):
    """Render forgot password email entry page"""
    return render(request, 'useraccount/forgot_password_email.html')

def forgot_password_otp_page(request):
    """Render forgot password OTP verification page"""
    email = request.GET.get('email', '')
    return render(request, 'useraccount/forgot_password_otp.html', {'email': email})

def reset_password_page(request):
    """Render reset password page"""
    email = request.GET.get('email', '')
    return render(request, 'useraccount/reset_password.html', {'email': email})

# ==================== PASSWORD RESET API VIEWS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_forgot_password_send_otp(request):
    """
    Send OTP for password reset
    """
    try:
        serializer = ForgotPasswordEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        
        # Get user to fetch first_name
        user = AppUser.objects.get(email=email)
        
        # Generate OTP
        otp = generate_otp()
        
        # Delete any existing password reset for this email
        PasswordReset.objects.filter(email=email, is_used=False).delete()
        
        # Create new password reset record
        password_reset = PasswordReset.objects.create(
            email=email,
            otp=otp
        )
        
        # Send OTP email
        send_password_reset_otp(email, otp, user.first_name)
        
        return Response({
            'success': True,
            'message': 'Reset code sent successfully',
            'email': email
        })
        
    except AppUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'No account found with this email'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error in forgot password send OTP: {str(e)}", exc_info=True)
        return Response({
            'success': False,
            'error': 'Failed to send reset code'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_forgot_password_verify_otp(request):
    """
    Verify OTP for password reset
    """
    logger.info(f"Verify OTP called with data: {request.data}")
    
    serializer = ForgotPasswordOTPSerializer(data=request.data)
    
    if not serializer.is_valid():
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    otp = serializer.validated_data['otp']
    
    logger.info(f"Verifying OTP for email: {email}, OTP: {otp}")
    
    try:
        # Find valid password reset record
        password_reset = PasswordReset.objects.get(
            email=email,
            otp=otp,
            is_used=False
        )
        
        logger.info(f"Found password reset record: {password_reset}")
        
        # Check if expired (10 minutes)
        time_diff = timezone.now() - password_reset.created_at
        logger.info(f"Time difference: {time_diff.total_seconds()} seconds")
        
        if time_diff > timedelta(minutes=10):
            logger.info(f"OTP expired, deleting record")
            password_reset.delete()
            return Response({
                'success': False,
                'error': 'Code expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'success': True,
            'message': 'Code verified successfully',
            'email': email
        })
        
    except PasswordReset.DoesNotExist:
        logger.error(f"No password reset record found for email: {email}, OTP: {otp}")
        # Check if any record exists for this email
        existing = PasswordReset.objects.filter(email=email)
        if existing.exists():
            logger.error(f"Existing records for {email}: {list(existing.values())}")
        return Response({
            'success': False,
            'error': 'Invalid verification code'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_forgot_password_resend_otp(request):
    """
    Resend OTP for password reset
    """
    email = request.data.get('email')
    
    if not email:
        return Response({
            'success': False,
            'error': 'Email is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = AppUser.objects.get(email=email)
        
        # Delete old OTP
        PasswordReset.objects.filter(email=email, is_used=False).delete()
        
        # Generate new OTP
        new_otp = generate_otp()
        
        # Create new record
        password_reset = PasswordReset.objects.create(
            email=email,
            otp=new_otp
        )
        
        # Send email
        send_password_reset_otp(email, new_otp, user.first_name)
        
        return Response({
            'success': True,
            'message': 'New code sent successfully'
        })
        
    except AppUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'No account found with this email'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@renderer_classes([JSONRenderer])
def api_reset_password(request):
    """
    Reset password after OTP verification
    """
    serializer = ResetPasswordSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    
    try:
        # Check if there's a verified OTP (optional - you can track this in session)
        user = AppUser.objects.get(email=email)
        
        # Update password
        user.set_password(serializer.validated_data['password'])
        user.save()
        
        # Mark all password reset records as used
        PasswordReset.objects.filter(email=email, is_used=False).update(is_used=True)
        
        # Send success email
        send_password_reset_success(email, user.first_name)
        
        return Response({
            'success': True,
            'message': 'Password reset successfully'
        })
        
    except AppUser.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Account not found'
        }, status=status.HTTP_400_BAD_REQUEST)