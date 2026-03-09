/**
 * Tạo ý tưởng mới
 * Trang full form để đề xuất ý tưởng nghiên cứu
 */
import { useState } from 'react';
import { PageContainer, ProForm, ProFormText, ProFormSelect, ProFormTextArea, ProFormCheckbox } from '@ant-design/pro-components';
import { Card, Button, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { history } from '@umijs/max';
import {
  createIdea,
  IDEA_FIELDS,
  PROJECT_LEVEL_MAP,
  type IdeaCreateData,
  type ProjectLevel,
} from '@/services/api/ideas';

const PROJECT_LEVELS: ProjectLevel[] = Object.keys(PROJECT_LEVEL_MAP) as ProjectLevel[];

const NewIdeaPage: React.FC = () => {
  const [loading, setLoading] = useState(false);

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
            render: (_, dom) => (
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
            options={IDEA_FIELDS.map((f) => ({ label: f, value: f }))}
            rules={[{ required: true, message: 'Vui lòng chọn lĩnh vực' }]}
          />
          <ProFormCheckbox.Group
            name="suitableLevels"
            label="Cấp đề tài phù hợp"
            rules={[{ required: true, message: 'Vui lòng chọn ít nhất một cấp đề tài' }]}
            options={PROJECT_LEVELS.map((level) => ({
              label: PROJECT_LEVEL_MAP[level].text,
              value: level,
            }))}
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
