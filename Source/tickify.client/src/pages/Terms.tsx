import { useTranslation } from 'react-i18next';

export function Terms() {
  const { t } = useTranslation();

  const sections = [
    {
      title: 'Acceptance of Terms',
      content: 'By accessing and using Tickify, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our service.'
    },
    {
      title: 'Use License',
      content: 'Permission is granted to temporarily access Tickify for personal, non-commercial use only. This license does not include: modifying or copying materials, using materials for commercial purposes, attempting to reverse engineer any software, removing copyright or proprietary notations, or transferring materials to another person.'
    },
    {
      title: 'User Accounts',
      content: 'When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding your password and for any activities or actions under your account.'
    },
    {
      title: 'Event Organizers',
      content: 'Event organizers are responsible for the accuracy of event information, ticket pricing, refund policies, and event execution. Tickify acts as a platform provider and is not liable for event cancellations, changes, or disputes between organizers and attendees.'
    },
    {
      title: 'Ticket Purchases',
      content: 'All ticket sales are subject to availability and confirmation. Prices are subject to change without notice. Payment must be made in full at the time of booking. Refund policies are determined by individual event organizers unless otherwise specified.'
    },
    {
      title: 'Payment Processing',
      content: 'We use third-party payment processors (Stripe and VNPay) to process transactions. By submitting your payment information, you agree to the terms of these payment providers. Tickify does not store your complete payment card details.'
    },
    {
      title: 'Prohibited Activities',
      content: "You may not: use the service for any illegal purpose, attempt to gain unauthorized access, interfere with the service's operation, transmit harmful code or viruses, collect user information without consent, or engage in ticket scalping or fraud."
    },
    {
      title: 'Intellectual Property',
      content: 'The service and its original content, features, and functionality are owned by Tickify and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.'
    },
    {
      title: 'Limitation of Liability',
      content: 'Tickify shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service, unauthorized access to your data, or any other matter relating to the service.'
    },
    {
      title: 'Indemnification',
      content: 'You agree to defend, indemnify, and hold harmless Tickify and its affiliates from any claims, damages, obligations, losses, liabilities, costs, or expenses arising from your violation of these Terms or your use of the service.'
    },
    {
      title: 'Termination',
      content: 'We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.'
    },
    {
      title: 'Governing Law',
      content: "These Terms shall be governed by and construed in accordance with the laws of Vietnam, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver."
    },
    {
      title: 'Changes to Terms',
      content: "We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. Continued use of the service after changes constitutes acceptance."
    },
    {
      title: 'Contact Information',
      content: 'If you have any questions about these Terms, please contact us at legal@tickify.com or through our contact page.'
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('terms.title', 'Terms of Service')}
          </h1>
          <p className="text-muted-foreground">
            {t('terms.lastUpdated', 'Last Updated: January 2024')}
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8">
          {/* Introduction */}
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground">
            {t('terms.introduction', 'Welcome to Tickify. These Terms of Service ("Terms") govern your use of our website and services. Please read them carefully.')}
          </p>

          <div className="border-t pt-8" />

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold mb-3 text-primary">
                  {index + 1}. {t(`terms.sections.${index}.title`, section.title)}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t(`terms.sections.${index}.content`, section.content)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t mt-8 pt-8" />

          {/* Footer Notice */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              {t('terms.footer', 'These terms constitute the entire agreement between you and Tickify regarding the use of our service. By using Tickify, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;
