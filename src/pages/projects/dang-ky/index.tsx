/**
 * Form đăng ký thực hiện một nhiệm vụ trong thông báo tuyển chọn.
 * Thành viên dùng lại AuthorsEditor của hồ sơ đề xuất.
 */
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, TeamOutlined } from '@ant-design/icons';
import { history, useSearchParams } from '@umijs/max';
import { useEffect, useState } from 'react';
import AuthorsEditor from '@/components/AuthorsEditor';
import ProposalAttachmentUpload from '@/components/ProposalAttachmentUpload';
import { resolveProposalMemberRole } from '@/constants/proposalMemberRole';
import type { PublicationAuthor } from '@/services/api/profilePublications';
import {
  layNguCanhDangKy,
  luuHoSoDangKy,
  type HoSoDangKy,
  type NguCanhDangKy,
} from '@/services/api/proposalRegistrations';
import { vndInputNumberProps } from '@/utils/format';

const { Paragraph } = Typography;

function loiThanhVien(rows: PublicationAuthor[], batBuoc: boolean) {
  if (rows.some((r) => !String(r.fullName || '').trim())) return 'Mỗi thành viên cần có họ tên.';
  if (rows.length === 0) {
    return batBuoc ? 'Cần ít nhất 1 thành viên, trong đó có đúng 1 chủ nhiệm.' : null;
  }
  const vaiTro = rows.map((r) => resolveProposalMemberRole(r.proposalMemberRole));
  if (vaiTro.filter((r) => r === 'PRINCIPAL').length !== 1) {
    return 'Danh sách thành viên phải có đúng 1 chủ nhiệm.';
  }
  if (vaiTro.filter((r) => r === 'SECRETARY').length > 1) {
    return 'Chỉ được có tối đa 1 thư ký.';
  }
  return null;
}

const DangKyThucHienPage: React.FC = () => {
  const [search] = useSearchParams();
  const cfpId = Number(search.get('callForProposalId'));
  const nhiemVuId = Number(search.get('nhiemVuId'));
  const hopLe = cfpId > 0 && nhiemVuId > 0;

  const [form] = Form.useForm();
  const [dangTai, setDangTai] = useState(true);
  const [dangLuu, setDangLuu] = useState(false);
  const [nguCanh, setNguCanh] = useState<NguCanhDangKy | null>(null);
  const [hoSo, setHoSo] = useState<HoSoDangKy | null>(null);
  const [thanhVien, setThanhVien] = useState<PublicationAuthor[]>([]);

  const quayLai = () => {
    if (cfpId > 0) history.push(`/projects/call-for-proposals/news/${cfpId}`);
    else history.push('/projects/call-for-proposals/news');
  };

  useEffect(() => {
    if (!hopLe) {
      setDangTai(false);
      return;
    }
    let huy = false;
    setDangTai(true);
    layNguCanhDangKy(cfpId, nhiemVuId)
      .then((res) => {
        if (huy || !res.data) return;
        setNguCanh(res.data);
        setHoSo(res.data.hoSo);
        setThanhVien(res.data.thanhVien || []);
        const h = res.data.hoSo;
        form.setFieldsValue({
          proposedBudget: h?.proposedBudget ?? undefined,
          durationMonths: h?.durationMonths ?? res.data.nhiemVu.durationMonths,
          attachmentUrl: h?.attachmentUrl ?? null,
          note: h?.note ?? '',
        });
      })
      .catch(() => {
        if (!huy) setNguCanh(null);
      })
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [cfpId, nhiemVuId, hopLe, form]);

  const nhiemVu = nguCanh?.nhiemVu;
  const daGui = hoSo?.status === 'CHO_DON_VI' || hoSo?.status === 'CHO_PKH';
  const khoa = !nguCanh?.dangMo || daGui;
  const nhanNhiemVu = nhiemVu
    ? `Đăng ký thực hiện nhiệm vụ: ${nhiemVu.code} ${nhiemVu.title}`
    : 'Đăng ký thực hiện nhiệm vụ';

  const luu = async (gui: boolean) => {
    try {
      await form.validateFields(gui ? undefined : ['proposedBudget', 'durationMonths']);
    } catch {
      return;
    }
    const values = form.getFieldsValue(true);
    const loiTv = loiThanhVien(thanhVien, gui);
    if (loiTv) {
      message.warning(loiTv);
      return;
    }
    setDangLuu(true);
    try {
      const res = await luuHoSoDangKy({
        callForProposalId: cfpId,
        projectProposalId: nhiemVuId,
        proposedBudget: Number(values.proposedBudget),
        durationMonths: Number(values.durationMonths),
        attachmentUrl: values.attachmentUrl || null,
        note: values.note || null,
        members: thanhVien,
        gui,
      });
      if (res.data?.hoSo) setHoSo(res.data.hoSo);
      if (res.data?.thanhVien) {
        setThanhVien(res.data.thanhVien.map((m) => ({ ...m })));
      }
      message.success(
        gui ? 'Đã gửi hồ sơ. Đơn đang chờ đơn vị xác nhận.' : 'Đã lưu nháp hồ sơ đăng ký.',
      );
    } catch {
      // request.ts đã hiện lỗi
    } finally {
      setDangLuu(false);
    }
  };

  return (
    <PageContainer
      loading={dangTai}
      title={nhanNhiemVu}
      onBack={quayLai}
      className="dk-thuc-hien"
    >
      <style>{`
        .dk-thuc-hien .ant-page-header-heading-title {
          white-space: normal;
          overflow: visible;
          line-height: 1.45;
        }
      `}</style>

      {!hopLe ? (
        <Alert type="warning" showIcon message="Thiếu thông báo hoặc nhiệm vụ để đăng ký." />
      ) : null}

      {hopLe && !dangTai && !nguCanh ? (
        <Alert type="error" showIcon message="Không mở được hồ sơ đăng ký cho nhiệm vụ này." />
      ) : null}

      {nhiemVu ? (
        <>
            {!nguCanh?.dangMo ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Kỳ đăng ký đã đóng. Hồ sơ chỉ để xem."
              />
            ) : null}
            {hoSo?.status === 'CHO_PKH' ? (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message="Đơn vị đã xác nhận. Hồ sơ đang chờ Phòng Khoa học và Hợp tác quốc tế."
              />
            ) : hoSo?.status === 'CHO_DON_VI' ? (
              <Alert
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
                message="Hồ sơ đã gửi. Bạn không sửa được nữa cho đến khi đơn vị trả lại."
              />
            ) : hoSo?.status === 'DRAFT' && hoSo.unitComment ? (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Đơn vị trả lại hồ sơ"
                description={hoSo.unitComment}
              />
            ) : (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
                message="Lưu nháp khi chưa xong. Gửi khi đã có đúng một chủ nhiệm."
              />
            )}

            <Card
              title={
                <span>
                  <TeamOutlined /> Thành viên ({thanhVien.length})
                </span>
              }
              style={{ marginBottom: 16 }}
            >
              <Paragraph type="secondary">
                Thêm hoặc xóa thành viên. Chọn từ hồ sơ nhà khoa học giống lúc nộp đề xuất. Đúng một
                chủ nhiệm, tối đa một thư ký.
              </Paragraph>
              <AuthorsEditor
                value={thanhVien}
                onChange={setThanhVien}
                disabled={khoa}
                hideRoleColumns
              />
            </Card>

            <Card title="Đề xuất của nhóm" style={{ marginBottom: 16 }}>
              <Form form={form} layout="vertical" disabled={khoa}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="proposedBudget"
                      label="Đề xuất kinh phí (VNĐ)"
                      rules={[
                        { required: true, message: 'Nhập kinh phí đề xuất' },
                        {
                          validator: async (_, value) => {
                            const n = Number(value);
                            if (!n || n <= 0) throw new Error('Kinh phí phải lớn hơn 0');
                          },
                        },
                      ]}
                    >
                      <InputNumber
                        style={{ width: '100%' }}
                        size="large"
                        min={0}
                        {...vndInputNumberProps}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="durationMonths"
                      label="Thời gian thực hiện đề xuất (tháng)"
                      rules={[
                        { required: true, message: 'Nhập thời gian' },
                        {
                          type: 'number',
                          min: 1,
                          max: 60,
                          message: 'Từ 1 đến 60 tháng',
                        },
                      ]}
                    >
                      <InputNumber style={{ width: '100%' }} size="large" min={1} max={60} />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item
                      name="attachmentUrl"
                      label="File đăng ký / thuyết minh sơ bộ"
                      extra="Không bắt buộc. Nếu có thì PDF hoặc DOCX, tối đa 10MB."
                    >
                      <ProposalAttachmentUpload
                        disabled={khoa}
                        folder="projects/registration-attachments"
                        maxMb={10}
                        buttonText="Chọn file PDF hoặc DOCX"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="note" label="Ghi chú">
                      <Input.TextArea
                        rows={4}
                        showCount
                        maxLength={2000}
                        placeholder="Ghi thêm điều nhóm muốn giải trình, nếu có."
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
        </>
      ) : null}

      <FooterToolbar>
        <Button icon={<ArrowLeftOutlined />} onClick={quayLai}>
          Quay lại
        </Button>
        {nhiemVu && !khoa ? (
          <>
            <Button icon={<SaveOutlined />} loading={dangLuu} onClick={() => void luu(false)}>
              Lưu nháp
            </Button>
            <Button
              type="primary"
              icon={<SendOutlined />}
              loading={dangLuu}
              onClick={() => void luu(true)}
            >
              Gửi hồ sơ
            </Button>
          </>
        ) : null}
      </FooterToolbar>
    </PageContainer>
  );
};

export default DangKyThucHienPage;
