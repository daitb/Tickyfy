import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchX, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card rounded-lg border shadow-lg p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="mb-6 flex justify-center">
            <SearchX className="w-24 h-24 md:w-32 md:h-32 text-muted-foreground opacity-50" />
          </div>

          {/* Error Code */}
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-primary mb-4">
            404
          </h1>

          {/* Title */}
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            {t('notFound.title', 'Page Not Found')}
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t(
              'notFound.description',
              "Oops! The page you are looking for doesn't exist. It might have been moved or deleted."
            )}
          </p>

          {/* Suggestions */}
          <div className="mb-8">
            <p className="text-muted-foreground mb-4">
              {t('notFound.suggestions.title', 'Here are some helpful links:')}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant="link"
                onClick={() => navigate('/events')}
              >
                {t('notFound.suggestions.events', 'Browse Events')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/about')}
              >
                {t('notFound.suggestions.about', 'About Us')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/contact')}
              >
                {t('notFound.suggestions.contact', 'Contact Support')}
              </Button>
              <Button
                variant="link"
                onClick={() => navigate('/faq')}
              >
                {t('notFound.suggestions.faq', 'FAQ')}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              variant="outline"
              size="lg"
              onClick={handleGoBack}
              className="min-w-[200px]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('notFound.actions.goBack', 'Go Back')}
            </Button>
            <Button
              size="lg"
              onClick={handleGoHome}
              className="min-w-[200px]"
            >
              <Home className="w-4 h-4 mr-2" />
              {t('notFound.actions.goHome', 'Go to Homepage')}
            </Button>
          </div>

          {/* Additional Help */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              {t(
                'notFound.help',
                'If you believe this is a mistake or need assistance, please'
              )}{' '}
              <Button
                variant="link"
                className="p-0 h-auto font-normal"
                onClick={() => navigate('/contact')}
              >
                {t('notFound.contactUs', 'contact our support team')}
              </Button>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
