/**
 * Adds a cache-busting query parameter to an image URL
 * This ensures images are refreshed when they change
 */
export function getCacheBustedImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // If URL already has query parameters, append to them
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Removes cache-busting parameters from an image URL
 * Useful when storing URLs in database
 */
export function getCleanImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // Remove query parameters
  return url.split('?')[0];
}

/**
 * Checks if an image URL is valid and accessible
 */
export async function isImageAccessible(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
