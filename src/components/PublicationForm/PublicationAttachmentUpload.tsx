/**
 * Upload nhiều file đính kèm KQNC — dùng chung hồ sơ cá nhân & module admin
 */
import React, { useRef, useState } from 'react';
import { Button, Space, Tooltip, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { DeleteOutlined, DownloadOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
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

  return (
    <Upload
      multiple
      accept={DINH_DANG_FILE_CONG_BO}
      fileList={danhSachFile}
      itemRender={(_origin, file) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '4px 0',
          }}
        >
          <a
            onClick={() => taiFile(file)}
            style={{
              maxWidth: 360,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            <PaperClipOutlined style={{ marginRight: 6 }} />
            {file.name}
          </a>
          <Space size={0} style={{ flexShrink: 0 }}>
            <Tooltip title="Tải xuống">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => taiFile(file)}
              />
            </Tooltip>
            <Tooltip title="Xóa">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => xoaFile(file)}
              />
            </Tooltip>
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
