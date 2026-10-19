/**
 * Trang xem thông báo tuyển chọn — mở tab mới, trình bày như công văn Word.
 */
import { Button, Modal, Spin, message } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useAccess, useParams } from '@umijs/max';
import { useCallback, useEffect, useState } from 'react';
import {
  getCfpNoticeView,
  submitCallForProposal,
  type CfpNoticeHang,
  type CfpNoticeView,
  type CfpStatus,
} from '@/services/api/callForProposals';

function chu(truong: Record<string, string>, key: string) {
  return truong[key] || '';
}

const TrangXemThongBao: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [data, setData] = useState<CfpNoticeView | null>(null);
  const [loading, setLoading] = useState(true);
  const [dangTrinh, setDangTrinh] = useState(false);

  const tai = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCfpNoticeView(Number(id));
      setData(res.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được thông báo');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void tai();
  }, [tai]);

  const st = data?.status as CfpStatus | undefined;
  const duocTrinh = !!access.canSubmitCfp && (st === 'DRAFT' || st === 'RETURNED');
  const t = data?.truong || {};

  const trinhBgh = () => {
    if (!id) return;
    Modal.confirm({
      title: 'Trình BGH duyệt thông báo này?',
      content: 'Thông báo sẽ chuyển sang chờ BGH duyệt.',
      okText: 'Trình BGH',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangTrinh(true);
        try {
          await submitCallForProposal(Number(id));
          message.success('Đã trình BGH');
          await tai();
        } catch (e: any) {
          if (!e?.response && e?.message) message.error(e.message);
        } finally {
          setDangTrinh(false);
        }
      },
    });
  };

  return (
    <div className="xem-tb">
      <style>{`
        .xem-tb { min-height: 100vh; background: #e8e8e8; }
        .xem-tb-bar {
          position: sticky; top: 0; z-index: 2;
          display: flex; justify-content: flex-end; gap: 8px;
          padding: 12px 24px; background: #fff; border-bottom: 1px solid #d9d9d9;
        }
        .giay {
          width: 210mm; min-height: 297mm; margin: 24px auto 40px;
          background: #fff; color: #000;
          padding: 20mm 15mm 20mm 30mm;
          box-shadow: 0 2px 10px rgba(0,0,0,.15);
          font-family: "Times New Roman", Times, serif;
          font-size: 13pt; line-height: 1.5;
        }
        .quoc-hieu { display: grid; grid-template-columns: 1fr 1fr; text-align: center; font-weight: 700; }
        .quoc-hieu .phai { font-weight: 700; }
        .gach { display: inline-block; border-bottom: 1px solid #000; line-height: 1.2; }
        .so-ngay { display: flex; justify-content: space-between; margin-top: 12px; }
        .tieu-de { text-align: center; font-weight: 700; font-size: 14pt; margin: 18px 0 4px; }
        .trich-yeu { text-align: center; font-weight: 700; margin-bottom: 16px; }
        .doan { text-align: justify; margin: 0 0 8px; }
        .noi-dung-tb p { text-align: justify; text-indent: 1.27cm; margin: 0 0 8px; }
        .ky { display: grid; grid-template-columns: 1.1fr 0.9fr; margin-top: 16px; }
        .noi-nhan { font-size: 12pt; }
        .ky-phai { text-align: center; font-weight: 700; }
        .ten-ky { margin-top: 72px; }
        .phu-luc { margin-top: 28px; text-align: center; }
        .phu-luc h2 { font-size: 13pt; font-weight: 700; margin: 0; }
        .phu-luc .kem { font-style: italic; margin: 8px 0 12px; }
        .bang { width: 100%; border-collapse: collapse; font-size: 12pt; }
        .bang th, .bang td { border: 1px solid #000; padding: 6px 8px; vertical-align: top; }
        .bang th { background: #f2f2f2; text-align: center; font-weight: 700; }
        .bang td.giua { text-align: center; }
        @media print {
          .xem-tb { background: #fff; }
          .xem-tb-bar { display: none; }
          .giay { margin: 0; box-shadow: none; width: auto; min-height: 0; }
        }
      `}</style>

      <div className="xem-tb-bar">
        {duocTrinh ? (
          <Button type="primary" icon={<SendOutlined />} loading={dangTrinh} onClick={trinhBgh}>
            Trình BGH
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}>
          <Spin />
        </div>
      ) : (
        <article className="giay">
          <div className="quoc-hieu">
            <div>
              <div>ĐẠI HỌC ĐÀ NẴNG</div>
              <div>
                <span className="gach">TRƯỜNG ĐẠI HỌC SƯ PHẠM</span>
              </div>
            </div>
            <div className="phai">
              <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div>
                <span className="gach">Độc lập - Tự do - Hạnh phúc</span>
              </div>
            </div>
          </div>
          <div className="so-ngay">
            <div>
              Số: {chu(t, 'so')}/TB-{chu(t, 'ky_hieu')}
            </div>
            <div>
              Đà Nẵng, ngày {chu(t, 'dd')} tháng {chu(t, 'mm')} năm {chu(t, 'year')}
            </div>
          </div>

          <div className="tieu-de">THÔNG BÁO</div>
          <div className="trich-yeu">{chu(t, 'tieu_de')}</div>
          <div
            className="doan noi-dung-tb"
            dangerouslySetInnerHTML={{ __html: chu(t, 'noi_dung_thong_bao') }}
          />

          <div className="ky">
            <div className="noi-nhan">
              <strong>Nơi nhận:</strong>
              <div style={{ whiteSpace: 'pre-wrap' }}>{chu(t, 'noi_nhan')}</div>
            </div>
            <div className="ky-phai">
              <div>{chu(t, 'tham_quyen_ky')}</div>
              <div className="ten-ky">{chu(t, 'ho_ten_nguoi_ky')}</div>
            </div>
          </div>

          <div className="phu-luc">
            <h2>DANH MỤC NHIỆM VỤ KHOA HỌC VÀ CÔNG NGHỆ</h2>
            <div>
              <strong>
                Tuyển chọn tổ chức, cá nhân chủ trì thực hiện
                <br />
                từ năm {chu(t, 'nam_thuc_hien')}
              </strong>
            </div>
            <div className="kem">
              (Kèm theo Thông báo số {chu(t, 'so')}/TB-{chu(t, 'ky_hieu')}
              <br />
              ngày {chu(t, 'dd')}-{chu(t, 'mm')}-{chu(t, 'yyyy')} của Trường Đại học Sư phạm - Đại học
              Đà Nẵng)
            </div>
            <table className="bang">
              <thead>
                <tr>
                  <th style={{ width: 48 }}>STT</th>
                  <th>Tên nhiệm vụ</th>
                  <th>Mục tiêu</th>
                  <th>Sản phẩm dự kiến</th>
                  <th style={{ width: 110 }}>Thời gian thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {(data?.hang || []).length ? (
                  (data?.hang as CfpNoticeHang[]).map((h) => (
                    <tr key={h.stt}>
                      <td className="giua">{h.stt}</td>
                      <td>{h.tenNhiemVu}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{h.mucTieu}</td>
                      <td style={{ whiteSpace: 'pre-wrap' }}>{h.sanPhamDuKien}</td>
                      <td className="giua">{h.thoiGianThucHien}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="giua" colSpan={5}>
                      Chưa có nhiệm vụ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      )}
    </div>
  );
};

export default TrangXemThongBao;
