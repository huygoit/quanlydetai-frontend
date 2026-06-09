/**
 * Form kê khai KQNC — hồ sơ cá nhân (/profile/me)
 */
import React from 'react';
import { Alert, Button, Cascader, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import AuthorsEditor from '@/components/AuthorsEditor';
import {
  buildResearchOutputCascaderOptions,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import { laySchemaTheoMaLa, type LeafFormSchema } from '@/services/researchOutputFormSchema';
import PublicationAttachmentUpload from './PublicationAttachmentUpload';

export type PublicationFormFieldsProps = {
  form: FormInstance;
  researchOutputTree: ResearchOutputTypeTreeNode[];
  researchTreeLoading?: boolean;
  authors: PublicationAuthor[];
  onAuthorsChange: (authors: PublicationAuthor[]) => void;
  ownerProfileId?: number;
  isAdminKeKhai?: boolean;
  selectedLeafRuleKind: string | null;
  selectedLeafSchema: LeafFormSchema;
  showAdvancedPubFields: boolean;
  onShowAdvancedPubFieldsChange: (show: boolean) => void;
  onLeafSelect: (ruleKind: string | null, leafCode: string | null, schema: LeafFormSchema) => void;
};

const PublicationFormFields: React.FC<PublicationFormFieldsProps> = ({
  form,
  researchOutputTree,
  researchTreeLoading = false,
  authors,
  onAuthorsChange,
  ownerProfileId,
  isAdminKeKhai = false,
  selectedLeafRuleKind,
  selectedLeafSchema,
  showAdvancedPubFields,
  onShowAdvancedPubFieldsChange,
  onLeafSelect,
}) => (
  <Form form={form} layout="vertical">
    <Row gutter={16}>
      <Col span={24}>
        <Form.Item
          name="researchOutputTypePath"
          label="Loại kết quả NCKH (danh mục — chọn đến mục lá)"
          rules={[{ required: true, message: 'Vui lòng chọn mục lá trong cây danh mục' }]}
        >
          <Cascader
            options={buildResearchOutputCascaderOptions(researchOutputTree)}
            placeholder="Chọn nhóm → … → mục lá"
            showSearch
            changeOnSelect={false}
            loading={researchTreeLoading}
            style={{ width: '100%' }}
            onChange={(_val, selectedOptions) => {
              const last = selectedOptions?.[selectedOptions.length - 1] as
                | { ruleKind?: string | null; code?: string | null }
                | undefined;
              const nextRuleKind = last?.ruleKind ?? null;
              const nextLeafCode = (last?.code as string | undefined) ?? null;
              const nextSchema = laySchemaTheoMaLa(nextLeafCode, nextRuleKind);
              onLeafSelect(nextRuleKind, nextLeafCode, nextSchema);
              if (!nextSchema.batBuocForm.includes('isbn')) {
                form.setFieldValue('isbn', undefined);
              }
              if (!nextSchema.batBuocForm.includes('hdgsnnScore')) {
                form.setFieldValue('hdgsnnScore', undefined);
              }
            }}
          />
        </Form.Item>
      </Col>
      <Col span={24}>
        <Form.Item
          name="title"
          label="Tiêu đề kết quả NCKH"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề kết quả NCKH' }]}
        >
          <Input.TextArea rows={2} placeholder="Nhập tiêu đề đầy đủ" />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item name="publishedAt" label="Ngày xuất bản">
          <DatePicker
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            placeholder="Chọn ngày xuất bản"
          />
        </Form.Item>
      </Col>

      <Col span={12}>
        <Form.Item name="publicationStatus" label="Trạng thái">
          <Select
            options={[
              { label: 'Đã xuất bản', value: 'PUBLISHED' },
              { label: 'Đã chấp nhận', value: 'ACCEPTED' },
              { label: 'Đang review', value: 'UNDER_REVIEW' },
            ]}
            placeholder="Chọn trạng thái"
          />
        </Form.Item>
      </Col>

      {(selectedLeafRuleKind === 'HDGSNN_POINTS_TO_HOURS' ||
        selectedLeafSchema.batBuocForm.includes('hdgsnnScore')) && (
        <Col span={12}>
          <Form.Item
            name="hdgsnnScore"
            label="Điểm HĐGSNN (quy đổi giờ)"
            rules={[{ required: true, message: 'Vui lòng nhập điểm HĐGSNN' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              max={10}
              step={0.25}
              placeholder="VD: 0.75"
            />
          </Form.Item>
        </Col>
      )}

      <Col span={24}>
        <Button
          type="link"
          style={{ paddingLeft: 0 }}
          onClick={() => onShowAdvancedPubFieldsChange(!showAdvancedPubFields)}
        >
          {showAdvancedPubFields
            ? 'Ẩn thông tin bài báo mở rộng'
            : 'Hiện thông tin bài báo mở rộng'}
        </Button>
      </Col>

      {selectedLeafSchema.batBuocForm.includes('isbn') && (
        <Col span={12}>
          <Form.Item
            name="isbn"
            label="ISBN"
            rules={[{ required: true, message: 'Vui lòng nhập ISBN cho loại kết quả này' }]}
          >
            <Input placeholder="VD: 978-..." />
          </Form.Item>
        </Col>
      )}

      {showAdvancedPubFields && (
        <>
          <Col span={8}>
            <Form.Item name="volume" label="Volume">
              <Input placeholder="VD: 15" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="issue" label="Issue">
              <Input placeholder="VD: 3" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item name="pages" label="Trang">
              <Input placeholder="VD: 123-145" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="doi" label="DOI">
              <Input placeholder="VD: 10.1234/example" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item name="issn" label="ISSN">
              <Input placeholder="VD: 1234-5678" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item name="url" label="Link (URL)">
              <Input placeholder="https://..." />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              name="attachmentUrls"
              label="File đính kèm bài báo"
              extra="PDF, Word, hình ảnh — có thể tải nhiều file liên quan (bản PDF bài báo, minh chứng, …)"
            >
              <PublicationAttachmentUpload />
            </Form.Item>
          </Col>
        </>
      )}
    </Row>

    <Divider>Danh sách tác giả chi tiết (để tính quy đổi giờ)</Divider>

    {isAdminKeKhai && (
      <Alert
        type="info"
        showIcon
        message="Tài khoản quản trị không được thêm vào danh sách tác giả"
        description="Vui lòng chọn NCV hoặc sinh viên thật qua lookup, hoặc nhập tay tác giả ngoài hệ thống."
        style={{ marginBottom: 16 }}
      />
    )}

    <AuthorsEditor
      value={authors}
      onChange={onAuthorsChange}
      ownerProfileId={isAdminKeKhai ? undefined : ownerProfileId}
    />
  </Form>
);

export default PublicationFormFields;
