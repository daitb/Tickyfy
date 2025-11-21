import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';

export function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('contact.form.errors.nameRequired', 'Name is required');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('contact.form.errors.emailRequired', 'Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('contact.form.errors.emailInvalid', 'Invalid email format');
    }

    if (!formData.subject.trim()) {
      newErrors.subject = t('contact.form.errors.subjectRequired', 'Subject is required');
    }

    if (!formData.message.trim()) {
      newErrors.message = t('contact.form.errors.messageRequired', 'Message is required');
    } else if (formData.message.trim().length < 10) {
      newErrors.message = t('contact.form.errors.messageTooShort', 'Message must be at least 10 characters');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setShowSuccess(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      setTimeout(() => setShowSuccess(false), 6000);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail className="w-10 h-10 text-primary" />,
      title: 'Email',
      content: 'support@tickify.com',
      link: 'mailto:support@tickify.com'
    },
    {
      icon: <Phone className="w-10 h-10 text-primary" />,
      title: 'Phone',
      content: '+84 123 456 789',
      link: 'tel:+84123456789'
    },
    {
      icon: <MapPin className="w-10 h-10 text-primary" />,
      title: 'Address',
      content: '123 Event Street, Ho Chi Minh City, Vietnam',
      link: undefined
    }
  ];

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('contact.title', 'Contact Us')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {t('contact.subtitle', "Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border shadow-sm p-6">
              <h2 className="text-2xl font-bold mb-6">
                {t('contact.form.title', 'Send us a Message')}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t('contact.form.name', 'Your Name')}</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.form.email', 'Your Email')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">{t('contact.form.subject', 'Subject')}</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className={errors.subject ? 'border-red-500' : ''}
                  />
                  {errors.subject && <p className="text-sm text-red-500">{errors.subject}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('contact.form.message', 'Message')}</Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className={errors.message ? 'border-red-500' : ''}
                  />
                  {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    t('contact.form.sending', 'Sending...')
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('contact.form.send', 'Send Message')}
                    </>
                  )}
                </Button>
              </form>
              
              {showSuccess && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
                  {t('contact.form.success', 'Thank you! Your message has been sent successfully.')}
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-card rounded-lg border shadow-sm p-6 flex items-start gap-4 transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex-shrink-0">{info.icon}</div>
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {t(`contact.info.${info.title.toLowerCase()}.title`, info.title)}
                  </h3>
                  {info.link ? (
                    <a href={info.link} className="text-muted-foreground hover:text-primary transition-colors">
                      {t(`contact.info.${info.title.toLowerCase()}.content`, info.content)}
                    </a>
                  ) : (
                    <p className="text-muted-foreground">
                      {t(`contact.info.${info.title.toLowerCase()}.content`, info.content)}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Business Hours */}
            <div className="bg-primary text-primary-foreground rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-3">
                {t('contact.hours.title', 'Business Hours')}
              </h3>
              <p className="mb-1">
                {t('contact.hours.weekdays', 'Monday - Friday: 9:00 AM - 6:00 PM')}
              </p>
              <p>
                {t('contact.hours.weekend', 'Saturday - Sunday: 10:00 AM - 4:00 PM')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
