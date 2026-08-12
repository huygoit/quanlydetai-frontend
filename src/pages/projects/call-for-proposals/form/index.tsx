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
import { Card, message, Button, Form } from 'antd';
import { history, useParams, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  createCallForProposal,
  updateCallForProposal,
  getCallForProposal,
  CFP_PERIOD_KIND_OPTIONS,
  type CfpWritePayload,
} from '@/services/api/callForProposals';
import { getProjectProcessTypeOptions } from '@/services/api/projectProcessTypes';
import PublicationAttachmentUpload from '@/components/PublicationForm/PublicationAttachmentUpload';
import RichTextHtmlField from '@/components/RichTextHtmlField';

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
          projectProcessTypeIds: d.projectProcessTypeIds || [],
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
              projectProcessTypeIds: [],
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
              projectProcessTypeIds: (values.projectProcessTypeIds || []).map(Number),
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
            name="projectProcessTypeIds"
            label="Cấp ý tưởng/đề tài"
            mode="multiple"
            rules={[{ required: true, message: 'Chọn ít nhất 1 cấp từ danh mục' }]}
            request={async () => {
              // Lấy từ danh mục cấp ý tưởng/đề tài (QT-I…QT-V)
              const res = await getProjectProcessTypeOptions({ status: 'ACTIVE' });
              return (res.data || []).map((o) => ({
                value: o.id,
                label: `${o.code} — ${o.name}`,
              }));
            }}
            fieldProps={{
              showSearch: true,
              optionFilterProp: 'label',
              placeholder: 'Chọn cấp ý tưởng/đề tài',
            }}
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
