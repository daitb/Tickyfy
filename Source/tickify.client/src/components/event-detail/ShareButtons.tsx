import { Facebook, Twitter, Linkedin, Mail, Link, MessageCircle } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  eventTitle: string;
  eventUrl: string;
}

export default function ShareButtons({ eventTitle, eventUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const shareText = `Check out ${eventTitle} on Tickify!`;

  const shareLinks = [
    {
      name: 'Facebook',
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`,
      color: 'hover:bg-blue-600'
    },
    {
      name: 'Twitter',
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(eventUrl)}`,
      color: 'hover:bg-sky-500'
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}`,
      color: 'hover:bg-blue-700'
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + eventUrl)}`,
      color: 'hover:bg-green-600'
    },
    {
      name: 'Email',
      icon: Mail,
      url: `mailto:?subject=${encodeURIComponent(eventTitle)}&body=${encodeURIComponent(shareText + '\n\n' + eventUrl)}`,
      color: 'hover:bg-gray-700'
    }
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-64">
      <div className="text-gray-900 mb-3">Share this event</div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {shareLinks.map((link) => {
          const Icon = link.icon;
          return (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-2 p-3 bg-gray-100 rounded-lg transition-colors ${link.color} hover:text-white`}
              title={link.name}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{link.name}</span>
            </a>
          );
        })}
      </div>
      <button
        onClick={copyToClipboard}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <Link className="w-4 h-4" />
        <span className="text-sm">{copied ? 'Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
}
