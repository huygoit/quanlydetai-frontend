/**
 * Upload nhiều file đính kèm KQNC — dùng chung hồ sơ cá nhân & module admin
 */
import React, { useState } from 'react';
import { Button, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload';
import { UploadOutlined } from '@ant-design/icons';
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

  return (
    <Upload
      multiple
      accept={DINH_DANG_FILE_CONG_BO}
      fileList={danhSachFile}
      showUploadList={{ showRemoveIcon: true, showDownloadIcon: true }}
      onRemove={(file) => {
        xoaFile(file);
        return true;
      }}
      onDownload={(file) => {
        const href =
          file.url || resolvePublicAssetUrl(value.find((u) => tenFileTuUrl(u) === file.name));
        if (href) downloadFromUrl(href, file.name);
      }}
      customRequest={async (options) => {
        const file = options.file as File;
        setDangTai(true);
        try {
          const kq = await uploadFileDon(file, { folder: THU_MUC_FILE_CONG_BO });
          onChange?.([...value, kq.url]);
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
