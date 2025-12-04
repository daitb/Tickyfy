import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Users,
  Search,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  ArrowLeft,
  Mail,
  Calendar,
} from 'lucide-react';
import apiClient from '../services/apiClient';

interface ManageUsersProps {
  onNavigate: (page: string, userId?: string) => void;
}

interface UserDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  roles: string[];
}

export function ManageUsers({ onNavigate }: ManageUsersProps) {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Assuming there's a users endpoint - adjust based on your API
      const response = await apiClient.get<UserDto[]>('/Users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: UserDto) => {
    try {
      // Assuming there's an endpoint to toggle user active status
      await apiClient.put(`/users/${user.userId}/toggle-active`, {
        isActive: !user.isActive,
      });
      setSuccess(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to update user status');
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (roles: string[]) => {
    if (roles.includes('Admin')) {
      return <Badge className="bg-red-100 text-red-700">Admin</Badge>;
    }
    if (roles.includes('Organizer')) {
      return <Badge className="bg-blue-100 text-blue-700">Organizer</Badge>;
    }
    if (roles.includes('Staff')) {
      return <Badge className="bg-green-100 text-green-700">Staff</Badge>;
    }
    return <Badge className="bg-neutral-100 text-neutral-700">Customer</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('admin-dashboard')}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Users className="text-orange-500" size={32} />
                <h1>User Management</h1>
              </div>
            </div>
            <p className="text-neutral-600">Manage platform users and permissions</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <UserX className="text-red-600" size={16} />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <UserCheck className="text-green-600" size={16} />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                No users found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.userId}>
                      <TableCell>
                        <div>
                          <div className="text-neutral-900 font-medium">{user.fullName}</div>
                          {user.phoneNumber && (
                            <div className="text-sm text-neutral-500">{user.phoneNumber}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-neutral-400" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.roles || [])}</TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge className="bg-green-100 text-green-700">
                            <UserCheck size={12} className="mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700">
                            <UserX size={12} className="mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <Calendar size={14} />
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(user)}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

