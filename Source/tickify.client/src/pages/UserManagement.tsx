import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Search,
  UserCog,
  CheckCircle,
  XCircle,
  Loader2,
  Ban,
  Trash2,
} from "lucide-react";
import { userService } from "../services/userService";
import apiClient from "../services/apiClient";
import { useTranslation } from "react-i18next";

interface User {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

interface OrganizerRequest {
  requestId: number;
  userId: number;
  user: {
    fullName: string;
    email: string;
  };
  organizationName: string;
  businessRegistration: string;
  phoneNumber: string;
  address: string;
  description?: string;
  status: string;
  requestedAt: string;
}

interface UserManagementProps {
  onNavigate: (page: string) => void;
}

export function UserManagement({ onNavigate }: UserManagementProps) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [organizerRequests, setOrganizerRequests] = useState<
    OrganizerRequest[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "requests">("users");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, [pageNumber, searchTerm]);

  const fetchData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [usersRes, requestsRes] = await Promise.all([
        userService.getUsers(pageNumber, pageSize, searchTerm || undefined),
        apiClient.get("/Admin/organizer-requests"),
      ]);
      setUsers(usersRes.items || []);
      setTotalPages(usersRes.totalPages);
      setOrganizerRequests(requestsRes.data.data || []);
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.response?.data?.message || "Không thể tải dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    try {
      await userService.assignRole(userId, roleId);
      await fetchData();
    } catch (error) {
      console.error("Error updating role:", error);
      setError("Không thể cập nhật vai trò");
    }
  };

  const handleToggleActive = async (userId: number) => {
    try {
      await userService.toggleActiveStatus(userId);
      await fetchData();
    } catch (error) {
      console.error("Error toggling active status:", error);
      setError("Không thể thay đổi trạng thái");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      await userService.deleteUser(userId);
      await fetchData();
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Không thể xóa người dùng");
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    try {
      await apiClient.post(`/Admin/organizer-requests/${requestId}/approve`);
      await fetchData();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiClient.post(`/Admin/organizer-requests/${requestId}/reject`);
      await fetchData();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingRequests = organizerRequests.filter(
    (r) => r.status === "Pending"
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Quản lý người dùng
          </h1>
          <p className="text-neutral-600">
            Quản lý users và xét duyệt yêu cầu trở thành organizer
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <UserCog className="mr-2" size={18} />
            Danh sách Users ({users.length})
          </Button>
          <Button
            variant={activeTab === "requests" ? "default" : "outline"}
            onClick={() => setActiveTab("requests")}
          >
            <CheckCircle className="mr-2" size={18} />
            Yêu cầu Organizer ({pendingRequests.length})
          </Button>
        </div>

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <div className="flex gap-4 mt-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    size={20}
                  />
                  <Input
                    placeholder="Tìm kiếm theo tên hoặc email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center py-8">Đang tải...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.userId}>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "Admin" ? "destructive" : "default"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.isEmailVerified ? (
                            <Badge variant="default" className="bg-green-600">
                              Đã xác thực
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Chưa xác thực</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) =>
                              handleRoleChange(user.userId, Number(value))
                            }
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="User">User</SelectItem>
                              <SelectItem value="Organizer">
                                Organizer
                              </SelectItem>
                              <SelectItem value="Staff">Staff</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Organizer Requests Tab */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-center py-8">Đang tải...</p>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-neutral-500">
                    Không có yêu cầu nào đang chờ xử lý
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card key={request.requestId}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {request.organizationName}
                        </CardTitle>
                        <p className="text-sm text-neutral-600 mt-1">
                          Người yêu cầu: {request.user.fullName} (
                          {request.user.email})
                        </p>
                      </div>
                      <Badge>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          Mã số thuế
                        </p>
                        <p className="text-sm text-neutral-600">
                          {request.businessRegistration}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          Số điện thoại
                        </p>
                        <p className="text-sm text-neutral-600">
                          {request.phoneNumber}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-sm font-medium text-neutral-700">
                          Địa chỉ
                        </p>
                        <p className="text-sm text-neutral-600">
                          {request.address}
                        </p>
                      </div>
                      {request.description && (
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-neutral-700">
                            Mô tả
                          </p>
                          <p className="text-sm text-neutral-600">
                            {request.description}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-700">
                          Ngày gửi
                        </p>
                        <p className="text-sm text-neutral-600">
                          {new Date(request.requestedAt).toLocaleString(
                            "vi-VN"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleApproveRequest(request.requestId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="mr-2" size={18} />
                        Phê duyệt
                      </Button>
                      <Button
                        onClick={() => handleRejectRequest(request.requestId)}
                        variant="destructive"
                      >
                        <XCircle className="mr-2" size={18} />
                        Từ chối
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
