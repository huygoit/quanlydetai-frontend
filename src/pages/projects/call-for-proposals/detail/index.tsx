/**
 * Chi tiết thông báo tuyển chọn — workflow actions theo quyền
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Timeline,
  message,
  DatePicker,
} from 'antd';
import { history, useAccess, useParams } from '@umijs/max';
import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  getCallForProposal,
  submitCallForProposal,
  approveCallForProposal,
  returnCallForProposal,
  publishCallForProposal,
  extendCallForProposal,
  closeCallForProposal,
  CFP_STATUS_MAP,
  renderCfpProcessTypeTags,
  type CallForProposal,
  type CfpStatus,
} from '@/services/api/callForProposals';

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'Tạo mới',
  UPDATE: 'Cập nhật',
  SUBMIT: 'Trình BGH',
  APPROVE: 'BGH duyệt',
  RETURN: 'Yêu cầu chỉnh sửa',
  PUBLISH: 'Phát hành',
  EXTEND: 'Gia hạn',
  CLOSE: 'Đóng sớm',
  REMIND_HC: 'Nhắc HC',
};

const CfpDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const [data, setData] = useState<CallForProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnOpen, setReturnOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);
  const [returnForm] = Form.useForm();
  const [publishForm] = Form.useForm();
  const [extendForm] = Form.useForm();

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getCallForProposal(Number(id));
      setData(res.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được chi tiết');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const st = data?.status as CfpStatus | undefined;
  const stMeta = st ? CFP_STATUS_MAP[st] : undefined;

  const run = async (fn: () => Promise<unknown>, okMsg: string) => {
    try {
      await fn();
      message.success(okMsg);
      await reload();
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Thao tác thất bại');
    }
  };

  // Nút workflow đặt dưới header — tránh đè breadcrumb (CSS global đặt breadcrumb absolute bên phải)
  const actionButtons = (
    <Space wrap>
      {(st === 'DRAFT' || st === 'RETURNED') && access.canUpdateCfp && (
        <Button onClick={() => history.push(`/projects/call-for-proposals/form/${id}`)}>Sửa</Button>
      )}
      {(st === 'DRAFT' || st === 'RETURNED') && access.canSubmitCfp && (
        <Button type="primary" onClick={() => run(() => submitCallForProposal(Number(id)), 'Đã trình BGH')}>
          Trình BGH duyệt
        </Button>
      )}
      {st === 'PENDING_BGH' && access.canApproveCfp && (
        <>
          <Button type="primary" onClick={() => run(() => approveCallForProposal(Number(id)), 'Đã duyệt')}>
            Phê duyệt
          </Button>
          <Button danger onClick={() => setReturnOpen(true)}>
            Yêu cầu chỉnh sửa
          </Button>
        </>
      )}
      {st === 'APPROVED' && access.canPublishCfp && (
        <Button type="primary" onClick={() => setPublishOpen(true)}>
          Xác nhận phát hành
        </Button>
      )}
      {st === 'PUBLISHED' && access.canExtendCfp && data?.submissionPeriod?.status === 'OPEN' && (
        <Button onClick={() => setExtendOpen(true)}>Gia hạn</Button>
      )}
      {st === 'PUBLISHED' && access.canCloseCfp && data?.submissionPeriod?.status === 'OPEN' && (
        <Button
          danger
          onClick={() =>
            Modal.confirm({
              title: 'Đóng sớm kỳ tiếp nhận?',
              content: 'Giảng viên sẽ không nộp được đề xuất thuộc thông báo này.',
              onOk: () => run(() => closeCallForProposal(Number(id)), 'Đã đóng sớm'),
            })
          }
        >
          Đóng sớm
        </Button>
      )}
    </Space>
  );

  const coNutThaoTac =
    ((st === 'DRAFT' || st === 'RETURNED') && (access.canUpdateCfp || access.canSubmitCfp)) ||
    (st === 'PENDING_BGH' && access.canApproveCfp) ||
    (st === 'APPROVED' && access.canPublishCfp) ||
    (st === 'PUBLISHED' &&
      data?.submissionPeriod?.status === 'OPEN' &&
      (access.canExtendCfp || access.canCloseCfp));

  return (
    <PageContainer loading={loading} title={data?.title || 'Chi tiết thông báo'}>
      {data?.returnReason && st === 'RETURNED' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Lý do trả về"
          description={data.returnReason}
        />
      )}
      {coNutThaoTac && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{actionButtons}</div>
        </Card>
      )}
      <Card style={{ marginBottom: 16 }}>
        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
          <Descriptions.Item label="Trạng thái">
            <Tag color={stMeta?.color}>{stMeta?.text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Kỳ">
            {data?.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm TC'} {data?.periodLabel}
          </Descriptions.Item>
          <Descriptions.Item label="Hạn nộp">
            {data?.deadlineAt ? dayjs(data.deadlineAt).format('DD/MM/YYYY HH:mm') : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="Loại / cấp đề tài">
            {data
              ? renderCfpProcessTypeTags(data).map((t) => <Tag key={t.key}>{t.label}</Tag>)
              : null}
          </Descriptions.Item>
          <Descriptions.Item label="Người tạo">{data?.creatorName || data?.createdBy}</Descriptions.Item>
          <Descriptions.Item label="Số VB / ngày phát hành">
            {data?.officialDocNo
              ? `${data.officialDocNo} (${data.officialDocDate || '—'})`
              : '—'}
          </Descriptions.Item>
          {data?.submissionPeriod && (
            <Descriptions.Item label="Kỳ tiếp nhận" span={2}>
              <Tag color={data.submissionPeriod.isAccepting ? 'green' : 'default'}>
                {data.submissionPeriod.status}
                {data.submissionPeriod.isAccepting ? ' — đang nhận hồ sơ' : ''}
              </Tag>
              {' · hạn '}
              {dayjs(data.submissionPeriod.deadlineAt).format('DD/MM/YYYY')}
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Nội dung" span={2}>
            <div
              dangerouslySetInnerHTML={{
                __html: data?.contentHtml || '<em>(Chưa có nội dung)</em>',
              }}
            />
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Lịch sử trình duyệt">
        <Timeline
          items={(data?.audits || []).map((a) => ({
            children: (
              <div>
                <strong>{ACTION_LABEL[a.action] || a.action}</strong>
                {a.actorName ? ` — ${a.actorName}` : ''}
                <div style={{ color: '#888', fontSize: 12 }}>
                  {a.createdAt ? dayjs(a.createdAt).format('DD/MM/YYYY HH:mm') : ''}
                </div>
                {a.note && <div>{a.note}</div>}
              </div>
            ),
          }))}
        />
        {!data?.audits?.length && <div style={{ color: '#999' }}>Chưa có lịch sử.</div>}
      </Card>

      <Modal
        title="Yêu cầu chỉnh sửa"
        open={returnOpen}
        onCancel={() => setReturnOpen(false)}
        onOk={async () => {
          const v = await returnForm.validateFields();
          await run(() => returnCallForProposal(Number(id), v.reason), 'Đã trả về PKH');
          setReturnOpen(false);
          returnForm.resetFields();
        }}
      >
        <Form form={returnForm} layout="vertical">
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Bắt buộc' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Xác nhận phát hành (thủ công sau ký VBĐT)"
        open={publishOpen}
        onCancel={() => setPublishOpen(false)}
        onOk={async () => {
          const v = await publishForm.validateFields();
          await run(
            () =>
              publishCallForProposal(Number(id), {
                officialDocNo: v.officialDocNo,
                officialDocDate: dayjs(v.officialDocDate).format('YYYY-MM-DD'),
                signedFileUrl: v.signedFileUrl || null,
              }),
            'Đã phát hành',
          );
          setPublishOpen(false);
          publishForm.resetFields();
        }}
      >
        <Form form={publishForm} layout="vertical">
          <Form.Item name="officialDocNo" label="Số văn bản" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="officialDocDate" label="Ngày phát hành" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="signedFileUrl" label="URL file PDF đã ký (tuỳ chọn)">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Gia hạn deadline"
        open={extendOpen}
        onCancel={() => setExtendOpen(false)}
        onOk={async () => {
          const v = await extendForm.validateFields();
          await run(
            () => extendCallForProposal(Number(id), dayjs(v.deadlineAt).format('YYYY-MM-DD')),
            'Đã gia hạn',
          );
          setExtendOpen(false);
          extendForm.resetFields();
        }}
      >
        <Form form={extendForm} layout="vertical">
          <Form.Item
            name="deadlineAt"
            label="Hạn mới"
            rules={[{ required: true, message: 'Bắt buộc' }]}
            extra="Phải sau hạn hiện tại."
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default CfpDetailPage;
