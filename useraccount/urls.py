from django.urls import path
from useraccount import views

urlpatterns = [
    # Page rendering views
    path('homepage/', views.homepage, name='homepage'),
    path('user/login/', views.user_login, name='login'),
    path('user/signup/', views.user_signup, name='signup'),
    path('email-enter/', views.email_enter_page, name='email_enter'),
    path('verify-otp/', views.otp_verify_page, name='otp_verify'),
    path('signup-success/', views.signup_success_page, name='signup_success'),
    
    # REST API endpoints for OTP flow
    path('api/auth/send-otp/', views.api_send_otp, name='api_send_otp'),
    path('api/auth/verify-otp/', views.api_verify_otp, name='api_verify_otp'),
    path('api/auth/resend-otp/', views.api_resend_otp, name='api_resend_otp'),
    path('api/auth/complete-signup/', views.api_complete_signup, name='api_complete_signup'),
    
    # Existing REST API endpoints
    path('api/user/login/', views.api_login, name='api_login'),   
    path('api/user/signup/', views.api_signup, name='api_signup'),
    path('api/user/logout/', views.api_logout, name='api_logout'),
    path('api/user/me/', views.api_get_current_user, name='api_current_user'),
    path('api/auth/check-session/', views.api_check_session, name='api_check_session'),
    path('api/auth/csrf/', views.get_csrf_token, name='api_csrf'),

    path('forgot-password/', views.forgot_password_email_page, name='forgot_password_email'),
    path('forgot-password/otp/', views.forgot_password_otp_page, name='forgot_password_otp'),
    path('reset-password/', views.reset_password_page, name='reset_password'),
    
    # Password Reset APIs
    path('api/auth/forgot-password/send-otp/', views.api_forgot_password_send_otp, name='api_forgot_send_otp'),
    path('api/auth/forgot-password/verify-otp/', views.api_forgot_password_verify_otp, name='api_forgot_verify_otp'),
    path('api/auth/forgot-password/resend-otp/', views.api_forgot_password_resend_otp, name='api_forgot_resend_otp'),
    path('api/auth/reset-password/', views.api_reset_password, name='api_reset_password'),
]