import React, { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Flex,
  Space,
  Spin,
  Tag,
  Typography,
  Upload,
  message,
  theme,
} from 'antd';
import type { UploadProps } from 'antd';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  CameraOutlined,
  DownloadOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { formatProfileOrganizationLine, trungKhopHocVi } from '@/utils/format';
import { coHienThiHocHam } from '@/utils/profileCatalogOptions';
import './index.less';

const { Title, Text } = Typography;

/** Dung lượng tối đa ảnh đại diện (2MB) */
const KICH_THUOC_TOI_DA_AVATAR = 2 * 1024 * 1024;

/** Định dạng ảnh được phép tải lên */
const DINH_DANG_ANH_HOP_LE = ['image/jpeg', 'image/png', 'image/webp'];

export interface ProfileHeaderProps {
  name: string;
  /** Đơn vị (trường / viện) */
  organization: string;
  /** Khoa/phòng ban (tên từ danh mục departments) — hiển thị sau organization */
  faculty?: string;
  /** @deprecated Không dùng khi hiển thị dòng đơn vị (tránh trùng với faculty) */
  department?: string;
  avatarUrl?: string;
  /** Nhãn trạng thái hồ sơ, ví dụ "Nháp" */
  status?: string;
  /** Màu Tag trạng thái (Ant Design preset) */
  statusColor?: string;
  /** Lĩnh vực NC chính — `profile.mainResearchArea` (tab Hướng nghiên cứu) */
  researchArea?: string;
  /** @deprecated Dùng researchArea */
  majorCode?: string;
  /** Key học vị — `profile.degree` */
  degree?: string;
  /** Nhãn hiển thị học vị (tiếng Việt từ catalog) */
  degreeLabel?: string;
  /** Năm nhận học vị */
  degreeYear?: number | null;
  /** Key học hàm — `profile.academicTitle` */
  academicTitle?: string;
  /** Nhãn hiển thị học hàm */
  academicTitleLabel?: string;
  /** Năm đạt học hàm */
  academicTitleYear?: number | null;
  researchHours: number | null;
  convertedPoint: number | null;
  metricsLoading?: boolean;
  /** Thay khối giờ/điểm mặc định bằng panel tùy chỉnh (lọc kỳ + số liệu). */
  metricsSlot?: React.ReactNode;
  avatarUploading?: boolean;
  verified?: boolean;
  onAvatarChange?: (file: File) => Promise<void> | void;
  onExportCV?: () => void;
  exportLoading?: boolean;
  /** Hiển thị thẻ thống kê giờ NCKH / điểm quy đổi */
  showMetrics?: boolean;
  /** Thanh thao tác bên trái (xác thực, quản trị…) — dưới tag trạng thái */
  leadingActions?: React.ReactNode;
  /** Vùng nút bên phải (trang chi tiết, quản trị) */
  extraActions?: React.ReactNode;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  name,
  organization,
  faculty,
  department,
  avatarUrl,
  status,
  statusColor = 'default',
  researchArea: _researchArea,
  majorCode: _majorCode,
  degree,
  degreeLabel,
  degreeYear,
  academicTitle,
  academicTitleLabel,
  academicTitleYear,
  researchHours,
  convertedPoint,
  metricsLoading = false,
  metricsSlot,
  avatarUploading = false,
  verified = false,
  onAvatarChange,
  onExportCV,
  exportLoading = false,
  showMetrics = true,
  leadingActions,
  extraActions,
}) => {
  const { token } = theme.useToken();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  const avatarSrc = previewUrl ?? resolvePublicAssetUrl(avatarUrl);

  const dongDonVi = useMemo(
    () => formatProfileOrganizationLine(organization, faculty),
    [organization, faculty],
  );

  /** Badge dưới họ tên: trạng thái → học hàm → học vị (không hiện lĩnh vực NC). */
  const profileTags = useMemo(() => {
    const items: { label: string; color?: string }[] = [];
    const them = (raw: unknown, color?: string) => {
      const label = Array.isArray(raw)
        ? raw.map((x) => String(x).trim()).filter(Boolean).join(', ')
        : String(raw ?? '').trim();
      if (!label) return;
      if (items.some((item) => trungKhopHocVi(item.label, label))) return;
      items.push({ label, color });
    };
    if (status) them(status, statusColor);
    // Học hàm trước học vị; không hiển thị khi "Không"
    if (coHienThiHocHam(academicTitle)) {
      const nhanHocHam = academicTitleLabel ?? academicTitle;
      const nhanDayDu =
        academicTitleYear != null ? `${nhanHocHam} (${academicTitleYear})` : nhanHocHam;
      them(nhanDayDu, 'gold');
    }
    if (degree || degreeLabel) {
      const nhanHocVi = degreeLabel ?? degree;
      const nhanDayDu =
        degreeYear != null ? `${nhanHocVi} (${degreeYear})` : nhanHocVi;
      them(nhanDayDu);
    }
    return items;
  }, [
    status,
    statusColor,
    degree,
    degreeLabel,
    degreeYear,
    academicTitle,
    academicTitleLabel,
    academicTitleYear,
  ]);

  useEffect(() => {
    if (!avatarUploading && previewUrl && avatarUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(undefined);
    }
  }, [avatarUrl, avatarUploading, previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const styleVars = useMemo(
    () =>
      ({
        '--profile-primary': token.colorPrimary,
        '--profile-text': token.colorText,
        '--profile-text-secondary': token.colorTextSecondary,
        '--profile-border': token.colorBorderSecondary,
        '--profile-bg': token.colorBgContainer,
        '--profile-fill': token.colorFillAlter,
        '--profile-shadow': token.boxShadowSecondary,
      }) as React.CSSProperties,
    [token],
  );

  const dinhDangChiSo = (value: number | null) => {
    if (metricsLoading) {
      return <Spin size="small" />;
    }
    if (value == null) {
      return '—';
    }
    return Math.round(value * 100) / 100;
  };

  const thongKeNckh =
    showMetrics && metricsSlot ? (
      metricsSlot
    ) : showMetrics ? (
      <div className="profile-header-metricsCompact" aria-label="Thống kê giờ NCKH và điểm quy đổi">
        <div className="profile-header-metricItem">
          <Text type="secondary" className="profile-header-metricLabel">
            Số giờ NCKH
          </Text>
          <div className="profile-header-metricValue">
            {dinhDangChiSo(researchHours)}
            {!metricsLoading && researchHours != null && (
              <span className="profile-header-metricUnit">giờ</span>
            )}
          </div>
        </div>
        <div className="profile-header-metricDivider" aria-hidden />
        <div className="profile-header-metricItem profile-header-metricItem--points">
          <Text type="secondary" className="profile-header-metricLabel">
            Điểm quy đổi
          </Text>
          <div className="profile-header-metricValue">
            {dinhDangChiSo(convertedPoint)}
            {!metricsLoading && convertedPoint != null && (
              <span className="profile-header-metricUnit">điểm</span>
            )}
          </div>
        </div>
      </div>
    ) : null;

  const kiemTraFileAnh = (file: File): boolean => {
    const laAnh =
      DINH_DANG_ANH_HOP_LE.includes(file.type) ||
      /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!laAnh) {
      message.error('Chỉ được tải lên file ảnh');
      return false;
    }
    if (file.size > KICH_THUOC_TOI_DA_AVATAR) {
      message.error('Ảnh không được vượt quá 2MB');
      return false;
    }
    return true;
  };

  const xuLyDoiAnh: UploadProps['beforeUpload'] = async (file) => {
    const tep = file as File;
    if (!kiemTraFileAnh(tep) || !onAvatarChange) {
      return Upload.LIST_IGNORE;
    }

    const urlCu = avatarSrc;
    const blobUrl = URL.createObjectURL(tep);
    setPreviewUrl(blobUrl);

    try {
      await onAvatarChange(tep);
    } catch {
      message.error('Cập nhật ảnh đại diện thất bại');
      URL.revokeObjectURL(blobUrl);
      setPreviewUrl(urlCu?.startsWith('blob:') ? undefined : urlCu);
    }

    return Upload.LIST_IGNORE;
  };

  const noiDungAvatar = (
    <div className="profile-header-avatarWrapper">
      <Avatar
        size={88}
        src={avatarSrc}
        icon={<UserOutlined />}
        className="profile-header-avatar"
      />
      {onAvatarChange && (
        <div
          className={`profile-header-avatarOverlay${
            avatarUploading ? ' profile-header-avatarOverlay--loading' : ''
          }`}
          aria-hidden={avatarUploading}
        >
          {avatarUploading ? (
            <Spin size="small" />
          ) : (
            <>
              <CameraOutlined className="profile-header-avatarOverlayIcon" />
              <span className="profile-header-avatarOverlayText">Đổi ảnh</span>
            </>
          )}
        </div>
      )}
    </div>
  );

  const avatarBlock = onAvatarChange ? (
    <Upload
      accept={DINH_DANG_ANH_HOP_LE.join(',')}
      showUploadList={false}
      beforeUpload={xuLyDoiAnh}
      disabled={avatarUploading}
      className="profile-header-upload"
    >
      {noiDungAvatar}
    </Upload>
  ) : (
    noiDungAvatar
  );

  const cotAvatar = (
    <div className="profile-header-avatarCol">
      {avatarBlock}
      {onExportCV && (
        <Button
          type="primary"
          block
          icon={<DownloadOutlined />}
          loading={exportLoading}
          onClick={onExportCV}
          className="profile-header-exportCvBtn"
        >
          Tải CV
        </Button>
      )}
    </div>
  );

  const coCotPhai = showMetrics || !!extraActions;

  return (
    <Card className="profile-header-card" bordered={false} style={styleVars}>
      <div className="profile-header-root">
        <Flex
          gap={20}
          align="center"
          justify="space-between"
          wrap="wrap"
          className="profile-header-layout"
        >
          <Flex gap={24} align="flex-start" className="profile-header-main" flex={1}>
            {cotAvatar}
            <div className="profile-header-info">
              <Title level={3} className="profile-header-name">
                {name}
                {verified && (
                  <SafetyCertificateOutlined
                    className="profile-header-verified"
                    title="Hồ sơ đã xác thực"
                  />
                )}
              </Title>
              {dongDonVi ? (
                <Text type="secondary" className="profile-header-org">
                  {dongDonVi}
                </Text>
              ) : null}
                {profileTags.length > 0 && (
                  <Space size={[8, 8]} wrap className="profile-header-tags">
                    {profileTags.map((tag) => (
                      <Tag key={tag.label} color={tag.color}>
                        {tag.label}
                      </Tag>
                    ))}
                  </Space>
                )}
                {leadingActions ? (
                  <div className="profile-header-leadingActions">{leadingActions}</div>
                ) : null}
            </div>
          </Flex>

          {coCotPhai && (
            <Flex
              vertical
              align="flex-end"
              gap={12}
              className="profile-header-aside"
            >
              {thongKeNckh}
              {extraActions && (
                <div className="profile-header-actions">{extraActions}</div>
              )}
            </Flex>
          )}
        </Flex>
      </div>
    </Card>
  );
};

export default ProfileHeader;
