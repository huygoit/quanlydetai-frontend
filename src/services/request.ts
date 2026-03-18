/**
 * API Request Configuration
 *
 * - Mặc định API_BASE_URL = '' → gọi relative /api/... (dev: proxy Umi; prod: Nginx/proxy cùng domain).
 * - Chỉ khi set UMI_APP_API_URL (hoặc API_URL) có giá trị thật mới gọi thẳng URL đó (vd backend khác domain).
 * Lý do: .env với UMI_APP_API_URL rỗng Umi thường không inject → trước đây prod rơi vào localhost:3333.
 */
import { request as umiRequest, history } from '@umijs/max';
import { message } from 'antd';

const fromEnv = process.env.UMI_APP_API_URL || process.env.API_URL;
export const API_BASE_URL = fromEnv && String(fromEnv).trim() !== '' ? String(fromEnv).trim() : '';

// Token storage key
const TOKEN_KEY = 'khcn-access-token';
const USER_KEY = 'khcn-current-user';

// Token helpers
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// Request wrapper với auth header và error handling
export async function request<T = any>(
  url: string,
  options?: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    data?: any;
    params?: any;
    headers?: Record<string, string>;
    skipAuth?: boolean;
  },
): Promise<T> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  // Add auth token if exists and not skipped
  if (token && !options?.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await umiRequest<T>(`${API_BASE_URL}${url}`, {
      method: options?.method || 'GET',
      headers,
      data: options?.data,
      params: options?.params,
      // UmiJS request options
      skipErrorHandler: true,
    });

    return response;
  } catch (error: any) {
    // Handle different error types
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data ?? error.data ?? {};

      switch (status) {
        case 401:
          removeToken();
          // Đang ở trang login: hiển thị message từ backend (sai email/mật khẩu), không redirect
          if (history.location?.pathname === '/login') {
            message.error(data.message || 'Email hoặc mật khẩu không đúng.');
          } else {
            message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
            history.push('/login');
          }
          break;
        case 403:
          message.error('Bạn không có quyền thực hiện thao tác này.');
          break;
        case 400:
          message.error(data.message || 'Yêu cầu không hợp lệ.');
          break;
        case 404:
          message.error(data.message || 'Không tìm thấy tài nguyên.');
          break;
        case 422:
          // Validation error (AdonisJS: errors là mảng {field, rule, message})
          if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            const first = data.errors[0];
            message.error(first?.message || data.errors[0]);
          } else if (data.errors && typeof data.errors === 'object') {
            const firstVal = Object.values(data.errors)[0];
            message.error(Array.isArray(firstVal) ? firstVal[0] : String(firstVal));
          } else {
            message.error(data.message || 'Dữ liệu không hợp lệ.');
          }
          break;
        case 500:
          message.error('Lỗi máy chủ. Vui lòng thử lại sau.');
          break;
        default:
          message.error(data.message || 'Đã có lỗi xảy ra.');
      }
    } else if (error.message === 'Failed to fetch') {
      message.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
    }

    throw error;
  }
}

// Shorthand methods
export const get = <T = any>(url: string, params?: any, options?: any) =>
  request<T>(url, { method: 'GET', params, ...options });

export const post = <T = any>(url: string, data?: any, options?: any) =>
  request<T>(url, { method: 'POST', data, ...options });

export const put = <T = any>(url: string, data?: any, options?: any) =>
  request<T>(url, { method: 'PUT', data, ...options });

export const del = <T = any>(url: string, options?: any) =>
  request<T>(url, { method: 'DELETE', ...options });

export const patch = <T = any>(url: string, data?: any, options?: any) =>
  request<T>(url, { method: 'PATCH', data, ...options });

// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    currentPage: number;
    perPage: number;
    lastPage: number;
  };
}
