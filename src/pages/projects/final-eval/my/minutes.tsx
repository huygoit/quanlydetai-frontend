/**
 * Form biên bản ĐGCK (BM-05.06) — Thư ký / PKH ghi kết quả họp.
 */
import { NHAN_TRIEN_KHAI, NHAN_VAI_TRO_HD, NHAN_XEP_LOAI } from '@/constants/module56';
import { hoSoCuoiKy, luuBienBan, type HoSoCuoiKy } from '@/services/api/module56';
import { layThongBaoLoi } from '@/utils/apiErrorMessage';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import {
  ArrowLeftOutlined,
  FileProtectOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useModel, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const MinutesFormPage: React.FC = () => {
  const { outlineId: raw } = useParams<{ outlineId: string }>();
  const outlineId = Number(raw);
  const access = useAccess();
  const canPkh = !!access.canContractManage;
  const { initialState } = useModel('@@initialState');
  const userId = Number(
    (initialState?.currentUser as { id?: number } | undefined)?.id || 0,
  );
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);

  const load = useCallback(async () => {
    if (!outlineId) return;
    setLoading(true);
    try {
      const res = await hoSoCuoiKy(outlineId);
      const data = res.data;
      setHs(data);
      const members = data.council?.members || [];
      const m = data.minutes;
      // Đếm phiếu từ kết luận các phiếu TV đã nộp (reportComment)
      const daNop = (data.sheets || []).filter((s) => !!s.submittedAt);
      let tuPhieuDat = 0;
      let tuPhieuBoSung = 0;
      let tuPhieuKhongDat = 0;
      for (const s of daNop) {
        const kl = String(s.reportComment || '');
        if (kl === 'DAT_YEU_CAU') tuPhieuDat += 1;
        else if (kl === 'CAN_BO_SUNG') tuPhieuBoSung += 1;
        else if (kl === 'KHONG_DAT') tuPhieuKhongDat += 1;
      }
      const tuPhieuQuyen = daNop.length;
      // Ưu tiên số đã chốt trong biên bản; chưa chốt thì lấy từ phiếu HĐ
      const voteDat = data.minutesLocked
        ? ((m as any)?.voteDat ?? tuPhieuDat)
        : tuPhieuDat;
      const voteBoSung = data.minutesLocked
        ? ((m as any)?.voteBoSung ?? tuPhieuBoSung)
        : tuPhieuBoSung;
      const voteKhongDat = data.minutesLocked
        ? ((m as any)?.voteKhongDat ?? tuPhieuKhongDat)
        : tuPhieuKhongDat;
      const voteEligible = data.minutesLocked
        ? ((m as any)?.voteEligible ?? tuPhieuQuyen)
        : tuPhieuQuyen;
      form.setFieldsValue({
        presentUserIds: m?.presentUserIds?.length
          ? m.presentUserIds
          : members.map((x: any) => Number(x.userId)),
        qdCouncilNo: (m as any)?.qdCouncilNo || '',
        nhanXetChung: (m as any)?.nhanXetChung || m?.discussion || '',
        clarifyContent: (m as any)?.clarifyContent || m?.quality || '',
        ownerExplanation: (m as any)?.ownerExplanation || '',
        voteDat,
        voteBoSung,
        voteKhongDat,
        voteEligible,
        classification: data.classification || undefined,
        noiDungHoanThien: m?.recommendation || '',
        otherRecommendation: (m as any)?.otherRecommendation || '',
      });
    } catch (e) {
      message.error(layThongBaoLoi(e, 'Không tải được hồ sơ'));
      setHs(null);
    } finally {
      setLoading(false);
    }
  }, [outlineId, form]);

  useEffect(() => {
    void load();
  }, [load]);

  const members = hs?.council?.members || [];
  const vaiTroToi = useMemo(() => {
    const me = members.find((m: any) => Number(m.userId) === userId);
    return String(me?.role || '');
  }, [members, userId]);

  const laThuKy = vaiTroToi === 'THU_KY';
  const khoa = !!hs?.minutesLocked;
  const st = hs?.executionStatus || '';
  const coTheGhi = !khoa && st === 'DGCK_HOP_HD' && (laThuKy || canPkh);

  const onSubmit = async () => {
    try {
      const v = await form.validateFields();
      setSaving(true);
      await luuBienBan(outlineId, {
        presentUserIds: v.presentUserIds || [],
        qdCouncilNo: v.qdCouncilNo || '',
        nhanXetChung: v.nhanXetChung,
        discussion: v.nhanXetChung,
        clarifyContent: v.clarifyContent || '',
        ownerExplanation: v.ownerExplanation || '',
        voteDat: v.voteDat ?? 0,
        voteBoSung: v.voteBoSung ?? 0,
        voteKhongDat: v.voteKhongDat ?? 0,
        voteEligible: v.voteEligible ?? 0,
        classification: v.classification,
        noiDungHoanThien: v.noiDungHoanThien || '',
        recommendation: v.noiDungHoanThien || '',
        otherRecommendation: v.otherRecommendation || '',
        productMarks: [],
      });
      message.success('Đã lưu biên bản BM-05.06');
      await load();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error(layThongBaoLoi(e, 'Lưu biên bản thất bại'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title={false} loading={loading}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        style={{ paddingLeft: 0, marginBottom: 8 }}
        onClick={() => history.push(`/projects/final-eval/my/${outlineId}`)}
      >
        Quay lại chi tiết hội đồng
      </Button>

      <div
        style={{
          marginBottom: 18,
          padding: '20px 22px',
          borderRadius: 16,
          background:
            'linear-gradient(120deg, #062a4a 0%, #0e5cad 55%, #3b9eff 100%)',
          color: '#fff',
        }}
      >
        <Space wrap size={8} style={{ marginBottom: 8 }}>
          <Tag color="blue" style={{ fontWeight: 600 }}>
            {hs?.code || '—'}
          </Tag>
          <Tag>BM-05.06</Tag>
          <Tag>{NHAN_TRIEN_KHAI[st] || st || '—'}</Tag>
          {khoa ? <Tag color="success">Đã khóa biên bản</Tag> : null}
        </Space>
        <Title level={4} style={{ color: '#fff', margin: '0 0 6px' }}>
          <FileProtectOutlined /> Biên bản đánh giá kết quả thực hiện nhiệm vụ
        </Title>
        <Paragraph style={{ color: 'rgba(255,255,255,0.88)', margin: 0 }}>
          {hs?.title || ''}
        </Paragraph>
      </div>

      {!laThuKy && !canPkh && !khoa ? (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          message="Chỉ Thư ký hội đồng hoặc PKH mới ghi / chốt biên bản."
        />
      ) : null}

      {khoa ? (
        <Alert
          type="success"
          showIcon
          style={{ marginBottom: 16, borderRadius: 12 }}
          message="Biên bản đã được chốt"
          description={
            hs?.minutesFileUrl ? (
              <a
                href={resolvePublicAssetUrl(hs.minutesFileUrl)}
                target="_blank"
                rel="noreferrer"
              >
                Tải biên bản DOCX
              </a>
            ) : (
              'Phiếu chỉ xem.'
            )
          }
        />
      ) : null}

      <Card size="small" style={{ borderRadius: 14, marginBottom: 14 }}>
        <Descriptions size="small" column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label="Chủ nhiệm">
            {hs?.ownerName || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian họp">
            {hs?.council?.meetingAt
              ? dayjs(hs.council.meetingAt).format('HH:mm DD/MM/YYYY')
              : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Địa điểm">
            {hs?.council?.location || '—'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Form form={form} layout="vertical" disabled={khoa || !coTheGhi}>
        <Card
          title="1. Thành phần họp"
          style={{ borderRadius: 14, marginBottom: 14 }}
        >
          <Form.Item
            name="presentUserIds"
            label="Thành viên có mặt (hợp lệ)"
            rules={[{ required: true, message: 'Chọn thành viên có mặt' }]}
          >
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction="vertical">
                {members.map((m: any) => (
                  <Checkbox key={m.userId} value={Number(m.userId)}>
                    {m.fullName || m.name || `#${m.userId}`} (
                    {NHAN_VAI_TRO_HD[m.role as keyof typeof NHAN_VAI_TRO_HD] ||
                      m.role}
                    )
                  </Checkbox>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
          <Form.Item name="qdCouncilNo" label="Số QĐ thành lập Hội đồng / Tổ chuyên gia">
            <Input placeholder="Ví dụ: 123/QĐ-ĐHSP" />
          </Form.Item>
        </Card>

        <Card
          title="2. Kết quả đánh giá"
          style={{ borderRadius: 14, marginBottom: 14 }}
        >
          <Form.Item
            name="nhanXetChung"
            label="2.1. Nhận xét chung"
            rules={[{ required: true, message: 'Nhập nhận xét chung' }]}
          >
            <TextArea
              rows={4}
              placeholder="Mức độ hoàn thành mục tiêu, nội dung, sản phẩm; chất lượng, giá trị KH; khả năng ứng dụng…"
            />
          </Form.Item>
          <Form.Item
            name="clarifyContent"
            label="2.2. Nội dung cần làm rõ, hoàn thiện (nếu có)"
          >
            <TextArea rows={3} placeholder="Nếu không có thì để trống" />
          </Form.Item>
          <Form.Item
            name="ownerExplanation"
            label="2.3. Giải trình của Chủ nhiệm và ý kiến khác biệt (nếu có)"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Card>

        <Card
          title="3. Kết luận và kiến nghị"
          style={{ borderRadius: 14, marginBottom: 14 }}
        >
          <Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Kết quả biểu quyết — tự tổng hợp từ kết luận các phiếu thành viên đã
            nộp (không nhập tay).
          </Paragraph>
          <Row gutter={12}>
            <Col xs={12} md={6}>
              <Form.Item
                name="voteDat"
                label="Đạt (phiếu)"
                rules={[{ required: true, message: 'Chưa có dữ liệu phiếu' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} readOnly />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="voteBoSung"
                label="Cần bổ sung (phiếu)"
                rules={[{ required: true, message: 'Chưa có dữ liệu phiếu' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} readOnly />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="voteKhongDat"
                label="Không đạt (phiếu)"
                rules={[{ required: true, message: 'Chưa có dữ liệu phiếu' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} readOnly />
              </Form.Item>
            </Col>
            <Col xs={12} md={6}>
              <Form.Item
                name="voteEligible"
                label="Số TV đã nộp phiếu"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <InputNumber min={0} style={{ width: '100%' }} readOnly />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="classification"
            label="Kết luận xếp loại"
            rules={[{ required: true, message: 'Chọn kết luận' }]}
          >
            <Radio.Group
              options={[
                { value: 'DAT_YEU_CAU', label: NHAN_XEP_LOAI.DAT_YEU_CAU },
                { value: 'CAN_BO_SUNG', label: NHAN_XEP_LOAI.CAN_BO_SUNG },
                { value: 'KHONG_DAT', label: NHAN_XEP_LOAI.KHONG_DAT },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="noiDungHoanThien"
            label="Nội dung cần hoàn thiện (nếu có)"
          >
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="otherRecommendation"
            label="Kiến nghị khác (rủi ro nghiên cứu / khai thác kết quả…)"
          >
            <TextArea rows={3} />
          </Form.Item>
        </Card>
      </Form>

      {!khoa && coTheGhi ? (
        <FooterToolbar>
          <Button
            onClick={() => history.push(`/projects/final-eval/my/${outlineId}`)}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={() => void onSubmit()}
          >
            Chốt biên bản & xuất DOCX
          </Button>
        </FooterToolbar>
      ) : null}
    </PageContainer>
  );
};

export default MinutesFormPage;
