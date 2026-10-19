/**
 * Nhiệm vụ gắn với một thông báo tuyển chọn.
 * Chọn bằng hộp thoại (tìm kiếm + checkbox) vì danh sách đề xuất có phân trang.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Input, Modal, Popconfirm, Space, Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import {
  attachCfpProposals,
  detachCfpProposals,
  listCfpProposalCandidates,
  listCfpProposals,
  listProposalCandidatesByTypes,
  type CfpNhiemVu,
} from '@/services/api/callForProposals';
import { PROPOSAL_STATUS_MAP, type ProposalStatus } from '@/services/api/projectProposals';

type Props = {
  /** Có id khi sửa thông báo. Form tạo thì để trống, nhiệm vụ gắn lúc lưu nháp. */
  cfpId?: number | null;
  /** Cấp đang chọn trên form tạo, để lọc danh mục nhiệm vụ */
  processTypeIds?: number[];
  coTheSua: boolean;
  /** Tiêu đề thẻ. Mặc định dùng cho form thêm/sửa. */
  tieuDe?: string;
  onChanged?: () => void;
  onPendingChange?: (ids: number[]) => void;
  /** Hiện nút Đăng ký thực hiện trên từng dòng. Dùng ở trang chi tiết. */
  onDangKy?: (row: CfpNhiemVu) => void;
  /** Hiện nút Xem trên từng dòng. */
  onXem?: (row: CfpNhiemVu) => void;
};

function nhanTrangThai(status: string) {
  const meta = PROPOSAL_STATUS_MAP[status as ProposalStatus];
  return <Tag color={meta?.color}>{meta?.label || status}</Tag>;
}

function nhanCap(row: CfpNhiemVu) {
  if (!row.projectProcessType) return '—';
  return `${row.projectProcessType.code} · ${row.projectProcessType.name}`;
}

const NhiemVuThongBao: React.FC<Props> = ({
  cfpId,
  processTypeIds,
  coTheSua,
  tieuDe,
  onChanged,
  onPendingChange,
  onDangKy,
  onXem,
}) => {
  const [danhSach, setDanhSach] = useState<CfpNhiemVu[]>([]);
  const [dangTai, setDangTai] = useState(false);
  const [mo, setMo] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [trang, setTrang] = useState(1);
  const [tong, setTong] = useState(0);
  const [ungVien, setUngVien] = useState<CfpNhiemVu[]>([]);
  const [dangTaiUngVien, setDangTaiUngVien] = useState(false);
  const [daChon, setDaChon] = useState<Map<number, CfpNhiemVu>>(new Map());
  const [dangLuu, setDangLuu] = useState(false);

  const taiDanhSach = useCallback(async () => {
    if (!cfpId) return;
    setDangTai(true);
    try {
      const res = await listCfpProposals(cfpId);
      setDanhSach(res.data || []);
    } catch {
      setDanhSach([]);
    } finally {
      setDangTai(false);
    }
  }, [cfpId]);

  useEffect(() => {
    void taiDanhSach();
  }, [taiDanhSach]);

  const baoChoGanRef = useRef(onPendingChange);
  baoChoGanRef.current = onPendingChange;
  useEffect(() => {
    if (cfpId) return;
    baoChoGanRef.current?.(danhSach.map((row) => row.id));
  }, [cfpId, danhSach]);

  const taiUngVien = useCallback(async () => {
    const cap = (processTypeIds || []).filter((id) => id > 0);
    if (!cfpId && cap.length === 0) {
      setUngVien([]);
      setTong(0);
      return;
    }
    setDangTaiUngVien(true);
    try {
      const params = { keyword: tuKhoa || undefined, page: trang, perPage: 8 };
      const res = cfpId
        ? await listCfpProposalCandidates(cfpId, params)
        : await listProposalCandidatesByTypes({ ...params, projectProcessTypeIds: cap });
      setUngVien(res.data || []);
      setTong(res.meta?.total || 0);
    } catch {
      setUngVien([]);
      setTong(0);
    } finally {
      setDangTaiUngVien(false);
    }
  }, [cfpId, processTypeIds, tuKhoa, trang]);

  useEffect(() => {
    if (!mo) return;
    void taiUngVien();
  }, [mo, taiUngVien]);

  const moHopThoai = () => {
    if (!cfpId && !(processTypeIds || []).some((id) => id > 0)) {
      message.warning('Chọn cấp đề tài trước khi thêm nhiệm vụ.');
      return;
    }
    setTuKhoa('');
    setTrang(1);
    setDaChon(new Map());
    setMo(true);
  };

  const ganCucBo = (rows: CfpNhiemVu[]) => {
    setDanhSach((prev) => {
      const map = new Map(prev.map((row) => [row.id, row]));
      for (const row of rows) map.set(row.id, row);
      return [...map.values()];
    });
    message.success(`Đã chọn ${rows.length} nhiệm vụ. Bấm Lưu nháp để gắn vào thông báo.`);
    setMo(false);
  };

  const gan = async (rows: CfpNhiemVu[], coChuyen: boolean) => {
    if (!cfpId) {
      ganCucBo(rows);
      return;
    }
    const ids = rows.map((row) => row.id);
    setDangLuu(true);
    try {
      const res = await attachCfpProposals(cfpId, ids);
      const moved = res.data?.moved || 0;
      message.success(
        coChuyen && moved > 0
          ? `Đã thêm ${res.data?.attached || ids.length} nhiệm vụ, trong đó chuyển ${moved} nhiệm vụ từ thông báo khác.`
          : `Đã thêm ${res.data?.attached || ids.length} nhiệm vụ vào thông báo.`,
      );
      setMo(false);
      await taiDanhSach();
      onChanged?.();
    } catch {
      // request.ts đã hiện lỗi
    } finally {
      setDangLuu(false);
    }
  };

  const xacNhanThem = () => {
    const rows = [...daChon.values()];
    if (!rows.length) return Promise.reject(new Error('empty'));
    const dangOChoKhac = rows.filter((r) => r.callForProposalTitle);
    if (!dangOChoKhac.length) return gan(rows, false);
    const loiChuyen = cfpId
      ? 'Thêm vào đây sẽ chuyển chúng sang thông báo này.'
      : 'Khi lưu nháp, các nhiệm vụ này sẽ chuyển sang thông báo mới.';
    return new Promise<void>((resolve, reject) => {
      Modal.confirm({
        title: 'Chuyển nhiệm vụ sang thông báo này?',
        content: `${dangOChoKhac.length} nhiệm vụ đang thuộc thông báo khác. ${loiChuyen}`,
        okText: 'Chuyển và thêm',
        cancelText: 'Để sau',
        onOk: () => Promise.resolve(gan(rows, true)).then(resolve),
        onCancel: () => reject(new Error('cancel')),
      });
    });
  };

  const goMot = async (idNhiemVu: number) => {
    if (!cfpId) {
      setDanhSach((prev) => prev.filter((row) => row.id !== idNhiemVu));
      message.success('Đã bỏ nhiệm vụ khỏi danh sách chọn.');
      return;
    }
    try {
      await detachCfpProposals(cfpId, [idNhiemVu]);
      message.success('Đã gỡ nhiệm vụ khỏi thông báo.');
      await taiDanhSach();
      onChanged?.();
    } catch {
      // request.ts đã hiện lỗi
    }
  };

  const cotDaGan: ColumnsType<CfpNhiemVu> = [
    { title: 'Mã', dataIndex: 'code', width: 140 },
    { title: 'Tên nhiệm vụ', dataIndex: 'title', ellipsis: true },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 180, ellipsis: true },
    { title: 'Đơn vị', dataIndex: 'ownerUnit', width: 180, ellipsis: true },
    { title: 'Cấp', width: 220, ellipsis: true, render: (_, r) => nhanCap(r) },
    { title: 'Trạng thái', dataIndex: 'status', width: 140, render: (s: string) => nhanTrangThai(s) },
  ];
  if (coTheSua || onDangKy || onXem) {
    cotDaGan.push({
      title: 'Thao tác',
      width: onXem && onDangKy ? 230 : onDangKy ? 170 : onXem ? 90 : 80,
      fixed: 'right',
      render: (_, r) => (
        <Space size={0}>
          {onXem ? (
            <Button type="link" size="small" onClick={() => onXem(r)}>
              Xem
            </Button>
          ) : null}
          {onDangKy ? (
            <Button type="link" size="small" onClick={() => onDangKy(r)}>
              Đăng ký thực hiện
            </Button>
          ) : null}
          {coTheSua ? (
            <Popconfirm
              title="Gỡ nhiệm vụ này khỏi thông báo?"
              okText="Gỡ"
              cancelText="Hủy"
              onConfirm={() => goMot(r.id)}
            >
              <Button type="link" danger size="small">
                Gỡ
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    });
  }

  const cotChon: ColumnsType<CfpNhiemVu> = [
    { title: 'Mã', dataIndex: 'code', width: 130 },
    {
      title: 'Tên nhiệm vụ',
      dataIndex: 'title',
      ellipsis: true,
      render: (_, r) => (
        <div>
          <div>{r.title}</div>
          {r.callForProposalTitle ? (
            <Tag color="gold" style={{ marginTop: 4 }}>
              Đang thuộc: {r.callForProposalTitle}
            </Tag>
          ) : null}
        </div>
      ),
    },
    { title: 'Chủ nhiệm', dataIndex: 'ownerName', width: 160, ellipsis: true },
    { title: 'Cấp', width: 200, ellipsis: true, render: (_, r) => nhanCap(r) },
    { title: 'Trạng thái', dataIndex: 'status', width: 130, render: (s: string) => nhanTrangThai(s) },
  ];

  return (
    <Card
      title={`${tieuDe || 'Nhiệm vụ trong thông báo'} (${danhSach.length})`}
      style={{ marginBottom: 16 }}
      extra={
        coTheSua ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={moHopThoai}>
            Thêm nhiệm vụ
          </Button>
        ) : null
      }
    >
      <Table<CfpNhiemVu>
        rowKey="id"
        size={onDangKy || onXem ? 'middle' : 'small'}
        loading={dangTai}
        columns={cotDaGan}
        dataSource={danhSach}
        scroll={onDangKy || onXem ? { x: 1080 } : undefined}
        pagination={danhSach.length > 8 ? { pageSize: 8, showSizeChanger: false } : false}
        locale={{
          emptyText: coTheSua
            ? 'Chưa có nhiệm vụ. Bấm Thêm nhiệm vụ để chọn từ danh mục đề xuất.'
            : 'Chưa có nhiệm vụ trong thông báo này.',
        }}
      />

      <Modal
        title="Thêm nhiệm vụ từ danh mục đề xuất"
        open={mo}
        width={960}
        destroyOnClose
        onCancel={() => setMo(false)}
        okText={`Thêm vào thông báo${daChon.size ? ` (${daChon.size})` : ''}`}
        cancelText="Hủy"
        confirmLoading={dangLuu}
        okButtonProps={{ disabled: daChon.size === 0 }}
        onOk={xacNhanThem}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Input.Search
            allowClear
            placeholder="Mã, tên nhiệm vụ hoặc chủ nhiệm"
            onSearch={(value) => {
              setTrang(1);
              setTuKhoa(value.trim());
            }}
          />
          <Table<CfpNhiemVu>
            rowKey="id"
            size="small"
            loading={dangTaiUngVien}
            columns={cotChon}
            dataSource={ungVien}
            rowSelection={{
              selectedRowKeys: [...daChon.keys()],
              preserveSelectedRowKeys: true,
              onChange: (keys, rows) => {
                const giu = new Set(keys.map((k) => Number(k)));
                setDaChon((prev) => {
                  const next = new Map(prev);
                  for (const id of next.keys()) {
                    if (!giu.has(id)) next.delete(id);
                  }
                  for (const row of rows) {
                    if (row) next.set(row.id, row);
                  }
                  return next;
                });
              },
            }}
            pagination={{
              current: trang,
              pageSize: 8,
              total: tong,
              showSizeChanger: false,
              onChange: (p) => setTrang(p),
            }}
            locale={{ emptyText: 'Không có nhiệm vụ cùng cấp để thêm.' }}
          />
        </Space>
      </Modal>
    </Card>
  );
};

export default NhiemVuThongBao;
