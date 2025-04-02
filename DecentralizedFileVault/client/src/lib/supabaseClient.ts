// Client-side interface to interact with Supabase through our API
import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
// Ensure URL is properly formed with https:// prefix
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseUrl = rawSupabaseUrl.startsWith('http') 
  ? rawSupabaseUrl 
  : `https://${rawSupabaseUrl}`;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || '';

// Log Supabase configuration (for debugging)
console.log(`Supabase client URL: ${supabaseUrl}`);
console.log(`Supabase client key available: ${supabaseKey ? 'Yes (masked for security)' : 'No'}`);

// Create Supabase client instance (for direct operations if needed)
export const supabaseClient = createClient(supabaseUrl, supabaseKey);

// ===== Authentication Functions =====

// Get current user
export async function getCurrentUser() {
  const response = await fetch('/api/auth/user', {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to get current user');
  }

  return await response.json();
}

// Login user
export async function loginUser(username: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const errorJson = JSON.parse(errorText);
      throw new Error(errorJson.error || 'Login failed');
    } catch (e) {
      throw new Error(`Login failed: ${errorText}`);
    }
  }

  return await response.json();
}

// Register new user
export async function registerUser(email: string, password: string, username: string) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, username }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Registration failed: ${error}`);
  }

  return await response.json();
}

// Logout user
export async function logoutUser() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Logout failed: ${error}`);
  }

  return true;
}

// Share file with another user by email
export async function shareFile(fileId: string, email: string, permission: string) {
  const response = await fetch('/api/files/share', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, email, permission }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sharing failed: ${error}`);
  }

  return await response.json();
}

// Share file with another user by recipient ID
export async function shareFileByRecipientId(fileId: string, recipientId: number, permission: string) {
  const response = await fetch('/api/files/share-by-id', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, recipientId, permission }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sharing failed: ${error}`);
  }

  return await response.json();
}

// Get shared link for a file
export async function getShareLink(fileId: string, requirePassword: boolean, password?: string) {
  const response = await fetch('/api/files/share-link', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileId, requirePassword, password }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to generate share link: ${error}`);
  }

  return await response.json();
}
