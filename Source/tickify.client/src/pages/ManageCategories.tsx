import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';

interface Category {
  id: string;
  name: string;
  description: string;
  eventCount: number;
  icon: string;
  createdAt: string;
}

export function ManageCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with actual API call
  useEffect(() => {
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Music',
        description: 'Concerts, festivals, and live music performances',
        eventCount: 45,
        icon: '🎵',
        createdAt: '2024-01-01'
      },
      {
        id: '2',
        name: 'Technology',
        description: 'Tech conferences, workshops, and meetups',
        eventCount: 28,
        icon: '💻',
        createdAt: '2024-01-02'
      },
      {
        id: '3',
        name: 'Sports',
        description: 'Sporting events, tournaments, and competitions',
        eventCount: 32,
        icon: '⚽',
        createdAt: '2024-01-03'
      },
      {
        id: '4',
        name: 'Food & Drink',
        description: 'Food festivals, wine tastings, and culinary events',
        eventCount: 19,
        icon: '🍽️',
        createdAt: '2024-01-04'
      },
      {
        id: '5',
        name: 'Arts & Culture',
        description: 'Art exhibitions, theater, and cultural events',
        eventCount: 23,
        icon: '🎨',
        createdAt: '2024-01-05'
      }
    ];
    setCategories(mockCategories);
  }, []);

  const handleAdd = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '', icon: '' });
    setShowDialog(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      icon: category.icon
    });
    setShowDialog(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to save category
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (selectedCategory) {
        // Update existing
        setCategories(categories.map(c => 
          c.id === selectedCategory.id 
            ? { ...c, ...formData }
            : c
        ));
      } else {
        // Add new
        const newCategory: Category = {
          id: Date.now().toString(),
          ...formData,
          eventCount: 0,
          createdAt: new Date().toISOString()
        };
        setCategories([...categories, newCategory]);
      }
      
      setShowDialog(false);
      setFormData({ name: '', description: '', icon: '' });
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    
    setIsLoading(true);
    try {
      // TODO: Call API to delete category
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCategories(categories.filter(c => c.id !== selectedCategory.id));
      setShowDeleteDialog(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalEvents = categories.reduce((sum, cat) => sum + cat.eventCount, 0);

  return (
    <div className="py-8 px-4 bg-background min-h-screen">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('admin.manageCategories.title', 'Manage Categories')}</h1>
            <p className="text-muted-foreground">
              {t('admin.manageCategories.subtitle', 'Organize events with categories')}
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            {t('admin.manageCategories.addCategory', 'Add Category')}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.manageCategories.stats.totalCategories', 'Total Categories')}
              </CardTitle>
              <Tag className="w-5 h-5" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.manageCategories.stats.totalEvents', 'Total Events')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t('admin.manageCategories.stats.avgPerCategory', 'Avg per Category')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {categories.length > 0 ? Math.round(totalEvents / categories.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={t('admin.manageCategories.search', 'Search categories...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Table */}
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('admin.manageCategories.table.icon', 'Icon')}</TableHead>
                  <TableHead>{t('admin.manageCategories.table.name', 'Name')}</TableHead>
                  <TableHead>{t('admin.manageCategories.table.description', 'Description')}</TableHead>
                  <TableHead>{t('admin.manageCategories.table.events', 'Events')}</TableHead>
                  <TableHead className="text-right">{t('admin.manageCategories.table.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCategories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t('admin.manageCategories.noCategories', 'No categories found')}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="text-2xl">{category.icon}</TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.description}</TableCell>
                      <TableCell>{category.eventCount}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(category)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCategory 
                  ? t('admin.manageCategories.edit.title', 'Edit Category')
                  : t('admin.manageCategories.add.title', 'Add Category')}
              </DialogTitle>
              <DialogDescription>
                {t('admin.manageCategories.dialog.description', 'Fill in the category details below')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('admin.manageCategories.form.name', 'Name')}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('admin.manageCategories.form.namePlaceholder', 'Enter category name')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="icon">{t('admin.manageCategories.form.icon', 'Icon (Emoji)')}</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder={t('admin.manageCategories.form.iconPlaceholder', '🎵')}
                  maxLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('admin.manageCategories.form.description', 'Description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('admin.manageCategories.form.descriptionPlaceholder', 'Enter category description')}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)} disabled={isLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleSave} disabled={isLoading || !formData.name.trim()}>
                {isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin.manageCategories.delete.title', 'Delete Category')}</DialogTitle>
              <DialogDescription>
                {t('admin.manageCategories.delete.description', 'Are you sure you want to delete this category?')}
              </DialogDescription>
            </DialogHeader>
            {selectedCategory && (
              <div className="py-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selectedCategory.icon}</span>
                  <div>
                    <p className="font-semibold">{selectedCategory.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCategory.eventCount} {t('admin.manageCategories.delete.events', 'events')}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isLoading}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmDelete} disabled={isLoading}>
                {isLoading ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default ManageCategories;
