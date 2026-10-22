/**
 * Sao lưu và khôi phục dữ liệu. Chỉ Super Admin.
 * Xác nhận khôi phục bằng đúng tên file đang hiện, không bắt nhớ tên database.
 */
import { PageContainer } from '@ant-design/pro-components';
import { Alert, Button, Input, Modal, Space, Table, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  khoiPhucBanSao,
  layDanhSachSaoLuu,
  taiBanSao,
  taiLenBanSao,
  taoBanSao,
  xoaBanSao,
  type BanSao,
} from '@/services/api/backups';

const { Text } = Typography;

function dinhDangDungLuong(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(1)} KB`;
  return `${(byte / 1024 / 1024).toFixed(1)} MB`;
}

const TrangSaoLuu: React.FC = () => {
  const [files, setFiles] = useState<BanSao[]>([]);
  const [databaseName, setDatabaseName] = useState('');
  const [dangTai, setDangTai] = useState(false);
  const [dangTao, setDangTao] = useState(false);
  const [fileChon, setFileChon] = useState<BanSao | null>(null);
  const [tenXacNhan, setTenXacNhan] = useState('');
  const [dangKhoiPhuc, setDangKhoiPhuc] = useState(false);

  const taiLai = useCallback(async () => {
    setDangTai(true);
    try {
      const res = await layDanhSachSaoLuu();
      setFiles(res.data?.files || []);
      setDatabaseName(res.data?.databaseName || '');
    } catch (e: unknown) {
      message.error((e as Error).message || 'Không tải được danh sách');
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    void taiLai();
  }, [taiLai]);

  const tao = async () => {
    setDangTao(true);
    try {
      await taoBanSao();
      message.success('Đã tạo bản sao');
      await taiLai();
    } catch (e: unknown) {
      message.error((e as Error).message || 'Tạo bản sao thất bại');
    } finally {
      setDangTao(false);
    }
  };

  const khoiPhuc = async () => {
    if (!fileChon || tenXacNhan !== fileChon.name) return;
    setDangKhoiPhuc(true);
    try {
      await khoiPhucBanSao(fileChon.name, tenXacNhan);
      message.success('Đã khôi phục dữ liệu');
      setFileChon(null);
      setTenXacNhan('');
      await taiLai();
    } catch (e: unknown) {
      message.error((e as Error).message || 'Khôi phục thất bại');
    } finally {
      setDangKhoiPhuc(false);
    }
  };

  const columns: ColumnsType<BanSao> = [
    { title: 'Tên file', dataIndex: 'name' },
    {
      title: 'Dung lượng',
      dataIndex: 'size',
      width: 120,
      render: (size: number) => dinhDangDungLuong(size),
    },
    {
      title: 'Thời điểm',
      dataIndex: 'createdAt',
      width: 180,
      render: (v: string) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—'),
    },
    {
      title: 'Thao tác',
      width: 280,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            onClick={() => taiBanSao(row.name).catch((e) => message.error(e.message))}
          >
            Tải về
          </Button>
          <Button
            type="link"
            onClick={() => {
              setFileChon(row);
              setTenXacNhan('');
            }}
          >
            Khôi phục
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              Modal.confirm({
                title: 'Xóa file sao lưu?',
                content: row.name,
                okText: 'Xóa',
                cancelText: 'Hủy',
                onOk: async () => {
                  await xoaBanSao(row.name);
                  message.success('Đã xóa file');
                  await taiLai();
                },
              });
            }}
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="Sao lưu dữ liệu">
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Bản sao là file trên máy chủ, gồm database và file đã tải lên. Không lưu nội dung bản sao trong database."
      />
      {databaseName ? (
        <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Database hiện tại: {databaseName}
        </Text>
      ) : null}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" loading={dangTao} onClick={() => void tao()}>
          Tạo bản sao
        </Button>
        <Upload
          accept=".zip"
          showUploadList={false}
          customRequest={async (options) => {
            try {
              await taiLenBanSao(options.file as File);
              message.success('Đã tải file lên thư mục sao lưu');
              options.onSuccess?.({});
              await taiLai();
            } catch (e: unknown) {
              message.error((e as Error).message || 'Tải lên thất bại');
              options.onError?.(e as Error);
            }
          }}
        >
          <Button>Tải file zip lên</Button>
        </Upload>
      </Space>
      <Table
        rowKey="name"
        loading={dangTai}
        columns={columns}
        dataSource={files}
        pagination={false}
      />

      <Modal
        title="Khôi phục dữ liệu"
        open={!!fileChon}
        okText="Khôi phục"
        cancelText="Hủy"
        confirmLoading={dangKhoiPhuc}
        okButtonProps={{ danger: true, disabled: tenXacNhan !== fileChon?.name }}
        onCancel={() => {
          setFileChon(null);
          setTenXacNhan('');
        }}
        onOk={() => void khoiPhuc()}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Thao tác này ghi đè dữ liệu đang chạy."
          description={databaseName ? `Database: ${databaseName}` : undefined}
        />
        <Text style={{ display: 'block', marginBottom: 8 }}>
          Gõ lại tên file: <Text code>{fileChon?.name}</Text>
        </Text>
        <Input
          value={tenXacNhan}
          placeholder="Tên file sao lưu"
          onChange={(e) => setTenXacNhan(e.target.value)}
        />
      </Modal>
    </PageContainer>
  );
};

export default TrangSaoLuu;
