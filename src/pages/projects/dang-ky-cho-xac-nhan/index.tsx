/**
 * Danh sách hồ sơ đăng ký thực hiện đang chờ trưởng đơn vị xác nhận.
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Button,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useEffect, useState } from 'react';
import { PROPOSAL_MEMBER_ROLE_LABEL } from '@/constants/proposalMemberRole';
import type { PublicationAuthor } from '@/services/api/profilePublications';
import {
  chiTietDonDangKy,
  danhSachDonChoXacNhan,
  traLaiDonDangKy,
  xacNhanDonDangKy,
  type DonChoXacNhan,
} from '@/services/api/proposalRegistrations';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';

function tien(n?: number | null) {
  return `${Number(n || 0).toLocaleString('vi-VN')} đ`;
}

const DonChoXacNhanPage: React.FC = () => {
  const [danhSach, setDanhSach] = useState<DonChoXacNhan[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [mo, setMo] = useState(false);
  const [dangXem, setDangXem] = useState(false);
  const [hoSo, setHoSo] = useState<DonChoXacNhan | null>(null);
  const [thanhVien, setThanhVien] = useState<PublicationAuthor[]>([]);
  const [duocXuLyDon, setDuocXuLyDon] = useState(false);
  const [moXacNhan, setMoXacNhan] = useState(false);
  const [moTraLai, setMoTraLai] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [formXacNhan] = Form.useForm();
  const [formTraLai] = Form.useForm();

  const tai = useCallback(async () => {
    setDangTai(true);
    try {
      const res = await danhSachDonChoXacNhan();
      setDanhSach(res.data || []);
    } catch {
      setDanhSach([]);
    } finally {
      setDangTai(false);
    }
  }, []);

  useEffect(() => {
    void tai();
  }, [tai]);

  const xem = async (row: DonChoXacNhan) => {
    setMo(true);
    setDangXem(true);
    setHoSo(row);
    setThanhVien([]);
    try {
      const res = await chiTietDonDangKy(row.id);
      setHoSo(res.data?.hoSo || row);
      setThanhVien(res.data?.thanhVien || []);
      setDuocXuLyDon(!!res.data?.coTheXuLy);
    } catch {
      setMo(false);
    } finally {
      setDangXem(false);
    }
  };

  const xacNhan = async () => {
    if (!hoSo) return;
    const ghiChu = String(formXacNhan.getFieldValue('note') || '').trim();
    setDangLuu(true);
    try {
      await xacNhanDonDangKy(hoSo.id, ghiChu);
      message.success('Đã xác nhận. Hồ sơ chuyển Phòng Khoa học và Hợp tác quốc tế.');
      setMoXacNhan(false);
      setMo(false);
      formXacNhan.resetFields();
      await tai();
    } catch {
      // request.ts đã hiện lỗi
    } finally {
      setDangLuu(false);
    }
  };

  const traLai = async () => {
    if (!hoSo) return;
    try {
      await formTraLai.validateFields();
    } catch {
      return;
    }
    const lyDo = String(formTraLai.getFieldValue('reason') || '').trim();
    setDangLuu(true);
    try {
      await traLaiDonDangKy(hoSo.id, lyDo);
      message.success('Đã trả lại. Người nộp nhận email và có thể sửa hồ sơ.');
      setMoTraLai(false);
      setMo(false);
      formTraLai.resetFields();
      await tai();
    } catch {
      // request.ts đã hiện lỗi
    } finally {
      setDangLuu(false);
    }
  };

  const cot: ColumnsType<DonChoXacNhan> = [
    { title: 'Mã hồ sơ', dataIndex: 'code', width: 140 },
    { title: 'Người đăng ký', dataIndex: 'ownerName', width: 180, ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 180, ellipsis: true },
    {
      title: 'Nhiệm vụ',
      ellipsis: true,
      render: (_, r) => (r.nhiemVu ? `${r.nhiemVu.code} ${r.nhiemVu.title}` : '—'),
    },
    {
      title: 'Kinh phí',
      width: 150,
      align: 'right',
      render: (_, r) => tien(r.proposedBudget),
    },
    {
      title: 'Thời gian',
      width: 110,
      render: (_, r) => `${r.durationMonths} tháng`,
    },
    {
      title: '',
      width: 80,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => void xem(r)}>
          Xem
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="Đơn đăng ký chờ xác nhận"
    >
      <Table<DonChoXacNhan>
        rowKey="id"
        loading={dangTai}
        columns={cot}
        dataSource={danhSach}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: 'Không có đơn chờ xác nhận.' }}
      />

      <Drawer
        title={hoSo?.code || 'Hồ sơ đăng ký'}
        width={720}
        open={mo}
        onClose={() => setMo(false)}
        destroyOnClose
        extra={
          duocXuLyDon ? (
            <Space>
              <Button danger onClick={() => setMoTraLai(true)}>
                Trả lại
              </Button>
              <Button type="primary" onClick={() => setMoXacNhan(true)}>
                Xác nhận
              </Button>
            </Space>
          ) : null
        }
      >
        {dangXem ? (
          <div>Đang tải...</div>
        ) : hoSo ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Người đăng ký">
                {hoSo.ownerName}
                {hoSo.ownerUnit ? ` · ${hoSo.ownerUnit}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Nhiệm vụ">
                {hoSo.nhiemVu ? `${hoSo.nhiemVu.code} ${hoSo.nhiemVu.title}` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kinh phí đề xuất">{tien(hoSo.proposedBudget)}</Descriptions.Item>
              <Descriptions.Item label="Thời gian">{hoSo.durationMonths} tháng</Descriptions.Item>
              <Descriptions.Item label="Ghi chú của người nộp">{hoSo.note || '—'}</Descriptions.Item>
              <Descriptions.Item label="File đính kèm">
                {hoSo.attachmentUrl ? (
                  <a href={resolvePublicAssetUrl(hoSo.attachmentUrl)} target="_blank" rel="noreferrer">
                    Mở file
                  </a>
                ) : (
                  'Không có file'
                )}
              </Descriptions.Item>
            </Descriptions>
            <Table<PublicationAuthor>
              style={{ marginTop: 16 }}
              size="small"
              rowKey={(r) => String(r.id || r.fullName)}
              pagination={false}
              dataSource={thanhVien}
              columns={[
                { title: 'Họ tên', dataIndex: 'fullName' },
                {
                  title: 'Vai trò',
                  width: 140,
                  render: (_, r) => {
                    const vai = r.proposalMemberRole || 'MEMBER';
                    return (
                      <Tag>{PROPOSAL_MEMBER_ROLE_LABEL[vai] || vai}</Tag>
                    );
                  },
                },
              ]}
            />
          </>
        ) : null}
      </Drawer>

      <Modal
        title="Xác nhận hồ sơ"
        open={moXacNhan}
        okText="Xác nhận"
        cancelText="Đóng"
        confirmLoading={dangLuu}
        onCancel={() => setMoXacNhan(false)}
        onOk={() => void xacNhan()}
      >
        <Form form={formXacNhan} layout="vertical">
          <Form.Item name="note" label="Ghi chú" extra="Không bắt buộc.">
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Trả lại hồ sơ"
        open={moTraLai}
        okText="Trả lại"
        okButtonProps={{ danger: true }}
        cancelText="Đóng"
        confirmLoading={dangLuu}
        onCancel={() => setMoTraLai(false)}
        onOk={() => void traLai()}
      >
        <Form form={formTraLai} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do"
            rules={[{ required: true, message: 'Nhập lý do trả lại' }]}
          >
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default DonChoXacNhanPage;
