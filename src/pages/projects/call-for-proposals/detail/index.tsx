/**
 * Chi tiết thông báo tuyển chọn — workflow actions theo quyền
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Modal,
  Space,
  Tag,
  Timeline,
  Typography,
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
  downloadCfpNotice,
  renderCfpProcessTypeTags,
  type CallForProposal,
  type CfpNhiemVu,
  type CfpStatus,
} from '@/services/api/callForProposals';
import { getProposal, PROPOSAL_STATUS_MAP, type ProjectProposal } from '@/services/api/projectProposals';
import NhiemVuThongBao from './NhiemVuThongBao';

const { Text } = Typography;

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
  const [dangTaiThongBao, setDangTaiThongBao] = useState(false);
  const [moXem, setMoXem] = useState(false);
  const [dangXem, setDangXem] = useState(false);
  const [nhiemVuXem, setNhiemVuXem] = useState<ProjectProposal | null>(null);

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
        <Button type="primary" onClick={() => run(() => approveCallForProposal(Number(id)), 'Đã duyệt')}>
          Phê duyệt
        </Button>
      )}
      <Button loading={dangTaiThongBao} onClick={() => void taiThongBao()}>
        Tải thông báo
      </Button>
      {st === 'PENDING_BGH' && access.canApproveCfp && (
        <Button danger onClick={() => setReturnOpen(true)}>
          Yêu cầu chỉnh sửa
        </Button>
      )}
      {st === 'APPROVED' && access.canPublishCfp && (
        <Button
          type="primary"
          onClick={() => {
            publishForm.setFieldsValue({
              officialDocNo: data?.soVanBan || data?.officialDocNo || undefined,
            });
            setPublishOpen(true);
          }}
        >
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

  const xemNhiemVu = async (row: CfpNhiemVu) => {
    setMoXem(true);
    setDangXem(true);
    setNhiemVuXem(null);
    try {
      const res = await getProposal(row.id);
      setNhiemVuXem(res.data || null);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được nhiệm vụ');
      setMoXem(false);
    } finally {
      setDangXem(false);
    }
  };

  const taiThongBao = async () => {
    if (!id) return;
    setDangTaiThongBao(true);
    try {
      await downloadCfpNotice(Number(id));
    } catch (e: any) {
      message.error(e?.message || 'Tải thông báo thất bại');
    } finally {
      setDangTaiThongBao(false);
    }
  };

  const ngayVanBan = data?.officialDocDate
    ? dayjs(data.officialDocDate).isValid()
      ? dayjs(data.officialDocDate).format('DD/MM/YYYY')
      : data.officialDocDate
    : '';

  return (
    <PageContainer loading={loading} title={data?.title || 'Chi tiết thông báo'} className="cfp-chi-tiet">
      <style>{`
        .cfp-chi-tiet .cfp-tom-tat {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .cfp-chi-tiet .cfp-o {
          background: #f7f9fc;
          border: 1px solid #eef1f6;
          border-radius: 10px;
          padding: 12px 14px;
          min-height: 72px;
        }
        .cfp-chi-tiet .cfp-nhan {
          color: #8c8c8c;
          font-size: 12px;
          margin-bottom: 6px;
        }
        .cfp-chi-tiet .cfp-gia-tri {
          font-weight: 600;
          color: #1f1f1f;
          line-height: 1.45;
        }
        .cfp-chi-tiet .cfp-noi-dung {
          margin-top: 16px;
          padding: 16px 18px;
          background: #fff;
          border: 1px solid #f0f0f0;
          border-radius: 10px;
          line-height: 1.7;
        }
        .cfp-chi-tiet .cfp-dong {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 24px;
          margin-top: 16px;
        }
        @media (max-width: 900px) {
          .cfp-chi-tiet .cfp-tom-tat { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      {data?.returnReason && st === 'RETURNED' && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Lý do trả về"
          description={data.returnReason}
        />
      )}

      <Card
        title="Thông tin chung về Thông báo"
        style={{ marginBottom: 16 }}
        extra={actionButtons}
      >
        <div className="cfp-tom-tat">
          <div className="cfp-o">
            <div className="cfp-nhan">Trạng thái</div>
            <div className="cfp-gia-tri">
              <Tag color={stMeta?.color} style={{ marginInlineEnd: 0 }}>
                {stMeta?.text || '—'}
              </Tag>
            </div>
          </div>
          <div className="cfp-o">
            <div className="cfp-nhan">Kỳ thực hiện</div>
            <div className="cfp-gia-tri">
              {data ? (data.periodKind === 'ACADEMIC' ? 'Năm học' : 'Năm tài chính') : '—'}{' '}
              {data?.periodLabel || ''}
            </div>
          </div>
          <div className="cfp-o">
            <div className="cfp-nhan">Hạn nộp hồ sơ</div>
            <div className="cfp-gia-tri">
              {data?.deadlineAt ? dayjs(data.deadlineAt).format('DD/MM/YYYY HH:mm') : '—'}
            </div>
          </div>
          <div className="cfp-o">
            <div className="cfp-nhan">Số văn bản</div>
            <div className="cfp-gia-tri">
              {data?.soVanBan || data?.officialDocNo || '—'}
              {ngayVanBan ? <Text type="secondary"> · {ngayVanBan}</Text> : null}
            </div>
          </div>
        </div>

        <div className="cfp-dong">
          <div>
            <Text type="secondary">Cấp đề tài </Text>
            {data
              ? renderCfpProcessTypeTags(data).map((t) => (
                  <Tag key={t.key} color="blue">
                    {t.label}
                  </Tag>
                ))
              : '—'}
          </div>
          <div>
            <Text type="secondary">Người tạo </Text>
            <Text strong>
              {data ? `${data.createdBy} - ${data.creatorName || '—'}` : '—'}
            </Text>
          </div>
          {data?.submissionPeriod ? (
            <div>
              <Text type="secondary">Kỳ tiếp nhận </Text>
              <Tag color={data.submissionPeriod.isAccepting ? 'green' : 'default'}>
                {data.submissionPeriod.isAccepting ? 'Đang nhận hồ sơ' : 'Đã đóng'}
              </Tag>
              <Text type="secondary">
                hạn {dayjs(data.submissionPeriod.deadlineAt).format('DD/MM/YYYY')}
              </Text>
            </div>
          ) : null}
        </div>

        <div className="cfp-noi-dung">
          <div className="cfp-nhan">Nội dung</div>
          <div
            dangerouslySetInnerHTML={{
              __html: data?.contentHtml || '<span style="color:#8c8c8c">Chưa có nội dung.</span>',
            }}
          />
        </div>
      </Card>

      {data ? (
        <NhiemVuThongBao
          cfpId={Number(data.id)}
          coTheSua={false}
          tieuDe="Danh sách nhiệm vụ trong thông báo"
          onXem={xemNhiemVu}
        />
      ) : null}

      <Drawer
        title={nhiemVuXem?.code || 'Chi tiết nhiệm vụ'}
        width={640}
        open={moXem}
        onClose={() => setMoXem(false)}
        destroyOnClose
      >
        {dangXem ? (
          <div>Đang tải...</div>
        ) : nhiemVuXem ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Trạng thái">
              <Tag color={PROPOSAL_STATUS_MAP[nhiemVuXem.status]?.color}>
                {PROPOSAL_STATUS_MAP[nhiemVuXem.status]?.label || nhiemVuXem.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tên nhiệm vụ">{nhiemVuXem.title}</Descriptions.Item>
            <Descriptions.Item label="Chủ nhiệm">
              {nhiemVuXem.ownerName}
              {nhiemVuXem.ownerUnit ? ` · ${nhiemVuXem.ownerUnit}` : ''}
            </Descriptions.Item>
            <Descriptions.Item label="Cấp">
              {nhiemVuXem.projectProcessType
                ? `${nhiemVuXem.projectProcessType.code} · ${nhiemVuXem.projectProcessType.name}`
                : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Thời gian">
              {nhiemVuXem.durationMonths ? `${nhiemVuXem.durationMonths} tháng` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Mục tiêu">{nhiemVuXem.objectives || '—'}</Descriptions.Item>
            <Descriptions.Item label="Sản phẩm dự kiến">
              {nhiemVuXem.expectedResults || '—'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>

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
                {a.note ? <div>{a.note}</div> : null}
              </div>
            ),
          }))}
        />
        {!data?.audits?.length ? <div style={{ color: '#999' }}>Chưa có lịch sử.</div> : null}
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
