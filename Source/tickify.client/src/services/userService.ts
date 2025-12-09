import apiClient from "./apiClient";

// ===== INTERFACES =====
export interface UserListDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface UserDetailDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  avatarUrl?: string;
  bio?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  country?: string;
  role: string;
  roles: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UserProfileDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  roles: string[];
  totalBookings: number;
  totalEventsAttended: number;
  memberSince: string;
}

export interface UpdateProfileDto {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface AssignRoleDto {
  roleId: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// ===== USER SERVICE =====
class UserService {
  /**
   * Get list of users (Admin only)
   */
  async getUsers(
    pageNumber: number = 1,
    pageSize: number = 10,
    searchTerm?: string,
    role?: string,
    isActive?: boolean,
    emailVerified?: boolean
  ): Promise<PagedResult<UserListDto>> {
    const params: any = { pageNumber, pageSize };
    if (searchTerm) params.searchTerm = searchTerm;
    if (role) params.role = role;
    if (isActive !== undefined) params.isActive = isActive;
    if (emailVerified !== undefined) params.emailVerified = emailVerified;

    const response = await apiClient.get<PagedResult<UserListDto>>("/users", {
      params,
    });
    return response.data;
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(id: number): Promise<UserDetailDto> {
    const response = await apiClient.get<UserDetailDto>(`/users/${id}`);
    return response.data;
  }

  /**
   * Get current user profile
   */
  async getCurrentUserProfile(): Promise<UserProfileDto> {
    const response = await apiClient.get<UserProfileDto>("/users/profile");
    return response.data;
  }

  /**
   * Update current user profile
   */
  async updateProfile(data: UpdateProfileDto): Promise<UserProfileDto> {
    const response = await apiClient.put<UserProfileDto>("/users/profile", data);
    return response.data;
  }

  /**
   * Upload avatar for current user
   */
  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<string>("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  }

  /**
   * Assign role to user (Admin only)
   */
  async assignRole(userId: number, roleId: number): Promise<void> {
    await apiClient.post(`/users/${userId}/assign-role`, { roleId });
  }

  /**
   * Toggle user active status (Admin only)
   */
  async toggleActiveStatus(userId: number): Promise<void> {
    await apiClient.put(`/users/${userId}/toggle-active`);
  }

  /**
   * Delete user (Admin only)
   */
  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`);
  }
}

export const userService = new UserService();
