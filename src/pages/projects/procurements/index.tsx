/**
 * Menu CSVC — Danh sách yêu cầu mua sắm (Chờ CSVC).
 * Thông báo → /projects/procurements?id= → mở sheet xem / xử lý.
 */
import {
  NHAN_LOAI_MUA,
  NHAN_MS,
  nhanMuc,
} from '@/constants/module56';
import {
  csvcMuaSam,
  dsMuaSamCsvc,
  type PhieuMua,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  PaperClipOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useAccess, useLocation } from '@umijs/max';
import {
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { ChonTep } from '@/pages/projects/execution/ChonTep';

const { Text } = Typography;

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

const ProcurementsCsvcPage: React.FC = () => {
  const access = useAccess();
  const { search, pathname } = useLocation();
  const [rows, setRows] = useState<PhieuMua[]>([]);
  const [loading, setLoading] = useState(false);
  const [xem, setXem] = useState<PhieuMua | null>(null);
  const [acting, setActing] = useState(false);
  const [method, setMethod] = useState<'MUA_TRUC_TIEP' | 'DAU_THAU'>(
    'MUA_TRUC_TIEP',
  );
  const [ngayNhan, setNgayNhan] = useState<Dayjs | null>(dayjs());
  const [tepChungTu, setTepChungTu] = useState<TepModule56[]>([]);
  const [cungUngOpen, setCungUngOpen] = useState(false);
  const [cungUngPhieu, setCungUngPhieu] = useState<PhieuMua | null>(null);
  const daMoTuUrl = useRef(false);

  const tai = async () => {
    setLoading(true);
    try {
      const res = await dsMuaSamCsvc();
      setRows(res.data || []);
      return res.data || [];
    } catch (e: any) {
      message.error(bao(e));
      return [] as PhieuMua[];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void tai();
    daMoTuUrl.current = false;
  }, []);

  // Thông báo → ?id= → mở sheet xem
  useEffect(() => {
    if (daMoTuUrl.current) return;
    const id = Number(new URLSearchParams(search).get('id') || 0);
    if (!id) return;
    void tai().then((list) => {
      const hit = list.find((x) => x.id === id) || null;
      if (!hit) {
        message.warning('Không tìm thấy yêu cầu mua sắm (có thể đã xử lý).');
        return;
      }
      daMoTuUrl.current = true;
      setXem(hit);
      const q = new URLSearchParams(search);
      q.delete('id');
      const qs = q.toString();
      history.replace(`${pathname}${qs ? `?${qs}` : ''}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  if (!access.canHandleProcurement) {
    return (
      <PageContainer title="Danh sách yêu cầu mua sắm">
        <Alert type="error" showIcon message="Chỉ phòng CSVC được truy cập." />
      </PageContainer>
    );
  }

  const moCungUng = (r: PhieuMua) => {
    setCungUngPhieu(r);
    setMethod('MUA_TRUC_TIEP');
    setNgayNhan(dayjs());
    setTepChungTu([]);
    setCungUngOpen(true);
  };

  const xacNhanCungUng = async () => {
    if (!cungUngPhieu) return;
    if (method === 'MUA_TRUC_TIEP' && !ngayNhan) {
      message.warning('Nhập ngày nhận hàng');
      return;
    }
    setActing(true);
    try {
      await csvcMuaSam(cungUngPhieu.id, {
        action: 'supply',
        method,
        receivedAt: ngayNhan ? ngayNhan.format('YYYY-MM-DD') : undefined,
        attachments: tepChungTu.length ? tepChungTu : undefined,
      });
      message.success(
        method === 'MUA_TRUC_TIEP'
          ? 'Đã cung ứng — chuyển Phòng Kế hoạch - Tài chính'
          : 'Đã cung ứng — chờ CNNV xác nhận nhận hàng',
      );
      setCungUngOpen(false);
      setCungUngPhieu(null);
      setXem(null);
      await tai();
    } catch (e: any) {
      message.error(bao(e));
    } finally {
      setActing(false);
    }
  };

  const columns: ProColumns<PhieuMua>[] = [
    {
      title: 'Mã hợp đồng',
      width: 140,
      render: (_, r) => (
        <Text strong>{r.contractNo || r.outlineCode || '—'}</Text>
      ),
    },
    {
      title: 'Tên nhiệm vụ',
      ellipsis: true,
      render: (_, r) => r.outlineTitle || '—',
    },
    {
      title: 'Loại vật tư',
      width: 120,
      render: (_, r) =>
        NHAN_LOAI_MUA[r.kind as keyof typeof NHAN_LOAI_MUA] || r.kind,
    },
    {
      title: 'Khoản chi',
      width: 160,
      render: (_, r) => nhanMuc(r.lineCode) || r.lineCode,
    },
    {
      title: 'Thành tiền',
      width: 180,
      align: 'right',
      render: (_, r) => (
        <Space size={6} wrap>
          <Text strong>{formatVnd(r.totalAmount)}</Text>
          {r.overBudget ? (
            <Tag color="error" style={{ marginInlineEnd: 0 }}>
              Vượt dư
            </Tag>
          ) : null}
        </Space>
      ),
    },
    {
      title: 'Lý do',
      ellipsis: true,
      dataIndex: 'purpose',
    },
    {
      title: 'Trạng thái',
      width: 120,
      render: (_, r) => <Tag>{NHAN_MS[r.status] || r.status}</Tag>,
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 200,
      render: (_, r) => (
        <Space>
          <a onClick={() => setXem(r)}>
            <EyeOutlined /> Xem
          </a>
          {r.status === 'MS_CHO_CSVC' && (
            <a onClick={() => moCungUng(r)}>
              <CheckOutlined /> Đã cung ứng
            </a>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={
        <Space>
          <ShoppingCartOutlined />
          <span>Danh sách yêu cầu mua sắm</span>
        </Space>
      }
      subTitle="CSVC — tiếp nhận và cung ứng vật tư / thiết bị"
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Các đề nghị đang chờ CSVC xử lý. Sau khi xác nhận Đã cung ứng, chủ nhiệm nhiệm vụ sẽ nhận thông báo để xác nhận nhận hàng."
      />
      <ProTable<PhieuMua>
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={rows}
        search={false}
        options={false}
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Không có yêu cầu chờ CSVC' }}
      />

      <Drawer
        title={
          <Space>
            <EyeOutlined />
            <span>Chi tiết yêu cầu mua sắm</span>
            {xem ? <Tag>{NHAN_MS[xem.status] || xem.status}</Tag> : null}
          </Space>
        }
        open={!!xem}
        onClose={() => setXem(null)}
        width={720}
        maskClosable={false}
        footer={
          xem?.status === 'MS_CHO_CSVC' ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button onClick={() => setXem(null)}>Đóng</Button>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => moCungUng(xem)}
              >
                Đã cung ứng
              </Button>
            </div>
          ) : (
            <div style={{ textAlign: 'right' }}>
              <Button onClick={() => setXem(null)}>Đóng</Button>
            </div>
          )
        }
      >
        {xem && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Mã hợp đồng">
                {xem.contractNo || xem.outlineCode || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Tên nhiệm vụ">
                {xem.outlineTitle || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Loại vật tư">
                {NHAN_LOAI_MUA[xem.kind as keyof typeof NHAN_LOAI_MUA] ||
                  xem.kind}
              </Descriptions.Item>
              <Descriptions.Item label="Khoản chi">
                {nhanMuc(xem.lineCode) || xem.lineCode}
              </Descriptions.Item>
              <Descriptions.Item label="Thành tiền">
                <Text strong>{formatVnd(xem.totalAmount)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Lý do / mục đích">
                {xem.purpose || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Cần trước ngày">
                {xem.neededBy || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Table
              size="small"
              rowKey={(_, i) => String(i)}
              pagination={false}
              dataSource={xem.items || []}
              columns={[
                { title: 'Tên hàng', dataIndex: 'name' },
                { title: 'ĐVT', dataIndex: 'unit', width: 80 },
                { title: 'SL', dataIndex: 'qty', width: 70 },
                {
                  title: 'Đơn giá',
                  width: 110,
                  render: (_, it) => formatVnd(it.unitPrice),
                },
                {
                  title: 'Thành tiền',
                  width: 120,
                  render: (_, it) => formatVnd(it.amount),
                },
              ]}
            />

            {(xem.attachments || []).length > 0 && (
              <Space direction="vertical" size={4}>
                <Text strong>Minh chứng</Text>
                {xem.attachments.map((t, i) => (
                  <a
                    key={`${t.fileUrl}-${i}`}
                    href={resolvePublicAssetUrl(t.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <PaperClipOutlined /> {t.fileName || `File ${i + 1}`}
                  </a>
                ))}
              </Space>
            )}
          </Space>
        )}
      </Drawer>

      <Modal
        title="Xác nhận đã cung ứng"
        open={cungUngOpen}
        onCancel={() => setCungUngOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy"
        okButtonProps={{ loading: acting }}
        onOk={() => void xacNhanCungUng()}
        destroyOnClose
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={
            method === 'MUA_TRUC_TIEP'
              ? 'Mua trực tiếp: nhập ngày nhận hàng + chứng từ → chuyển Phòng Kế hoạch - Tài chính.'
              : 'Đấu thầu: sau cung ứng, chủ nhiệm xác nhận nhận hàng rồi mới sang KH-TC.'
          }
        />
        <Form layout="vertical">
          <Form.Item label="Hình thức cung ứng" required>
            <Select
              style={{ width: '100%' }}
              value={method}
              onChange={(v) => setMethod(v)}
              options={[
                { value: 'MUA_TRUC_TIEP', label: 'Đặt hàng / mua sắm trực tiếp' },
                { value: 'DAU_THAU', label: 'Đấu thầu' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="Ngày nhận hàng"
            required={method === 'MUA_TRUC_TIEP'}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={ngayNhan}
              onChange={(v) => setNgayNhan(v)}
              placeholder="dd/mm/yyyy"
            />
          </Form.Item>
          <Form.Item label="Chứng từ (hóa đơn / biên bản)">
            <ChonTep
              maxBytes={20 * 1024 * 1024}
              nhan="Tải chứng từ"
              onCo={(t) => setTepChungTu((prev) => [...prev, t])}
            />
            {tepChungTu.length > 0 && (
              <Space
                direction="vertical"
                size={4}
                style={{ marginTop: 8, width: '100%' }}
              >
                {tepChungTu.map((t, i) => (
                  <Space key={`${t.fileUrl}-${i}`}>
                    <PaperClipOutlined />
                    <a
                      href={resolvePublicAssetUrl(t.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t.fileName || `File ${i + 1}`}
                    </a>
                    <Button
                      type="link"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={() =>
                        setTepChungTu((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                    />
                  </Space>
                ))}
              </Space>
            )}
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProcurementsCsvcPage;
