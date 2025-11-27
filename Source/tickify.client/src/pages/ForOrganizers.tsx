import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, CreditCard, BarChart, Shield, Headphones, TrendingUp, CheckCircle, HelpCircle, Mail, FileText } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface ForOrganizersProps {
  onNavigate?: (page: string, id?: string) => void;
}

export function ForOrganizers({ onNavigate }: ForOrganizersProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features: Feature[] = [
    {
      icon: <Calendar className="w-12 h-12 text-primary" />,
      title: 'Easy Event Creation',
      description: 'Create and manage your events with our intuitive event builder. Set up ticket types, pricing, and seating in minutes.'
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: 'Attendee Management',
      description: 'Track registrations, manage check-ins, and communicate with your attendees all in one place.'
    },
    {
      icon: <CreditCard className="w-12 h-12 text-primary" />,
      title: 'Secure Payments',
      description: 'Accept payments through Stripe and VNPay. Get paid quickly with automated payouts after your event.'
    },
    {
      icon: <BarChart className="w-12 h-12 text-primary" />,
      title: 'Analytics & Insights',
      description: 'Get detailed analytics on ticket sales, attendee demographics, and revenue to make data-driven decisions.'
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: 'Fraud Protection',
      description: 'Advanced fraud detection and prevention to protect your events and revenue from fraudulent transactions.'
    },
    {
      icon: <Headphones className="w-12 h-12 text-primary" />,
      title: 'Dedicated Support',
      description: 'Our support team is here to help you succeed. Get priority support and expert guidance whenever you need it.'
    }
  ];

  const benefits = [
    'No upfront costs - only pay when you sell tickets',
    'Competitive service fees starting at 5%',
    'Real-time sales tracking and reporting',
    'Custom branding and event pages',
    'QR code ticket scanning',
    'Email marketing tools',
    'Social media integration',
    'Mobile-friendly check-in app'
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      fee: '5%',
      features: ['Up to 100 tickets per event', 'Basic analytics', 'Email support', 'Standard payment processing']
    },
    {
      name: 'Professional',
      fee: '7%',
      features: ['Unlimited tickets', 'Advanced analytics', 'Priority support', 'Custom branding', 'Promo codes']
    },
    {
      name: 'Enterprise',
      fee: 'Custom',
      features: ['Everything in Professional', 'Dedicated account manager', 'API access', 'White-label options', 'Custom integrations']
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('forOrganizers.title', 'For Event Organizers')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            {t('forOrganizers.subtitle', 'Everything you need to create, manage, and promote successful events')}
          </p>
          {onNavigate && (
            <Button
              size="lg"
              onClick={() => onNavigate('become-organizer')}
              className="mt-4"
            >
              {t('forOrganizers.getStarted', 'Get Started Today')}
            </Button>
          )}
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('forOrganizers.features.title', 'Powerful Features for Event Success')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-card rounded-lg border shadow-sm p-6 text-center transition-transform hover:-translate-y-2 hover:shadow-lg"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t(`forOrganizers.features.${index}.title`, feature.title)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`forOrganizers.features.${index}.description`, feature.description)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Section */}
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">
            {t('forOrganizers.benefits.title', 'Why Choose Tickify?')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>{t(`forOrganizers.benefits.${index}`, benefit)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('forOrganizers.pricing.title', 'Simple, Transparent Pricing')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`bg-card rounded-lg border shadow-sm p-6 ${
                  index === 1 ? 'border-primary border-2' : ''
                }`}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <div className="text-4xl font-bold text-primary mb-1">
                    {tier.fee}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('forOrganizers.pricing.perTicket', 'per ticket sold')}
                  </p>
                </div>
                <ul className="space-y-3">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {t(`forOrganizers.pricing.${tier.name.toLowerCase()}.${featureIndex}`, feature)}
                      </span>
                    </li>
                  ))}
                </ul>
                {index === 1 && (
                  <div className="mt-6 text-center">
                    <Badge className="bg-primary text-primary-foreground">
                      {t('forOrganizers.pricing.mostPopular', 'Most Popular')}
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Success Stories / Stats */}
        <div className="bg-card rounded-lg border shadow-sm p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('forOrganizers.stats.title', 'Trusted by Thousands of Organizers')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">
                {t('forOrganizers.stats.events', 'Events Created')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">500K+</div>
              <div className="text-muted-foreground">
                {t('forOrganizers.stats.tickets', 'Tickets Sold')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">2,000+</div>
              <div className="text-muted-foreground">
                {t('forOrganizers.stats.organizers', 'Active Organizers')}
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">98%</div>
              <div className="text-muted-foreground">
                {t('forOrganizers.stats.satisfaction', 'Satisfaction Rate')}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-8 text-center mb-8">
          <TrendingUp className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">
            {t('forOrganizers.cta.title', 'Ready to Get Started?')}
          </h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            {t('forOrganizers.cta.description', 'Join thousands of successful event organizers who trust Tickify to power their events.')}
          </p>
          {onNavigate && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => onNavigate('become-organizer')}
            >
              {t('forOrganizers.cta.button', 'Become an Organizer')}
            </Button>
          )}
        </div>

        {/* Related Links */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 text-center">
            {t('forOrganizers.relatedLinks.title', 'Need More Information?')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/help-center')}
              className="justify-start"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              {t('forOrganizers.relatedLinks.helpCenter', 'Help Center')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/faq')}
              className="justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('forOrganizers.relatedLinks.faq', 'FAQ')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/contact')}
              className="justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('forOrganizers.relatedLinks.contact', 'Contact Us')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/about')}
              className="justify-start"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('forOrganizers.relatedLinks.about', 'About Us')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForOrganizers;

