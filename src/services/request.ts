/**
 * API Request Configuration
 *
 * - Mặc định API_BASE_URL = '' → gọi relative /api/... (dev: proxy Umi; prod: Nginx/proxy cùng domain).
 * - Chỉ khi set UMI_APP_API_URL (hoặc API_URL) có giá trị thật mới gọi thẳng URL đó (vd backend khác domain).
 * Lý do: .env với UMI_APP_API_URL rỗng Umi thường không inject → trước đây prod rơi vào localhost:3333.
 */
import { request as umiRequest, history } from '@umijs/max';
import { message } from 'antd';
import { chuanHoaLoiTacGia, laLoiThieuNhomChinh } from '@/utils/authorValidationMessages';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';

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
    // Chỉ hiện message nghiệp vụ — không hiện "Request failed with status code …"
    let toastMsg = '';

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data ?? error.data ?? {};

      switch (status) {
        case 401:
          removeToken();
          // Đang ở trang login: hiển thị message từ backend (sai email/mật khẩu), không redirect
          if (history.location?.pathname === '/login') {
            toastMsg = layThongBaoLoi(error, 'Email hoặc mật khẩu không đúng.');
          } else {
            toastMsg = 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
            history.push('/login');
          }
          break;
        case 403:
          toastMsg = 'Bạn không có quyền thực hiện thao tác này.';
          break;
        case 400: {
          const raw400 = layThongBaoLoi(error, 'Yêu cầu không hợp lệ.');
          if (!laLoiThieuNhomChinh(raw400)) {
            toastMsg = chuanHoaLoiTacGia(raw400) || 'Yêu cầu không hợp lệ.';
          }
          break;
        }
        case 404:
          toastMsg = layThongBaoLoi(error, 'Không tìm thấy tài nguyên.');
          break;
        case 422: {
          const rawMsg = layThongBaoLoi(error, 'Dữ liệu không hợp lệ.');
          if (!laLoiThieuNhomChinh(rawMsg)) {
            toastMsg = chuanHoaLoiTacGia(rawMsg) || 'Dữ liệu không hợp lệ.';
          }
          break;
        }
        case 500:
          toastMsg = 'Lỗi máy chủ. Vui lòng thử lại sau.';
          break;
        case 503:
          toastMsg = layThongBaoLoi(error, 'Hệ thống đang bận. Vui lòng thử lại sau.');
          break;
        default:
          toastMsg = layThongBaoLoi(error, 'Đã có lỗi xảy ra.');
      }
    } else if (
      error.message === 'Failed to fetch' ||
      error.message === 'Network Error'
    ) {
      toastMsg = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
    } else {
      toastMsg = layThongBaoLoi(error, '');
    }

    if (toastMsg) {
      message.error(toastMsg);
      error.displayMessage = toastMsg;
      error.message = toastMsg;
      error.__toastShown = true;
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
