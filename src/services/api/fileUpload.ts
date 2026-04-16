import { API_BASE_URL, getToken } from '../request';

export type KetQuaUploadFile = {
  /** URL để tải/xem file sau khi upload */
  url: string;
  /** Tên file phía server (nếu có) */
  name?: string;
};

const uploadEndpointFromEnv = process.env.UMI_APP_UPLOAD_ENDPOINT;
const UPLOAD_ENDPOINT =
  uploadEndpointFromEnv && String(uploadEndpointFromEnv).trim() !== ''
    ? String(uploadEndpointFromEnv).trim()
    : '/api/uploads';

const uploadFolderFromEnv = process.env.UMI_APP_UPLOAD_FOLDER;
export const THU_MUC_UPLOAD_MAC_DINH =
  uploadFolderFromEnv && String(uploadFolderFromEnv).trim() !== ''
    ? String(uploadFolderFromEnv).trim()
    : 'profile/language-certificates';

/**
 * Upload 1 file lên server (multipart/form-data).
 *
 * Quy ước response: ưu tiên các dạng phổ biến:
 * - { success: true, data: { url: string } }
 * - { url: string }
 * - { data: { url: string } }
 */
export async function uploadFileDon(
  file: File,
  opts?: {
    folder?: string;
    fieldName?: string;
    extraData?: Record<string, any>;
  },
): Promise<KetQuaUploadFile> {
  const token = getToken();
  const fd = new FormData();
  const fieldName = opts?.fieldName || 'file';
  fd.append(fieldName, file);

  const folder = opts?.folder || THU_MUC_UPLOAD_MAC_DINH;
  if (folder) fd.append('folder', folder);

  if (opts?.extraData) {
    Object.entries(opts.extraData).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      fd.append(k, String(v));
    });
  }

  const res = await fetch(`${API_BASE_URL}${UPLOAD_ENDPOINT}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  });

  if (!res.ok) {
    throw new Error('Tải file lên thất bại');
  }

  const json = await res.json().catch(() => null);
  const url =
    json?.data?.url ||
    json?.url ||
    json?.data?.data?.url ||
    (typeof json?.data === 'string' ? json.data : undefined);

  if (!url || typeof url !== 'string') {
    throw new Error('Server không trả về đường dẫn file hợp lệ');
  }

  return { url, name: json?.data?.name || json?.name };
}

