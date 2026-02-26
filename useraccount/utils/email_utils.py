import random
import string
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
import logging

logger = logging.getLogger(__name__)

def generate_otp(length=6):
    """Generate a numeric OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

def send_otp_email(email, otp, first_name=None):
    """Send OTP verification email"""
    try:
        context = {
            'email': email,
            'first_name': first_name or 'there',
            'otp': list(str(otp)),  # Convert to list for template iteration
            'year': timezone.now().year,
        }
        
        logger.info(f"Rendering email template for {email}")
        # Fixed path: add 'useraccount/' prefix
        html_message = render_to_string('useraccount/emails/otp_send.html', context)
        
        logger.info(f"Sending email to {email}")
        send_mail(
            subject='Your Tasko Verification Code',
            message='',  # Plain text version
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Email sent successfully to {email}")
        return True
    except Exception as e:
        logger.error(f"Error in send_otp_email: {str(e)}", exc_info=True)
        raise

def send_otp_confirmed_email(email, first_name=None):
    """Send email when OTP is successfully verified"""
    try:
        context = {
            'email': email,
            'first_name': first_name or 'there',
            'verified_date': timezone.now().strftime('%B %d, %Y'),
            'year': timezone.now().year,
        }
        
        # Fixed path: add 'useraccount/' prefix
        html_message = render_to_string('useraccount/emails/otp_confirmed.html', context)
        
        send_mail(
            subject='Tasko: Email Verified Successfully',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"OTP confirmed email sent to {email}")
    except Exception as e:
        logger.error(f"Error in send_otp_confirmed_email: {str(e)}", exc_info=True)
        raise

def send_welcome_complete_email(user):
    """Send welcome email after account creation"""
    try:
        context = {
            'email': user.email,
            'first_name': user.first_name,
            'full_name': f"{user.first_name} {user.last_name}".strip(),
            'initials': f"{user.first_name[0] if user.first_name else ''}{user.last_name[0] if user.last_name else ''}",
            'join_date': user.date_joined.strftime('%B %d, %Y'),
            'dashboard_url': f"/tasko/main_app/dashboard/",
            'year': timezone.now().year,
        }
        
        # Fixed path: add 'useraccount/' prefix
        html_message = render_to_string('useraccount/emails/welcome_complete.html', context)
        
        send_mail(
            subject='Welcome to Tasko! Your Account is Ready 🎉',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Welcome email sent to {user.email}")
    except Exception as e:
        logger.error(f"Error in send_welcome_complete_email: {str(e)}", exc_info=True)
        raise

# Passward reset

def send_password_reset_otp(email, otp, first_name=None):
    """Send password reset OTP email"""
    try:
        context = {
            'email': email,
            'first_name': first_name or 'there',
            'otp': list(str(otp)),
            'year': timezone.now().year,
        }
        
        html_message = render_to_string('useraccount/emails/password_reset_otp.html', context)
        
        send_mail(
            subject='Reset Your Tasko Password',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Password reset OTP sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Error sending password reset OTP: {str(e)}", exc_info=True)
        raise

def send_password_reset_success(email, first_name=None):
    """Send password reset success email"""
    try:
        context = {
            'email': email,
            'first_name': first_name or 'there',
            'login_url': f"{settings.BASE_URL}/useraccounts/user/login/",
            'year': timezone.now().year,
        }
        
        html_message = render_to_string('useraccount/emails/password_reset_success.html', context)
        
        send_mail(
            subject='Your Tasko Password Has Been Changed',
            message='',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            html_message=html_message,
            fail_silently=False,
        )
        logger.info(f"Password reset success email sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Error sending password reset success email: {str(e)}", exc_info=True)
        raise