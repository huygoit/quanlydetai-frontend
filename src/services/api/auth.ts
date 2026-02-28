/**
 * Authentication API Service
 */
import { post, get, setToken, removeToken, ApiResponse } from '../request';
import type { UserRole } from '../mock/homeMockService';

// Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: number;
    email: string;
    fullName: string;
    role: UserRole;
    unit?: string;
    isActive: boolean;
  };
  token: {
    type: string;
    token: string;
    expiresAt: string;
  };
}

export interface CurrentUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  unit?: string;
  isActive: boolean;
}

// API Functions

/**
 * Đăng nhập
 */
export async function login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
  const response = await post<ApiResponse<LoginResponse>>('/api/auth/login', data, {
    skipAuth: true,
  });
  
  // Save token to localStorage
  if (response.success && response.data.token) {
    setToken(response.data.token.token);
  }
  
  return response;
}

/**
 * Đăng xuất
 */
export async function logout(): Promise<ApiResponse<null>> {
  try {
    const response = await post<ApiResponse<null>>('/api/auth/logout');
    return response;
  } finally {
    // Always remove token
    removeToken();
  }
}

/**
 * Lấy thông tin user hiện tại
 */
export async function getCurrentUser(): Promise<ApiResponse<CurrentUser>> {
  return get<ApiResponse<CurrentUser>>('/api/auth/me');
}

/**
 * Đổi mật khẩu
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<ApiResponse<null>> {
  return post<ApiResponse<null>>('/api/auth/change-password', data);
}
