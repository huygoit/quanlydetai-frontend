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
import { Card, message, Button, Form, Modal, Space } from 'antd';
import { DownloadOutlined, EyeOutlined, SendOutlined } from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import { useEffect, useRef, useState } from 'react';
import dayjs from 'dayjs';
import {
  attachCfpProposals,
  createCallForProposal,
  downloadCfpNotice,
  submitCallForProposal,
  updateCallForProposal,
  getCallForProposal,
  CFP_PERIOD_KIND_OPTIONS,
  type CfpWritePayload,
} from '@/services/api/callForProposals';
import { getProjectProcessTypeOptions } from '@/services/api/projectProcessTypes';
import PublicationAttachmentUpload from '@/components/PublicationForm/PublicationAttachmentUpload';
import RichTextHtmlField from '@/components/RichTextHtmlField';
import NhiemVuThongBao from '../detail/NhiemVuThongBao';

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
  const [capIds, setCapIds] = useState<number[]>([]);
  const formRef = useRef<ProFormInstance>();
  const nhiemVuChoGanRef = useRef<number[]>([]);
  const [dangXem, setDangXem] = useState(false);
  const [dangTaiFile, setDangTaiFile] = useState(false);
  const [dangTrinh, setDangTrinh] = useState(false);

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
        const cap = (d.projectProcessTypeIds || []).map(Number);
        setCapIds(cap);
        setInitial({
          title: d.title,
          periodKind: d.periodKind,
          periodLabel: d.periodLabel,
          deadlineAt: d.deadlineAt ? dayjs(d.deadlineAt).format('YYYY-MM-DD') : undefined,
          projectProcessTypeIds: cap,
          contentHtml: d.contentHtml || '',
          attachmentUrls: d.attachmentUrls || [],
        });
      })
      .catch((e) => message.error(e?.message || 'Không tải được'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const lapPayload = (values: Record<string, any>): CfpWritePayload | null => {
    const deadlineAt = chuanHoaHanNop(values.deadlineAt);
    if (!deadlineAt) {
      message.error('Ngày hạn nộp không hợp lệ.');
      return null;
    }
    return {
      title: values.title,
      periodKind: values.periodKind,
      periodLabel: values.periodLabel || sinhNhanKy(values.periodKind),
      deadlineAt,
      projectProcessTypeIds: (values.projectProcessTypeIds || []).map(Number),
      contentHtml: values.contentHtml || null,
      attachmentUrls: values.attachmentUrls || [],
    };
  };

  const luuDeXuat = async (): Promise<number | null> => {
    let values: Record<string, any>;
    try {
      values = (await formRef.current?.validateFields()) || {};
    } catch {
      return null;
    }
    const payload = lapPayload(values);
    if (!payload) return null;
    if (isEdit && id) {
      await updateCallForProposal(Number(id), payload);
      return Number(id);
    }
    const res = await createCallForProposal(payload);
    const newId = Number(res.data?.id);
    if (!newId) return null;
    const choGan = nhiemVuChoGanRef.current;
    if (choGan.length) {
      try {
        await attachCfpProposals(newId, choGan);
        nhiemVuChoGanRef.current = [];
      } catch {
        message.warning('Đã tạo nháp nhưng chưa gắn được nhiệm vụ. Mở lại form để thêm.');
        history.push(`/projects/call-for-proposals/form/${newId}`);
        return null;
      }
    }
    return newId;
  };

  const xemThongBao = async () => {
    if (!isEdit || !id) {
      message.warning('Lưu nháp trước để xem thông báo.');
      return;
    }
    setDangXem(true);
    try {
      const savedId = await luuDeXuat();
      if (!savedId) return;
      window.open(`/projects/call-for-proposals/${savedId}/xem`, '_blank', 'noopener,noreferrer');
    } catch (e: any) {
      if (!e?.response && e?.message) message.error(e.message);
    } finally {
      setDangXem(false);
    }
  };

  const taiThongBao = async () => {
    if (!isEdit || !id) {
      message.warning('Lưu nháp trước để tải thông báo.');
      return;
    }
    setDangTaiFile(true);
    try {
      const savedId = await luuDeXuat();
      if (!savedId) return;
      await downloadCfpNotice(savedId);
    } catch (e: any) {
      message.error(e?.message || 'Tải thông báo thất bại');
    } finally {
      setDangTaiFile(false);
    }
  };

  const trinhBgh = () => {
    Modal.confirm({
      title: 'Trình BGH duyệt thông báo này?',
      content: 'Nội dung hiện tại sẽ được lưu, rồi chuyển sang chờ BGH duyệt.',
      okText: 'Trình BGH',
      cancelText: 'Hủy',
      onOk: async () => {
        setDangTrinh(true);
        try {
          const savedId = await luuDeXuat();
          if (!savedId) return;
          await submitCallForProposal(savedId);
          message.success('Đã trình BGH');
          history.push(`/projects/call-for-proposals/${savedId}`);
        } catch (e: any) {
          if (!e?.response && e?.message) message.error(e.message);
        } finally {
          setDangTrinh(false);
        }
      },
    });
  };

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
          onValuesChange={(changed) => {
            if (changed.projectProcessTypeIds) {
              setCapIds(
                (changed.projectProcessTypeIds as number[]).map(Number).filter((n) => n > 0),
              );
            }
          }}
          onFinish={async () => {
            try {
              const savedId = await luuDeXuat();
              if (!savedId) return false;
              if (isEdit) {
                message.success('Lưu thông báo thành công !');
                return true;
              }
              message.success('Đã tạo nháp');
              history.push(`/projects/call-for-proposals/${savedId}`);
              return true;
            } catch (e: any) {
              message.error(e?.data?.message || e?.message || 'Lưu thất bại');
              return false;
            }
          }}
          submitter={{
            searchConfig: { submitText: 'Lưu nháp' },
            resetButtonProps: { style: { display: 'none' } },
            render: (_, dom) => (
              <FooterToolbar
                extra={
                  <Space>
                    <Button icon={<EyeOutlined />} loading={dangXem} onClick={() => void xemThongBao()}>
                      Xem thông báo
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      loading={dangTaiFile}
                      onClick={() => void taiThongBao()}
                    >
                      Tải về
                    </Button>
                    {access.canSubmitCfp ? (
                      <Button
                        icon={<SendOutlined />}
                        loading={dangTrinh}
                        onClick={trinhBgh}
                      >
                        Trình BGH
                      </Button>
                    ) : null}
                  </Space>
                }
              >
                <Button onClick={() => history.push('/projects/call-for-proposals')}>Quay lại</Button>
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
        <div style={{ marginTop: 8 }}>
          {isEdit ? (
            <NhiemVuThongBao cfpId={Number(id)} coTheSua />
          ) : (
            <NhiemVuThongBao
              processTypeIds={capIds}
              coTheSua
              onPendingChange={(ids) => {
                nhiemVuChoGanRef.current = ids;
              }}
            />
          )}
        </div>
      </Card>
    </PageContainer>
  );
};

export default CfpFormPage;
