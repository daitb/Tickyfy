import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { EventPolicies } from '../types';

interface PolicyBlockProps {
  policies: EventPolicies;
  className?: string;
}

export function PolicyBlock({ policies, className = '' }: PolicyBlockProps) {
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-xl p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="text-blue-600 mt-0.5 flex-shrink-0" size={20} />
        <div>
          <h4 className="text-blue-900 mb-1">Ticket Policies</h4>
          <p className="text-sm text-blue-700">Please review before purchasing</p>
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
              {policies.refundable ? 'Refundable' : 'Non-refundable'}
            </span>
            {policies.refundable && policies.refundDeadline && (
              <span className="text-neutral-600">
                {' '}until {new Date(policies.refundDeadline).toLocaleDateString('en-US', {
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
              {policies.transferable ? 'Transferable' : 'Non-transferable'}
            </span>
            <span className="text-neutral-600">
              {' '}{policies.transferable ? 'tickets can be transferred to others' : 'tickets are bound to buyer'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={16} />
          <p className="text-xs text-blue-700">
            All tickets are official and verified. Please check your email for ticket delivery after purchase.
          </p>
        </div>
      </div>
    </div>
  );
}
