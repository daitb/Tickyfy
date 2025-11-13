import { useState } from 'react';
import {
  Tag,
  Plus,
  Upload,
  Copy,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Percent,
  Gift,
  AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Checkbox } from '../components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { Progress } from '../components/ui/progress';

interface PromoCodeManagementProps {
  onNavigate: (page: string) => void;
}

interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed' | 'free-ticket';
  discountValue: number;
  applicableEvents: string;
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  startDate: string;
  endDate: string;
  minPurchase?: number;
  status: 'active' | 'expired' | 'disabled';
}

const mockPromoCodes: PromoCode[] = [
  {
    id: '1',
    code: 'SUMMER2025',
    description: 'Summer sale discount',
    discountType: 'percentage',
    discountValue: 20,
    applicableEvents: 'All Events',
    maxUses: 100,
    usedCount: 45,
    maxUsesPerUser: 1,
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    minPurchase: 200000,
    status: 'active',
  },
  {
    id: '2',
    code: 'WELCOME50',
    description: 'New user discount',
    discountType: 'fixed',
    discountValue: 50000,
    applicableEvents: 'All Events',
    maxUses: 500,
    usedCount: 156,
    maxUsesPerUser: 1,
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    status: 'active',
  },
  {
    id: '3',
    code: 'VIP2024',
    description: 'VIP member exclusive',
    discountType: 'percentage',
    discountValue: 30,
    applicableEvents: 'Premium Events',
    maxUses: 50,
    usedCount: 50,
    maxUsesPerUser: 2,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'expired',
  },
  {
    id: '4',
    code: 'EARLYBIRD',
    description: 'Early bird special',
    discountType: 'percentage',
    discountValue: 15,
    applicableEvents: 'Selected Events',
    maxUses: 200,
    usedCount: 89,
    maxUsesPerUser: 1,
    startDate: '2025-01-01',
    endDate: '2025-06-30',
    status: 'active',
  },
];

export function PromoCodeManagement({ onNavigate }: PromoCodeManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [selectedCode, setSelectedCode] = useState<PromoCode | null>(null);
  const [codeToDelete, setCodeToDelete] = useState<string | null>(null);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    applicableEvents: 'all',
    maxUses: 100,
    maxUsesPerUser: 1,
    startDate: '',
    endDate: '',
    minPurchase: 0,
    status: true,
  });

  const filteredCodes = mockPromoCodes.filter((code) => {
    const matchesSearch =
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || code.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCodes = mockPromoCodes.length;
  const activeCodes = mockPromoCodes.filter((c) => c.status === 'active').length;
  const totalRedemptions = mockPromoCodes.reduce((sum, c) => sum + c.usedCount, 0);
  const totalDiscount = 3450000;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-700">Expired</Badge>;
      case 'disabled':
        return <Badge className="bg-neutral-200 text-neutral-700">Disabled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    // Show toast notification
    console.log('Copied:', code);
  };

  const handleCreateCode = () => {
    console.log('Creating promo code:', formData);
    setShowCreateDialog(false);
    // Reset form
    setFormData({
      code: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      applicableEvents: 'all',
      maxUses: 100,
      maxUsesPerUser: 1,
      startDate: '',
      endDate: '',
      minPurchase: 0,
      status: true,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1>Promo Code Management</h1>
          <div className="flex gap-3">
            <Button variant="outline">
              <Upload size={18} className="mr-2" />
              Bulk Import
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="bg-teal-500 hover:bg-teal-600"
            >
              <Plus size={18} className="mr-2" />
              Create New Code
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Total Codes</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <Tag className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-1">{totalCodes}</div>
              <div className="text-xs text-neutral-600">All promo codes</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Active Codes</div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-green-500 mb-1">{activeCodes}</div>
              <div className="text-xs text-neutral-600">Currently available</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Total Redemptions</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-1">{totalRedemptions}</div>
              <div className="text-xs text-neutral-600">Times used</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="text-sm text-neutral-600">Total Discount</div>
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-teal-600" size={20} />
                </div>
              </div>
              <div className="text-2xl text-neutral-900 mb-1">{totalDiscount.toLocaleString()}₫</div>
              <div className="text-xs text-neutral-600">Total savings</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Search code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Promo Codes Grid */}
        {filteredCodes.length === 0 ? (
          <Card className="p-16">
            <div className="text-center">
              <Tag className="mx-auto text-neutral-400 mb-4" size={64} />
              <h3 className="text-neutral-900 mb-2">No promo codes yet</h3>
              <p className="text-neutral-600 mb-6">Create your first promo code to get started</p>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-teal-500 hover:bg-teal-600"
              >
                <Plus size={18} className="mr-2" />
                Create Promo Code
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCodes.map((code) => (
              <Card key={code.id} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                <div className="absolute top-4 right-4">{getStatusBadge(code.status)}</div>

                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <code className="text-xl font-mono">{code.code}</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(code.code)}
                      className="text-teal-500"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-lg text-neutral-900">
                        {code.discountType === 'percentage' && `${code.discountValue}% OFF`}
                        {code.discountType === 'fixed' && `${code.discountValue.toLocaleString()}₫ OFF`}
                        {code.discountType === 'free-ticket' && 'Free Ticket'}
                      </div>
                      <div className="text-sm text-neutral-600 mt-1">{code.description}</div>
                    </div>

                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Valid for:</span>
                        <span className="text-neutral-900">{code.applicableEvents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Valid period:</span>
                        <span className="text-neutral-900">
                          {new Date(code.startDate).toLocaleDateString()} -{' '}
                          {new Date(code.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      {code.minPurchase && (
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Min purchase:</span>
                          <span className="text-neutral-900">{code.minPurchase.toLocaleString()}₫</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">Usage</span>
                        <span className="text-neutral-900">
                          {code.usedCount}/{code.maxUses} used
                        </span>
                      </div>
                      <Progress value={(code.usedCount / code.maxUses) * 100} className="h-2" />
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedCode(code);
                          setShowStatsDialog(true);
                        }}
                      >
                        <Eye size={14} className="mr-1" />
                        Stats
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCodeToDelete(code.id)}
                        className="text-red-600 border-red-600"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Promo Code Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Promo Code</DialogTitle>
            <DialogDescription>Set up a new promotional discount code</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="code">
                Promo Code <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER2025"
                  className="font-mono"
                  maxLength={20}
                />
                <Button variant="outline" onClick={generateRandomCode}>
                  Generate
                </Button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">Alphanumeric, 4-20 characters</p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this promo code"
                maxLength={200}
              />
            </div>

            <div>
              <Label>Discount Type</Label>
              <RadioGroup
                value={formData.discountType}
                onValueChange={(v) => setFormData({ ...formData, discountType: v })}
                className="flex gap-4 mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="percentage" id="percentage" />
                  <Label htmlFor="percentage">Percentage (%)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <Label htmlFor="fixed">Fixed Amount</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="free-ticket" id="free-ticket" />
                  <Label htmlFor="free-ticket">Free Ticket</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label htmlFor="discountValue">
                {formData.discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (VND)'}
              </Label>
              <Input
                id="discountValue"
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                placeholder={formData.discountType === 'percentage' ? '20' : '50000'}
              />
            </div>

            <div>
              <Label htmlFor="applicableEvents">Applicable Events</Label>
              <Select
                value={formData.applicableEvents}
                onValueChange={(v) => setFormData({ ...formData, applicableEvents: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="selected">Selected Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxUses">Max Total Uses</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                <Input
                  id="maxUsesPerUser"
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="minPurchase">Minimum Purchase Amount (VND)</Label>
              <Input
                id="minPurchase"
                type="number"
                value={formData.minPurchase}
                onChange={(e) => setFormData({ ...formData, minPurchase: Number(e.target.value) })}
                placeholder="Optional"
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <Label htmlFor="status">Active Status</Label>
                <p className="text-xs text-neutral-500">Make this code available immediately</p>
              </div>
              <Switch
                id="status"
                checked={formData.status}
                onCheckedChange={(v) => setFormData({ ...formData, status: v })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-500 hover:bg-teal-600" onClick={handleCreateCode}>
              Create & Activate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Promo Code Statistics</DialogTitle>
          </DialogHeader>
          {selectedCode && (
            <div className="space-y-4">
              <div className="text-center py-4">
                <code className="text-2xl font-mono">{selectedCode.code}</code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-neutral-600">Total Uses</div>
                    <div className="text-2xl text-neutral-900">{selectedCode.usedCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-sm text-neutral-600">Remaining</div>
                    <div className="text-2xl text-neutral-900">
                      {selectedCode.maxUses - selectedCode.usedCount}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="text-sm text-neutral-600">
                More detailed statistics would appear here...
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!codeToDelete} onOpenChange={() => setCodeToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Promo Code?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this promo code? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCodeToDelete(null)}>
              Cancel
            </Button>
            <Button className="bg-red-500 hover:bg-red-600" onClick={() => setCodeToDelete(null)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
