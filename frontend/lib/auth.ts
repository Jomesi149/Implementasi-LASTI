/**
 * JWT token utilities
 */

interface JWTPayload {
  sub?: string;
  user_id?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

/**
 * Decode JWT token (without verification - only for reading claims)
 * In production, verify tokens on backend!
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT format');
      return null;
    }

    // Base64 URL decode (replace - and _ to restore standard base64)
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
    );
    return decoded as JWTPayload;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Get user ID from stored token
 */
export function getUserIdFromToken(): string | null {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No accessToken in localStorage');
      return null;
    }

    console.log('Token found, length:', token.length);
    const payload = decodeJWT(token);
    
    if (!payload) {
      console.warn('Failed to decode JWT payload');
      return null;
    }

    console.log('JWT Payload:', payload);

    // Try common field names for user ID in JWT
    const userId = payload.sub || payload.user_id || payload.id;
    
    if (!userId) {
      console.warn('No user ID found in JWT payload. Available keys:', Object.keys(payload));
      return null;
    }
    
    console.log('✓ User ID extracted from token:', userId);
    return userId;
  } catch (error) {
    console.error('Failed to get user ID from token:', error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

/**
 * Clear auth tokens from storage
 */
export function clearAuthTokens(): void {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
