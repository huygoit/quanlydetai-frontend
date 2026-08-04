/**
 * Chi tiết phiên xét chọn — nhập kết quả HĐ, biên bản, trình/phê duyệt BGH (US-03-04)
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  message,
} from 'antd';
import { history, useAccess, useParams } from '@umijs/max';
import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  getSelectionSession,
  saveSelectionSessionResults,
  saveSelectionMinutes,
  submitSelectionToBgh,
  bghApproveSelection,
  bghRejectSelection,
  getSelectionSummary,
  updateSelectionSessionMeta,
  COUNCIL_RESULT_OPTIONS,
  SESSION_STATUS_MAP,
  type CouncilResult,
  type SelectionSession,
  type SelectionSessionItem,
} from '@/services/api/proposalSelectionSessions';
import { API_BASE_URL } from '@/services/request';

type EditRow = SelectionSessionItem & {
  councilOpinion: string;
  councilResult?: CouncilResult;
  adjustmentNote?: string;
};

const SelectionSessionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const sid = Number(id);
  const [session, setSession] = useState<SelectionSession | null>(null);
  const [rows, setRows] = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState<{
    totals: { dongY: number; dieuChinh: number; khongDongY: number; total: number };
    byUnit: Array<{
      unit: string;
      dongY: number;
      dieuChinh: number;
      khongDongY: number;
      total: number;
    }>;
  } | null>(null);
  const [membersText, setMembersText] = useState('');
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectForm] = Form.useForm();

  const canPkh = access.canManageSelectionSession || access.canReviewProjectProposal;
  const canBgh = access.canApproveSelectionSession || access.canApproveProjectProposal;
  const locked = session?.status === 'LOCKED';
  const pendingBgh = session?.status === 'PENDING_BGH';
  const editable = canPkh && !locked && !pendingBgh;

  const load = useCallback(async () => {
    if (!Number.isFinite(sid)) return;
    setLoading(true);
    try {
      const res = await getSelectionSession(sid);
      const d = res.data;
      if (!d) return;
      setSession(d);
      setRows(
        (d.items || []).map((it) => ({
          ...it,
          councilOpinion: it.councilOpinion || '',
          councilResult: (it.councilResult as CouncilResult) || undefined,
          adjustmentNote: it.adjustmentNote || '',
        })),
      );
      setMembersText(
        (d.councilMembers || [])
          .map((m) => (m.role ? `${m.name} — ${m.role}` : m.name))
          .join('\n'),
      );
      const sum = await getSelectionSummary(sid);
      setSummary(sum.data || null);
    } catch (e: any) {
      message.error(e?.message || 'Không tải được phiên');
    } finally {
      setLoading(false);
    }
  }, [sid]);

  useEffect(() => {
    void load();
  }, [load]);

  const stMeta = session ? SESSION_STATUS_MAP[session.status] : null;

  const columns = useMemo(
    () => [
      {
        title: 'Mã',
        width: 110,
        render: (_: unknown, r: EditRow) => r.proposal?.code,
      },
      {
        title: 'Tên đề tài',
        ellipsis: true,
        render: (_: unknown, r: EditRow) => r.proposal?.title,
      },
      {
        title: 'Chủ nhiệm / Đơn vị',
        width: 180,
        render: (_: unknown, r: EditRow) => (
          <span>
            {r.proposal?.ownerName}
            <br />
            <small>{r.proposal?.ownerUnit}</small>
          </span>
        ),
      },
      {
        title: 'Ý kiến Hội đồng',
        width: 220,
        render: (_: unknown, r: EditRow, idx: number) =>
          editable ? (
            <Input.TextArea
              rows={2}
              value={r.councilOpinion}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...next[idx], councilOpinion: e.target.value };
                setRows(next);
              }}
            />
          ) : (
            r.councilOpinion || '—'
          ),
      },
      {
        title: 'Kết quả',
        width: 180,
        render: (_: unknown, r: EditRow, idx: number) =>
          editable ? (
            <Select
              style={{ width: '100%' }}
              placeholder="Chọn"
              value={r.councilResult}
              options={COUNCIL_RESULT_OPTIONS}
              onChange={(v) => {
                const next = [...rows];
                next[idx] = { ...next[idx], councilResult: v };
                setRows(next);
              }}
            />
          ) : (
            COUNCIL_RESULT_OPTIONS.find((o) => o.value === r.councilResult)?.label || '—'
          ),
      },
      {
        title: 'Nội dung điều chỉnh',
        width: 200,
        render: (_: unknown, r: EditRow, idx: number) => {
          const need = r.councilResult === 'DONG_Y_DIEU_CHINH';
          if (!need && !r.adjustmentNote) return '—';
          return editable ? (
            <Input.TextArea
              rows={2}
              disabled={!need}
              value={r.adjustmentNote}
              placeholder={need ? 'Bắt buộc khi Đồng ý có điều chỉnh' : ''}
              onChange={(e) => {
                const next = [...rows];
                next[idx] = { ...next[idx], adjustmentNote: e.target.value };
                setRows(next);
              }}
            />
          ) : (
            r.adjustmentNote || '—'
          );
        },
      },
    ],
    [editable, rows],
  );

  /** Lưu kết quả + thành phần HĐ; trả về true nếu thành công */
  const luuKetQua = async (opts?: { silent?: boolean }): Promise<boolean> => {
    if (!session) return false;
    for (const r of rows) {
      if (!r.councilOpinion?.trim() || !r.councilResult) {
        message.error(`Thiếu ý kiến/kết quả: ${r.proposal?.code}`);
        return false;
      }
      if (r.councilResult === 'DONG_Y_DIEU_CHINH' && !r.adjustmentNote?.trim()) {
        message.error(`Thiếu nội dung điều chỉnh: ${r.proposal?.code}`);
        return false;
      }
    }
    setSaving(true);
    try {
      const memberLines = membersText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((line) => {
          const [name, role] = line.split('—').map((x) => x.trim());
          return { name: name || line, role };
        });
      await updateSelectionSessionMeta(session.id, {
        title: session.title,
        councilMembers: memberLines,
      });
      const res = await saveSelectionSessionResults(session.id, {
        expectedVersion: session.version,
        items: rows.map((r) => ({
          projectProposalId: r.projectProposalId,
          councilOpinion: r.councilOpinion,
          councilResult: r.councilResult!,
          adjustmentNote: r.adjustmentNote,
        })),
      });
      if (!opts?.silent) message.success('Đã lưu kết quả');
      setSession(res.data || session);
      await load();
      return true;
    } catch (e: any) {
      message.error(e?.data?.message || e?.message || 'Lưu thất bại');
      return false;
    } finally {
      setSaving(false);
    }
  };

  if (!Number.isFinite(sid)) {
    return <PageContainer>ID phiên không hợp lệ.</PageContainer>;
  }

  return (
    <PageContainer
      loading={loading}
      title={session?.title || `Phiên #${sid}`}
      subTitle={stMeta ? <Tag color={stMeta.color}>{stMeta.label}</Tag> : undefined}
      onBack={() => history.push('/projects/selection-sessions')}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {session?.status === 'RETURNED' && session.bghComment && (
          <Alert type="error" showIcon message="BGH yêu cầu chỉnh sửa" description={session.bghComment} />
        )}
        {locked && <Alert type="success" showIcon message="Phiên đã khóa — không chỉnh sửa kết quả." />}

        <Card size="small" title="Thông tin phiên">
          <p>
            <strong>Ngày họp:</strong>{' '}
            {session ? dayjs(session.meetingAt).format('DD/MM/YYYY HH:mm') : '—'}
          </p>
          <p>
            <strong>Địa điểm:</strong> {session?.location}
          </p>
          {editable && (
            <Form layout="vertical">
              <Form.Item
                label="Thành phần Hội đồng (mỗi dòng: Họ tên — Vai trò)"
                extra="VD: PGS.TS. Nguyễn A — Chủ tịch"
              >
                <Input.TextArea
                  rows={3}
                  value={membersText}
                  onChange={(e) => setMembersText(e.target.value)}
                />
              </Form.Item>
            </Form>
          )}
          {!editable && session?.councilMembers?.length ? (
            <ul>
              {session.councilMembers.map((m, i) => (
                <li key={i}>
                  {m.name}
                  {m.role ? ` — ${m.role}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
          {session?.minutesFileUrl && (
            <p>
              Biên bản:{' '}
              <a href={`${API_BASE_URL}${session.minutesFileUrl}`} target="_blank" rel="noreferrer">
                Tải / xem biên bản (HTML — in PDF)
              </a>
            </p>
          )}
        </Card>

        {summary && (
          <Row gutter={12}>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Đồng ý" value={summary.totals.dongY} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Có điều chỉnh" value={summary.totals.dieuChinh} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Không đồng ý" value={summary.totals.khongDongY} />
              </Card>
            </Col>
            <Col xs={12} md={6}>
              <Card size="small">
                <Statistic title="Tổng" value={summary.totals.total} />
              </Card>
            </Col>
          </Row>
        )}

        {summary?.byUnit?.length ? (
          <Card size="small" title="Tổng kết theo đơn vị">
            <Table
              size="small"
              pagination={false}
              rowKey="unit"
              dataSource={summary.byUnit}
              columns={[
                { title: 'Đơn vị', dataIndex: 'unit' },
                { title: 'Đồng ý', dataIndex: 'dongY', width: 90 },
                { title: 'Điều chỉnh', dataIndex: 'dieuChinh', width: 100 },
                { title: 'Không ĐY', dataIndex: 'khongDongY', width: 100 },
                { title: 'Tổng', dataIndex: 'total', width: 80 },
              ]}
            />
          </Card>
        ) : null}

        <Card title="Danh sách đề xuất & kết quả Hội đồng">
          <Table
            rowKey="projectProposalId"
            size="small"
            scroll={{ x: 1100 }}
            pagination={false}
            dataSource={rows}
            columns={columns as any}
          />
        </Card>

        <Space wrap>
          {editable && (
            <Button type="primary" loading={saving} onClick={() => void luuKetQua()}>
              Lưu kết quả
            </Button>
          )}
          {canPkh &&
            (session?.status === 'OPEN' ||
              session?.status === 'CREATED' ||
              session?.status === 'RETURNED' ||
              session?.status === 'MINUTES_SAVED') && (
            <Button
              onClick={async () => {
                try {
                  const ok = await luuKetQua({ silent: true });
                  if (!ok) return;
                  await saveSelectionMinutes(sid);
                  message.success('Đã sinh biên bản');
                  await load();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Lưu biên bản thất bại');
                }
              }}
            >
              Lưu biên bản
            </Button>
          )}
          {canPkh && (session?.status === 'MINUTES_SAVED' || session?.status === 'RETURNED') && (
            <Button
              type="primary"
              onClick={async () => {
                try {
                  await submitSelectionToBgh(sid);
                  message.success('Đã trình BGH');
                  await load();
                } catch (e: any) {
                  message.error(e?.data?.message || e?.message || 'Trình BGH thất bại');
                }
              }}
            >
              Trình BGH phê duyệt
            </Button>
          )}
          {canBgh && pendingBgh && (
            <>
              <Button
                type="primary"
                onClick={async () => {
                  try {
                    await bghApproveSelection(sid);
                    message.success('BGH đã phê duyệt — phiên khóa, trạng thái đề xuất đã cập nhật');
                    await load();
                  } catch (e: any) {
                    message.error(e?.data?.message || e?.message || 'Phê duyệt thất bại');
                  }
                }}
              >
                BGH phê duyệt
              </Button>
              <Button danger onClick={() => setRejectOpen(true)}>
                BGH từ chối / yêu cầu sửa
              </Button>
            </>
          )}
        </Space>
      </Space>

      <Modal
        title="BGH từ chối danh mục"
        open={rejectOpen}
        onCancel={() => setRejectOpen(false)}
        onOk={async () => {
          const v = await rejectForm.validateFields();
          try {
            await bghRejectSelection(sid, v.reason);
            message.success('Đã trả lại PKH');
            setRejectOpen(false);
            await load();
          } catch (e: any) {
            message.error(e?.data?.message || e?.message || 'Thất bại');
          }
        }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="Nội dung phản hồi" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SelectionSessionDetailPage;
