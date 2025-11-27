import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Shield, Headphones, FileText, HelpCircle, Mail, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';

export function About() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Calendar className="w-12 h-12 text-primary" />,
      title: 'Event Management',
      description: 'Create, manage and promote your events with ease. Our platform provides all the tools you need.'
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: 'Community Focused',
      description: 'Connect with organizers and attendees. Build lasting relationships within our community.'
    },
    {
      icon: <Shield className="w-12 h-12 text-primary" />,
      title: 'Secure Payments',
      description: 'Process payments securely with integrated Stripe and VNPay payment gateways.'
    },
    {
      icon: <Headphones className="w-12 h-12 text-primary" />,
      title: '24/7 Support',
      description: 'Our dedicated support team is always here to help you succeed.'
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('about.title', 'About Tickify')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('about.subtitle', 'Your trusted partner for seamless event management and ticketing solutions')}
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-card rounded-lg border shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4 text-primary">
            {t('about.mission.title', 'Our Mission')}
          </h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t('about.mission.description', 'At Tickify, we are committed to revolutionizing the event management industry by providing innovative, user-friendly solutions that empower organizers and delight attendees. We believe that every event, big or small, deserves professional-grade tools and seamless experiences.')}
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-8">
            {t('about.features.title', 'Why Choose Tickify?')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-card rounded-lg border shadow-sm p-6 text-center transition-transform hover:-translate-y-2 hover:shadow-lg"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">
                  {t(`about.features.${index}.title`, feature.title)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`about.features.${index}.description`, feature.description)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Story */}
        <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold mb-4">
            {t('about.story.title', 'Our Story')}
          </h2>
          <p className="text-lg leading-relaxed mb-4">
            {t('about.story.paragraph1', 'Founded in 2024, Tickify was born from a simple observation: event management should be accessible, intuitive, and powerful. Our team of passionate developers and event professionals came together to create a platform that bridges the gap between technology and human connection.')}
          </p>
          <p className="text-lg leading-relaxed">
            {t('about.story.paragraph2', 'Today, we serve thousands of organizers and millions of attendees worldwide, helping them create memorable experiences that bring people together. From small community gatherings to large-scale conferences, Tickify is proud to be part of your journey.')}
          </p>
        </div>

        {/* Related Links */}
        <div className="bg-card rounded-lg border shadow-sm p-6">
          <h3 className="text-xl font-bold mb-4 text-center">
            {t('about.relatedLinks.title', 'Explore More')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/for-organizers')}
              className="justify-start"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('about.relatedLinks.organizers', 'For Organizers')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/help-center')}
              className="justify-start"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              {t('about.relatedLinks.helpCenter', 'Help Center')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/contact')}
              className="justify-start"
            >
              <Mail className="w-4 h-4 mr-2" />
              {t('about.relatedLinks.contact', 'Contact Us')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/faq')}
              className="justify-start"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('about.relatedLinks.faq', 'FAQ')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
