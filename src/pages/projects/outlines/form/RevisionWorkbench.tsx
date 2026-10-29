/**
 * Bảng điều khiển hoàn thiện TM theo biên bản BM.05b
 * Luồng: CNNV → PKH → Hội đồng → BGH
 */
import React from 'react';
import {
  CheckCircleFilled,
  ClockCircleOutlined,
  DiffOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FlagOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { Button, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import type {
  OutlineRevisionContext,
  OutlineVersionMeta,
  RevisionGateStatus,
} from '@/services/api/projectOutlines';
import './revision-workbench.less';
import { formatDate, formatDateTime } from '@/utils/datetime';

const { Text, Paragraph, Title } = Typography;

function formatSize(bytes?: number | null) {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}


type BuocKey = 'CHINH_SUA' | 'PKH' | 'HOI_DONG' | 'BGH';

function buocHienTai(
  status?: string,
  gate?: RevisionGateStatus | null,
): { key: BuocKey; index: number } {
  if (status === 'SAN_SANG_THUC_HIEN' || status === 'CHO_HC_PHAT_HANH_QD') {
    return { key: 'BGH', index: 4 };
  }
  if (status === 'CHO_BGH_DUYET_TM' || gate === 'CHO_BGH') {
    return { key: 'BGH', index: 3 };
  }
  if (status === 'CHO_HD_XAC_NHAN_TM') {
    return { key: 'HOI_DONG', index: 2 };
  }
  if (status === 'CHO_PKH_DUYET_TM' || gate === 'CHO_PKH') {
    return { key: 'PKH', index: 1 };
  }
  return { key: 'CHINH_SUA', index: 0 };
}

function nhanBuoc(
  status?: string,
  gate?: RevisionGateStatus | null,
): string {
  if (status === 'CHINH_SUA_TM') {
    return 'Đang hoàn thiện theo ý kiến Hội đồng (BM.05b)';
  }
  if (status === 'CHO_PKH_DUYET_TM') {
    return 'Đã nộp — chờ Phòng Khoa học duyệt';
  }
  if (status === 'CHO_HD_XAC_NHAN_TM' && gate === 'CHO_CHU_TICH') {
    return 'Thư ký đã đồng ý — chờ Chủ tịch hội đồng';
  }
  if (status === 'CHO_HD_XAC_NHAN_TM') {
    return 'PKH đã duyệt — chờ Thư ký hoặc Chủ tịch hội đồng xác nhận';
  }
  if (status === 'CHO_BGH_DUYET_TM') {
    return 'Chờ BGH phê duyệt (xem BM.04 / BM.05a / BM.05b)';
  }
  if (status === 'CHO_HC_PHAT_HANH_QD') {
    return 'BGH đã ký — chờ TC-HC phát hành QĐ giao thực hiện';
  }
  if (status === 'SAN_SANG_THUC_HIEN') {
    return 'Đã phê duyệt — Module 5 đã mở';
  }
  return 'Bản hoàn thiện thuyết minh';
}

function ThePhienBan({
  tieuDe,
  badge,
  ver,
  highlight,
}: {
  tieuDe: string;
  badge: string;
  ver?: OutlineVersionMeta | null;
  highlight?: boolean;
}) {
  return (
    <div className={`rw-version ${highlight ? 'rw-version--hi' : ''}`}>
      <div className="rw-version__head">
        <span className="rw-version__badge">{badge}</span>
        <Text strong>{tieuDe}</Text>
      </div>
      {ver ? (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <div className="rw-version__row">
            <FileTextOutlined />
            <Text ellipsis={{ tooltip: ver.fileName || '—' }}>
              {ver.fileName || 'Chưa có tên file'}
            </Text>
          </div>
          <div className="rw-version__meta">
            <span>{formatSize(ver.fileSize)}</span>
            <span>·</span>
            <span>{formatDateTime(ver.uploadedAt || ver.lockedAt || ver.createdAt)}</span>
          </div>
          {ver.outlineFileUrl ? (
            <a href={ver.outlineFileUrl} target="_blank" rel="noreferrer">
              Mở file
            </a>
          ) : null}
        </Space>
      ) : (
        <Text type="secondary">Chưa có phiên bản khóa</Text>
      )}
    </div>
  );
}

export type RevisionWorkbenchProps = {
  status?: string;
  ctx: OutlineRevisionContext | null;
  editable: boolean;
  canExtend: boolean;
  hienPkh: boolean;
  hienThuKy: boolean;
  hienChuTich: boolean;
  hienBgh: boolean;
  explanationLen: number;
  onDiff: () => void;
  onExtend: () => void;
  onApprove: (accept: boolean) => void;
  onSubmit: () => void;
  onOpenBghApproval?: () => void;
};

const BUOC_NHAN: { key: BuocKey; label: string }[] = [
  { key: 'CHINH_SUA', label: 'CNNV hoàn thiện' },
  { key: 'PKH', label: 'Phòng KH' },
  { key: 'HOI_DONG', label: 'Hội đồng' },
  { key: 'BGH', label: 'BGH' },
];

const RevisionWorkbench: React.FC<RevisionWorkbenchProps> = ({
  status,
  ctx,
  editable,
  canExtend,
  hienPkh,
  hienThuKy,
  hienChuTich,
  hienBgh,
  explanationLen,
  onDiff,
  onExtend,
  onApprove,
  onSubmit,
  onOpenBghApproval,
}) => {
  const minLen = ctx?.minExplanationLength || 100;
  const buoc = buocHienTai(status, ctx?.revisionGateStatus);
  const pct = Math.min(100, Math.round((Math.min(buoc.index, 3) / 3) * 100));
  const quaHan = !!ctx?.pastDeadline;

  return (
    <div className={`rw-root ${quaHan ? 'rw-root--late' : ''}`}>
      <div className="rw-hero">
        <div className="rw-hero__glow" />
        <Row gutter={[24, 16]} align="middle">
          <Col xs={24} lg={14}>
            <Space size={8} wrap>
              <Tag color="volcano" className="rw-chip">
                BM.05b · Biên bản hội đồng
              </Tag>
              {ctx?.finalScore != null && (
                <Tag color="blue">Điểm TB: {ctx.finalScore}</Tag>
              )}
              {quaHan && <Tag color="error">Đã quá hạn</Tag>}
            </Space>
            <Title level={3} className="rw-hero__title">
              Ý kiến Hội đồng thẩm định
            </Title>
            <Paragraph className="rw-hero__sub">
              {nhanBuoc(status, ctx?.revisionGateStatus)}
            </Paragraph>
            {ctx?.revisionDeadline && (
              <div className="rw-deadline">
                <ClockCircleOutlined />
                <span>
                  Hạn hoàn thiện:{' '}
                  <strong>
                    {formatDate(ctx.revisionDeadline)}
                  </strong>
                  {ctx.needsReminder && !quaHan
                    ? ` · còn ≤ ${ctx.reminderDays} ngày`
                    : ''}
                </span>
              </div>
            )}
          </Col>
          <Col xs={24} lg={10}>
            <div className="rw-steps">
              {BUOC_NHAN.map((b, i) => {
                const done = i < buoc.index || status === 'SAN_SANG_THUC_HIEN';
                const active = i === buoc.index && status !== 'SAN_SANG_THUC_HIEN';
                return (
                  <div
                    key={b.key}
                    className={`rw-step ${done ? 'is-done' : ''} ${
                      active ? 'is-active' : ''
                    }`}
                  >
                    <div className="rw-step__dot">
                      {done ? <CheckCircleFilled /> : i + 1}
                    </div>
                    <div className="rw-step__label">{b.label}</div>
                  </div>
                );
              })}
            </div>
            <Progress
              percent={status === 'SAN_SANG_THUC_HIEN' ? 100 : pct}
              showInfo={false}
              strokeColor={{ from: '#0f766e', to: '#f59e0b' }}
              trailColor="rgba(255,255,255,0.2)"
              style={{ marginTop: 12 }}
            />
          </Col>
        </Row>
      </div>

      <div className="rw-body">
        {ctx?.revisionReturnReason && (
          <div className="rw-return">
            <FlagOutlined />
            <div>
              <Text strong>Bị trả lại — lý do: </Text>
              <span>{ctx.revisionReturnReason}</span>
            </div>
          </div>
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <div className="rw-panel rw-panel--opinion">
              <div className="rw-panel__title">
                <FileProtectOutlined /> Nội dung điều chỉnh (BM.05b)
              </div>
              {ctx?.adjustmentRequirements ? (
                <Paragraph className="rw-opinion">
                  {ctx.adjustmentRequirements}
                </Paragraph>
              ) : (
                <Text type="secondary">
                  Chưa có nội dung điều chỉnh chi tiết trên biên bản.
                </Text>
              )}
              {ctx?.discussionNotes && (
                <>
                  <div className="rw-panel__sub">Thảo luận / ý kiến HĐ</div>
                  <Paragraph className="rw-opinion rw-opinion--muted">
                    {ctx.discussionNotes}
                  </Paragraph>
                </>
              )}
              {ctx?.minutesNote && (
                <>
                  <div className="rw-panel__sub">Ghi chú biên bản</div>
                  <Paragraph className="rw-opinion rw-opinion--muted">
                    {ctx.minutesNote}
                  </Paragraph>
                </>
              )}
              <Space wrap style={{ marginTop: 8 }}>
                {ctx?.minutesFileUrl && (
                  <Button
                    type="primary"
                    ghost
                    icon={<FilePdfOutlined />}
                    href={ctx.minutesFileUrl}
                    target="_blank"
                  >
                    Xem PDF biên bản BM.05b
                  </Button>
                )}
                <Button icon={<DiffOutlined />} onClick={onDiff}>
                  So sánh 2 phiên bản
                </Button>
                {canExtend && status === 'CHINH_SUA_TM' && (
                  <Button type="link" onClick={onExtend}>
                    PKH gia hạn hạn nộp
                  </Button>
                )}
              </Space>
            </div>
          </Col>
          <Col xs={24} md={10}>
            <div className="rw-panel">
              <div className="rw-panel__title">Hai phiên bản lưu trữ</div>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <ThePhienBan
                  tieuDe="Bản gốc (HĐ đã đánh giá)"
                  badge="Gốc"
                  ver={ctx?.baselineVersion}
                />
                <ThePhienBan
                  tieuDe="Bản hoàn thiện"
                  badge="Mới"
                  ver={ctx?.submittedVersion}
                  highlight
                />
              </Space>
              {ctx?.diffLimitNote && (
                <Text type="secondary" className="rw-hint">
                  {ctx.diffLimitNote}
                </Text>
              )}
            </div>
          </Col>
        </Row>

        {(hienPkh || hienThuKy || hienChuTich || hienBgh) && (
          <div className="rw-gate">
            <div className="rw-gate__title">
              {hienPkh && 'Phòng Khoa học — duyệt bản hoàn thiện'}
              {hienThuKy && 'Thư ký hội đồng — xác nhận bản hoàn thiện'}
              {hienChuTich && 'Chủ tịch hội đồng — xác nhận bản hoàn thiện'}
              {hienBgh && 'BGH — mở hồ sơ Chờ phê duyệt (BM.04 / BM.05a / BM.05b)'}
            </div>
            {hienBgh ? (
              <Button
                type="primary"
                size="large"
                onClick={onOpenBghApproval}
              >
                Mở Chờ phê duyệt
              </Button>
            ) : (
              <Space>
                <Button type="primary" size="large" onClick={() => onApprove(true)}>
                  Đồng ý
                </Button>
                <Button danger size="large" onClick={() => onApprove(false)}>
                  Trả lại CNNV
                </Button>
              </Space>
            )}
          </div>
        )}

        {editable && status === 'CHINH_SUA_TM' && (
          <div className="rw-cta">
            <div>
              <Text strong>Sẵn sàng nộp cho Phòng Khoa học?</Text>
              <div>
                <Text type="secondary">
                  Cần BM.04 mới + giải trình ≥ {minLen} ký tự (hiện{' '}
                  {explanationLen}). Sau nộp: PKH → Hội đồng → BGH.
                </Text>
              </div>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<SendOutlined />}
              disabled={explanationLen < minLen || quaHan}
              onClick={onSubmit}
            >
              Nộp bản hoàn thiện cho phòng khoa học
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevisionWorkbench;
