import apiClient from "./apiClient";

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
    console.log('[ImageService] Starting upload for file:', {
      name: file.name,
      size: `${(file.size / 1024).toFixed(2)} KB`,
      type: file.type
    });

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('[ImageService] Sending request to /api/images/upload');
      
      const response = await apiClient.post<ImageUploadResponse>('/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('[ImageService] Upload successful:', {
        blobName: response.data.blobName,
        imageUrl: response.data.imageUrl,
        message: response.data.message
      });

      return response.data;
    } catch (error: any) {
      console.error('[ImageService] Upload failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Get image URL by blob name
   * @param blobName - Blob name from upload response
   * @param expiryHours - Hours before URL expires (default: 24)
   */
  async getImageUrl(blobName: string, expiryHours: number = 24): Promise<ImageUrlResponse> {
    console.log('[ImageService] Getting URL for blob:', blobName);

    try {
      const response = await apiClient.get<ImageUrlResponse>(
        `/images/${blobName}?expiryHours=${expiryHours}`
      );

      console.log('[ImageService] URL retrieved:', response.data.imageUrl);
      return response.data;
    } catch (error: any) {
      console.error('[ImageService] Failed to get URL:', error.message);
      throw error;
    }
  }

  /**
   * Delete image by blob name
   * @param blobName - Blob name to delete
   */
  async deleteImage(blobName: string): Promise<{ message: string; blobName: string }> {
    console.log('[ImageService] Deleting blob:', blobName);

    try {
      const response = await apiClient.delete<{ message: string; blobName: string }>(
        `/images/${blobName}`
      );

      console.log('[ImageService] ✅ Image deleted:', response.data.message);
      return response.data;
    } catch (error: any) {
      console.error('[ImageService] ❌ Failed to delete:', error.message);
      throw error;
    }
  }

  /**
   * Validate image file before upload
   * @param file - File to validate
   * @returns Error message if invalid, null if valid
   */
  validateImageFile(file: File): string | null {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    console.log('[ImageService] Validating file:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!allowedTypes.includes(file.type)) {
      const error = 'Invalid file type. Only JPG, PNG, GIF, and WebP images are allowed.';
      console.warn('[ImageService] ⚠️ Validation failed:', error);
      return error;
    }

    if (file.size > maxSize) {
      const error = `File size exceeds 5MB limit. Your file: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      console.warn('[ImageService] ⚠️ Validation failed:', error);
      return error;
    }

    console.log('[ImageService] File validation passed');
    return null;
  }
}

export const imageService = new ImageService();
