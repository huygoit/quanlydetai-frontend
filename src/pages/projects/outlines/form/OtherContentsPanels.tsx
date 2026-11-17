/**
 * Tab Nội dung khác — các panel mô tả (rich text).
 */
import RichTextHtmlField from '@/components/RichTextHtmlField';
import type { OutlineOtherContents } from '@/services/api/projectOutlines';
import {
  AuditOutlined,
  DeploymentUnitOutlined,
  FundProjectionScreenOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Card, Collapse, Form, Space, Typography } from 'antd';

type Props = {
  value: OutlineOtherContents;
  onChange: (next: OutlineOtherContents) => void;
  editable: boolean;
};

function OtherContentsPanels({ value, onChange, editable }: Props) {
  const setField = (key: keyof OutlineOtherContents, html: string) => {
    onChange({ ...value, [key]: html });
  };

  return (
    <Collapse
      defaultActiveKey={['app', 'impact', 'risk', 'ethics']}
      bordered={false}
      style={{ background: 'transparent' }}
      items={[
        {
          key: 'app',
          label: (
            <Space>
              <DeploymentUnitOutlined style={{ color: '#1677ff' }} />
              <Typography.Text strong>
                Khả năng ứng dụng và phương thức chuyển giao kết quả nghiên cứu
              </Typography.Text>
            </Space>
          ),
          style: {
            marginBottom: 12,
            borderRadius: 10,
            border: '1px solid #91caff',
            background: 'linear-gradient(180deg, #e6f4ff 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <Form.Item
              style={{ marginBottom: 0 }}
              extra={
                <Typography.Text type="secondary">
                  Phương thức, địa chỉ ứng dụng, chuyển giao kết quả nhiệm vụ;
                  khả năng thị trường; phương án thương mại hóa; phần chia lợi
                  nhuận từ thương mại hóa kết quả nhiệm vụ (nếu có).
                </Typography.Text>
              }
            >
              <RichTextHtmlField
                disabled={!editable}
                minHeight={160}
                value={value.applicationTransferHtml || ''}
                onChange={(html) => setField('applicationTransferHtml', html)}
                placeholder="Mô tả khả năng ứng dụng, chuyển giao, thị trường và thương mại hóa…"
              />
            </Form.Item>
          ),
        },
        {
          key: 'impact',
          label: (
            <Space>
              <FundProjectionScreenOutlined style={{ color: '#52c41a' }} />
              <Typography.Text strong>
                Dự kiến hiệu quả và tác động của kết quả thực hiện nhiệm vụ
              </Typography.Text>
            </Space>
          ),
          style: {
            marginBottom: 12,
            borderRadius: 10,
            border: '1px solid #b7eb8f',
            background: 'linear-gradient(180deg, #f6ffed 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Đánh giá về dự kiến hiệu quả đầu ra của nhiệm vụ
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={140}
                  value={value.outputEffectivenessHtml || ''}
                  onChange={(html) =>
                    setField('outputEffectivenessHtml', html)
                  }
                  placeholder="Đánh giá hiệu quả đầu ra dự kiến…"
                />
              </Card>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Đánh giá về dự kiến tác động của kết quả thực hiện nhiệm vụ
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={140}
                  value={value.impactAssessmentHtml || ''}
                  onChange={(html) => setField('impactAssessmentHtml', html)}
                  placeholder="Đánh giá tác động dự kiến của kết quả…"
                />
              </Card>
            </Space>
          ),
        },
        {
          key: 'risk',
          label: (
            <Space>
              <SafetyCertificateOutlined style={{ color: '#fa8c16' }} />
              <Typography.Text strong>
                Quản lý rủi ro và biện pháp kiểm soát
              </Typography.Text>
            </Space>
          ),
          style: {
            marginBottom: 12,
            borderRadius: 10,
            border: '1px solid #ffd591',
            background: 'linear-gradient(180deg, #fff7e6 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <Form.Item
              style={{ marginBottom: 0 }}
              extra={
                <Typography.Text type="secondary">
                  Xác định, phân tích, đánh giá mức độ tác động, biện pháp phòng
                  ngừa, giám sát, ứng phó và phương án báo cáo đối với các loại
                  rủi ro có thể xảy ra; phân biệt rủi ro nghiên cứu với vi phạm
                  chủ quan.
                </Typography.Text>
              }
            >
              <RichTextHtmlField
                disabled={!editable}
                minHeight={160}
                value={value.riskManagementHtml || ''}
                onChange={(html) => setField('riskManagementHtml', html)}
                placeholder="Mô tả rủi ro, mức độ tác động và biện pháp kiểm soát…"
              />
            </Form.Item>
          ),
        },
        {
          key: 'ethics',
          label: (
            <Space>
              <AuditOutlined style={{ color: '#722ed1' }} />
              <Typography.Text strong>
                Yêu cầu về đạo đức, dữ liệu, sở hữu trí tuệ, an toàn, bảo mật và
                AI
              </Typography.Text>
            </Space>
          ),
          style: {
            marginBottom: 4,
            borderRadius: 10,
            border: '1px solid #d3adf7',
            background: 'linear-gradient(180deg, #f9f0ff 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Đối tượng/dữ liệu đặc thù và thủ tục phê duyệt/chấp thuận
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 8 }}
                >
                  Nếu nhiệm vụ liên quan dữ liệu/đối tượng đặc thù, nêu thủ tục
                  phê duyệt hoặc chấp thuận cần thực hiện (nếu có).
                </Typography.Paragraph>
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={120}
                  value={value.ethicsDataApprovalHtml || ''}
                  onChange={(html) =>
                    setField('ethicsDataApprovalHtml', html)
                  }
                  placeholder="Đối tượng/dữ liệu đặc thù và thủ tục phê duyệt…"
                />
              </Card>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Kế hoạch quản lý dữ liệu
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 8 }}
                >
                  Nguồn dữ liệu, căn cứ thu thập/xử lý, phân quyền truy cập, lưu
                  trữ, chia sẻ, bàn giao và tiêu hủy.
                </Typography.Paragraph>
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={120}
                  value={value.dataManagementPlanHtml || ''}
                  onChange={(html) =>
                    setField('dataManagementPlanHtml', html)
                  }
                  placeholder="Kế hoạch quản lý dữ liệu…"
                />
              </Card>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Kết quả có khả năng bảo hộ SHTT và quyền bên thứ ba
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 8 }}
                >
                  Kết quả có khả năng bảo hộ SHTT, quyền của bên thứ ba và phương
                  án xác lập/khai thác quyền.
                </Typography.Paragraph>
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={120}
                  value={value.ipProtectionHtml || ''}
                  onChange={(html) => setField('ipProtectionHtml', html)}
                  placeholder="SHTT, quyền bên thứ ba và phương án khai thác…"
                />
              </Card>
              <Card
                size="small"
                title={
                  <Typography.Text strong>
                    Việc sử dụng AI (nếu có)
                  </Typography.Text>
                }
                headStyle={{ minHeight: 40 }}
              >
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginBottom: 8 }}
                >
                  Mục đích, công đoạn sử dụng, dữ liệu đưa vào hệ thống AI, biện
                  pháp kiểm tra/giám sát của con người và trách nhiệm đối với đầu
                  ra.
                </Typography.Paragraph>
                <RichTextHtmlField
                  disabled={!editable}
                  minHeight={120}
                  value={value.aiUsageHtml || ''}
                  onChange={(html) => setField('aiUsageHtml', html)}
                  placeholder="Mô tả việc sử dụng AI (để trống nếu không áp dụng)…"
                />
              </Card>
            </Space>
          ),
        },
      ]}
    />
  );
}

export default OtherContentsPanels;
