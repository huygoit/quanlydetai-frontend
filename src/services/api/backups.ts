/**
 * Sao lưu / khôi phục — chỉ Super Admin.
 * File nằm trên máy chủ, không ghi nội dung bản sao vào database.
 */
import { API_BASE_URL, getToken, type ApiResponse } from '../request';
import { downloadBlob } from '@/utils/download';

export type BanSao = {
  name: string;
  size: number;
  createdAt: string;
};

export type DanhSachSaoLuu = {
  databaseName: string;
  files: BanSao[];
};

async function docLoi(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  try {
    const json = text ? JSON.parse(text) : null;
    if (json?.message) return String(json.message);
  } catch {
    /* HTML 502/504 từ nginx — không phải JSON */
  }
  if (res.status === 502 || res.status === 504) {
    return `Máy chủ hết thời gian chờ (${res.status}). Khôi phục có thể đã chạy xong — kiểm tra dữ liệu / restart PM2.`;
  }
  if (res.status === 401 || res.status === 403) {
    return 'Phiên đăng nhập hết hạn hoặc không đủ quyền. Đăng nhập lại rồi thử lại.';
  }
  return text?.slice(0, 200) || `Thao tác thất bại (HTTP ${res.status}).`;
}

function headerAuth(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function layDanhSachSaoLuu(): Promise<ApiResponse<DanhSachSaoLuu>> {
  const res = await fetch(`${API_BASE_URL}/api/admin/backups`, { headers: headerAuth() });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json();
}

export async function taoBanSao(): Promise<ApiResponse<BanSao>> {
  const res = await fetch(`${API_BASE_URL}/api/admin/backups`, {
    method: 'POST',
    headers: headerAuth(),
  });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json();
}

export async function taiBanSao(name: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/backups/file?name=${encodeURIComponent(name)}`,
    { headers: headerAuth() },
  );
  if (!res.ok) throw new Error(await docLoi(res));
  const blob = await res.blob();
  downloadBlob(blob, name);
}

export async function xoaBanSao(name: string): Promise<void> {
  const res = await fetch(
    `${API_BASE_URL}/api/admin/backups/file?name=${encodeURIComponent(name)}`,
    { method: 'DELETE', headers: headerAuth() },
  );
  if (!res.ok) throw new Error(await docLoi(res));
}

export async function taiLenBanSao(file: File): Promise<ApiResponse<BanSao>> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE_URL}/api/admin/backups/upload`, {
    method: 'POST',
    headers: headerAuth(),
    body: fd,
  });
  if (!res.ok) throw new Error(await docLoi(res));
  return res.json();
}

export async function khoiPhucBanSao(fileName: string, confirmName: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/backups/restore`, {
    method: 'POST',
    headers: { ...headerAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, confirmName }),
  });
  if (!res.ok) throw new Error(await docLoi(res));
}
