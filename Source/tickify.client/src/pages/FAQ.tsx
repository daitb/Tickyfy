import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/accordion';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

export function FAQ() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const faqData: FAQItem[] = [
    // General Questions
    {
      category: 'General',
      question: 'What is Tickify?',
      answer: 'Tickify is a comprehensive event management and ticketing platform that helps organizers create, manage, and promote events while providing attendees with a seamless ticket purchasing experience.'
    },
    {
      category: 'General',
      question: 'How do I create an account?',
      answer: 'Click the "Sign Up" button in the top right corner, fill in your details (name, email, password), and verify your email address. You can then choose to become an attendee or event organizer.'
    },
    {
      category: 'General',
      question: 'Is Tickify free to use?',
      answer: 'Creating an account and browsing events is completely free. For organizers, we charge a small service fee per ticket sold. Attendees may see booking fees depending on the event.'
    },
    // Ticket Purchasing
    {
      category: 'Tickets',
      question: 'How do I purchase tickets?',
      answer: 'Browse events, select the event you want to attend, choose your ticket type and quantity, click "Buy Tickets", and complete the secure checkout process with your payment information.'
    },
    {
      category: 'Tickets',
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit/debit cards through Stripe, and VNPay for local Vietnamese payment methods including bank transfers, QR codes, and e-wallets.'
    },
    {
      category: 'Tickets',
      question: 'How do I receive my tickets?',
      answer: 'After successful payment, you will receive your tickets via email immediately. You can also view and download them from your account dashboard at any time.'
    },
    {
      category: 'Tickets',
      question: 'Can I transfer my tickets to someone else?',
      answer: "Yes, you can transfer tickets to another person through your account dashboard. Simply select the ticket and enter the recipient's email address."
    },
    // Refunds and Cancellations
    {
      category: 'Refunds',
      question: 'What is your refund policy?',
      answer: 'Refund policies vary by event and are set by the organizer. Generally, tickets are refundable up to 7 days before the event. Check the specific event page for details.'
    },
    {
      category: 'Refunds',
      question: 'How do I request a refund?',
      answer: 'Go to your bookings, select the ticket you want to refund, click "Request Refund", provide a reason, and submit. Refunds are typically processed within 5-10 business days after approval.'
    },
    {
      category: 'Refunds',
      question: 'What happens if an event is cancelled?',
      answer: 'If an organizer cancels an event, you will receive a full refund automatically. You will be notified via email about the cancellation and refund status.'
    },
    // For Organizers
    {
      category: 'Organizers',
      question: 'How do I create an event?',
      answer: 'Register as an organizer, complete your profile verification, click "Create Event", fill in event details, set ticket types and pricing, and submit for approval. Events are typically reviewed within 24 hours.'
    },
    {
      category: 'Organizers',
      question: 'How much does it cost to host an event?',
      answer: 'We charge a service fee of 5-10% per ticket sold, depending on your subscription tier. There are no upfront costs to create and list your event.'
    },
    {
      category: 'Organizers',
      question: 'When do I receive payment for ticket sales?',
      answer: 'Payouts are processed after your event concludes, typically within 7 business days. You can request a payout from your organizer dashboard once funds are available.'
    },
    {
      category: 'Organizers',
      question: 'Can I offer promotional codes or discounts?',
      answer: 'Yes, you can create promo codes with percentage or fixed amount discounts. Set usage limits, expiration dates, and minimum purchase requirements from your event dashboard.'
    },
    // Technical Support
    {
      category: 'Support',
      question: 'I forgot my password. What should I do?',
      answer: 'Click "Forgot Password" on the login page, enter your email address, and follow the password reset link sent to your email. The link expires after 24 hours.'
    },
    {
      category: 'Support',
      question: 'My payment failed. What should I do?',
      answer: 'Check that your card details are correct and has sufficient funds. If the problem persists, try a different payment method or contact your bank. You can also reach our support team for assistance.'
    },
    {
      category: 'Support',
      question: 'How do I contact customer support?',
      answer: 'You can reach us through the Contact page, send an email to support@tickify.com, or use the live chat feature in your account dashboard. We respond within 24 hours.'
    },
    {
      category: 'Support',
      question: 'Is my payment information secure?',
      answer: 'Yes, we use industry-standard SSL encryption and partner with PCI-compliant payment processors (Stripe and VNPay). We never store your complete card details on our servers.'
    }
  ];

  const filteredFAQs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = Array.from(new Set(faqData.map((faq) => faq.category)));

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('faq.title', 'Frequently Asked Questions')}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t('faq.subtitle', 'Find answers to common questions about Tickify')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder={t('faq.search.placeholder', 'Search for questions...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* FAQ Sections by Category */}
        {categories.map((category) => {
          const categoryFAQs = filteredFAQs.filter((faq) => faq.category === category);
          
          if (categoryFAQs.length === 0) return null;

          return (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-primary">
                {t(`faq.categories.${category.toLowerCase()}`, category)}
              </h2>
              
              <Accordion type="single" collapsible className="space-y-2">
                {categoryFAQs.map((faq, index) => {
                  const panelId = `${category}-${index}`;
                  return (
                    <AccordionItem 
                      key={panelId} 
                      value={panelId}
                      className="bg-card border rounded-lg px-4"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:no-underline">
                        {t(`faq.items.${panelId}.question`, faq.question)}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {t(`faq.items.${panelId}.answer`, faq.answer)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          );
        })}

        {/* No Results */}
        {filteredFAQs.length === 0 && (
          <div className="bg-card rounded-lg border shadow-sm p-12 text-center">
            <p className="text-lg font-semibold text-muted-foreground mb-2">
              {t('faq.noResults', 'No questions found matching your search.')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('faq.noResultsHint', 'Try different keywords or browse all categories above.')}
            </p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-8 bg-primary text-primary-foreground rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">
            {t('faq.stillNeedHelp.title', 'Still need help?')}
          </h2>
          <p className="mb-2">
            {t('faq.stillNeedHelp.description', "Can't find the answer you're looking for? Our support team is here to help.")}
          </p>
          <p>
            {t('faq.stillNeedHelp.contact', 'Contact us at')} <strong>support@tickify.com</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

export default FAQ;
