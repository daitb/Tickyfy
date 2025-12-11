import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, Book, MessageCircle, Video, FileText, HelpCircle, ArrowRight } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

interface HelpCategory {
  icon: React.ReactNode;
  title: string;
  description: string;
  articles: number;
  color: string;
}

interface HelpArticle {
  category: string;
  title: string;
  description: string;
  views: number;
}

export function HelpCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const categories: HelpCategory[] = [
    {
      icon: <Book className="w-8 h-8" />,
      title: 'Getting Started',
      description: 'Learn the basics of using Tickify',
      articles: 12,
      color: 'text-blue-600'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Account & Profile',
      description: 'Manage your account settings',
      articles: 8,
      color: 'text-green-600'
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'Tickets & Bookings',
      description: 'Everything about purchasing tickets',
      articles: 15,
      color: 'text-purple-600'
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: 'For Organizers',
      description: 'Resources for event organizers',
      articles: 20,
      color: 'text-orange-600'
    },
    {
      icon: <HelpCircle className="w-8 h-8" />,
      title: 'Payment & Refunds',
      description: 'Payment methods and refund policies',
      articles: 10,
      color: 'text-red-600'
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: 'Technical Support',
      description: 'Troubleshooting and technical issues',
      articles: 14,
      color: 'text-indigo-600'
    }
  ];

  const popularArticles: HelpArticle[] = [
    {
      category: 'Getting Started',
      title: 'How to create an account',
      description: 'Step-by-step guide to creating your Tickify account',
      views: 1250
    },
    {
      category: 'Tickets & Bookings',
      title: 'How to purchase tickets',
      description: 'Complete guide to buying tickets for events',
      views: 980
    },
    {
      category: 'Payment & Refunds',
      title: 'Accepted payment methods',
      description: 'Learn about all available payment options',
      views: 750
    },
    {
      category: 'For Organizers',
      title: 'Creating your first event',
      description: 'Guide to setting up and managing events',
      views: 650
    },
    {
      category: 'Account & Profile',
      title: 'Updating your profile',
      description: 'How to edit your personal information',
      views: 520
    },
    {
      category: 'Tickets & Bookings',
      title: 'Transferring tickets',
      description: 'How to transfer tickets to another person',
      views: 480
    }
  ];

  const filteredArticles = popularArticles.filter(
    article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="py-12 bg-background min-h-screen">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {t('helpCenter.title', 'Help Center')}
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            {t('helpCenter.subtitle', 'Find answers to your questions and get the support you need')}
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder={t('helpCenter.search.placeholder', 'Search for help articles...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-lg"
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {t('helpCenter.categories.title', 'Browse by Category')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1"
                onClick={() => {
                  if (category.title === 'For Organizers') {
                    navigate('/for-organizers');
                  } else if (category.title === 'Payment & Refunds') {
                    navigate('/refund-policy');
                  }
                }}
              >
                <CardHeader>
                  <div className={`${category.color} mb-2`}>
                    {category.icon}
                  </div>
                  <CardTitle>{t(`helpCenter.categories.${index}.title`, category.title)}</CardTitle>
                  <CardDescription>
                    {t(`helpCenter.categories.${index}.description`, category.description)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('helpCenter.categories.articles', '{{count}} articles', { count: category.articles })}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">
            {t('helpCenter.popular.title', 'Popular Articles')}
          </h2>
          {searchQuery && filteredArticles.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-lg font-semibold text-muted-foreground mb-2">
                  {t('helpCenter.search.noResults', 'No articles found matching your search.')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('helpCenter.search.tryDifferent', 'Try different keywords or browse categories above.')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(searchQuery ? filteredArticles : popularArticles).map((article, index) => (
                <Card key={index} className="cursor-pointer hover:shadow-md transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-xs text-muted-foreground mb-1">
                          {t(`helpCenter.categories.${categories.findIndex(c => c.title === article.category)}.title`, article.category)}
                        </div>
                        <CardTitle className="text-lg mb-2">
                          {t(`helpCenter.articles.${index}.title`, article.title)}
                        </CardTitle>
                        <CardDescription>
                          {t(`helpCenter.articles.${index}.description`, article.description)}
                        </CardDescription>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {t('helpCenter.articles.views', '{{count}} views', { count: article.views })}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle>{t('helpCenter.quickLinks.faq.title', 'FAQ')}</CardTitle>
              <CardDescription className="text-primary-foreground/80">
                {t('helpCenter.quickLinks.faq.description', 'Frequently asked questions')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate('/faq')}
              >
                {t('helpCenter.quickLinks.faq.button', 'View FAQ')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-2 border-primary">
            <CardHeader>
              <CardTitle>{t('helpCenter.quickLinks.contact.title', 'Contact Support')}</CardTitle>
              <CardDescription>
                {t('helpCenter.quickLinks.contact.description', 'Get in touch with our team')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/contact')}
              >
                {t('helpCenter.quickLinks.contact.button', 'Contact Us')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('helpCenter.quickLinks.video.title', 'Video Tutorials')}</CardTitle>
              <CardDescription>
                {t('helpCenter.quickLinks.video.description', 'Watch step-by-step guides')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {t('helpCenter.quickLinks.video.button', 'Watch Videos')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Still Need Help Section */}
        <Card className="bg-muted">
          <CardContent className="p-8 text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h3 className="text-2xl font-bold mb-2">
              {t('helpCenter.stillNeedHelp.title', 'Still need help?')}
            </h3>
            <p className="text-muted-foreground mb-4">
              {t('helpCenter.stillNeedHelp.description', "Can't find what you're looking for? Our support team is here to help.")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/contact')}>
                {t('helpCenter.stillNeedHelp.contact', 'Contact Support')}
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.href = 'mailto:support@tickify.com'}
              >
                {t('helpCenter.stillNeedHelp.email', 'Email Us')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default HelpCenter;

