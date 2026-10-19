import { HAN_FILE, NHAN_BCTD } from '@/constants/module56';
import {
  luuTienDo,
  manTienDo,
  pkhTienDo,
  type KyTienDo,
  type ManTienDo,
  type TepModule56,
} from '@/services/api/module56';
import { formatVnd } from '@/utils/format';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Space,
  Table,
  Tag,
  message,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

export function TabTienDo({
  outlineId,
  vaiTro,
  onXong,
}: {
  outlineId: number;
  vaiTro: VaiTro;
  onXong: (t: string) => void;
}) {
  const [data, setData] = useState<ManTienDo | null>(null);
  const [loi, setLoi] = useState('');
  const [ky, setKy] = useState<KyTienDo | null>(null);
  const [contentRows, setContentRows] = useState<
    { milestone: string; progress: string; done: string }[]
  >([]);
  const [productRows, setProductRows] = useState<
    { name: string; achieved: string }[]
  >([]);
  const [nextPlan, setNextPlan] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [tep, setTep] = useState<TepModule56[]>([]);

  const tai = () =>
    manTienDo(outlineId)
      .then((res) => {
        setData(res.data);
        setLoi('');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId]);

  const mo = (row: KyTienDo) => {
    const bc = row.report;
    setKy(row);
    setContentRows(
      bc?.contentRows?.length
        ? bc.contentRows
        : [{ milestone: row.title, progress: '', done: '' }],
    );
    setProductRows(
      bc?.productRows?.length ? bc.productRows : [{ name: '', achieved: '' }],
    );
    setNextPlan(bc?.nextPlan || '');
    setRecommendation(bc?.recommendation || '');
    setTep(bc?.attachments || []);
  };

  const luu = async (submit: boolean) => {
    if (!ky) return;
    const tong = tep.reduce((s, t) => s + (t.fileSize || 0), 0);
    if (tong > HAN_FILE.tienDo) {
      message.warning('Tổng file vượt 50MB');
      return;
    }
    if (submit && !nextPlan.trim()) {
      message.warning('Kế hoạch tiếp theo là bắt buộc khi nộp');
      return;
    }
    try {
      await luuTienDo(ky.id, {
        outlineId,
        submit,
        contentRows,
        productRows: productRows.filter((p) => p.name.trim()),
        nextPlan,
        recommendation,
        attachments: tep,
      });
      onXong(submit ? 'Đã nộp báo cáo' : 'Đã lưu nháp');
      setKy(null);
      await tai();
    } catch (e: any) {
      message.error(bao(e));
    }
  };

  const suaDuoc = (row: KyTienDo) =>
    vaiTro.canCnnv &&
    (!row.report ||
      row.report.status === 'BCTD_DRAFT' ||
      row.report.status === 'BCTD_BS');

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {loi && <Alert type="error" message={loi} />}
      {data && (
        <Alert
          type="info"
          message={`Tạm ứng ${formatVnd(
            data.finance.advanced,
          )} · Đã chi ${formatVnd(data.finance.spent)} · Quyết toán ${formatVnd(
            data.finance.settled,
          )}`}
          description="Số liệu kinh phí chỉ để xem, không sửa trên màn này."
        />
      )}
      {(data?.periods || []).map((p) => (
        <Card
          key={p.id}
          size="small"
          title={`${p.title} · hạn ${dayjs(p.dueOn).format('DD/MM/YYYY')}`}
          extra={
            <Space>
              {p.overdue && <Tag color="red">Quá hạn</Tag>}
              <Tag>{p.kind === 'MIDPOINT' ? 'Giữa kỳ' : 'Mốc'}</Tag>
              {p.report && (
                <Tag>{NHAN_BCTD[p.report.status] || p.report.status}</Tag>
              )}
            </Space>
          }
        >
          <Space>
            {suaDuoc(p) && (
              <Button type="primary" onClick={() => mo(p)}>
                {p.report ? 'Sửa báo cáo' : 'Nộp báo cáo'}
              </Button>
            )}
            {vaiTro.canManage && p.report?.status === 'BCTD_CHO_PKH' && (
              <>
                <Button
                  onClick={() =>
                    pkhTienDo(p.report!.id, { accept: true })
                      .then(tai)
                      .catch((e) => message.error(bao(e)))
                  }
                >
                  PKH duyệt
                </Button>
                <Button
                  onClick={() => {
                    const note = window.prompt('Ghi chú trả lại') || '';
                    if (!note.trim()) return;
                    pkhTienDo(p.report!.id, {
                      accept: false,
                      note: note.trim(),
                    })
                      .then(tai)
                      .catch((e) => message.error(bao(e)));
                  }}
                >
                  Trả lại
                </Button>
              </>
            )}
          </Space>
        </Card>
      ))}

      {ky && (
        <Card size="small" title={`Soạn báo cáo: ${ky.title}`}>
          <Form layout="vertical">
            {contentRows.map((r, i) => (
              <Space key={i} style={{ display: 'flex', marginBottom: 8 }}>
                <Input
                  placeholder="Mốc (đúng thuyết minh)"
                  value={r.milestone}
                  onChange={(e) =>
                    setContentRows((s) =>
                      s.map((x, j) =>
                        j === i ? { ...x, milestone: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Tiến độ"
                  value={r.progress}
                  onChange={(e) =>
                    setContentRows((s) =>
                      s.map((x, j) =>
                        j === i ? { ...x, progress: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Đã làm"
                  value={r.done}
                  onChange={(e) =>
                    setContentRows((s) =>
                      s.map((x, j) =>
                        j === i ? { ...x, done: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Space>
            ))}
            <Button
              onClick={() =>
                setContentRows((s) => [
                  ...s,
                  { milestone: '', progress: '', done: '' },
                ])
              }
            >
              Thêm dòng nội dung
            </Button>
            {productRows.map((r, i) => (
              <Space key={`p${i}`} style={{ display: 'flex', margin: '8px 0' }}>
                <Input
                  placeholder="Tên sản phẩm"
                  value={r.name}
                  onChange={(e) =>
                    setProductRows((s) =>
                      s.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Input
                  placeholder="Đạt được"
                  value={r.achieved}
                  onChange={(e) =>
                    setProductRows((s) =>
                      s.map((x, j) =>
                        j === i ? { ...x, achieved: e.target.value } : x,
                      ),
                    )
                  }
                />
              </Space>
            ))}
            <Form.Item label="Kế hoạch tiếp" required>
              <Input.TextArea
                rows={3}
                value={nextPlan}
                onChange={(e) => setNextPlan(e.target.value)}
              />
            </Form.Item>
            <Form.Item label="Kiến nghị">
              <Input.TextArea
                rows={2}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
              />
            </Form.Item>
            <ChonTep
              maxBytes={HAN_FILE.tienDo}
              onCo={(t) => setTep((s) => [...s, t])}
            />
            {tep.map((t) => (
              <div key={t.fileUrl}>{t.fileName}</div>
            ))}
            <Space style={{ marginTop: 8 }}>
              <Button onClick={() => luu(false)}>Lưu nháp</Button>
              <Button type="primary" onClick={() => luu(true)}>
                Nộp
              </Button>
              <Button onClick={() => setKy(null)}>Đóng</Button>
            </Space>
          </Form>
        </Card>
      )}
      {data?.finance?.lines && (
        <Table
          size="small"
          pagination={false}
          rowKey="code"
          dataSource={data.finance.lines}
          columns={[
            { title: 'Mục', dataIndex: 'label' },
            {
              title: 'Dự toán',
              dataIndex: 'planned',
              render: (v) => formatVnd(v),
            },
            {
              title: 'Tạm ứng',
              dataIndex: 'advanced',
              render: (v) => formatVnd(v),
            },
            {
              title: 'Đã chi',
              dataIndex: 'spent',
              render: (v) => formatVnd(v),
            },
          ]}
        />
      )}
    </Space>
  );
}
