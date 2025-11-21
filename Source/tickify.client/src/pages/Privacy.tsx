import { useTranslation } from 'react-i18next';

export function Privacy() {
  const { t } = useTranslation();

  const sections = [
    {
      title: 'Information We Collect',
      content: 'We collect information you provide directly to us, including: personal information (name, email, phone number), payment information (processed securely through third-party providers), profile information, event preferences, communication history, and device information (IP address, browser type, operating system).'
    },
    {
      title: 'How We Use Your Information',
      content: 'We use the information we collect to: provide, maintain, and improve our services, process transactions and send related information, send you technical notices and support messages, respond to your comments and questions, communicate about events, promotions, and news, monitor and analyze trends and usage, detect and prevent fraud and abuse, and personalize your experience.'
    },
    {
      title: 'Information Sharing',
      content: 'We may share your information with: event organizers (when you purchase tickets), payment processors (Stripe and VNPay), service providers who assist our operations, law enforcement when required by law, other parties with your consent, and business transferees in case of merger or acquisition. We do not sell your personal information to third parties.'
    },
    {
      title: 'Data Security',
      content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure. We use encryption for sensitive data, secure servers with firewall protection, regular security audits, and access controls for our team members.'
    },
    {
      title: 'Cookies and Tracking',
      content: 'We use cookies and similar tracking technologies to track activity on our service. Cookies are files with small amounts of data. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. We use: essential cookies for authentication, preference cookies for your settings, analytics cookies to understand usage, and marketing cookies for targeted advertising.'
    },
    {
      title: 'Your Rights and Choices',
      content: 'You have the right to: access your personal information, correct inaccurate data, delete your account and data (subject to legal obligations), object to processing of your information, opt-out of marketing communications, and request data portability. To exercise these rights, contact us at privacy@tickify.com.'
    },
    {
      title: 'Data Retention',
      content: 'We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this policy. After you delete your account, we may retain certain information for legitimate business purposes or as required by law, typically for 7 years for financial records and 3 years for other data.'
    },
    {
      title: 'International Data Transfers',
      content: 'Your information may be transferred to and maintained on computers located outside of your country where data protection laws may differ. By using our service, you consent to this transfer. We ensure appropriate safeguards are in place for such transfers.'
    },
    {
      title: "Children's Privacy",
      content: 'Our service is not intended for children under 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete it.'
    },
    {
      title: 'Third-Party Services',
      content: 'Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review the privacy policies of any third-party services you visit.'
    },
    {
      title: 'California Privacy Rights',
      content: 'If you are a California resident, you have specific rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete personal information, and the right to opt-out of the sale of personal information (we do not sell personal information).'
    },
    {
      title: 'GDPR Compliance',
      content: 'For users in the European Economic Area (EEA), we process your personal data in accordance with the General Data Protection Regulation (GDPR). Our legal basis for processing includes: consent, contractual necessity, legal obligations, and legitimate interests. You have additional rights under GDPR as outlined in the "Your Rights" section.'
    },
    {
      title: 'Changes to This Policy',
      content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last Updated" date. For material changes, we will provide prominent notice or seek your consent where required by law.'
    },
    {
      title: 'Contact Us',
      content: 'If you have any questions about this Privacy Policy, please contact us at: Email: privacy@tickify.com, Address: 123 Event Street, Ho Chi Minh City, Vietnam, Phone: +84 123 456 789. Our Data Protection Officer can be reached at dpo@tickify.com.'
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('privacy.title', 'Privacy Policy')}
          </h1>
          <p className="text-muted-foreground">
            {t('privacy.lastUpdated', 'Last Updated: January 2024')}
          </p>
        </div>

        <div className="bg-card rounded-lg border shadow-sm p-8">
          {/* Introduction */}
          <p className="text-lg leading-relaxed mb-8 text-muted-foreground">
            {t('privacy.introduction', 'At Tickify, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our event management and ticketing platform.')}
          </p>

          <div className="border-t pt-8" />

          {/* Privacy Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => (
              <div key={index}>
                <h2 className="text-2xl font-bold mb-3 text-primary">
                  {index + 1}. {t(`privacy.sections.${index}.title`, section.title)}
                </h2>
                <p className="text-lg leading-relaxed text-muted-foreground">
                  {t(`privacy.sections.${index}.content`, section.content)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t mt-8 pt-8" />

          {/* Footer Notice */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground italic">
              {t('privacy.footer', 'By using Tickify, you acknowledge that you have read and understood this Privacy Policy and agree to its terms. Your continued use of our service after changes to this policy constitutes acceptance of those changes.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;
