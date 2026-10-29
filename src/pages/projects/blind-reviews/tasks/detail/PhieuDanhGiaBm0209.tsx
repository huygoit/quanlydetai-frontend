/**
 * Phiếu đánh giá theo mẫu BM-02.09
 * (hồ sơ xét tài trợ / đặt hàng / tuyển chọn / giao trực tiếp)
 */
import { Checkbox, Form, Input, InputNumber, Radio, Table, Typography } from 'antd';
import type { FormInstance } from 'antd/es/form';
import type { ReviewScoreLine } from '@/services/api/projectOutlineScores';
import './phieu-danh-gia-bm0209.less';

const { Text } = Typography;
const { TextArea } = Input;

export const KET_LUAN_BM0209 = [
  {
    value: 'DE_XUAT',
    label: 'Đề nghị xét tài trợ/đặt hàng/lựa chọn/giao trực tiếp',
  },
  { value: 'HOAN_THIEN', label: 'Đề nghị hoàn thiện' },
  {
    value: 'KHONG_DE_XUAT',
    label: 'Không đề nghị xét tài trợ/đặt hàng/lựa chọn/giao trực tiếp',
  },
] as const;

type Props = {
  form: FormInstance;
  lines: ReviewScoreLine[];
  editable: boolean;
  previewTotal: number | null;
  evaluatorName?: string | null;
  submittedAtLabel?: string | null;
};

const PhieuDanhGiaBm0209: React.FC<Props> = ({
  form,
  lines,
  editable,
  previewTotal,
  evaluatorName,
  submittedAtLabel,
}) => {
  const maxTong = lines.reduce((s, l) => s + Number(l.maxScore || 0), 0);

  return (
    <div className={`bm0209 ${editable ? '' : 'bm0209--readonly'}`}>
      <div className="bm0209__header">
        <div className="bm0209__coquan">
          <div>ĐẠI HỌC ĐÀ NẴNG</div>
          <div>
            <strong>TRƯỜNG ĐẠI HỌC SƯ PHẠM</strong>
          </div>
        </div>
        <div className="bm0209__quoc-hieu">
          <div>
            <strong>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong>
          </div>
          <div>
            <strong>Độc lập - Tự do - Hạnh phúc</strong>
          </div>
          <div className="bm0209__ngay">
            {submittedAtLabel || 'Đà Nẵng, ngày … tháng … năm …'}
          </div>
        </div>
        <div className="bm0209__ma">BM.05a / BM-02.09</div>
      </div>

      <h2 className="bm0209__title">
        PHIẾU ĐÁNH GIÁ HỒ SƠ XÉT TÀI TRỢ/ĐẶT HÀNG/TUYỂN CHỌN/GIAO TRỰC TIẾP
      </h2>

      <Form form={form} layout="vertical" disabled={!editable}>
        <div className="bm0209__muc">
          <strong>A. KIỂM TRA ĐIỀU KIỆN TRƯỚC KHI CHẤM ĐIỂM</strong>
          <div className="bm0209__checks">
            <Form.Item name="precheckEligible" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>Đủ điều kiện tham gia.</Checkbox>
            </Form.Item>
            <Form.Item
              name="precheckConflictCleared"
              valuePropName="checked"
              style={{ marginBottom: 8 }}
            >
              <Checkbox>
                Đã hoàn thành BM-06.08 và không có xung đột lợi ích chưa được xử lý.
              </Checkbox>
            </Form.Item>
            <Form.Item name="precheckEthicsOk" valuePropName="checked" style={{ marginBottom: 8 }}>
              <Checkbox>
                Đã đáp ứng hoặc có phương án xử lý yêu cầu về đạo đức, dữ liệu, SHTT, an toàn, an
                ninh, bảo mật và AI (nếu có).
              </Checkbox>
            </Form.Item>
          </div>
          <Text type="secondary" className="bm0209__note">
            Nếu nội dung bắt buộc nào chưa đạt, thành viên đánh giá nêu rõ tại phần nhận xét và đề
            nghị hoàn thiện hoặc không đề nghị theo quy định.
          </Text>
        </div>

        <div className="bm0209__muc">
          <strong>B. Kết quả đánh giá</strong>
          <Form.List name="lines">
            {(fields) => (
              <Table
                className="bm0209__bang"
                size="small"
                pagination={false}
                rowKey={(r) => String(r.key)}
                dataSource={fields.map((f, index) => ({ ...f, meta: lines[index] }))}
                columns={[
                  {
                    title: 'STT',
                    width: 56,
                    align: 'center',
                    render: (_: unknown, __: unknown, index: number) => index + 1,
                  },
                  {
                    title: 'Tiêu chí',
                    render: (_: unknown, row: any) => row.meta?.criterionName || '—',
                  },
                  {
                    title: 'Điểm tối đa',
                    width: 110,
                    align: 'center',
                    render: (_: unknown, row: any) => row.meta?.maxScore ?? '—',
                  },
                  {
                    title: 'Điểm đánh giá',
                    width: 140,
                    align: 'center',
                    render: (_: unknown, row: any) => (
                      <>
                        <Form.Item name={[row.name, 'criterionCode']} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          name={[row.name, 'score']}
                          style={{ marginBottom: 0 }}
                          rules={[
                            { required: true, message: 'Nhập điểm' },
                            {
                              type: 'number',
                              min: 0,
                              max: Number(row.meta?.maxScore ?? 0),
                              message: `0–${row.meta?.maxScore}`,
                            },
                          ]}
                        >
                          <InputNumber
                            min={0}
                            max={Number(row.meta?.maxScore ?? 0)}
                            step={0.5}
                            style={{ width: 100 }}
                          />
                        </Form.Item>
                      </>
                    ),
                  },
                ]}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2} align="right">
                      <strong>TỔNG</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} align="center">
                      <strong>{maxTong || 100}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} align="center">
                      <strong>{previewTotal ?? '—'}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            )}
          </Form.List>
        </div>

        <div className="bm0209__muc">
          <strong>Kết luận</strong>
          <Form.Item
            name="conclusion"
            rules={[{ required: true, message: 'Chọn kết luận' }]}
            style={{ marginTop: 8, marginBottom: 12 }}
          >
            <Radio.Group>
              {KET_LUAN_BM0209.map((o) => (
                <div key={o.value} style={{ marginBottom: 6 }}>
                  <Radio value={o.value}>{o.label}</Radio>
                </div>
              ))}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="generalComment"
            label="Nhận xét"
            rules={[{ required: true, message: 'Nhập nhận xét' }]}
          >
            <TextArea rows={4} showCount maxLength={4000} placeholder="Nhận xét: …" />
          </Form.Item>
        </div>

        <div className="bm0209__chuky">
          <div>
            <strong>THÀNH VIÊN ĐÁNH GIÁ</strong>
          </div>
          <div>(Ký, ghi rõ họ tên)</div>
          {evaluatorName ? (
            <div className="bm0209__ten">
              <strong>{evaluatorName}</strong>
            </div>
          ) : null}
        </div>
      </Form>
    </div>
  );
};

export default PhieuDanhGiaBm0209;
