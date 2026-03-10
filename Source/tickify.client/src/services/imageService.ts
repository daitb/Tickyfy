import apiClient from "./apiClient";
import { toast } from "sonner";

export interface ImageUploadResponse {
  blobName: string;
  imageUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  message: string;
}

export interface ImageUrlResponse {
  blobName: string;
  imageUrl: string;
  expiresAt: string;
}

class ImageService {
  /**
   * Upload image file to Azure Storage
   * @param file - Image file to upload
   * @returns Upload response with imageUrl and blobName
   */
  async uploadImage(file: File): Promise<ImageUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<ImageUploadResponse>('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể tải ảnh lên. Vui lòng thử lại.';
      toast.error(errorMsg);
      throw error;
    }
  }

  /**
   * Get image URL by blob name
   * @param blobName - Blob name from upload response
   * @param expiryHours - Hours before URL expires (default: 24)
   */
  async getImageUrl(blobName: string, expiryHours: number = 24): Promise<ImageUrlResponse> {
    try {
      const response = await apiClient.get<ImageUrlResponse>(
        `/images/${blobName}?expiryHours=${expiryHours}`
      );

      return response.data;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Delete image by blob name
   * @param blobName - Blob name to delete
   */
  async deleteImage(blobName: string): Promise<{ message: string; blobName: string }> {
    try {
      const response = await apiClient.delete<{ message: string; blobName: string }>(
        `/images/${blobName}`
      );

      return response.data;
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Không thể xóa ảnh. Vui lòng thử lại.';
      toast.error(errorMsg);
      throw error;
    }
  }

  /**
   * Validate image file before upload
   * @param file - File to validate
   * @returns Error message if invalid, null if valid
   */
  validateImageFile(file: File): { key: string; params?: any } | null {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return { 
        key: 'image.validation.invalidType',
        params: { type: file.type }
      };
    }

    if (file.size > maxSize) {
      return { 
        key: 'image.validation.sizeTooLarge',
        params: { size: (file.size / 1024 / 1024).toFixed(2) }
      };
    }

    return null;
  }
}

export const imageService = new ImageService();
