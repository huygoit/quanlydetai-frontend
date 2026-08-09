/**
 * Upload 1 file PDF/DOCX — dùng cho đề xuất / thuyết minh
 */
import React, { useState } from 'react';
import { Button, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { DeleteOutlined, PaperClipOutlined, UploadOutlined } from '@ant-design/icons';
import { uploadFileDon } from '@/services/api/fileUpload';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';

const THU_MUC_MAC_DINH = 'projects/proposal-attachments';
const ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export type ProposalAttachmentUploadProps = {
  value?: string | null;
  onChange?: (url: string | null) => void;
  disabled?: boolean;
  /** Thư mục lưu (mặc định đề xuất) */
  folder?: string;
  /** Dung lượng tối đa MB (mặc định 10; thuyết minh 20) */
  maxMb?: number;
  buttonText?: string;
};

const tenFileTuUrl = (url: string) => {
  try {
    const path = decodeURIComponent(url.split('?')[0]);
    return path.split('/').pop() || 'file';
  } catch {
    return 'file';
  }
};

const ProposalAttachmentUpload: React.FC<ProposalAttachmentUploadProps> = ({
  value,
  onChange,
  disabled,
  folder = THU_MUC_MAC_DINH,
  maxMb = 10,
  buttonText,
}) => {
  const [dangTai, setDangTai] = useState(false);
  const maxBytes = maxMb * 1024 * 1024;

  const fileList: UploadFile[] = value
    ? [
        {
          uid: 'proposal-att',
          name: tenFileTuUrl(value),
          status: 'done',
          url: resolvePublicAssetUrl(value),
        },
      ]
    : [];

  return (
    <Upload
      accept={ACCEPT}
      maxCount={1}
      fileList={fileList}
      disabled={disabled}
      beforeUpload={(file) => {
        if (disabled) return Upload.LIST_IGNORE;
        const okType =
          file.type === 'application/pdf' ||
          file.type ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          /\.(pdf|docx)$/i.test(file.name);
        if (!okType) {
          message.error('Chỉ chấp nhận PDF hoặc DOCX');
          return Upload.LIST_IGNORE;
        }
        if (file.size > maxBytes) {
          message.error(`Dung lượng tối đa ${maxMb}MB`);
          return Upload.LIST_IGNORE;
        }
        return true;
      }}
      itemRender={(_origin, file) => (
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 8,
            padding: '6px 10px',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            background: '#fafafa',
          }}
        >
          <PaperClipOutlined />
          <a href={file.url} target="_blank" rel="noreferrer">
            {file.name}
          </a>
          {!disabled && (
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => onChange?.(null)}
            >
              Xóa
            </Button>
          )}
        </div>
      )}
      customRequest={async (options) => {
        if (disabled) return;
        const file = options.file as File;
        setDangTai(true);
        try {
          const kq = await uploadFileDon(file, { folder });
          onChange?.(kq.url);
          options.onSuccess?.(kq as unknown as Record<string, unknown>);
          message.success('Đã tải file');
        } catch (e: unknown) {
          const err = e as { message?: string };
          message.error(err?.message || 'Tải file thất bại');
          options.onError?.(e as Error);
        } finally {
          setDangTai(false);
        }
      }}
    >
      {!value && !disabled && (
        <Button icon={<UploadOutlined />} loading={dangTai}>
          {buttonText || `Chọn file PDF/DOCX (≤${maxMb}MB)`}
        </Button>
      )}
    </Upload>
  );
};

export default ProposalAttachmentUpload;
