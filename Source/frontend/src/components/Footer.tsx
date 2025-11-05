import { Ticket, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
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
                <a href="#" className="hover:text-orange-500 transition-colors">About Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Refund Policy</a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">FAQ</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Contact Us</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">For Organizers</a>
              </li>
              <li>
                <a href="#" className="hover:text-orange-500 transition-colors">Help Center</a>
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
