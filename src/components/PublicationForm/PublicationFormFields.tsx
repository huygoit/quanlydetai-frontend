/**
 * Form kê khai KQNC — hồ sơ cá nhân (/profile/me)
 */
import React from 'react';
import { Alert, Button, Cascader, Col, DatePicker, Divider, Form, Input, InputNumber, Row, Select, Tooltip } from 'antd';
import type { FormInstance } from 'antd/es/form';
import AuthorsEditor from '@/components/AuthorsEditor';
import {
  buildResearchOutputCascaderOptions,
  type PublicationAuthor,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import {
  laySchemaTheoMaLa,
  layNodeTheoPath,
  XEP_LOAI_NGHIEM_THU_OPTIONS,
  type FormFieldKey,
  type LeafFormSchema,
} from '@/services/researchOutputFormSchema';
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
}) => {
  // Rule "Nhân hệ số c" (đề tài) cần khai xếp loại nghiệm thu.
  const coXepLoaiNghiemThu = selectedLeafRuleKind === 'MULTIPLY_C';
  const show = (k: FormFieldKey) => selectedLeafSchema.hienThiForm.includes(k);
  const req = (k: FormFieldKey) => selectedLeafSchema.batBuocForm.includes(k);
  const coMetaMoRong =
    show('volume') || show('issue') || show('pages') || show('issn') || show('url');
  // QĐ 1883: yêu cầu minh chứng theo mục lá đang chọn (suy từ cây theo path đã chọn).
  const selectedPath = Form.useWatch<number[] | undefined>('researchOutputTypePath', form);
  const leafEvidence = React.useMemo(
    () => layNodeTheoPath(researchOutputTree, selectedPath)?.evidenceRequirements ?? null,
    [researchOutputTree, selectedPath]
  );
  const nhan = (text: string, batBuoc: boolean) =>
    batBuoc ? (
      <span>
        {text}{' '}
        <Tooltip title="Bắt buộc khi duyệt">
          <span style={{ color: '#ff4d4f' }}>*</span>
        </Tooltip>
      </span>
    ) : (
      text
    );

  return (
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
                const canXoa: Array<[FormFieldKey, string]> = [
                  ['journalName', 'journalOrConference'],
                  ['isbn', 'isbn'],
                  ['hdgsnnScore', 'hdgsnnScore'],
                  ['doi', 'doi'],
                  ['qRankUrl', 'qRankUrl'],
                  ['reputableListUrl', 'reputableListUrl'],
                  ['volume', 'volume'],
                  ['issue', 'issue'],
                  ['pages', 'pages'],
                  ['issn', 'issn'],
                  ['url', 'url'],
                ];
                for (const [key, field] of canXoa) {
                  if (!nextSchema.hienThiForm.includes(key)) form.setFieldValue(field, undefined);
                }
                if (nextRuleKind !== 'MULTIPLY_C') form.setFieldValue('acceptanceGrade', undefined);
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

        {show('journalName') && (
          <Col span={24}>
            <Form.Item name="journalOrConference" label={nhan('Tên tạp chí / hội thảo', req('journalName'))}>
              <Input placeholder="Tên tạp chí hoặc tên hội thảo/kỷ yếu" />
            </Form.Item>
          </Col>
        )}

        {show('publishedAt') && (
          <Col span={12}>
            <Form.Item name="publishedAt" label={nhan('Ngày xuất bản', req('publishedAt'))}>
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder="Chọn ngày xuất bản"
              />
            </Form.Item>
          </Col>
        )}

        {/* Trạng thái xuất bản: ẩn khỏi form, vẫn giữ giá trị (mặc định PUBLISHED) */}
        <Form.Item name="publicationStatus" hidden>
          <Input />
        </Form.Item>

        {coXepLoaiNghiemThu && (
          <Col span={12}>
            <Form.Item
              name="acceptanceGrade"
              label={nhan('Xếp loại nghiệm thu', true)}
              rules={[{ required: true, message: 'Vui lòng chọn xếp loại nghiệm thu đề tài' }]}
            >
              <Select placeholder="Chọn xếp loại nghiệm thu" options={XEP_LOAI_NGHIEM_THU_OPTIONS} />
            </Form.Item>
          </Col>
        )}

        {show('hdgsnnScore') && (
          <Col span={12}>
            <Form.Item name="hdgsnnScore" label={nhan('Điểm HĐGSNN (quy đổi giờ)', req('hdgsnnScore'))}>
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

        {show('isbn') && (
          <Col span={12}>
            <Form.Item name="isbn" label={nhan('ISBN', req('isbn'))}>
              <Input placeholder="VD: 978-..." />
            </Form.Item>
          </Col>
        )}

        {show('doi') && (
          <Col span={12}>
            <Form.Item name="doi" label={nhan('Link DOI', req('doi'))}>
              <Input placeholder="VD: https://doi.org/10.xxxx/..." />
            </Form.Item>
          </Col>
        )}

        {show('qRankUrl') && (
          <Col span={12}>
            <Form.Item name="qRankUrl" label={nhan('Link mức xếp hạng Q', req('qRankUrl'))}>
              <Input placeholder="Link Scimago / WoS minh chứng Q" />
            </Form.Item>
          </Col>
        )}

        {show('reputableListUrl') && (
          <Col span={24}>
            <Form.Item name="reputableListUrl" label={nhan('Link danh mục tạp chí uy tín', req('reputableListUrl'))}>
              <Input placeholder="Link danh mục HĐGSNN / WoS / Scopus" />
            </Form.Item>
          </Col>
        )}

        {leafEvidence && (
          <Col span={24}>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 8 }}
              message="Minh chứng cần nộp (theo QĐ 1883)"
              description={<div style={{ whiteSpace: 'pre-line' }}>{leafEvidence}</div>}
            />
          </Col>
        )}

        {show('attachment') && (
          <Col span={24}>
            <Form.Item
              name="attachmentUrls"
              label={nhan('File minh chứng', req('attachment'))}
              extra="PDF, Word, hình ảnh — toàn văn và các minh chứng liên quan."
            >
              <PublicationAttachmentUpload />
            </Form.Item>
          </Col>
        )}

        {coMetaMoRong && (
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
        )}

        {coMetaMoRong && showAdvancedPubFields && (
          <>
            {show('volume') && (
              <Col span={8}>
                <Form.Item name="volume" label="Volume">
                  <Input placeholder="VD: 15" />
                </Form.Item>
              </Col>
            )}

            {show('issue') && (
              <Col span={8}>
                <Form.Item name="issue" label="Issue">
                  <Input placeholder="VD: 3" />
                </Form.Item>
              </Col>
            )}

            {show('pages') && (
              <Col span={8}>
                <Form.Item name="pages" label="Trang">
                  <Input placeholder="VD: 123-145" />
                </Form.Item>
              </Col>
            )}

            {show('issn') && (
              <Col span={12}>
                <Form.Item name="issn" label="ISSN">
                  <Input placeholder="VD: 1234-5678" />
                </Form.Item>
              </Col>
            )}

            {show('url') && (
              <Col span={24}>
                <Form.Item name="url" label="Link (URL)">
                  <Input placeholder="https://..." />
                </Form.Item>
              </Col>
            )}
          </>
        )}
      </Row>

      <Divider>Danh sách tác giả chi tiết (để tính quy đổi giờ)</Divider>

      {req('contributionRate') && (
        <Alert
          type="info"
          showIcon
          message="Loại này cần nhập Tỉ lệ % đóng góp cho từng tác giả"
          description="Theo QĐ 1883 điều 1.4: giờ quy đổi chia theo tỉ lệ % đóng góp (tổng nên bằng 100%)."
          style={{ marginBottom: 16 }}
        />
      )}

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
        showContribution={show('contributionRate')}
      />
    </Form>
  );
};

export default PublicationFormFields;
