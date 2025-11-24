import apiClient from "./apiClient";

// ===== CATEGORY DTOs =====
export interface CategoryDto {
  categoryId: number;
  categoryName: string;
  description?: string;
  eventCount: number;
  createdAt: string;
}

export interface CreateCategoryDto {
  categoryName: string;
  description?: string;
}

export interface UpdateCategoryDto {
  categoryName: string;
  description?: string;
}

// ===== CATEGORY SERVICE =====
class CategoryService {
  /**
   * GET /api/categories - List all active categories
   */
  async getCategories(): Promise<CategoryDto[]> {
    const response = await apiClient.get<CategoryDto[]>('/categories');
    return response.data;
  }

  /**
   * GET /api/categories/{id} - Get category details by ID
   */
  async getCategoryById(id: number): Promise<CategoryDto> {
    const response = await apiClient.get<CategoryDto>(`/categories/${id}`);
    return response.data;
  }

  /**
   * POST /api/categories - Create new category (Admin only)
   */
  async createCategory(dto: CreateCategoryDto): Promise<CategoryDto> {
    const response = await apiClient.post<CategoryDto>('/categories', dto);
    return response.data;
  }

  /**
   * PUT /api/categories/{id} - Update existing category (Admin only)
   */
  async updateCategory(id: number, dto: UpdateCategoryDto): Promise<CategoryDto> {
    const response = await apiClient.put<CategoryDto>(`/categories/${id}`, dto);
    return response.data;
  }

  /**
   * DELETE /api/categories/{id} - Delete category (Admin only)
   */
  async deleteCategory(id: number): Promise<boolean> {
    const response = await apiClient.delete<boolean>(`/categories/${id}`);
    return response.data;
  }
}

export const categoryService = new CategoryService();
