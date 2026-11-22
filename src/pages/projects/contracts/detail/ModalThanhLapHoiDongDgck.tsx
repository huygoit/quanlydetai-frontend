/**
 * Modal PKH thành lập hội đồng đánh giá cuối kỳ:
 * chọn thời gian / địa điểm / thành viên → lưu → BE gửi chuông + email kèm link hồ sơ đề nghị.
 */
import { NHAN_VAI_TRO_HD } from '@/constants/module56';
import { luuHoiDong } from '@/services/api/module56';
import { getAvailableOutlineReviewers } from '@/services/api/projectOutlineReviews';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import { DATETIME_PICKER_FORMAT } from '@/utils/datetime';
import { TeamOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useState } from 'react';

type VaiTroHd = keyof typeof NHAN_VAI_TRO_HD;

type ThanhVien = {
  userId: number;
  name: string;
  role: VaiTroHd;
};

type Props = {
  open: boolean;
  outlineId: number;
  /** Trạng thái triển khai — cần DGCK_HOP_HD mới lưu được */
  executionStatus?: string | null;
  onClose: () => void;
  onDone?: () => void;
};

const ROLE_OPTS = Object.entries(NHAN_VAI_TRO_HD).map(([value, label]) => ({
  value,
  label,
}));

export function ModalThanhLapHoiDongDgck({
  open,
  outlineId,
  executionStatus,
  onClose,
  onDone,
}: Props) {
  const [form] = Form.useForm<{
    meetingAt: Dayjs;
    location?: string;
  }>();
  const [thanhVien, setThanhVien] = useState<ThanhVien[]>([]);
  const [nguoiOpts, setNguoiOpts] = useState<
    { value: number; label: string }[]
  >([]);
  const [dangLuu, setDangLuu] = useState(false);

  // Cho phép khi đã chuyển họp HĐ (sau PKH duyệt đủ)
  const sanSang =
    executionStatus === 'DGCK_HOP_HD' ||
    executionStatus === 'DGCK_CHINH_SUA' ||
    executionStatus === 'DGCK_CHO_QUYET_TOAN';

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      meetingAt: dayjs().add(7, 'day').hour(9).minute(0).second(0),
      location: undefined,
    });
    setThanhVien([]);
    setNguoiOpts([]);
  }, [open, form]);

  const timNguoi = async (kw: string) => {
    if (!kw.trim()) {
      setNguoiOpts([]);
      return;
    }
    try {
      const res = await getAvailableOutlineReviewers(outlineId, kw.trim());
      setNguoiOpts(
        (res?.data || [])
          .filter((r) => r.reviewerUserId)
          .map((r) => ({
            value: r.reviewerUserId as number,
            label: r.reviewerName,
          })),
      );
    } catch {
      setNguoiOpts([]);
    }
  };

  const themNguoi = (userId: number, label?: string) => {
    if (!userId) return;
    setThanhVien((s) =>
      s.some((m) => m.userId === userId)
        ? s
        : [...s, { userId, name: label || `#${userId}`, role: 'UY_VIEN' }],
    );
  };

  const kiemTraVaiTro = () => {
    const dem = (role: VaiTroHd) =>
      thanhVien.filter((m) => m.role === role).length;
    if (dem('CHU_TICH') !== 1) {
      message.warning('Cần đúng 1 Chủ tịch');
      return false;
    }
    if (dem('THU_KY') !== 1) {
      message.warning('Cần đúng 1 Thư ký');
      return false;
    }
    if (dem('PHAN_BIEN') < 2) {
      message.warning('Cần ít nhất 2 Phản biện');
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!sanSang) {
      message.warning(
        'Cần duyệt hồ sơ nghiệm thu và chuyển họp hội đồng trước khi thành lập.',
      );
      return;
    }
    try {
      const v = await form.validateFields();
      if (!kiemTraVaiTro()) return;
      setDangLuu(true);
      await luuHoiDong(outlineId, {
        meetingAt: v.meetingAt.toISOString(),
        location: v.location?.trim() || null,
        members: thanhVien.map((m) => ({
          userId: m.userId,
          role: m.role,
        })),
      });
      message.success(
        'Đã thành lập hội đồng — đã gửi chuông và email mời tới thành viên.',
      );
      onClose();
      onDone?.();
    } catch (e: unknown) {
      message.error(layThongBaoLoi(e, 'Thành lập hội đồng thất bại'));
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <TeamOutlined />
          Thành lập hội đồng đánh giá cuối kỳ
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={720}
      destroyOnClose
      footer={[
        <Button key="huy" onClick={onClose}>
          Hủy
        </Button>,
        <Button
          key="ok"
          type="primary"
          loading={dangLuu}
          disabled={!sanSang}
          onClick={() => void submit()}
        >
          Thành lập & gửi thông báo
        </Button>,
      ]}
    >
      {!sanSang && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chưa tới bước họp hội đồng"
          description="PKH cần duyệt hồ sơ nghiệm thu (chuyển trạng thái họp HĐ) rồi mới thành lập được."
        />
      )}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message="Sau khi thành lập, hệ thống gửi chuông + email tới từng thành viên, kèm link mở thẳng hồ sơ đề nghị đánh giá KQNV mà CNNV đã nộp."
      />
      <Form form={form} layout="vertical">
        <Form.Item
          name="meetingAt"
          label="Thời gian họp"
          rules={[{ required: true, message: 'Chọn thời gian họp' }]}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            format={DATETIME_PICKER_FORMAT}
          />
        </Form.Item>
        <Form.Item name="location" label="Địa điểm">
          <Input placeholder="Phòng họp / link trực tuyến" />
        </Form.Item>
      </Form>

      <div style={{ marginBottom: 8, fontWeight: 600 }}>Thành phần hội đồng</div>
      <Select
        showSearch
        filterOption={false}
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="Tìm theo họ tên để thêm thành viên"
        options={nguoiOpts}
        onSearch={(kw) => void timNguoi(kw)}
        onChange={(userId, opt) =>
          themNguoi(userId, (opt as { label?: string })?.label)
        }
        value={undefined}
      />
      <Table
        size="small"
        rowKey="userId"
        pagination={false}
        dataSource={thanhVien}
        locale={{ emptyText: 'Chưa thêm thành viên' }}
        columns={[
          { title: 'Họ tên', dataIndex: 'name' },
          {
            title: 'Vai trò',
            width: 160,
            render: (_, r) => (
              <Select
                style={{ width: 148 }}
                value={r.role}
                options={ROLE_OPTS}
                onChange={(role) =>
                  setThanhVien((s) =>
                    s.map((m) =>
                      m.userId === r.userId ? { ...m, role } : m,
                    ),
                  )
                }
              />
            ),
          },
          {
            title: '',
            width: 64,
            render: (_, r) => (
              <a
                onClick={() =>
                  setThanhVien((s) => s.filter((m) => m.userId !== r.userId))
                }
              >
                Xóa
              </a>
            ),
          },
        ]}
      />
      <div style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
        Bắt buộc: 1 Chủ tịch, 1 Thư ký, ≥ 2 Phản biện.
      </div>
    </Modal>
  );
}

export default ModalThanhLapHoiDongDgck;
