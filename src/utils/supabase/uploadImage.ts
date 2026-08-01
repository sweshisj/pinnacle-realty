import { supabase } from './client';

/**
 * Uploads an image file to Supabase Storage and returns the public URL
 * @param file The image file to upload
 * @param bucket The storage bucket name (default: 'property-images')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(file: File, bucket: string = 'property-images'): Promise<string> {
  try {
    // Generate a unique filename using timestamp and random string
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '0', // Disable caching for immediate visibility
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Deletes an image from Supabase Storage
 * @param imageUrl The public URL of the image to delete
 * @param bucket The storage bucket name (default: 'property-images')
 */
export async function deleteImage(imageUrl: string, bucket: string = 'property-images'): Promise<void> {
  try {
    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
}