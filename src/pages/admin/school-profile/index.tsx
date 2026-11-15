/**
 * Cấu hình profile trường / Bên A — dùng cho BM.06 & branding.
 */
import {
  getSchoolOrgProfile,
  updateSchoolOrgProfile,
  type SchoolOrgProfile,
} from '@/services/api/schoolOrgProfile';
import { uploadFileDon } from '@/services/api/fileUpload';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  BankOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess } from '@umijs/max';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Space,
  Typography,
  Upload,
  message,
} from 'antd';
import { useEffect, useState } from 'react';
import './school-profile.less';

const { Title, Text, Paragraph } = Typography;

const SchoolProfilePage: React.FC = () => {
  const access = useAccess();
  const canEdit = !!access.canEditSchoolProfile;
  const [form] = Form.useForm<SchoolOrgProfile>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getSchoolOrgProfile();
      const d = res.data;
      if (!d) throw new Error('Không tải được cấu hình');
      form.setFieldsValue(d);
      setLogoUrl(d.logoUrl || null);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      const res = await updateSchoolOrgProfile({
        ...v,
        logoUrl,
      });
      message.success(res.message || 'Đã lưu profile trường');
      if (res.data) {
        form.setFieldsValue(res.data);
        setLogoUrl(res.data.logoUrl || null);
      }
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const watched = Form.useWatch([], form) || {};
  const displayName = watched.schoolName || 'Tên trường';
  const displaySystem = watched.universitySystem || 'Hệ thống đại học';
  const logoSrc = resolvePublicAssetUrl(logoUrl || undefined);

  if (!access.canViewSchoolProfile) {
    return (
      <PageContainer>
        <Alert type="error" message="Không có quyền xem cấu hình profile trường." />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      className="school-profile-page"
      title="Cấu hình profile trường"
      subTitle="Thông tin pháp lý Bên A dùng khi sinh hợp đồng"
      loading={loading}
      extra={
        canEdit ? (
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void onSave()}
          >
            Lưu cấu hình
          </Button>
        ) : null
      }
    >
      <div className="sp-hero">
        <div className="sp-hero__glow" />
        <div className="sp-hero__inner">
          <div className="sp-hero__brand">
            <Avatar
              size={96}
              src={logoSrc}
              icon={<BankOutlined />}
              className="sp-hero__logo"
            />
            <div>
              <Text className="sp-hero__eyebrow">{displaySystem}</Text>
              <Title level={2} className="sp-hero__title">
                {displayName}
              </Title>
              <Paragraph className="sp-hero__desc">
                Thông tin trường và đại diện Bên A — hệ thống tự điền vào biểu mẫu hợp đồng khi sinh dự thảo.
              </Paragraph>
            </div>
          </div>
          {canEdit && (
            <Upload
              showUploadList={false}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              beforeUpload={async (file) => {
                if (file.size > 5 * 1024 * 1024) {
                  message.error('Logo tối đa 5MB');
                  return Upload.LIST_IGNORE;
                }
                try {
                  const up = await uploadFileDon(file, { folder: 'org/school-logo' });
                  setLogoUrl(up.url);
                  message.success('Đã tải logo');
                } catch (e: any) {
                  message.error(e?.message || 'Upload thất bại');
                }
                return Upload.LIST_IGNORE;
              }}
            >
              <Button icon={<UploadOutlined />} className="sp-hero__upload">
                Đổi logo
              </Button>
            </Upload>
          )}
        </div>
      </div>

      <Form form={form} layout="vertical" disabled={!canEdit} requiredMark="optional">
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <Card className="sp-card" title="Thông tin trường">
              <Row gutter={16}>
                <Col xs={24} md={14}>
                  <Form.Item
                    name="schoolName"
                    label="Tên trường"
                    rules={[{ required: true, message: 'Nhập tên trường' }]}
                  >
                    <Input size="large" placeholder="Ví dụ: Trường Đại học Sư phạm — ĐHĐN" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={10}>
                  <Form.Item
                    name="universitySystem"
                    label="Hệ thống đại học vùng"
                    rules={[{ required: true, message: 'Nhập hệ thống ĐH' }]}
                  >
                    <Input size="large" placeholder="Đại học Đà Nẵng" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              className="sp-card"
              style={{ marginTop: 20 }}
              title={
                <Space>
                  <IdcardOutlined />
                  Đại diện Bên A
                </Space>
              }
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="daiDienBenA"
                    label="Ông/Bà"
                    rules={[{ required: true, message: 'Nhập họ tên đại diện' }]}
                  >
                    <Input size="large" placeholder="Họ và tên người đại diện" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="chucVuBenA"
                    label="Chức vụ"
                    rules={[{ required: true, message: 'Nhập chức vụ' }]}
                  >
                    <Input size="large" placeholder="Hiệu trưởng / Phó hiệu trưởng…" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="diaChiBenA"
                    label="Địa chỉ"
                    rules={[{ required: true, message: 'Nhập địa chỉ' }]}
                  >
                    <Input.TextArea rows={2} placeholder="Địa chỉ trụ sở" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="dienThoaiBenA" label="Điện thoại">
                    <Input size="large" prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="emailBenA"
                    label="Email"
                    rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
                  >
                    <Input size="large" prefix={<MailOutlined />} placeholder="email@ued.udn.vn" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="taiKhoanBenA" label="Tài khoản">
                    <Input size="large" placeholder="Số tài khoản" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="nganHangBenA" label="Ngân hàng">
                    <Input size="large" placeholder="Tên ngân hàng / chi nhánh" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="maSoThueBenA" label="Mã số thuế">
                    <Input size="large" placeholder="MST đơn vị" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card className="sp-card sp-card--preview" title="Xem trước">
              <Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Thông tin sẽ được đưa vào biểu mẫu hợp đồng khi hệ thống sinh dự thảo.
              </Paragraph>
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Tên trường">
                  {watched.schoolName || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Hệ thống ĐH">
                  {watched.universitySystem || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Ông/Bà">
                  {watched.daiDienBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Chức vụ">
                  {watched.chucVuBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {watched.diaChiBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Điện thoại">
                  {watched.dienThoaiBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {watched.emailBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Tài khoản">
                  {watched.taiKhoanBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngân hàng">
                  {watched.nganHangBenA || '—'}
                </Descriptions.Item>
                <Descriptions.Item label="Mã số thuế">
                  {watched.maSoThueBenA || '—'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Form>

      {canEdit && (
        <div className="sp-sticky-save">
          <Button
            type="primary"
            size="large"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void onSave()}
          >
            Lưu cấu hình profile trường
          </Button>
        </div>
      )}
    </PageContainer>
  );
};

export default SchoolProfilePage;
