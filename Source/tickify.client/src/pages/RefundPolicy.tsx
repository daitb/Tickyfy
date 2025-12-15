import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { FileText, HelpCircle, Mail, Shield } from 'lucide-react';

export function RefundPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sections = [
    {
      title: 'General Refund Policy',
      content: 'Tickify provides a platform for event organizers to sell tickets. Refund policies are primarily determined by individual event organizers. However, we have established baseline policies to protect both organizers and attendees.'
    },
    {
      title: 'Refund Eligibility',
      content: 'Tickets are generally eligible for refund if: the event is cancelled by the organizer, the event is postponed and you cannot attend the new date, you request a refund at least 7 days before the event (subject to organizer\'s policy), there is a technical error on our platform that prevents you from attending, or the event description was significantly misleading. Refunds are not available for: tickets purchased less than 7 days before the event (unless event is cancelled), tickets for events that have already occurred, tickets transferred to another person, or tickets purchased with promotional codes that specify "no refunds".'
    },
    {
      title: 'Requesting a Refund',
      content: 'To request a refund: log into your Tickify account, navigate to "My Tickets", select the ticket you wish to refund, click "Request Refund", provide a reason for the refund request, and submit. You will receive an email confirmation of your request. Refund requests are typically reviewed within 2-3 business days.'
    },
    {
      title: 'Refund Processing Time',
      content: 'Once your refund is approved: refunds are processed within 5-10 business days, refunds are issued to the original payment method used, if the original payment method is no longer available, we will contact you for alternative arrangements, and you will receive an email notification when the refund is processed.'
    },
    {
      title: 'Event Cancellations',
      content: 'If an event is cancelled by the organizer: you will receive a full automatic refund, no action is required on your part, refunds are processed within 5-7 business days, and you will be notified via email about the cancellation and refund status.'
    },
    {
      title: 'Event Postponements',
      content: 'If an event is postponed: you can choose to keep your ticket for the new date, request a full refund if you cannot attend the new date, or transfer your ticket to someone else. Refund requests for postponed events must be submitted within 14 days of the postponement announcement.'
    },
    {
      title: 'Partial Refunds',
      content: 'Partial refunds may be available in certain circumstances: if only part of a multi-day event is cancelled, if you purchased a package but only want to refund specific tickets, or if there are service fees that can be refunded separately. Contact our support team for partial refund requests.'
    },
    {
      title: 'Service Fees',
      content: 'Service fees charged by Tickify are generally non-refundable unless: the event is cancelled, there is a technical error on our platform, or required by law. However, if you receive a full ticket refund, associated service fees may also be refunded at our discretion.'
    },
    {
      title: 'Disputes and Appeals',
      content: 'If your refund request is denied: you can appeal the decision by contacting our support team, provide additional information or documentation to support your case, our team will review your appeal within 5 business days, and we will work with both you and the organizer to find a fair resolution.'
    },
    {
      title: 'Organizer Refund Policies',
      content: 'Event organizers may set their own refund policies that are more lenient than our baseline policy. Always check the specific refund policy listed on the event page before purchasing tickets. Organizer policies cannot be less favorable than our minimum standards.'
    },
    {
      title: 'Chargebacks',
      content: 'We strongly discourage chargebacks as they can result in additional fees and complications. If you have an issue with a purchase, please contact our support team first. We are committed to resolving issues fairly and promptly. Chargebacks may result in account suspension.'
    },
    {
      title: 'Contact for Refunds',
      content: 'For refund-related questions or assistance, please contact us at: Email: refunds@tickify.com, Phone: +84 123 456 789, or through our Contact page. Our refund support team is available Monday-Friday, 9 AM - 6 PM.'
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('refundPolicy.title', 'Refund Policy')}
          </h1>
          <p className="text-muted-foreground">
            {t('refundPolicy.lastUpdated', 'Last Updated: January 2024')}
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8">
          {/* Introduction */}
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground">
            {t('refundPolicy.introduction', 'At Tickify, we understand that plans can change. This Refund Policy outlines the terms and conditions for ticket refunds on our platform. Please read this policy carefully before purchasing tickets.')}
          </p>

          <div className="border-t pt-8" />

          {/* Policy Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold mb-3 text-primary">
                  {index + 1}. {t(`refundPolicy.sections.${index}.title`, section.title)}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t(`refundPolicy.sections.${index}.content`, section.content)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t mt-8 pt-8" />

          {/* Related Links */}
          <div className="mt-8 p-6 bg-muted rounded-lg">
            <h3 className="text-lg font-bold mb-4">
              {t('refundPolicy.relatedLinks.title', 'Related Information')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/terms')}
                className="justify-start"
              >
                <FileText className="w-4 h-4 mr-2" />
                {t('refundPolicy.relatedLinks.terms', 'Terms of Service')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/privacy')}
                className="justify-start"
              >
                <Shield className="w-4 h-4 mr-2" />
                {t('refundPolicy.relatedLinks.privacy', 'Privacy Policy')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/help-center')}
                className="justify-start"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                {t('refundPolicy.relatedLinks.helpCenter', 'Help Center')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/contact')}
                className="justify-start"
              >
                <Mail className="w-4 h-4 mr-2" />
                {t('refundPolicy.relatedLinks.contact', 'Contact Us')}
              </Button>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              {t('refundPolicy.footer', 'This refund policy is subject to change. We recommend reviewing it periodically. By purchasing tickets through Tickify, you acknowledge that you have read and understood this Refund Policy.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RefundPolicy;

