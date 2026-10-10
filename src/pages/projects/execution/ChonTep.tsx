import { uploadFileDon } from '@/services/api/fileUpload';
import type { TepModule56 } from '@/services/api/module56';
import { Button, message, Upload } from 'antd';

/** Upload một file rồi trả object đúng body Module 5–6. */
export function ChonTep({
  maxBytes,
  nhan,
  onCo,
}: {
  maxBytes: number;
  nhan?: string;
  onCo: (tep: TepModule56) => void;
}) {
  return (
    <Upload
      showUploadList={false}
      maxCount={1}
      beforeUpload={async (file) => {
        if (file.size > maxBytes) {
          message.error(`File vượt ${Math.round(maxBytes / 1024 / 1024)}MB`);
          return Upload.LIST_IGNORE;
        }
        try {
          const up = await uploadFileDon(file, { folder: 'module56' });
          onCo({ fileName: file.name, fileUrl: up.url, fileSize: file.size });
        } catch (e: any) {
          message.error(e?.message || 'Tải file thất bại');
        }
        return Upload.LIST_IGNORE;
      }}
    >
      <Button>{nhan || 'Chọn file'}</Button>
    </Upload>
  );
}
