/**
 * Chi tiết phiên thẩm định — QĐ / BGH / TC-HC / theo dõi BM.05a
 */
import OutlinePreviewSheet, {
  type OutlinePreviewData,
} from '@/components/OutlinePreviewSheet';
import { getOutline } from '@/services/api/projectOutlines';
import {
  bghSignDefense,
  cancelDefenseSession,
  DEFENSE_ROLE_OPTIONS,
  DEFENSE_STATUS_MAP,
  getDefenseSession,
  openEarlyDefenseMeeting,
  publishDefense,
  remindDefenseMember,
  submitDefenseToBgh,
  type DefenseSession,
} from '@/services/api/projectOutlineDefenses';
import {
  ArrowLeftOutlined,
  CloseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  FormOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { FooterToolbar, PageContainer } from '@ant-design/pro-components';
import { history, useAccess, useModel, useParams } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Input,
  Modal,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import Bm05aScoreSheet from '../bm05a/Bm05aScoreSheet';
import BienBanThamDinh from './BienBanThamDinh';

const { Paragraph } = Typography;

const DefenseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUserId = Number((initialState?.currentUser as any)?.id || 0);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<DefenseSession | null>(null);
  const [tmOpen, setTmOpen] = useState(false);
  const [tmLoading, setTmLoading] = useState(false);
  const [tmOutline, setTmOutline] = useState<OutlinePreviewData | null>(null);
  const [phieuOpen, setPhieuOpen] = useState(false);
  const [phieuSheetId, setPhieuSheetId] = useState<number | null>(null);
  const [tabKey, setTabKey] = useState('phien');
  const sessionId = Number(id);

  const openPhieuSheet = (sheetId: number) => {
    setPhieuSheetId(sheetId);
    setPhieuOpen(true);
  };

  const load = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await getDefenseSession(sessionId);
      setSession(res.data);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const st = session?.status;
  const canPkh = access.canManageOutlineDefense;
  const canBgh =
    access.canApproveProjectProposal ||
    access.canApproveSelectionSession ||
    access.canApproveOutlineBudget;
  const canTchc = access.canConfirmOutlineBudget || access.canManageOutlineDefense;

  const handleSubmitBgh = () => {
    Modal.confirm({
      title: 'Trình BGH ký QĐ thành lập HĐ?',
      content: 'Hệ thống tạo dự thảo QĐ và chuyển trạng thái chờ BGH ký số.',
      onOk: async () => {
        try {
          const res = await submitDefenseToBgh(sessionId);
          setSession(res.data);
          message.success(res.message || 'Đã trình BGH');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        }
      },
    });
  };

  const handleBghSign = () => {
    let note = '';
    Modal.confirm({
      title: 'BGH ký số QĐ?',
      content: (
        <Input.TextArea
          rows={2}
          placeholder="Ghi chú (tuỳ chọn)"
          onChange={(e) => {
            note = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        try {
          const res = await bghSignDefense(sessionId, note || null);
          setSession(res.data);
          message.success(res.message || 'Đã ký');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        }
      },
    });
  };

  const handlePublish = () => {
    Modal.confirm({
      title: 'TC-HC phát hành QĐ?',
      content: 'Hệ thống gửi email mời + mở phiếu BM.05a cho thành viên HĐ.',
      onOk: async () => {
        try {
          const res = await publishDefense(sessionId);
          setSession(res.data);
          message.success(res.message || 'Đã phát hành');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
        }
      },
    });
  };

  const handleCancel = () => {
    let reason = '';
    Modal.confirm({
      title: 'Hủy phiên thẩm định',
      content: (
        <Input.TextArea
          rows={3}
          placeholder="Lý do ≥ 5 ký tự"
          onChange={(e) => {
            reason = e.target.value;
          }}
        />
      ),
      okButtonProps: { danger: true },
      onOk: async () => {
        if (!reason.trim() || reason.trim().length < 5) {
          message.warning('Nhập lý do ≥ 5 ký tự');
          return Promise.reject();
        }
        try {
          const res = await cancelDefenseSession(sessionId, reason.trim());
          setSession(res.data);
          message.success('Đã hủy');
        } catch (e: any) {
          message.error(e?.data?.message || e?.message || 'Thất bại');
          return Promise.reject();
        }
      },
    });
  };

  const handleRemind = async (memberId: number) => {
    try {
      const res = await remindDefenseMember(sessionId, memberId);
      message.success(res.message || 'Đã nhắc');
      await load();
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Thất bại');
    }
  };

  const statusMeta = st ? DEFENSE_STATUS_MAP[st] : null;
  const sheets = session?.scoreSheets || [];
  const myMember = useMemo(
    () => (session?.members || []).find((m) => Number(m.userId) === currentUserId),
    [session?.members, currentUserId],
  );
  const mySheets = useMemo(() => {
    if (!myMember?.id) return [];
    return sheets.filter((s) => s.memberId === myMember.id);
  }, [sheets, myMember?.id]);

  const memberRows = (session?.members || []).map((m) => {
    const mine = sheets.filter((s) => s.memberId === m.id);
    const submitted = mine.filter((s) => s.status === 'SUBMITTED').length;
    return {
      ...m,
      sheetTotal: mine.length,
      sheetSubmitted: submitted,
      pending: mine.length - submitted,
    };
  });

  const outlineCode = (outlineId: number) =>
    session?.outlines?.find((o) => o.id === outlineId)?.code || `TM #${outlineId}`;

  const openOutlineSheet = async (outlineId: number) => {
    setTmOpen(true);
    setTmLoading(true);
    try {
      const lite =
        session?.outlines?.find((o) => o.id === outlineId) ||
        (session?.outline?.id === outlineId ? session.outline : null);
      setTmOutline((lite as OutlinePreviewData) || { id: outlineId });
      const res = await getOutline(outlineId);
      if (res.data) setTmOutline(res.data as OutlinePreviewData);
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Không tải được thuyết minh');
    } finally {
      setTmLoading(false);
    }
  };

  const hasActions =
    mySheets.some((s) => s.status === 'DRAFT') ||
    (canPkh && st === 'DRAFT') ||
    (canBgh && st === 'PENDING_BGH') ||
    (canTchc && st === 'BGH_SIGNED') ||
    (canPkh && !!st && !['FINALIZED', 'CANCELLED'].includes(st));

  return (
    <PageContainer
      loading={loading}
      title={session?.title || session?.decisionCode || `Phiên #${sessionId}`}
      onBack={() =>
        history.push(canPkh ? '/projects/defenses' : '/projects/defenses/my-tasks')
      }
      tags={statusMeta ? <Tag color={statusMeta.color}>{statusMeta.label}</Tag> : undefined}
    >
      {!session ? (
        <Alert type="warning" message="Không tìm thấy phiên." />
      ) : (
        <>
          <div style={{ paddingBottom: hasActions || tabKey === 'bienban' ? 72 : 0 }}>
          <Tabs
            activeKey={tabKey}
            onChange={setTabKey}
            items={[
              {
                key: 'phien',
                label: 'Thông tin phiên',
                children: (
                  <>
                    {myMember && ['PUBLISHED', 'CONFIRMED'].includes(st || '') ? (
                      <Card
                        size="small"
                        title="Phiếu đánh giá thuyết minh của bạn"
                        style={{ marginBottom: 16 }}
                        extra={
                          <Button
                            type="link"
                            onClick={() => history.push('/projects/defenses/my-tasks')}
                          >
                            Tất cả phiếu của tôi
                          </Button>
                        }
                      >
                        {!mySheets.length ? (
                          <Alert
                            type="warning"
                            message="Chưa có phiếu — liên hệ PKH kiểm tra phát hành QĐ."
                          />
                        ) : (
                          <Table
                            size="small"
                            rowKey="id"
                            pagination={false}
                            dataSource={mySheets}
                            columns={[
                              {
                                title: 'Thuyết minh',
                                render: (_, r) => outlineCode(r.projectOutlineId),
                              },
                              {
                                title: 'Trạng thái',
                                width: 160,
                                render: (_, r) =>
                                  r.status === 'SUBMITTED' ? (
                                    <Tag color="green">Đã nộp</Tag>
                                  ) : (
                                    <Tag color="orange">Chưa nộp</Tag>
                                  ),
                              },
                              {
                                title: 'Điểm',
                                width: 120,
                                align: 'center',
                                render: (_, r) => r.totalScore ?? '—',
                              },
                              {
                                title: 'Thao tác',
                                width: 300,
                                render: (_, r) => (
                                  <Space size={4} wrap>
                                    {/* Icon tài liệu: mở xem hồ sơ thuyết minh */}
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={<FileTextOutlined />}
                                      onClick={() =>
                                        void openOutlineSheet(r.projectOutlineId)
                                      }
                                      style={{ paddingInline: 4 }}
                                    >
                                      Xem thuyết minh
                                    </Button>
                                    {/* Icon form: nhập/xem phiếu BM.05a */}
                                    <Button
                                      type="link"
                                      size="small"
                                      icon={
                                        r.status === 'SUBMITTED' ? (
                                          <EyeOutlined />
                                        ) : (
                                          <FormOutlined />
                                        )
                                      }
                                      onClick={() => openPhieuSheet(r.id)}
                                      style={{ paddingInline: 4 }}
                                    >
                                      {r.status === 'SUBMITTED'
                                        ? 'Xem phiếu'
                                        : 'Nhập phiếu đánh giá'}
                                    </Button>
                                  </Space>
                                ),
                              },
                            ]}
                          />
                        )}
                      </Card>
                    ) : null}

                    <Card
                      size="small"
                      title="Thông tin phiên"
                      style={{ marginBottom: 16 }}
                      extra={
                        canPkh &&
                        st &&
                        ['PUBLISHED', 'CONFIRMED'].includes(st) &&
                        session.meetingAt &&
                        dayjs(session.meetingAt).isAfter(dayjs()) &&
                        !session.earlyMeetingOpened ? (
                          <Button
                            type="primary"
                            ghost
                            size="small"
                            icon={<ThunderboltOutlined />}
                            onClick={() => {
                              Modal.confirm({
                                title: 'Xác nhận họp trước ngày dự kiến?',
                                content:
                                  'Thư ký hội đồng sẽ được quyền soạn biên bản thẩm định, xuất PDF và gửi ngay — không cần chờ đến lịch họp.',
                                okText: 'Xác nhận họp trước',
                                onOk: async () => {
                                  try {
                                    const res = await openEarlyDefenseMeeting(sessionId);
                                    setSession(res.data);
                                    message.success(
                                      res.message || 'Đã mở biên bản cho Thư ký',
                                    );
                                  } catch (e: any) {
                                    message.error(
                                      e?.data?.message || e?.message || 'Thất bại',
                                    );
                                    return Promise.reject();
                                  }
                                },
                              });
                            }}
                          >
                            Họp trước ngày dự kiến
                          </Button>
                        ) : session.earlyMeetingOpened ? (
                          <Tag color="orange">Đã xác nhận họp trước lịch</Tag>
                        ) : null
                      }
                    >
                      <Descriptions column={2} size="small">
                        <Descriptions.Item label="Mã QĐ">
                          {session.decisionCode || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày họp">
                          {session.meetingAt
                            ? dayjs(session.meetingAt).format('HH:mm DD/MM/YYYY')
                            : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Địa điểm">
                          {session.location || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Link họp">
                          {session.meetingUrl ? (
                            <a href={session.meetingUrl} target="_blank" rel="noreferrer">
                              {session.meetingUrl}
                            </a>
                          ) : (
                            '—'
                          )}
                        </Descriptions.Item>
                        <Descriptions.Item label="BM.05a" span={2}>
                          {session.scoreProgress
                            ? `${session.scoreProgress.submitted}/${session.scoreProgress.total} đã nộp`
                            : 'Chưa mở (sau khi TC-HC phát hành)'}
                        </Descriptions.Item>
                        {session.earlyMeetingOpened ? (
                          <Descriptions.Item label="Họp trước lịch" span={2}>
                            Đã mở
                            {session.earlyMeetingOpenedAt
                              ? ` lúc ${dayjs(session.earlyMeetingOpenedAt).format(
                                  'HH:mm DD/MM/YYYY',
                                )}`
                              : ''}{' '}
                            — Thư ký được soạn biên bản.
                          </Descriptions.Item>
                        ) : null}
                      </Descriptions>
                    </Card>

                    <Card size="small" title="Thuyết minh trong phiên" style={{ marginBottom: 16 }}>
                      <Table
                        size="small"
                        rowKey="id"
                        pagination={false}
                        dataSource={
                          session.outlines || (session.outline ? [session.outline] : [])
                        }
                        columns={[
                          {
                            title: 'Mã',
                            dataIndex: 'code',
                            width: 140,
                            render: (code: string, r) => (
                              <a onClick={() => void openOutlineSheet(r.id)}>{code}</a>
                            ),
                          },
                          {
                            title: 'Tên đề tài',
                            dataIndex: 'title',
                            ellipsis: true,
                            render: (title: string, r) => (
                              <a onClick={() => void openOutlineSheet(r.id)}>{title}</a>
                            ),
                          },
                          {
                            title: 'CNĐT',
                            dataIndex: 'ownerName',
                            width: 200,
                            ellipsis: true,
                          },
                          {
                            title: 'Trạng thái',
                            dataIndex: 'status',
                            width: 180,
                          },
                          {
                            title: 'Hồ sơ',
                            width: 180,
                            render: (_, r) => (
                              <Button
                                type="link"
                                size="small"
                                icon={<FileTextOutlined />}
                                onClick={() => void openOutlineSheet(r.id)}
                                style={{ paddingInline: 0 }}
                              >
                                Xem thuyết minh
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </Card>

                    <Card size="small" title="Hội đồng" style={{ marginBottom: 16 }}>
                      <Table
                        size="small"
                        rowKey={(r) => String(r.id || r.memberName)}
                        pagination={false}
                        dataSource={memberRows}
                        columns={[
                          { title: 'Họ tên', dataIndex: 'memberName' },
                          {
                            title: 'Vai trò',
                            width: 130,
                            render: (_, r) =>
                              DEFENSE_ROLE_OPTIONS.find((o) => o.value === r.roleInCouncil)
                                ?.label || r.roleInCouncil,
                          },
                          { title: 'Đơn vị', dataIndex: 'unit', ellipsis: true },
                          {
                            title: 'BM.05a',
                            width: 120,
                            render: (_, r) =>
                              r.sheetTotal ? `${r.sheetSubmitted}/${r.sheetTotal}` : '—',
                          },
                          {
                            title: 'Thao tác',
                            width: 100,
                            render: (_, r) =>
                              canPkh &&
                              st &&
                              ['PUBLISHED', 'CONFIRMED'].includes(st) &&
                              r.pending > 0 &&
                              r.id ? (
                                <a onClick={() => void handleRemind(r.id!)}>Nhắc</a>
                              ) : null,
                          },
                        ]}
                      />
                    </Card>

                    {session.decisionDraftHtml || session.decisionFileUrl ? (
                      <Card
                        size="small"
                        title="Dự thảo QĐ thành lập HĐ"
                        extra={
                          session.decisionFileUrl ? (
                            <a
                              href={resolvePublicAssetUrl(session.decisionFileUrl)}
                              target="_blank"
                              rel="noreferrer"
                              download
                            >
                              <DownloadOutlined /> Tải QĐ (DOCX)
                            </a>
                          ) : null
                        }
                      >
                        {session.decisionDraftHtml ? (
                          <Paragraph>
                            <div
                              dangerouslySetInnerHTML={{ __html: session.decisionDraftHtml }}
                            />
                          </Paragraph>
                        ) : (
                          <Alert
                            type="info"
                            showIcon
                            message="Đã sinh file DOCX dự thảo — tải về để xem nội dung đầy đủ."
                          />
                        )}
                      </Card>
                    ) : null}
                  </>
                ),
              },
              {
                key: 'bienban',
                label: 'Biên bản thẩm định',
                children: <BienBanThamDinh sessionId={sessionId} />,
              },
            ]}
          />
          </div>

          <OutlinePreviewSheet
            open={tmOpen}
            onClose={() => setTmOpen(false)}
            outline={tmOutline}
            loading={tmLoading}
          />

          <Bm05aScoreSheet
            open={phieuOpen}
            sheetId={phieuSheetId}
            onClose={() => {
              setPhieuOpen(false);
              setPhieuSheetId(null);
            }}
            onSaved={() => void load()}
          />

          {hasActions && tabKey !== 'bienban' ? (
            <FooterToolbar>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() =>
                  history.push(
                    canPkh ? '/projects/defenses' : '/projects/defenses/my-tasks',
                  )
                }
              >
                Quay lại
              </Button>
              {mySheets.some((s) => s.status === 'DRAFT') ? (
                <Button
                  type="primary"
                  icon={<FormOutlined />}
                  onClick={() => {
                    const first = mySheets.find((s) => s.status === 'DRAFT');
                    if (first) openPhieuSheet(first.id);
                  }}
                >
                  Nhập phiếu đánh giá
                </Button>
              ) : null}
              {canPkh && st === 'DRAFT' ? (
                <Button type="primary" onClick={handleSubmitBgh}>
                  Tạo QĐ & trình BGH
                </Button>
              ) : null}
              {canBgh && st === 'PENDING_BGH' ? (
                <Button type="primary" onClick={handleBghSign}>
                  BGH ký số
                </Button>
              ) : null}
              {canTchc && st === 'BGH_SIGNED' ? (
                <Button type="primary" onClick={handlePublish}>
                  TC-HC phát hành
                </Button>
              ) : null}
              {canPkh && st && !['FINALIZED', 'CANCELLED'].includes(st) ? (
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={handleCancel}
                >
                  Hủy phiên
                </Button>
              ) : null}
            </FooterToolbar>
          ) : null}
        </>
      )}
    </PageContainer>
  );
};

export default DefenseDetailPage;
