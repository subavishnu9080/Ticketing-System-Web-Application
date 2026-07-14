const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

/**
 * Helper to perform API requests to the backend server.
 * Handles headers, JSON encoding/decoding, and friendly network error messages.
 * 
 * @param {string} endpoint - The API endpoint path (e.g. '/api/auth/login') or a full URL
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @param {string} [token] - Optional JWT token for Authorization header
 * @returns {Promise<any>} Response data parsed from JSON or text
 */
export async function apiFetch(endpoint, options = {}, token = null) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = { ...options.headers };
  
  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      const errorMessage = (data && typeof data === 'object' ? data.message : data) || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }
    
    return data;
  } catch (err) {
    // If it's a browser TypeError, it usually indicates a network connection error (e.g. backend server is offline)
    if (err instanceof TypeError || err.message === 'Failed to fetch' || err.message.includes('fetch')) {
      throw new Error('Unable to connect to the backend server. Please verify that the backend server is running on port 5000.');
    }
    throw err;
  }
}
