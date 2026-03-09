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

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface RegisterResponse {
  user: {
    id: number;
    email: string;
    fullName?: string;
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

export interface ProfileRole {
  id: number;
  code: string;
  name: string;
}

export interface ProfileDepartment {
  id: number;
  name: string;
}

/** Response từ /api/auth/me - có thể có permissions */
export interface ProfileUser {
  id: number;
  username?: string;
  fullName?: string;
  full_name?: string;
  email: string;
  role?: UserRole;
  unit?: string;
  isActive?: boolean;
  department_id?: number;
  department?: ProfileDepartment;
  roles?: ProfileRole[];
  permissions?: string[];
}

export type CurrentUser = ProfileUser;

// API Functions

/**
 * Đăng ký tài khoản
 */
export async function register(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ApiResponse<RegisterResponse>> {
  return post<ApiResponse<RegisterResponse>>('/api/auth/register', data, {
    skipAuth: true,
  });
}

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
 * Lấy thông tin user hiện tại (profile với permissions)
 */
export async function getCurrentUser(): Promise<ApiResponse<ProfileUser>> {
  return get<ApiResponse<ProfileUser>>('/api/auth/me');
}

/**
 * Flatten permissions từ roles nếu backend trả permissions trong role
 */
export function normalizePermissions(user: ProfileUser | undefined): string[] {
  if (!user) return [];
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions;
  }
  const fromRoles = (user.roles || [])
    .flatMap((r: any) => r.permissions || [])
    .map((p: any) => (typeof p === 'string' ? p : p?.code || p?.name));
  return [...new Set(fromRoles)];
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
