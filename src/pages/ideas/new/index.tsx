/**
 * Tạo ý tưởng mới
 * Trang full form để đề xuất ý tưởng nghiên cứu
 */
import { useEffect, useState } from 'react';
import { PageContainer, ProForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormCheckbox } from '@ant-design/pro-components';
import { Card, Button, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  createIdea,
  type IdeaCreateData,
} from '@/services/api/ideas';
import {
  loadFieldSelectOptions,
  loadIdeaLevelOptions,
  type SelectOption,
} from '@/utils/researchCatalogOptions';

const NewIdeaPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<SelectOption[]>([]);
  const [levelOptions, setLevelOptions] = useState<SelectOption[]>([]);

  // Tải lĩnh vực + cấp từ danh mục
  useEffect(() => {
    void (async () => {
      const [fields, levels] = await Promise.all([
        loadFieldSelectOptions(),
        loadIdeaLevelOptions(),
      ]);
      setFieldOptions(fields);
      setLevelOptions(levels.options);
    })();
  }, []);

  const handleSubmit = async (values: IdeaCreateData) => {
    setLoading(true);
    try {
      const result = await createIdea(values);
      if (result.success) {
        message.success('Đã tạo ý tưởng thành công');
        history.push('/ideas/my');
      } else {
        message.error('Không thể tạo ý tưởng');
      }
    } catch (error) {
      message.error('Không thể tạo ý tưởng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer
      title="Tạo ý tưởng mới"
      subTitle="Đề xuất ý tưởng nghiên cứu khoa học"
      onBack={() => history.back()}
      extra={[
        <Button key="back" icon={<ArrowLeftOutlined />} onClick={() => history.push('/ideas/my')}>
          Về ý tưởng của tôi
        </Button>,
      ]}
    >
      <Card>
        <ProForm
          layout="vertical"
          onFinish={handleSubmit}
          submitter={{
            render: () => (
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                Lưu nháp
              </Button>
            ),
          }}
          style={{ maxWidth: 640 }}
        >
          <ProFormText
            name="title"
            label="Tiêu đề"
            placeholder="Nhập tiêu đề ý tưởng"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
          />
          <ProFormSelect
            name="field"
            label="Lĩnh vực"
            placeholder="Chọn lĩnh vực"
            options={fieldOptions}
            rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
            fieldProps={{ showSearch: true, optionFilterProp: 'label' }}
          />
          <ProFormCheckbox.Group
            name="suitableLevels"
            label="Cấp ý tưởng/đề tài"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cấp ý tưởng/đề tài' }]}
            options={levelOptions}
          />
          <ProFormTextArea
            name="summary"
            label="Tóm tắt"
            placeholder="Mô tả ngắn gọn về ý tưởng nghiên cứu"
            rules={[{ required: true, message: 'Vui lòng nhập tóm tắt' }]}
            fieldProps={{ rows: 6 }}
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default NewIdeaPage;
