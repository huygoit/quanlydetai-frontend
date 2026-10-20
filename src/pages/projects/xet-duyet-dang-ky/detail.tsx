/**
 * Bảng so sánh các đơn của một nhiệm vụ. Mỗi cột là một đơn, có nút Chấp thuận.
 */
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useParams } from '@umijs/max';
import { Alert, Button, Form, Input, Modal, Tag, Typography, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { resolveProposalMemberRole } from '@/constants/proposalMemberRole';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  chapThuanDonDangKy,
  dongDangKyNhiemVu,
  soSanhDonDangKy,
  suaLyDoTuChoiDon,
  xacNhanPhanCong,
  type DonSoSanh,
  type SoSanhDangKy,
  type ThanhVienSoSanh,
} from '@/services/api/proposalRegistrations';

const { Text } = Typography;

function tien(n?: number | null) {
  return `${Number(n || 0).toLocaleString('vi-VN')} đ`;
}

function nhanTrangThai(status: DonSoSanh['status']) {
  if (status === 'DKDT_DUOC_CHAP_THUAN') return <Tag color="green">Được chấp thuận</Tag>;
  if (status === 'DKDT_TU_CHOI') return <Tag color="red">Từ chối</Tag>;
  if (status === 'CHO_DON_VI') return <Tag>Chờ đơn vị</Tag>;
  return <Tag color="gold">Chờ xét</Tag>;
}

function chuNhiem(don: DonSoSanh) {
  const ds = don.thanhVien || [];
  return ds.find((tv) => resolveProposalMemberRole(tv.vaiTro) === 'PRINCIPAL') || ds[0];
}

function thanhVienKhac(don: DonSoSanh) {
  const cn = chuNhiem(don);
  return (don.thanhVien || []).filter((tv) => tv !== cn);
}

function khoaHang(tv: ThanhVienSoSanh) {
  const ham = tv.hocHam || 'Chưa có học hàm';
  const vi = tv.hocVi || 'Chưa có học vị';
  return `${ham} · ${vi}`;
}

function diem(tv?: ThanhVienSoSanh) {
  if (!tv || tv.diemNckh == null) return '—';
  return `${tv.diemNckh} giờ`;
}

const SoSanhDangKyPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const nhiemVuId = Number(id);
  const [duLieu, setDuLieu] = useState<SoSanhDangKy | null>(null);
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [moDong, setMoDong] = useState(false);
  const [donChon, setDonChon] = useState<DonSoSanh | null>(null);
  const [formChap] = Form.useForm();
  const [formDong] = Form.useForm();

  const tai = useCallback(async () => {
    setDangTai(true);
    try {
      const res = await soSanhDonDangKy(nhiemVuId);
      setDuLieu(res.data || null);
    } catch {
      setDuLieu(null);
    } finally {
      setDangTai(false);
    }
  }, [nhiemVuId]);

  useEffect(() => {
    if (nhiemVuId) void tai();
  }, [nhiemVuId, tai]);

  const don = duLieu?.don || [];
  const daKhoa = !!duLieu?.daPhanCong || !!duLieu?.nhiemVu.trangThai;
  const conChoDonVi = don.some((d) => d.status === 'CHO_DON_VI');
  const daChapThuan = don.some((d) => d.status === 'DKDT_DUOC_CHAP_THUAN');
  const coTuChoi = don.some((d) => d.status === 'DKDT_TU_CHOI');

  const hangThanhVien = useMemo(() => {
    const nhom = new Map<string, Map<number, ThanhVienSoSanh[]>>();
    for (const d of don) {
      for (const tv of thanhVienKhac(d)) {
        const khoa = khoaHang(tv);
        const cot = nhom.get(khoa) || new Map<number, ThanhVienSoSanh[]>();
        const o = cot.get(d.id) || [];
        o.push(tv);
        cot.set(d.id, o);
        nhom.set(khoa, cot);
      }
    }
    return [...nhom.entries()];
  }, [don]);

  const moChapThuan = (row: DonSoSanh) => {
    formChap.resetFields();
    setDonChon(row);
  };

  const chapThuan = async () => {
    if (!donChon) return;
    const conLai = don.some((d) => d.id !== donChon.id && d.status !== 'CHO_DON_VI');
    let reason = '';
    if (conLai) {
      try {
        await formChap.validateFields();
      } catch {
        return;
      }
      reason = String(formChap.getFieldValue('reason') || '').trim();
    }
    setDangLuu(true);
    try {
      const res = await chapThuanDonDangKy(nhiemVuId, donChon.id, reason);
      setDuLieu(res.data || null);
      setDonChon(null);
      message.success('Đã chấp thuận đơn này. Các đơn còn lại bị từ chối.');
    } finally {
      setDangLuu(false);
    }
  };

  const luuLyDo = async (row: DonSoSanh, lyDo: string) => {
    const chu = lyDo.trim();
    if (!chu) {
      message.warning('Lý do không được để trống.');
      return;
    }
    await suaLyDoTuChoiDon(row.id, chu);
    message.success('Đã lưu lý do.');
    await tai();
  };

  const phanCong = () => {
    Modal.confirm({
      title: 'Xác nhận phân công nhiệm vụ này?',
      content:
        'Hệ thống tạo nhiệm vụ chính thức, mở thuyết minh cho chủ nhiệm và gửi email cho mọi người đã đăng ký.',
      okText: 'Xác nhận phân công',
      cancelText: 'Để sau',
      onOk: async () => {
        const res = await xacNhanPhanCong(nhiemVuId);
        message.success(`Đã giao cho ${res.data?.principalName}. Mã ${res.data?.code}.`);
        await tai();
      },
    });
  };

  const dong = async () => {
    try {
      await formDong.validateFields();
    } catch {
      return;
    }
    const reason = String(formDong.getFieldValue('reason') || '').trim();
    setDangLuu(true);
    try {
      await dongDangKyNhiemVu(nhiemVuId, reason);
      message.success('Đã đóng đăng ký nhiệm vụ.');
      setMoDong(false);
      await tai();
    } finally {
      setDangLuu(false);
    }
  };

  const oNguoi = (ds?: ThanhVienSoSanh[]) => {
    if (!ds?.length) return <Text type="secondary">—</Text>;
    return ds.map((tv, i) => (
      <div key={`${tv.ten}-${i}`} className={i ? 'xd-cach' : undefined}>
        <Text strong>{tv.ten}</Text>
        <div>Điểm NCKH: {diem(tv)}</div>
        <div>Nhiệm vụ đang làm: {tv.soNhiemVuDangLam}</div>
      </div>
    ));
  };

  return (
    <PageContainer
      loading={dangTai}
      title={duLieu ? `${duLieu.nhiemVu.code} ${duLieu.nhiemVu.title}` : 'So sánh đơn đăng ký'}
      onBack={() => history.push('/projects/xet-duyet-dang-ky')}
    >
      <style>{`
        .xd-vung { overflow-x: auto; border: 1px solid #f0f0f0; border-radius: 12px; }
        .xd-bang { width: 100%; border-collapse: separate; border-spacing: 0; }
        .xd-bang th, .xd-bang td {
          border-bottom: 1px solid #f0f0f0;
          border-right: 1px solid #f0f0f0;
          padding: 12px 14px;
          vertical-align: top;
          background: #fff;
          min-width: 240px;
        }
        .xd-bang th:first-child, .xd-bang td:first-child {
          position: sticky;
          left: 0;
          z-index: 1;
          min-width: 180px;
          width: 180px;
          background: #fafafa;
          font-weight: 600;
        }
        .xd-bang thead th { background: #f7f9fc; }
        .xd-bang thead th:first-child { z-index: 2; }
        .xd-bang .cot-dat { background: #f6ffed; }
        .xd-bang thead .cot-dat { background: #f6ffed; }
        .xd-so { font-size: 22px; font-weight: 700; color: #1677ff; }
        .xd-cap { display: flex; gap: 8px; margin-top: 10px; }
        .xd-cap > div { flex: 1; background: #f7f9fc; border-radius: 8px; padding: 8px 10px; }
        .xd-nhan { color: #8c8c8c; font-size: 12px; font-weight: 400; }
        .xd-gia { font-weight: 700; font-size: 16px; }
        .xd-cach { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #f0f0f0; }
      `}</style>

      {duLieu?.daPhanCong ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
          message={`Đã phân công cho ${duLieu.daPhanCong.principalName} · ${duLieu.daPhanCong.code}`}
          action={
            duLieu.daPhanCong.outlineId ? (
              <Button
                size="small"
                onClick={() => history.push(`/projects/outlines/form/${duLieu.daPhanCong?.outlineId}`)}
              >
                Mở thuyết minh
              </Button>
            ) : null
          }
        />
      ) : null}
      {duLieu?.nhiemVu.trangThai === 'DM_DONG_DANG_KY' ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Nhiệm vụ đã đóng đăng ký"
          description={duLieu.nhiemVu.ghiChu}
        />
      ) : null}
      {conChoDonVi && !daKhoa ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="Còn đơn đang chờ đơn vị xác nhận. Chưa chấp thuận được cho đến khi đơn vị xử lý xong."
        />
      ) : null}

      <div className="xd-vung">
        <table className="xd-bang">
          <thead>
            <tr>
              <th>Thông tin</th>
              {don.map((d) => {
                const dat = d.status === 'DKDT_DUOC_CHAP_THUAN';
                const choDonVi = d.status === 'CHO_DON_VI';
                return (
                  <th key={d.id} className={dat ? 'cot-dat' : undefined}>
                    <div style={{ marginBottom: 6 }}>{nhanTrangThai(d.status)}</div>
                    <div>{d.code}</div>
                    <Text type="secondary">{d.ownerName}</Text>
                    <div style={{ fontWeight: 400, marginTop: 6 }}>
                      {d.ownerUnit || '—'} · {tien(d.proposedBudget)} · {d.durationMonths} tháng
                    </div>
                    <div style={{ fontWeight: 400, margin: '6px 0 10px' }}>
                      {d.attachmentUrl ? (
                        <a href={resolvePublicAssetUrl(d.attachmentUrl)} target="_blank" rel="noreferrer">
                          File đăng ký
                        </a>
                      ) : (
                        <Text type="secondary">Không có file</Text>
                      )}
                    </div>
                    {!daKhoa ? (
                      <Button
                        type="primary"
                        block
                        disabled={dat || choDonVi || conChoDonVi}
                        onClick={() => moChapThuan(d)}
                      >
                        {dat ? 'Đã chấp thuận' : 'Chấp thuận'}
                      </Button>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Số thành viên</td>
              {don.map((d) => (
                <td key={d.id} className={d.status === 'DKDT_DUOC_CHAP_THUAN' ? 'cot-dat' : undefined}>
                  <div className="xd-so">{(d.thanhVien || []).length}</div>
                </td>
              ))}
            </tr>
            <tr>
              <td>Chủ nhiệm nhiệm vụ</td>
              {don.map((d) => {
                const cn = chuNhiem(d);
                return (
                  <td key={d.id} className={d.status === 'DKDT_DUOC_CHAP_THUAN' ? 'cot-dat' : undefined}>
                    {cn ? (
                      <>
                        <Text strong>{cn.ten}</Text>
                        <div style={{ marginTop: 6 }}>
                          <Tag color="blue">{cn.hocHam || 'Chưa có học hàm'}</Tag>
                          <Tag color="cyan">{cn.hocVi || 'Chưa có học vị'}</Tag>
                        </div>
                        <div className="xd-cap">
                          <div>
                            <div className="xd-nhan">Điểm NCKH</div>
                            <div className="xd-gia">{diem(cn)}</div>
                          </div>
                          <div>
                            <div className="xd-nhan">Nhiệm vụ đang làm</div>
                            <div className="xd-gia">{cn.soNhiemVuDangLam}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <Text type="secondary">—</Text>
                    )}
                  </td>
                );
              })}
            </tr>
            {hangThanhVien.map(([khoa, cot]) => (
              <tr key={khoa}>
                <td>
                  Thành viên
                  <div style={{ fontWeight: 400, color: '#8c8c8c' }}>{khoa}</div>
                </td>
                {don.map((d) => (
                  <td key={d.id} className={d.status === 'DKDT_DUOC_CHAP_THUAN' ? 'cot-dat' : undefined}>
                    {oNguoi(cot.get(d.id))}
                  </td>
                ))}
              </tr>
            ))}
            {coTuChoi ? (
              <tr>
                <td>Lý do từ chối</td>
                {don.map((d) => (
                  <td key={d.id} className={d.status === 'DKDT_DUOC_CHAP_THUAN' ? 'cot-dat' : undefined}>
                    {d.status === 'DKDT_TU_CHOI' && !daKhoa ? (
                      <Input.TextArea
                        rows={3}
                        defaultValue={d.pkhReason || ''}
                        key={`${d.id}-${d.pkhReason || ''}`}
                        maxLength={2000}
                        placeholder="Sửa lý do rồi nhấp ra ngoài"
                        onBlur={(e) => {
                          const moi = e.target.value.trim();
                          if (moi && moi !== (d.pkhReason || '').trim()) void luuLyDo(d, moi);
                        }}
                      />
                    ) : (
                      d.pkhReason || '—'
                    )}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {!daKhoa ? (
        <FooterToolbar>
          <Button danger onClick={() => setMoDong(true)}>
            Không tuyển được
          </Button>
          {daChapThuan ? (
            <Button type="primary" onClick={phanCong}>
              Xác nhận phân công
            </Button>
          ) : null}
        </FooterToolbar>
      ) : null}

      <Modal
        title={donChon ? `Chấp thuận đơn ${donChon.code}` : 'Chấp thuận'}
        open={!!donChon}
        okText="Chấp thuận"
        cancelText="Hủy"
        confirmLoading={dangLuu}
        onCancel={() => setDonChon(null)}
        onOk={() => void chapThuan()}
      >
        <p>
          Đơn của <Text strong>{donChon?.ownerName}</Text> được chấp thuận. Các đơn còn lại của nhiệm vụ này bị từ chối.
        </p>
        {don.filter((d) => d.id !== donChon?.id && d.status !== 'CHO_DON_VI').length ? (
          <Form form={formChap} layout="vertical">
            <Form.Item
              name="reason"
              label="Lý do từ chối các đơn còn lại"
              rules={[{ required: true, message: 'Nhập lý do' }]}
            >
              <Input.TextArea rows={4} maxLength={2000} showCount />
            </Form.Item>
          </Form>
        ) : (
          <Text type="secondary">Nhiệm vụ chỉ có đơn này.</Text>
        )}
      </Modal>

      <Modal
        title="Đóng đăng ký vì không tuyển được"
        open={moDong}
        okText="Đóng đăng ký"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        confirmLoading={dangLuu}
        onCancel={() => setMoDong(false)}
        onOk={() => void dong()}
      >
        <Form form={formDong} layout="vertical">
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Nhập lý do' }]}>
            <Input.TextArea
              rows={4}
              maxLength={2000}
              showCount
              placeholder="Vì sao nhiệm vụ này không giao được cho ai"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SoSanhDangKyPage;
