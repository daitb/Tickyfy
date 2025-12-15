import { Ticket, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleNavigate = (page: string) => {
    navigate(`/${page}`);
  };

  return (
    <footer className="bg-neutral-900 text-neutral-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Ticket className="text-white" size={20} />
              </div>
              <span className="text-xl text-white">Tickify</span>
            </div>
            <p className="text-sm text-neutral-400">
              {t('footer.description')}
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigate('about')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.aboutUs')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('privacy')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.privacyPolicy')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('terms')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.termsOfService')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('refund-policy')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.refundPolicy')}
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white mb-4">{t('footer.support')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigate('faq')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.faq')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('contact')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.contactUs')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('for-organizers')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.forOrganizers')}
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('help-center')} className="hover:text-orange-500 transition-colors text-left">
                  {t('footer.helpCenter')}
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white mb-4">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail size={16} />
                <span>support@tickify.vn</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} />
                <span>1900 xxxx</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                <span>Ho Chi Minh City, Vietnam</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 mt-8 pt-8 text-sm text-neutral-400 text-center">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
