import apiClient from './apiClient';

export interface AdminStatsDto {
  totalRevenue: number;
  platformFees: number;
  totalEvents: number;
  activeEvents: number;
  totalUsers: number;
  activeUsers: number;
  totalOrganizers: number;
  pendingEvents: number;
  pendingOrganizerRequests: number;
  revenueGrowthPercentage: number;
  userGrowthPercentage: number;
}

export interface MonthlyRevenueDto {
  month: string;
  revenue: number;
  users: number;
}

export interface CategoryDistributionDto {
  name: string;
  value: number;
  color: string;
}

export interface RecentUserDto {
  id: number;
  name: string;
  email: string;
  joined: string;
  orders: number;
  spent: number;
}

export interface OrganizerListDto {
  id: number;
  name: string;
  email: string;
  events: number;
  revenue: number;
  status: string;
}

export interface OrganizerRequestDto {
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
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
}

export interface PendingEventDto {
  id: number;
  eventId?: number; // Keep for backward compatibility
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  image?: string;
  organizerId: number;
  organizerName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  reviewedBy?: number;
  reviewDate?: string;
  rejectionReason?: string;
}

/**
 * Admin Service
 * Handles all admin-related API calls
 */
export const adminService = {
  /**
   * GET /api/admin/organizer-requests - Get all organizer requests
   */
  async getOrganizerRequests(): Promise<OrganizerRequestDto[]> {
    const response = await apiClient.get('/admin/organizer-requests');
    return response.data.data || response.data || [];
  },

  /**
   * POST /api/admin/organizer-requests/{id}/approve - Approve organizer request
   */
  async approveOrganizerRequest(id: number): Promise<void> {
    await apiClient.post(`/admin/organizer-requests/${id}/approve`);
  },

  /**
   * POST /api/admin/organizer-requests/{id}/reject - Reject organizer request
   */
  async rejectOrganizerRequest(id: number, reviewNotes?: string): Promise<void> {
    await apiClient.post(`/admin/organizer-requests/${id}/reject`, { reviewNotes });
  },

  /**
   * GET /api/admin/events/pending - Get all pending events
   */
  async getPendingEvents(): Promise<PendingEventDto[]> {
    const response = await apiClient.get('/admin/events/pending');
    return response.data.data || response.data || [];
  },

  /**
   * GET /api/admin/events - Get all events (for admin dashboard)
   */
  async getAllEvents(): Promise<any[]> {
    const response = await apiClient.get('/admin/events');
    return response.data.data || response.data || [];
  },

  /**
   * GET /api/admin/events/analytics - Get all events with analytics data
   */
  async getAllEventsWithAnalytics(): Promise<any[]> {
    const response = await apiClient.get('/admin/events/analytics');
    return response.data.data || response.data || [];
  },

  /**
   * POST /api/admin/events/{id}/approve - Approve event
   */
  async approveEvent(id: number): Promise<void> {
    await apiClient.post(`/admin/events/${id}/approve`);
  },

  /**
   * POST /api/admin/events/{id}/reject - Reject event with reason
   */
  async rejectEvent(id: number, rejectionReason?: string): Promise<void> {
    await apiClient.post(`/admin/events/${id}/reject`, { rejectionReason });
  },

  /**
   * GET /api/admin/dashboard/stats - Get admin dashboard statistics
   */
  async getDashboardStats(): Promise<AdminStatsDto> {
    const response = await apiClient.get('/admin/dashboard/stats');
    return response.data.data || response.data;
  },

  /**
   * GET /api/admin/dashboard/revenue-trend - Get monthly revenue trend
   */
  async getMonthlyRevenue(months: number = 6): Promise<MonthlyRevenueDto[]> {
    const response = await apiClient.get(`/admin/dashboard/revenue-trend?months=${months}`);
    return response.data.data || response.data || [];
  },

  /**
   * GET /api/admin/dashboard/category-distribution - Get category distribution
   */
  async getCategoryDistribution(): Promise<CategoryDistributionDto[]> {
    const response = await apiClient.get('/admin/dashboard/category-distribution');
    return response.data.data || response.data || [];
  },

  /**
   * GET /api/admin/dashboard/recent-users - Get recent users
   */
  async getRecentUsers(count: number = 5): Promise<RecentUserDto[]> {
    const response = await apiClient.get(`/admin/dashboard/recent-users?count=${count}`);
    return response.data.data || response.data || [];
  },

  /**
   * GET /api/admin/dashboard/organizers - Get organizers list
   */
  async getOrganizersList(): Promise<OrganizerListDto[]> {
    const response = await apiClient.get('/admin/dashboard/organizers');
    return response.data.data || response.data || [];
  }
};
