import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Bell, Mail, Smartphone, MessageSquare, Clock, Lock, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface NotificationPreferencesProps {
  onNavigate: (page: string) => void;
}

interface NotificationSettings {
  email: {
    orderConfirmation: boolean;
    ticketIssued: boolean;
    eventReminder: boolean;
    eventUpdates: boolean;
    wishlistOnSale: boolean;
    newsletter: boolean;
  };
  push: {
    orderConfirmation: boolean;
    ticketIssued: boolean;
    eventReminder: boolean;
    eventUpdates: boolean;
  };
  sms: {
    eventStartingSoon: boolean;
    orderConfirmation: boolean;
    eventCancelled: boolean;
  };
  inApp: {
    enabled: boolean;
    realTime: boolean;
  };
}

export function NotificationPreferences({ onNavigate }: NotificationPreferencesProps) {
  const { t } = useTranslation();
  const [enableAll, setEnableAll] = useState(true);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState('2 hours ago');
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      orderConfirmation: true,
      ticketIssued: true,
      eventReminder: true,
      eventUpdates: true,
      wishlistOnSale: true,
      newsletter: false,
    },
    push: {
      orderConfirmation: true,
      ticketIssued: true,
      eventReminder: true,
      eventUpdates: false,
    },
    sms: {
      eventStartingSoon: true,
      orderConfirmation: false,
      eventCancelled: true,
    },
    inApp: {
      enabled: true,
      realTime: true,
    },
  });

  // Auto-save simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved('Just now');
      }, 500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [settings]);

  const updateEmailSetting = (key: keyof typeof settings.email, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      email: { ...prev.email, [key]: value },
    }));
  };

  const updatePushSetting = (key: keyof typeof settings.push, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      push: { ...prev.push, [key]: value },
    }));
  };

  const updateSmsSetting = (key: keyof typeof settings.sms, value: boolean) => {
    setSettings((prev) => ({
      ...prev,
      sms: { ...prev.sms, [key]: value },
    }));
  };

  const handleTestNotification = () => {
    setShowTestDialog(true);
    // Simulate sending test
    setTimeout(() => {
      setShowTestDialog(false);
    }, 2000);
  };

  const emailEnabledCount = Object.values(settings.email).filter(Boolean).length;
  const pushEnabledCount = Object.values(settings.push).filter(Boolean).length;
  const smsEnabledCount = Object.values(settings.sms).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-6">
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Dashboard
          </button>
          <span>/</span>
          <button onClick={() => onNavigate('user-profile')} className="hover:text-neutral-900">
            Settings
          </button>
          <span>/</span>
          <span className="text-neutral-900">Notifications</span>
        </div>

        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="mb-2">Notification Settings</h1>
            <p className="text-neutral-600">Choose how you want to be notified about important updates</p>
          </div>
          <div className="flex items-center gap-2">
            {isSaving ? (
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check size={16} />
                All changes saved
              </div>
            )}
            <span className="text-xs text-neutral-500">• {lastSaved}</span>
          </div>
        </div>

        {/* Quick Controls */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="enable-all" className="text-base cursor-pointer">
                    Enable All Notifications
                  </Label>
                  <p className="text-sm text-neutral-500 mt-1">
                    Master switch for all notification channels
                  </p>
                </div>
                <Switch
                  id="enable-all"
                  checked={enableAll}
                  onCheckedChange={setEnableAll}
                  className="ml-4"
                />
              </div>
              {!enableAll && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertDescription className="text-yellow-800 text-sm">
                    ⚠️ You'll miss important updates
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Label htmlFor="dnd" className="text-base cursor-pointer">
                    Do Not Disturb Mode
                  </Label>
                  <p className="text-sm text-neutral-500 mt-1">Quiet hours: 10 PM - 8 AM</p>
                </div>
                <Switch
                  id="dnd"
                  checked={doNotDisturb}
                  onCheckedChange={setDoNotDisturb}
                  className="ml-4"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail size={16} />
              Email
              <Badge variant="secondary" className="ml-1">
                {emailEnabledCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="push" className="flex items-center gap-2">
              <Bell size={16} />
              Push
              <Badge variant="secondary" className="ml-1">
                {pushEnabledCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <Smartphone size={16} />
              SMS
              <Badge variant="secondary" className="ml-1">
                {smsEnabledCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="in-app" className="flex items-center gap-2">
              <MessageSquare size={16} />
              In-App
            </TabsTrigger>
          </TabsList>

          {/* Email Notifications Tab */}
          <TabsContent value="email" className="space-y-6">
            {/* Booking & Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📦 Booking & Orders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email-order" className="cursor-pointer">
                        Order Confirmation
                      </Label>
                      <button
                        onClick={() => setShowEmailPreview(true)}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">When your order is confirmed</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Frequency: Instant</p>
                  </div>
                  <Switch
                    id="email-order"
                    checked={settings.email.orderConfirmation}
                    onCheckedChange={(checked) => updateEmailSetting('orderConfirmation', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="email-ticket" className="cursor-pointer">
                      Ticket Issued
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">When your tickets are ready</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Includes QR codes and event details</p>
                  </div>
                  <Switch
                    id="email-ticket"
                    checked={settings.email.ticketIssued}
                    onCheckedChange={(checked) => updateEmailSetting('ticketIssued', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Events & Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎫 Events & Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="email-reminder" className="cursor-pointer">
                      Event Reminder
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Reminder before your event starts</p>
                    {settings.email.eventReminder && (
                      <Select defaultValue="1hour">
                        <SelectTrigger className="w-48 mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1day">1 day before</SelectItem>
                          <SelectItem value="1hour">1 hour before</SelectItem>
                          <SelectItem value="30min">30 minutes before</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Switch
                    id="email-reminder"
                    checked={settings.email.eventReminder}
                    onCheckedChange={(checked) => updateEmailSetting('eventReminder', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="email-updates" className="cursor-pointer">
                      Event Updates
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Changes to events you're attending</p>
                  </div>
                  <Switch
                    id="email-updates"
                    checked={settings.email.eventUpdates}
                    onCheckedChange={(checked) => updateEmailSetting('eventUpdates', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wishlist & Waitlist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ❤️ Wishlist & Waitlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="email-wishlist" className="cursor-pointer">
                        Wishlist Event On Sale
                      </Label>
                      <Badge className="bg-orange-100 text-orange-700 text-xs">Medium Priority</Badge>
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">When wishlisted event goes on sale</p>
                  </div>
                  <Switch
                    id="email-wishlist"
                    checked={settings.email.wishlistOnSale}
                    onCheckedChange={(checked) => updateEmailSetting('wishlistOnSale', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Marketing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📢 Marketing & Promotions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="email-newsletter" className="cursor-pointer">
                      Newsletter
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Weekly digest of featured events</p>
                    {settings.email.newsletter && (
                      <Select defaultValue="weekly">
                        <SelectTrigger className="w-48 mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Switch
                    id="email-newsletter"
                    checked={settings.email.newsletter}
                    onCheckedChange={(checked) => updateEmailSetting('newsletter', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Push Notifications Tab */}
          <TabsContent value="push" className="space-y-6">
            <Alert className="bg-blue-50 border-blue-200">
              <Bell className="text-blue-600" size={16} />
              <AlertDescription className="text-blue-800 text-sm">
                Push notifications are enabled for Web Browser
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Push Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="push-order" className="cursor-pointer">
                      Order Confirmation
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Instant notification when order confirmed</p>
                  </div>
                  <Switch
                    id="push-order"
                    checked={settings.push.orderConfirmation}
                    onCheckedChange={(checked) => updatePushSetting('orderConfirmation', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="push-ticket" className="cursor-pointer">
                      Ticket Issued
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">When tickets are ready to download</p>
                  </div>
                  <Switch
                    id="push-ticket"
                    checked={settings.push.ticketIssued}
                    onCheckedChange={(checked) => updatePushSetting('ticketIssued', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="push-reminder" className="cursor-pointer">
                      Event Reminder
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Reminder before event starts</p>
                  </div>
                  <Switch
                    id="push-reminder"
                    checked={settings.push.eventReminder}
                    onCheckedChange={(checked) => updatePushSetting('eventReminder', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Notifications Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Smartphone className="text-blue-600" size={20} />
                  <div>
                    <div className="text-sm text-blue-900 mb-1">Phone: +1 (555) 123-4567</div>
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      <Check size={12} className="mr-1" />
                      Verified
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertDescription className="text-yellow-800 text-sm">
                💡 SMS notifications may incur carrier charges. Critical alerts only recommended.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Critical Alerts Only</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="sms-starting" className="cursor-pointer">
                      Event Starting Soon
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Final reminder 1 hour before event</p>
                  </div>
                  <Switch
                    id="sms-starting"
                    checked={settings.sms.eventStartingSoon}
                    onCheckedChange={(checked) => updateSmsSetting('eventStartingSoon', checked)}
                  />
                </div>
                <Separator />

                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="sms-cancelled" className="cursor-pointer">
                        Event Cancelled
                      </Label>
                      <Lock size={14} className="text-neutral-400" />
                    </div>
                    <p className="text-sm text-neutral-500 mt-1">Urgent: Event cancelled notification</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Cannot be disabled - Required</p>
                  </div>
                  <Switch id="sms-cancelled" checked={settings.sms.eventCancelled} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* In-App Notifications Tab */}
          <TabsContent value="in-app" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>In-App Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-3">
                  <div className="flex-1">
                    <Label htmlFor="inapp-enabled" className="cursor-pointer">
                      Enable In-App Notifications
                    </Label>
                    <p className="text-sm text-neutral-500 mt-1">Show notifications while using Tickify</p>
                  </div>
                  <Switch
                    id="inapp-enabled"
                    checked={settings.inApp.enabled}
                    onCheckedChange={(checked) =>
                      setSettings((prev) => ({
                        ...prev,
                        inApp: { ...prev.inApp, enabled: checked },
                      }))
                    }
                  />
                </div>

                {settings.inApp.enabled && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1">
                        <Label htmlFor="inapp-realtime" className="cursor-pointer">
                          Real-time Updates
                        </Label>
                        <p className="text-sm text-neutral-500 mt-1">
                          Show notifications instantly vs batched
                        </p>
                      </div>
                      <Switch
                        id="inapp-realtime"
                        checked={settings.inApp.realTime}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            inApp: { ...prev.inApp, realTime: checked },
                          }))
                        }
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Preview */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <h3 className="text-sm text-neutral-900 mb-4">Notification Preview</h3>
                <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bell className="text-purple-600" size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900 mb-1">Order Confirmed</div>
                      <p className="text-xs text-neutral-600">Your tickets for Summer Music Fest are ready!</p>
                    </div>
                    <Clock className="text-neutral-400" size={12} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Test Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Your Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-4">
              Send a test notification to verify your settings are working correctly
            </p>
            <div className="flex gap-3">
              <Button onClick={handleTestNotification} variant="outline">
                Send Test Notification
              </Button>
              <Select defaultValue="all">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All channels</SelectItem>
                  <SelectItem value="email">Email only</SelectItem>
                  <SelectItem value="push">Push only</SelectItem>
                  <SelectItem value="sms">SMS only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 sticky bottom-0 bg-neutral-50 py-4 border-t">
          <Button variant="outline">Reset to Default</Button>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            <Check size={16} className="mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Email Preview Modal */}
      <Dialog open={showEmailPreview} onOpenChange={setShowEmailPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview - Order Confirmation</DialogTitle>
            <DialogDescription>This is how the email will look</DialogDescription>
          </DialogHeader>

          <div className="bg-neutral-50 p-6 rounded-lg">
            <div className="bg-white p-8 rounded-lg border">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🎟️</div>
                <h2 className="text-2xl text-neutral-900">Order Confirmed!</h2>
              </div>
              <p className="text-neutral-700 mb-4">Hi John,</p>
              <p className="text-neutral-700 mb-4">
                Great news! Your order has been confirmed. Your tickets for Summer Music Festival are
                ready.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 mb-4">
                View Your Tickets
              </Button>
              <p className="text-xs text-neutral-500 text-center">
                You're receiving this email because you have notifications enabled for order confirmations.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline">Send Test Email</Button>
            <Button onClick={() => setShowEmailPreview(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={showTestDialog} onOpenChange={setShowTestDialog}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="text-green-600" size={32} />
              </div>
            </div>
            <DialogTitle className="text-center">Test Notification Sent!</DialogTitle>
            <DialogDescription className="text-center">
              Check your email, phone, and notification center
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
