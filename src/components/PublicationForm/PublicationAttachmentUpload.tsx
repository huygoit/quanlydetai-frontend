/**
 * Upload nhiều file đính kèm KQNC — dùng chung hồ sơ cá nhân & module admin
 */
import React, { useRef, useState } from 'react';
import { Button, Divider, Space, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import {
  DeleteOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { uploadFileDon } from '@/services/api/fileUpload';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { downloadFromUrl } from '@/utils/download';
import { tenFileTuUrl } from '@/utils/publicationAttachments';

const THU_MUC_FILE_CONG_BO = 'profile/publication-attachments';
const DINH_DANG_FILE_CONG_BO = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp';

export type PublicationAttachmentUploadProps = {
  value?: string[];
  onChange?: (urls: string[]) => void;
};

const PublicationAttachmentUpload: React.FC<PublicationAttachmentUploadProps> = ({
  value = [],
  onChange,
}) => {
  const [dangTai, setDangTai] = useState(false);
  // Giữ giá trị mới nhất theo từng lần render để khi chọn nhiều file cùng lúc
  // các callback upload tích lũy đúng, tránh ghi đè nhau do dùng closure cũ.
  const valueRef = useRef<string[]>(value);
  valueRef.current = value;

  const danhSachFile: UploadFile[] = value.map((url, i) => ({
    uid: `att-${i}-${url}`,
    name: tenFileTuUrl(url),
    status: 'done',
    url: resolvePublicAssetUrl(url),
  }));

  const xoaFile = (file: UploadFile) => {
    const idx = danhSachFile.findIndex((f) => f.uid === file.uid);
    if (idx < 0) return;
    onChange?.(value.filter((_, i) => i !== idx));
  };

  const taiFile = (file: UploadFile) => {
    const href =
      file.url || resolvePublicAssetUrl(value.find((u) => tenFileTuUrl(u) === file.name));
    if (href) downloadFromUrl(href, file.name);
  };

  // Mở file để xem trực tiếp trên trình duyệt (PDF/ảnh xem được ngay)
  const xemFile = (file: UploadFile) => {
    const href =
      file.url || resolvePublicAssetUrl(value.find((u) => tenFileTuUrl(u) === file.name));
    if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <Upload
      multiple
      accept={DINH_DANG_FILE_CONG_BO}
      fileList={danhSachFile}
      itemRender={(_origin, file) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '2px 8px',
            marginTop: 6,
            border: '1px solid #f0f0f0',
            borderRadius: 6,
            background: '#fafafa',
          }}
        >
          <PaperClipOutlined style={{ color: '#8c8c8c', fontSize: 14, flexShrink: 0 }} />
          <a
            onClick={() => xemFile(file)}
            title={file.name}
            style={{
              maxWidth: 640,
              color: 'rgba(0, 0, 0, 0.85)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.name}
          </a>
          <Space
            split={<Divider type="vertical" style={{ margin: 0 }} />}
            size={6}
            style={{ flexShrink: 0, marginLeft: 16 }}
          >
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => xemFile(file)}>
              Xem
            </Button>
            <Button
              type="link"
              size="small"
              style={{ padding: 0 }}
              icon={<DownloadOutlined />}
              onClick={() => taiFile(file)}
            >
              Tải xuống
            </Button>
            <Button
              type="link"
              danger
              size="small"
              style={{ padding: 0 }}
              icon={<DeleteOutlined />}
              onClick={() => xoaFile(file)}
            >
              Xóa
            </Button>
          </Space>
        </div>
      )}
      customRequest={async (options) => {
        const file = options.file as File;
        setDangTai(true);
        try {
          const kq = await uploadFileDon(file, { folder: THU_MUC_FILE_CONG_BO });
          // Cập nhật ref đồng bộ ngay để lần upload kế tiếp thấy được file vừa thêm.
          const next = [...valueRef.current, kq.url];
          valueRef.current = next;
          onChange?.(next);
          options.onSuccess?.(kq as unknown as Record<string, unknown>);
          message.success(`Đã tải lên: ${file.name}`);
        } catch (e: unknown) {
          const err = e as { message?: string };
          message.error(err?.message || 'Tải file lên thất bại');
          options.onError?.(e as Error);
        } finally {
          setDangTai(false);
        }
      }}
    >
      <Button icon={<UploadOutlined />} loading={dangTai}>
        Chọn file đính kèm
      </Button>
    </Upload>
  );
};

export default PublicationAttachmentUpload;
