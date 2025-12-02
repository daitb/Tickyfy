import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Home, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';

interface ErrorProps {
  errorCode?: number;
  errorMessage?: string;
}

export function Error({ errorCode, errorMessage }: ErrorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy error code từ URL params hoặc props
  const code = errorCode || parseInt(new URLSearchParams(location.search).get('code') || '500');
  const message = errorMessage || new URLSearchParams(location.search).get('message') || '';

  const getErrorDetails = () => {
    switch (code) {
      case 403:
        return {
          title: t('error.403.title', 'Access Forbidden'),
          description: t('error.403.description', 'You don\'t have permission to access this resource. Please contact support if you believe this is an error.'),
          icon: <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-orange-600" />
        };
      case 404:
        return {
          title: t('error.404.title', 'Page Not Found'),
          description: t('error.404.description', 'The page you are looking for doesn\'t exist or has been moved.'),
          icon: <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-blue-600" />
        };
      case 500:
        return {
          title: t('error.500.title', 'Server Error'),
          description: t('error.500.description', 'Something went wrong on our end. We\'re working to fix the issue. Please try again later.'),
          icon: <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-red-600" />
        };
      case 503:
        return {
          title: t('error.503.title', 'Service Unavailable'),
          description: t('error.503.description', 'Our service is temporarily unavailable due to maintenance. Please check back soon.'),
          icon: <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-yellow-600" />
        };
      default:
        return {
          title: t('error.generic.title', 'An Error Occurred'),
          description: message || t('error.generic.description', 'Something went wrong. Please try again or contact support if the problem persists.'),
          icon: <AlertTriangle className="w-24 h-24 md:w-32 md:h-32 text-red-600" />
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card rounded-lg border shadow-lg p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            {errorDetails.icon}
          </div>

          {/* Error Code */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-primary mb-4">
            {code}
          </h1>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {errorDetails.title}
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {errorDetails.description}
          </p>

          {/* Custom Message (if provided) */}
          {message && (
            <div className="mb-8 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground font-mono">
                {message}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="min-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('error.actions.goBack', 'Go Back')}
            </Button>
            <Button
              size="lg"
              onClick={handleGoHome}
              className="min-w-[200px]"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('error.actions.goHome', 'Go to Homepage')}
            </Button>
            {(code === 500 || code === 503) && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleRefresh}
                className="min-w-[200px]"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {t('error.actions.refresh', 'Refresh Page')}
              </Button>
            )}
          </div>

          {/* Helpful Links */}
          <div className="mb-8">
            <p className="text-muted-foreground mb-4">
              {t('error.helpfulLinks.title', 'Here are some helpful links:')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="link"
                onClick={() => navigate('/faq')}
              >
                {t('error.helpfulLinks.faq', 'FAQ')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/contact')}
              >
                {t('error.helpfulLinks.contact', 'Contact Support')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/help-center')}
              >
                {t('error.helpfulLinks.helpCenter', 'Help Center')}
              </Button>
            </div>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              {t('error.help', 'If you believe this is a mistake or need assistance, please')}{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/contact')}
              >
                {t('error.contactUs', 'contact our support team')}
              </Button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Error;

