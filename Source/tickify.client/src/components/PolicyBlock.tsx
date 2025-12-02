import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import React from 'react';
import type { EventPolicies } from '../types';
import { useTranslation } from 'react-i18next';

interface PolicyBlockProps {
  policies: EventPolicies;
  className?: string;
}

export function PolicyBlock({ policies, className = '' }: PolicyBlockProps) {
  const { t, i18n, ready } = useTranslation();
  
  // make sure i18n is ready before rendering
  if (!ready) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-xl p-6 ${className}`}>
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h4 className="text-blue-900 mb-1">{t('policy.policy', 'Ticket Policy')}</h4>
          <p className="text-sm text-blue-700">{t('policy.please', 'Please review before purchasing')}</p>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          {policies.refundable ? (
            <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
          ) : (
            <XCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
          )}
          <div className="text-sm">
            <span className="text-neutral-900">
              {policies.refundable 
                ? t('policy.Refundable', 'Refundable') 
                : t('policy.Non-refundable', 'Non-refundable')}
            </span>
            {policies.refundable && policies.refundDeadline && (
              <span className="text-neutral-600">
                {' '}{t('policy.until', 'until')} {new Date(policies.refundDeadline).toLocaleDateString(i18n.language === 'vi' ? 'vi-VN' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-3">
          {policies.transferable ? (
            <CheckCircle className="text-green-600 mt-0.5 flex-shrink-0" size={18} />
          ) : (
            <XCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
          )}
          <div className="text-sm">
            <span className="text-neutral-900">
              {policies.transferable 
                ? t('policy.Transferable', 'Transferable') 
                : t('policy.Non-transferable', 'Non-transferable')}
            </span>
            <span className="text-neutral-600">
              {' '}{policies.transferable 
                ? t('policy.text1', 'tickets can be transferred to others') 
                : t('policy.text2', 'tickets cannot be transferred to others')}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={16} />
          <p className="text-xs text-blue-700">
            {t('policy.notify', 'All tickets are official and verified. Please check your email for ticket delivery after purchase.')}
          </p>
        </div>
      </div>
    </div>
  );
}
