import { useState } from 'react';
import { Mail, ArrowLeft, Ticket } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { authService } from '../services/authService';

interface ForgotPasswordProps {
  onNavigate: (page: string) => void;
}

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await authService.forgotPassword(email);
      setIsEmailSent(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0] || 
                          err.message || 
                          t('auth.forgotPasswordError') || 
                          'Failed to send reset link. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <span className="text-xl text-neutral-900">Tickify</span>
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 md:p-8">
            {!isEmailSent ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-neutral-900 mb-2">{t('auth.forgotPasswordTitle')}</h1>
                  <p className="text-sm text-neutral-600">
                    {t('auth.forgotPasswordSubtitle')}
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? t('auth.sending') : t('auth.sendResetLink')}
                  </Button>

                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="w-full flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors"
                  >
                    <ArrowLeft size={16} />
                    {t('auth.backToLogin')}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <h1 className="text-neutral-900 mb-2">{t('auth.checkYourEmail')}</h1>
                  <p className="text-sm text-neutral-600 mb-8">
                    {t('auth.resetLinkSent')}<br />
                    <span className="text-neutral-900">{email}</span>
                  </p>

                  <div className="space-y-3">
                    <Button
                      onClick={() => onNavigate('login')}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      {t('auth.backToSignIn')}
                    </Button>

                    <p className="text-sm text-neutral-600">
                      {t('auth.didntReceive')}{' '}
                      <button
                        onClick={() => setIsEmailSent(false)}
                        className="text-orange-500 hover:text-orange-600 transition-colors"
                      >
                        {t('auth.clickToResend')}
                      </button>
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
