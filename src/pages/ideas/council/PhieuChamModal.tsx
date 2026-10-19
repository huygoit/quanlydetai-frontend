import { Button, Modal, Space, Tag } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import {
  MEMBER_ROLE_MAP,
  SCORING_CRITERIA,
  THRESHOLD_SCORE,
  type CouncilSession,
  type IdeaCouncilScore,
  type SessionIdea,
  type SessionMember,
} from '@/services/api/ideaCouncil';
import './phieu-cham.less';

type PhieuChamModalProps = {
  open: boolean;
  onClose: () => void;
  phieu: IdeaCouncilScore | null;
  yTuong: SessionIdea | null;
  phien: CouncilSession | null;
  thanhVien: SessionMember | null;
  tenChuTich?: string;
  tenThuKy?: string;
  ketQuaChung?: KetQuaChungPhieu | null;
};

export type KetQuaChungPhieu = {
  diem: number;
  dat: boolean;
  soPhieu: number;
  tongPhieu: number;
  duPhieu: boolean;
  tieuChi: { ten: string; diem: number }[];
};

export function tinhKetQuaChung(ds: IdeaCouncilScore[], tongThanhVien: number): KetQuaChungPhieu | null {
  if (!ds.length) return null;
  const trungBinh = (lay: (phieu: IdeaCouncilScore) => number) =>
    Math.round((ds.reduce((tong, phieu) => tong + lay(phieu), 0) / ds.length) * 100) / 100;
  const diem = trungBinh((phieu) => Number(phieu.weightedScore));
  const nhan = ['Tính mới', 'Khả thi', 'Phù hợp', 'Năng lực'];
  return {
    diem,
    dat: diem >= THRESHOLD_SCORE,
    soPhieu: ds.length,
    tongPhieu: tongThanhVien,
    duPhieu: tongThanhVien > 0 && ds.length >= tongThanhVien,
    tieuChi: SCORING_CRITERIA.map((tieuChi, thuTu) => ({
      ten: nhan[thuTu] || tieuChi.name,
      diem: trungBinh((phieu) => diemTieuChi(phieu, tieuChi.key).diem),
    })),
  };
}

export function TheKetQuaChung({ ketQua, gon }: { ketQua: KetQuaChungPhieu; gon?: boolean }) {
  const nen = ketQua.dat ? '#f6ffed' : '#fff2f0';
  const vien = ketQua.dat ? '#b7eb8f' : '#ffccc7';
  const chu = ketQua.dat ? '#237804' : '#a8071a';
  if (gon) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          margin: '0 auto 12px',
          maxWidth: 820,
          padding: '8px 14px',
          background: nen,
          border: `1px solid ${vien}`,
          borderRadius: 8,
        }}
      >
        <span>
          Kết quả chung <b>{ketQua.diem.toFixed(2)}/10</b>
          <span style={{ color: '#595959' }}> · {ketQua.soPhieu}/{ketQua.tongPhieu} phiếu</span>
        </span>
        <Tag color={ketQua.dat ? 'success' : 'error'} style={{ margin: 0, fontWeight: 700 }}>
          {ketQua.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'}
        </Tag>
      </div>
    );
  }
  return (
    <div style={{ padding: 14, background: nen, border: `1px solid ${vien}`, borderRadius: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: '#595959' }}>Kết quả chung</div>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.15, color: chu }}>
            {ketQua.diem.toFixed(2)}
            <span style={{ fontSize: 14, fontWeight: 600, color: '#595959' }}>/10</span>
          </div>
          <div style={{ fontSize: 13, color: '#595959' }}>
            {ketQua.soPhieu}/{ketQua.tongPhieu} phiếu · ngưỡng {THRESHOLD_SCORE}
            {ketQua.duPhieu ? '' : ' · tạm tính'}
          </div>
        </div>
        <Tag
          color={ketQua.dat ? 'success' : 'error'}
          style={{ margin: 0, fontSize: 16, fontWeight: 700, padding: '4px 12px', lineHeight: '28px' }}
        >
          {ketQua.dat ? 'ĐẠT' : 'KHÔNG ĐẠT'}
        </Tag>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        {ketQua.tieuChi.map((muc) => (
          <div key={muc.ten} style={{ background: '#fff', borderRadius: 6, padding: '6px 10px' }}>
            <div style={{ fontSize: 12, color: '#8c8c8c' }}>{muc.ten}</div>
            <div style={{ fontWeight: 700 }}>{muc.diem.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function diemTieuChi(phieu: IdeaCouncilScore, khoa: string): { diem: number; nhanXet: string } {
  const banDo: Record<string, { diem: number; nhanXet: string }> = {
    novelty: { diem: phieu.noveltyScore, nhanXet: phieu.noveltyComment },
    feasibility: { diem: phieu.feasibilityScore, nhanXet: phieu.feasibilityComment },
    alignment: { diem: phieu.alignmentScore, nhanXet: phieu.alignmentComment },
    authorCapacity: { diem: phieu.authorCapacityScore, nhanXet: phieu.authorCapacityComment },
  };
  return banDo[khoa] ?? { diem: 0, nhanXet: '' };
}

export function donViHienThi(unit?: string | null): string {
  if (!unit?.trim()) return '—';
  const phan = unit
    .split(/\s+[–—]\s+/)
    .map((muc) => muc.trim())
    .filter(Boolean);
  return [...new Set(phan)].join(', ');
}

function dinhDangNgay(giaTri?: string | null): string {
  if (!giaTri) return '—';
  const ngay = new Date(giaTri);
  if (Number.isNaN(ngay.getTime())) return giaTri;
  return ngay.toLocaleString('vi-VN');
}

function inPhieu() {
  const goc = document.getElementById('phieu-cham-print');
  if (!goc) return;
  const khung = document.createElement('iframe');
  khung.title = 'In phiếu chấm điểm';
  khung.style.position = 'fixed';
  khung.style.right = '0';
  khung.style.bottom = '0';
  khung.style.width = '0';
  khung.style.height = '0';
  khung.style.border = '0';
  document.body.appendChild(khung);
  const taiLieu = khung.contentDocument;
  const cuaSo = khung.contentWindow;
  if (!taiLieu || !cuaSo) {
    khung.remove();
    return;
  }
  taiLieu.open();
  taiLieu.write('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Phiếu chấm điểm</title></head><body></body></html>');
  taiLieu.close();
  document.querySelectorAll('style, link[rel="stylesheet"]').forEach((nut) => {
    taiLieu.head.appendChild(nut.cloneNode(true));
  });
  const trang = taiLieu.createElement('style');
  trang.textContent = '@page{size:A4;margin:12mm}body{margin:0;background:#fff}.phieu-cham{box-shadow:none;max-width:none}';
  taiLieu.head.appendChild(trang);
  taiLieu.body.appendChild(goc.cloneNode(true));
  let daXoa = false;
  const donDep = () => {
    if (daXoa) return;
    daXoa = true;
    khung.remove();
  };
  cuaSo.addEventListener('afterprint', donDep);
  window.setTimeout(() => {
    cuaSo.focus();
    cuaSo.print();
    window.setTimeout(donDep, 1500);
  }, 250);
}

export default function PhieuChamModal({
  open,
  onClose,
  phieu,
  yTuong,
  phien,
  thanhVien,
  tenChuTich,
  tenThuKy,
  ketQuaChung,
}: PhieuChamModalProps) {
  const vaiTro = phieu ? MEMBER_ROLE_MAP[phieu.councilRole] : undefined;
  const datNguong = !!phieu && Number(phieu.weightedScore) >= THRESHOLD_SCORE;

  return (
    <Modal
      title="Phiếu chấm điểm"
      open={open}
      onCancel={onClose}
      width={920}
      destroyOnClose
      bodyStyle={{ background: '#e8edf3', padding: 20, maxHeight: 'calc(100vh - 180px)', overflow: 'auto' }}
      footer={
        <Space>
          <Button onClick={onClose}>Đóng</Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={inPhieu} disabled={!phieu}>
            In / Lưu PDF
          </Button>
        </Space>
      }
    >
      {phieu && (
        <div className="phieu-cham-nen">
          {ketQuaChung ? <TheKetQuaChung ketQua={ketQuaChung} gon /> : null}
          <div id="phieu-cham-print" className="phieu-cham">
            <div className="phieu-cham-quoc-hieu">
              <div className="phieu-cham-trai">
                <div>ĐẠI HỌC ĐÀ NẴNG</div>
                <div className="phieu-cham-dam">TRƯỜNG ĐẠI HỌC SƯ PHẠM</div>
                <div className="phieu-cham-gach" />
              </div>
              <div className="phieu-cham-phai">
                <div className="phieu-cham-dam">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                <div className="phieu-cham-dam">Độc lập - Tự do - Hạnh phúc</div>
                <div className="phieu-cham-gach" />
              </div>
            </div>

            <div className="phieu-cham-tieu-de">PHIẾU CHẤM ĐIỂM Ý TƯỞNG</div>
            <p className="phieu-cham-phu-de">Hội đồng khoa học và đào tạo</p>

            <div className="phieu-cham-luoi">
              <div><b>Phiên:</b> {phien?.code} — {phien?.title}</div>
              <div><b>Năm:</b> {phien?.year ?? '—'}</div>
              <div><b>Ngày họp:</b> {phien?.meetingDate || '—'}</div>
              <div><b>Địa điểm:</b> {phien?.location || '—'}</div>
            </div>

            <div className="phieu-cham-luoi">
              <div><b>Mã ý tưởng:</b> {yTuong?.ideaCode}</div>
              <div><b>Lĩnh vực:</b> {yTuong?.field || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><b>Tên ý tưởng:</b> {yTuong?.ideaTitle}</div>
              <div><b>Tác giả:</b> {yTuong?.ownerName || '—'}</div>
              <div><b>Đơn vị:</b> {yTuong?.ownerUnit || '—'}</div>
            </div>

            <div className="phieu-cham-luoi">
              <div><b>Người chấm:</b> {phieu.councilMemberName}</div>
              <div><b>Vai trò:</b> {vaiTro?.text || phieu.councilRole}</div>
              <div><b>Đơn vị:</b> {donViHienThi(thanhVien?.unit)}</div>
              <div><b>Email:</b> {thanhVien?.memberEmail || '—'}</div>
              <div style={{ gridColumn: '1 / -1' }}><b>Thời điểm gửi phiếu:</b> {dinhDangNgay(phieu.submittedAt)}</div>
            </div>

            <table className="phieu-cham-bang">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Tiêu chí</th>
                  <th style={{ width: '10%' }}>Trọng số</th>
                  <th style={{ width: '10%' }}>Điểm</th>
                  <th style={{ width: '12%' }}>Quy đổi</th>
                  <th>Nhận xét</th>
                </tr>
              </thead>
              <tbody>
                {SCORING_CRITERIA.map((tieuChi) => {
                  const muc = diemTieuChi(phieu, tieuChi.key);
                  const quyDoi = Math.round(muc.diem * tieuChi.weight * 100) / 100;
                  return (
                    <tr key={tieuChi.key}>
                      <td>
                        <b>{tieuChi.name}</b>
                        <span className="phieu-cham-mo-ta">{tieuChi.description}</span>
                      </td>
                      <td className="phieu-cham-diem">{Math.round(tieuChi.weight * 100)}%</td>
                      <td className="phieu-cham-diem">{muc.diem}</td>
                      <td className="phieu-cham-diem">{quyDoi.toFixed(2)}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{muc.nhanXet || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="phieu-cham-tong">
              <div>
                <div className="phieu-cham-dam">Điểm tổng hợp (thang 10)</div>
                <div>{datNguong ? `Đạt ngưỡng ${THRESHOLD_SCORE}` : `Chưa đạt ngưỡng ${THRESHOLD_SCORE}`}</div>
              </div>
              <div className="phieu-cham-so-tong">{Number(phieu.weightedScore).toFixed(2)}</div>
            </div>

            <div style={{ marginTop: 14 }} className="phieu-cham-dam">Nhận xét chung</div>
            <div className="phieu-cham-nhan-xet">{phieu.generalComment?.trim() || '—'}</div>

            <div className="phieu-cham-ky">
              <div className="phieu-cham-ky-o">
                <div className="phieu-cham-dam">NGƯỜI CHẤM</div>
                <div className="phieu-cham-chu-ky">(Ký và ghi rõ họ tên)</div>
                <div className="phieu-cham-ky-ten">{phieu.councilMemberName}</div>
              </div>
              <div className="phieu-cham-ky-o">
                <div className="phieu-cham-dam">THƯ KÝ</div>
                <div className="phieu-cham-chu-ky">(Ký và ghi rõ họ tên)</div>
                <div className="phieu-cham-ky-ten">{tenThuKy || ''}</div>
              </div>
              <div className="phieu-cham-ky-o">
                <div className="phieu-cham-dam">CHỦ TỊCH HỘI ĐỒNG</div>
                <div className="phieu-cham-chu-ky">(Ký và ghi rõ họ tên)</div>
                <div className="phieu-cham-ky-ten">{tenChuTich || ''}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
