/**
 * RuleForm - Form for editing Rule of Research Output Type
 */
import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Alert, Divider, Card, Row, Col } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { EditableProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import type {
  RuleDTO,
  UpsertRulePayload,
  RuleKind,
  RangeItem,
} from '@/types/researchOutputs';
import { RULE_KIND_OPTIONS } from '@/types/researchOutputs';

const { TextArea } = Input;

interface RuleFormProps {
  rule: RuleDTO | null;
  loading: boolean;
  onSave: (payload: UpsertRulePayload) => void;
  onCreate: () => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ rule, loading, onSave, onCreate }) => {
  const [form] = Form.useForm();
  const [ruleKind, setRuleKind] = useState<RuleKind | undefined>(rule?.ruleKind);
  const [ranges, setRanges] = useState<RangeItem[]>(rule?.meta?.ranges || []);
  const [editableKeys, setEditableKeys] = useState<React.Key[]>([]);

  useEffect(() => {
    if (rule) {
      setRuleKind(rule.ruleKind);
      setRanges(rule.meta?.ranges || []);
      form.setFieldsValue({
        ruleKind: rule.ruleKind,
        pointsValue: rule.pointsValue,
        hoursValue: rule.hoursValue,
        hoursBonus: rule.hoursBonus,
        evidenceRequirements: rule.evidenceRequirements,
        c_excellent: rule.meta?.c_map?.EXCELLENT,
        c_pass_on_time: rule.meta?.c_map?.PASS_ON_TIME,
        c_pass_late: rule.meta?.c_map?.PASS_LATE,
      });
    } else {
      form.resetFields();
      setRuleKind(undefined);
      setRanges([]);
    }
  }, [rule, form]);

  const handleFinish = (values: any) => {
    const payload: UpsertRulePayload = {
      ruleKind: values.ruleKind,
      evidenceRequirements: values.evidenceRequirements,
    };

    switch (values.ruleKind as RuleKind) {
      case 'FIXED':
        payload.pointsValue = values.pointsValue;
        payload.hoursValue = values.hoursValue;
        break;

      case 'MULTIPLY_A':
        payload.hoursValue = values.hoursValue;
        payload.pointsValue = values.pointsValue;
        payload.hoursMultiplierVar = 'a';
        break;

      case 'HDGSNN_POINTS_TO_HOURS':
        payload.hoursValue = 600;
        payload.meta = { hours_per_point: 600 };
        break;

      case 'MULTIPLY_C':
        payload.pointsValue = values.pointsValue;
        payload.hoursValue = values.hoursValue;
        payload.hoursMultiplierVar = 'c';
        payload.meta = {
          c_map: {
            EXCELLENT: values.c_excellent,
            PASS_ON_TIME: values.c_pass_on_time,
            PASS_LATE: values.c_pass_late,
          },
        };
        break;

      case 'RANGE_REVENUE':
        payload.meta = { ranges };
        break;

      case 'BONUS_ADD':
        payload.pointsValue = values.pointsValue;
        payload.hoursValue = values.hoursValue;
        payload.hoursBonus = values.hoursBonus;
        break;
    }

    onSave(payload);
  };

  const rangeColumns: ProColumns<RangeItem & { id: string }>[] = [
    {
      title: 'Min',
      dataIndex: 'min',
      valueType: 'digit',
      width: 100,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Max',
      dataIndex: 'max',
      valueType: 'digit',
      width: 100,
      renderFormItem: () => <InputNumber placeholder="null = ∞" style={{ width: '100%' }} />,
    },
    {
      title: 'Điểm',
      dataIndex: 'points',
      valueType: 'digit',
      width: 100,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Giờ',
      dataIndex: 'hours',
      valueType: 'digit',
      width: 100,
      formItemProps: { rules: [{ required: true, message: 'Bắt buộc' }] },
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 80,
    },
  ];

  const renderRuleFields = () => {
    switch (ruleKind) {
      case 'FIXED':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pointsValue"
                  label="Điểm"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hoursValue"
                  label="Giờ quy đổi"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        );

      case 'MULTIPLY_A':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="hoursValue"
                  label="Giờ cơ sở"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="pointsValue" label="Điểm (tuỳ chọn)">
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Alert
              message="Công thức: Giờ = Giờ cơ sở × a (hệ số tác giả)"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </>
        );

      case 'HDGSNN_POINTS_TO_HOURS':
        return (
          <Alert
            message="HĐGSNN: 1 điểm = 600 giờ"
            description="Giờ quy đổi sẽ được tính tự động dựa trên điểm HĐGSNN."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        );

      case 'MULTIPLY_C':
        return (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="pointsValue"
                  label="Điểm"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="hoursValue"
                  label="Giờ cơ sở"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Divider orientation="left">Hệ số C theo kết quả nghiệm thu</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="c_excellent"
                  label="Xuất sắc"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="c_pass_on_time"
                  label="Đạt đúng hạn"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="c_pass_late"
                  label="Đạt chậm"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        );

      case 'RANGE_REVENUE':
        return (
          <>
            <Alert
              message="Định nghĩa các dải doanh thu và điểm/giờ tương ứng"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <EditableProTable<RangeItem & { id: string }>
              rowKey="id"
              value={ranges.map((r, i) => ({ ...r, id: `range-${i}` }))}
              onChange={(newData) => {
                setRanges(newData.map(({ id, ...rest }) => rest as RangeItem));
              }}
              columns={rangeColumns}
              recordCreatorProps={{
                newRecordType: 'dataSource',
                record: () => ({
                  id: `range-${Date.now()}`,
                  min: 0,
                  max: null,
                  points: 0,
                  hours: 0,
                }),
              }}
              editable={{
                type: 'multiple',
                editableKeys,
                onChange: setEditableKeys,
                actionRender: (row, config, defaultDom) => [
                  defaultDom.save,
                  defaultDom.delete,
                ],
              }}
            />
          </>
        );

      case 'BONUS_ADD':
        return (
          <>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="pointsValue"
                  label="Điểm"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="hoursValue"
                  label="Giờ cơ sở"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="hoursBonus"
                  label="Giờ thưởng"
                  rules={[{ required: true, message: 'Bắt buộc' }]}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Alert
              message="Công thức: Giờ = Giờ cơ sở + Giờ thưởng"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
          </>
        );

      default:
        return null;
    }
  };

  if (!rule) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Alert
          message="Chưa có rule quy đổi"
          description="Loại kết quả này chưa được cấu hình rule quy đổi điểm/giờ."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          Tạo rule
        </Button>
      </div>
    );
  }

  return (
    <Form form={form} layout="vertical" onFinish={handleFinish}>
      <Form.Item
        name="ruleKind"
        label="Loại rule"
        rules={[{ required: true, message: 'Vui lòng chọn loại rule' }]}
      >
        <Select
          options={RULE_KIND_OPTIONS}
          onChange={(value) => setRuleKind(value as RuleKind)}
          placeholder="Chọn loại rule"
        />
      </Form.Item>

      {renderRuleFields()}

      <Divider />

      <Form.Item name="evidenceRequirements" label="Yêu cầu minh chứng">
        <TextArea
          rows={3}
          placeholder="Mô tả các minh chứng cần nộp kèm..."
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
          Lưu rule
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RuleForm;
