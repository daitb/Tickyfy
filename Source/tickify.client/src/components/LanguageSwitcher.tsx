import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'en' ? 'vi' : 'en';
    await i18n.changeLanguage(newLang);
    // Force re-render by dispatching a custom event
    window.dispatchEvent(new Event('language-changed'));
  };

  // Get current language display name
  const getLanguageName = () => {
    return i18n.language === 'en' ? 'EN' : 'VI';
  };

  return (
    <button
      onClick={toggleLanguage}
      className="cursor-pointer flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
      title={i18n.language === 'en' ? 'Chuyển sang tiếng Việt' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="uppercase">{getLanguageName()}</span>
    </button>
  );
};

export default LanguageSwitcher;
