/**
 * Xem biên bản ĐGCK (BM-05.06) — layout giống biểu mẫu giấy.
 */
import { NHAN_VAI_TRO_HD, NHAN_XEP_LOAI } from '@/constants/module56';
import type { HoSoCuoiKy } from '@/services/api/module56';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { DownloadOutlined, FileProtectOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text, Title, Paragraph } = Typography;

type Props = {
  hs: HoSoCuoiKy;
};

function dong(label: string, value?: string | number | null) {
  const v = value == null || String(value).trim() === '' ? '—' : String(value);
  return (
    <div style={{ marginBottom: 8, lineHeight: 1.55 }}>
      <Text strong>{label}</Text> {v}
    </div>
  );
}

function khoi(tieuDe: string, children: React.ReactNode) {
  return (
    <div style={{ marginTop: 18, marginBottom: 8 }}>
      <Title
        level={5}
        style={{
          margin: '0 0 10px',
          color: '#0b3a6e',
          borderBottom: '1px solid #d6e4ff',
          paddingBottom: 6,
        }}
      >
        {tieuDe}
      </Title>
      {children}
    </div>
  );
}

function ketLuanText(code?: string | null) {
  if (code === 'DAT_YEU_CAU') return '☑ Đạt     ☐ Cần bổ sung, hoàn thiện     ☐ Không đạt';
  if (code === 'CAN_BO_SUNG')
    return '☐ Đạt     ☑ Cần bổ sung, hoàn thiện     ☐ Không đạt';
  if (code === 'KHONG_DAT') return '☐ Đạt     ☐ Cần bổ sung, hoàn thiện     ☑ Không đạt';
  return '☐ Đạt     ☐ Cần bổ sung, hoàn thiện     ☐ Không đạt';
}

export function BienBanDgckXem({ hs }: Props) {
  const m = hs.minutes;
  if (!m) return null;

  const members = hs.council?.members || [];
  const chuTich = members.find((x) => x.role === 'CHU_TICH');
  const thuKy = members.find((x) => x.role === 'THU_KY');
  const present = new Set((m.presentUserIds || []).map(Number));
  const soThamDu = present.size || (m.presentUserIds || []).length;
  const hop =
    [
      hs.council?.meetingAt
        ? dayjs(hs.council.meetingAt).format('HH:mm DD/MM/YYYY')
        : '',
      hs.council?.location || '',
    ]
      .filter(Boolean)
      .join(' — ') || '—';

  const phieuDat = (m as any).voteDat;
  const phieuBs = (m as any).voteBoSung;
  const phieuKd = (m as any).voteKhongDat;
  const quyenBq = (m as any).voteEligible;

  return (
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        border: '1px solid #d6e4ff',
        background: '#fff',
        boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div
        style={{
          padding: '14px 20px',
          background: 'linear-gradient(120deg, #0b3a6e 0%, #1677ff 100%)',
          color: '#fff',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <Space>
          <FileProtectOutlined style={{ fontSize: 20 }} />
          <div>
            <div style={{ fontWeight: 700 }}>Biên bản đánh giá kết quả (BM-05.06)</div>
            <div style={{ opacity: 0.9, fontSize: 13 }}>
              {hs.code} — đã chốt
            </div>
          </div>
        </Space>
        <Space wrap>
          {hs.classification ? (
            <Tag color="gold" style={{ margin: 0 }}>
              {NHAN_XEP_LOAI[hs.classification as 'DAT_YEU_CAU'] ||
                hs.classification}
            </Tag>
          ) : null}
          {hs.minutesFileUrl ? (
            <Button
              icon={<DownloadOutlined />}
              href={resolvePublicAssetUrl(hs.minutesFileUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Tải file DOCX
            </Button>
          ) : null}
        </Space>
      </div>

      <div
        style={{
          padding: '28px 32px 36px',
          maxWidth: 900,
          margin: '0 auto',
          fontFamily:
            '"Times New Roman", "Noto Serif", Georgia, "Liberation Serif", serif',
          color: '#1f1f1f',
        }}
      >
        {/* Quốc hiệu */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Đại học Đà Nẵng
            </div>
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Trường Đại học Sư phạm
            </div>
            <div style={{ marginTop: 4 }}>────────</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Cộng hòa xã hội chủ nghĩa Việt Nam
            </div>
            <div style={{ fontStyle: 'italic' }}>Độc lập – Tự do – Hạnh phúc</div>
            <div style={{ marginTop: 4 }}>────────</div>
          </div>
        </div>

        <Title
          level={4}
          style={{
            textAlign: 'center',
            textTransform: 'uppercase',
            margin: '8px 0 20px',
            letterSpacing: 0.3,
          }}
        >
          Biên bản đánh giá kết quả thực hiện nhiệm vụ KH,CN&ĐMST
        </Title>

        {khoi('1. Thông tin chung', (
          <>
            {dong('Tên nhiệm vụ:', hs.title)}
            {dong('Mã số:', hs.code)}
            {dong('Chủ nhiệm nhiệm vụ:', hs.ownerName)}
            {dong(
              'Quyết định thành lập Hội đồng số:',
              (m as any).qdCouncilNo,
            )}
            {dong('Thời gian, địa điểm / hình thức họp:', hop)}
            {dong(
              'Chủ tịch / Tổ trưởng:',
              chuTich?.fullName || chuTich?.name,
            )}
            {dong('Thư ký:', thuKy?.fullName || thuKy?.name)}
            {dong(
              'Tổng số thành viên / số tham dự hợp lệ:',
              `${members.length} / ${soThamDu}`,
            )}
            <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
              Điều kiện tiến hành cuộc họp và cam kết xung đột lợi ích, bảo mật
              được xác nhận theo quy định.
            </Paragraph>
          </>
        ))}

        {khoi('2. Kết quả đánh giá', (
          <>
            <Paragraph strong style={{ marginBottom: 4 }}>
              2.1. Nhận xét chung
            </Paragraph>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {m.discussion || '—'}
            </Paragraph>
            <Paragraph strong style={{ marginBottom: 4 }}>
              2.2. Nội dung cần làm rõ, hoàn thiện (nếu có)
            </Paragraph>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>
              {(m as any).clarifyContent || m.quality || '—'}
            </Paragraph>
            <Paragraph strong style={{ marginBottom: 4 }}>
              2.3. Giải trình của Chủ nhiệm và ý kiến khác biệt (nếu có)
            </Paragraph>
            <Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>
              {(m as any).ownerExplanation || '—'}
            </Paragraph>
          </>
        ))}

        {khoi('3. Kết luận và kiến nghị', (
          <>
            {dong(
              'Kết quả biểu quyết:',
              `Đạt ${phieuDat ?? '—'} phiếu; Cần bổ sung, hoàn thiện ${phieuBs ?? '—'} phiếu; Không đạt ${phieuKd ?? '—'} phiếu.`,
            )}
            {dong(
              'Số thành viên có quyền biểu quyết:',
              quyenBq ?? soThamDu,
            )}
            <div style={{ marginBottom: 10, lineHeight: 1.55 }}>
              <Text strong>Kết luận: </Text>
              {ketLuanText(hs.classification)}
            </div>
            {dong('Nội dung cần hoàn thiện (nếu có):', m.recommendation)}
            {dong(
              'Kiến nghị khác:',
              (m as any).otherRecommendation,
            )}
            <Paragraph type="secondary" style={{ marginTop: 12 }}>
              Biên bản được thông qua tại cuộc họp và lưu trong hồ sơ đánh giá
              nhiệm vụ.
            </Paragraph>
          </>
        ))}

        <Divider style={{ margin: '20px 0' }} />

        <div style={{ marginBottom: 16 }}>
          <Text strong>Thành phần hội đồng & điểm danh</Text>
          <div style={{ marginTop: 8 }}>
            {members.map((tv) => {
              const uid = Number(tv.userId);
              const coMat = present.size ? present.has(uid) : true;
              return (
                <div key={uid} style={{ marginBottom: 4 }}>
                  • {tv.fullName || tv.name || `#${uid}`} (
                  {NHAN_VAI_TRO_HD[tv.role as keyof typeof NHAN_VAI_TRO_HD] ||
                    tv.role}
                  ) — {coMat ? 'có mặt' : 'vắng'}
                </div>
              );
            })}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            marginTop: 28,
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>THƯ KÝ</div>
            <div style={{ fontStyle: 'italic', marginTop: 4 }}>
              (Ký, ghi rõ họ tên)
            </div>
            <div style={{ marginTop: 48, fontWeight: 600 }}>
              {thuKy?.fullName || thuKy?.name || '…………………'}
            </div>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>CHỦ TỊCH HỘI ĐỒNG</div>
            <div style={{ fontStyle: 'italic', marginTop: 4 }}>
              (Ký, ghi rõ họ tên)
            </div>
            <div style={{ marginTop: 48, fontWeight: 600 }}>
              {chuTich?.fullName || chuTich?.name || '…………………'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default BienBanDgckXem;
