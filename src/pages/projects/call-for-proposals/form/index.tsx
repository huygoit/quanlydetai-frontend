/**
 * Form tạo / sửa Thông báo tuyển chọn đề tài
 */
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormSelect,
  ProFormDatePicker,
  FooterToolbar,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { Card, message, Button, Space, Form, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  LinkOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  createCallForProposal,
  updateCallForProposal,
  getCallForProposal,
  CFP_LEVEL_OPTIONS,
  CFP_PERIOD_KIND_OPTIONS,
  type CfpWritePayload,
} from '@/services/api/callForProposals';
import PublicationAttachmentUpload from '@/components/PublicationForm/PublicationAttachmentUpload';

/** Tự sinh nhãn kỳ theo loại kỳ + ngày hiện tại (field ẩn trên form). */
const sinhNhanKy = (periodKind: string, ngay = dayjs()) => {
  if (periodKind === 'FINANCIAL') {
    // Năm TC: 01/04 → 31/03
    const nam = ngay.month() >= 3 ? ngay.year() : ngay.year() - 1;
    return String(nam);
  }
  // Năm học: 01/08 → 31/07
  const namBatDau = ngay.month() >= 7 ? ngay.year() : ngay.year() - 1;
  return `${namBatDau}-${namBatDau + 1}`;
};

/** Chuẩn hóa ngày hạn nộp về YYYY-MM-DD (ProFormDatePicker có thể trả dayjs hoặc chuỗi DD/MM/YYYY). */
const chuanHoaHanNop = (value: unknown): string | null => {
  if (value == null || value === '') return null;
  // dayjs / moment-like
  if (dayjs.isDayjs(value) || (typeof value === 'object' && typeof (value as { format?: unknown }).format === 'function')) {
    const d = dayjs.isDayjs(value) ? value : dayjs(value as Date);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  }
  if (value instanceof Date) {
    const d = dayjs(value);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = dayjs(s.slice(0, 10));
      return d.isValid() ? d.format('YYYY-MM-DD') : null;
    }
    // DD/MM/YYYY hoặc DD-MM-YYYY
    const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (m) {
      const iso = `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
      const d = dayjs(iso);
      return d.isValid() ? d.format('YYYY-MM-DD') : null;
    }
    const d = dayjs(s);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  }
  return null;
};

/**
 * Editor rich text tối giản (không thêm package).
 * Lưu HTML vào contentHtml — khớp spec CFP.
 */
const RichTextHtmlField: React.FC<{
  value?: string;
  onChange?: (html: string) => void;
}> = ({ value = '', onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const dangSoan = useRef(false);

  useEffect(() => {
    // Đồng bộ khi load dữ liệu sửa; không ghi đè khi đang gõ
    if (!editorRef.current || dangSoan.current) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const phatSinhThayDoi = () => {
    onChange?.(editorRef.current?.innerHTML || '');
  };

  const chayLenh = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    phatSinhThayDoi();
  };

  const chenLienKet = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (!url) return;
    chayLenh('createLink', url);
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid #f0f0f0',
          background: '#fafafa',
        }}
      >
        <Space size={2} wrap>
          <Tooltip title="In đậm">
            <Button
              type="text"
              size="small"
              icon={<BoldOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('bold');
              }}
            />
          </Tooltip>
          <Tooltip title="In nghiêng">
            <Button
              type="text"
              size="small"
              icon={<ItalicOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('italic');
              }}
            />
          </Tooltip>
          <Tooltip title="Gạch chân">
            <Button
              type="text"
              size="small"
              icon={<UnderlineOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('underline');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách">
            <Button
              type="text"
              size="small"
              icon={<UnorderedListOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('insertUnorderedList');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách số">
            <Button
              type="text"
              size="small"
              icon={<OrderedListOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('insertOrderedList');
              }}
            />
          </Tooltip>
          <Tooltip title="Chèn liên kết">
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chenLienKet();
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa định dạng">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('removeFormat');
              }}
            />
          </Tooltip>
        </Space>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        style={{ minHeight: 180, padding: 12, outline: 'none', lineHeight: 1.6 }}
        onFocus={() => {
          dangSoan.current = true;
        }}
        onBlur={() => {
          dangSoan.current = false;
          phatSinhThayDoi();
        }}
        onInput={phatSinhThayDoi}
      />
    </div>
  );
};

const CfpFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const access = useAccess();
  const [loading, setLoading] = useState(false);
  const [initial, setInitial] = useState<Partial<CfpWritePayload> | undefined>();
  const formRef = useRef<ProFormInstance>();

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getCallForProposal(Number(id))
      .then((res) => {
        const d = res.data;
        if (!d) return;
        if (d.status !== 'DRAFT' && d.status !== 'RETURNED') {
          message.warning('Chỉ sửa được khi Nháp hoặc Bị trả về.');
          history.push(`/projects/call-for-proposals/${d.id}`);
          return;
        }
        setInitial({
          title: d.title,
          periodKind: d.periodKind,
          periodLabel: d.periodLabel,
          deadlineAt: d.deadlineAt ? dayjs(d.deadlineAt).format('YYYY-MM-DD') : undefined,
          levels: d.levels,
          contentHtml: d.contentHtml || '',
          attachmentUrls: d.attachmentUrls || [],
        });
      })
      .catch((e) => message.error(e?.message || 'Không tải được'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  if (isEdit && !access.canUpdateCfp) {
    return <PageContainer>Bạn không có quyền sửa.</PageContainer>;
  }
  if (!isEdit && !access.canCreateCfp) {
    return <PageContainer>Bạn không có quyền tạo.</PageContainer>;
  }

  return (
    <PageContainer title={isEdit ? 'Sửa thông báo tuyển chọn' : 'Tạo thông báo tuyển chọn'}>
      <Card loading={loading && isEdit}>
        <ProForm
          formRef={formRef}
          key={initial ? 'loaded' : 'new'}
          initialValues={
            initial || {
              periodKind: 'ACADEMIC',
              periodLabel: sinhNhanKy('ACADEMIC'),
              levels: ['TRUONG'],
              contentHtml: '',
              attachmentUrls: [],
            }
          }
          onFinish={async (values) => {
            const deadlineAt = chuanHoaHanNop(values.deadlineAt);
            if (!deadlineAt) {
              message.error('Ngày hạn nộp không hợp lệ.');
              return false;
            }
            const payload: CfpWritePayload = {
              title: values.title,
              periodKind: values.periodKind,
              // Field ẩn: nếu trống thì tự sinh theo loại kỳ
              periodLabel: values.periodLabel || sinhNhanKy(values.periodKind),
              deadlineAt,
              levels: values.levels,
              contentHtml: values.contentHtml || null,
              attachmentUrls: values.attachmentUrls || [],
            };
            try {
              if (isEdit) {
                const res = await updateCallForProposal(Number(id), payload);
                message.success('Đã cập nhật');
                history.push(`/projects/call-for-proposals/${res.data?.id || id}`);
              } else {
                const res = await createCallForProposal(payload);
                message.success('Đã tạo nháp');
                history.push(`/projects/call-for-proposals/${res.data?.id}`);
              }
              return true;
            } catch (e: any) {
              message.error(e?.data?.message || e?.message || 'Lưu thất bại');
              return false;
            }
          }}
          submitter={{
            searchConfig: { submitText: 'Lưu nháp' },
            resetButtonProps: { style: { display: 'none' } },
            // Thanh nút cố định dưới cùng khi cuộn trang
            render: (_, dom) => (
              <FooterToolbar>
                <Button onClick={() => history.push('/projects/call-for-proposals')}>
                  Quay lại
                </Button>
                {dom}
              </FooterToolbar>
            ),
          }}
        >
          <ProFormText
            name="title"
            label="Tiêu đề thông báo"
            rules={[{ required: true, message: 'Bắt buộc' }]}
            placeholder="VD: Thông báo tuyển chọn đề tài KH&CN cấp Trường năm học 2026-2027"
          />
          <ProFormSelect
            name="periodKind"
            label="Loại kỳ"
            options={CFP_PERIOD_KIND_OPTIONS}
            rules={[{ required: true, message: 'Bắt buộc' }]}
            width="md"
            fieldProps={{
              onChange: (v: string) => {
                formRef.current?.setFieldsValue({ periodLabel: sinhNhanKy(v) });
              },
            }}
          />
          {/* Ẩn khỏi UI — backend vẫn bắt buộc periodLabel */}
          <ProFormText name="periodLabel" hidden />
          <ProFormDatePicker
            name="deadlineAt"
            label="Thời hạn nộp hồ sơ"
            rules={[
              { required: true, message: 'Bắt buộc' },
              {
                validator: async (_, value) => {
                  const iso = chuanHoaHanNop(value);
                  if (!iso) throw new Error('Ngày không hợp lệ');
                  const min = dayjs().startOf('day').add(10, 'day');
                  if (dayjs(iso).isBefore(min, 'day')) {
                    throw new Error('Phải lớn hơn ngày hiện tại ít nhất 10 ngày');
                  }
                },
              },
            ]}
            fieldProps={{
              format: 'DD/MM/YYYY',
              style: { width: '100%' },
              // Không cho chọn ngày < hôm nay + 10
              disabledDate: (current) =>
                !!current && current.isBefore(dayjs().add(10, 'day').startOf('day')),
            }}
            extra="Phải lớn hơn ngày hiện tại ít nhất 10 ngày."
            width="md"
          />
          <ProFormSelect
            name="levels"
            label="Loại / cấp đề tài"
            mode="multiple"
            options={CFP_LEVEL_OPTIONS}
            rules={[{ required: true, message: 'Chọn ít nhất 1 cấp' }]}
          />
          <Form.Item name="contentHtml" label="Nội dung hướng dẫn (rich text)">
            <RichTextHtmlField />
          </Form.Item>
          <Form.Item
            name="attachmentUrls"
            label="File đính kèm biểu mẫu"
            extra="PDF, Word, hình ảnh — biểu mẫu / phụ lục kèm thông báo."
          >
            <PublicationAttachmentUpload />
          </Form.Item>
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default CfpFormPage;
