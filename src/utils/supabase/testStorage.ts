import { supabase } from './client';

/**
 * Tests if the Supabase Storage bucket is properly configured
 * @param bucket The storage bucket name (default: 'property-images')
 * @returns Object with success status and message
 */
export async function testStorageBucket(bucket: string = 'property-images'): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // Try to list files in the bucket (this will fail if bucket doesn't exist)
    const { data, error } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 1
      });

    if (error) {
      console.error('Storage bucket test error:', error);
      
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: `Storage bucket '${bucket}' does not exist. Please create it in Supabase Dashboard.`,
          details: error
        };
      }
      
      return {
        success: false,
        message: `Storage bucket error: ${error.message}`,
        details: error
      };
    }

    return {
      success: true,
      message: `Storage bucket '${bucket}' is properly configured!`,
      details: { fileCount: data?.length || 0 }
    };
  } catch (error: any) {
    console.error('Storage test exception:', error);
    return {
      success: false,
      message: `Storage test failed: ${error.message || 'Unknown error'}`,
      details: error
    };
  }
}

/**
 * Creates a test upload to verify upload functionality
 * @param bucket The storage bucket name (default: 'property-images')
 */
export async function testImageUpload(bucket: string = 'property-images'): Promise<{ success: boolean; message: string; url?: string }> {
  try {
    // Create a small test image (1x1 red pixel PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
    const testImageBlob = await fetch(`data:image/png;base64,${testImageBase64}`).then(r => r.blob());
    const testFile = new File([testImageBlob], 'test.png', { type: 'image/png' });
    
    const fileName = `test-${Date.now()}.png`;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, testFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Test upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error.message}`
      };
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    // Clean up test file
    await supabase.storage
      .from(bucket)
      .remove([fileName]);

    return {
      success: true,
      message: 'Upload test successful!',
      url: urlData.publicUrl
    };
  } catch (error: any) {
    console.error('Test upload exception:', error);
    return {
      success: false,
      message: `Upload test failed: ${error.message || 'Unknown error'}`
    };
  }
}
