import { Ticket, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Footer() {
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
              Your trusted platform for discovering and booking events across Vietnam.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigate('about')} className="hover:text-orange-500 transition-colors text-left">
                  About Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('privacy')} className="hover:text-orange-500 transition-colors text-left">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('terms')} className="hover:text-orange-500 transition-colors text-left">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('refund-policy')} className="hover:text-orange-500 transition-colors text-left">
                  Refund Policy
                </button>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button onClick={() => handleNavigate('faq')} className="hover:text-orange-500 transition-colors text-left">
                  FAQ
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('contact')} className="hover:text-orange-500 transition-colors text-left">
                  Contact Us
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('for-organizers')} className="hover:text-orange-500 transition-colors text-left">
                  For Organizers
                </button>
              </li>
              <li>
                <button onClick={() => handleNavigate('help-center')} className="hover:text-orange-500 transition-colors text-left">
                  Help Center
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white mb-4">Contact</h4>
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
          <p>&copy; 2025 Tickify. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
