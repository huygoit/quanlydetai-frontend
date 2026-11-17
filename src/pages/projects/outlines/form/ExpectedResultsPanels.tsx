/**
 * Tab Kết quả dự kiến — 5 panel collapse + EditableProTable.
 */
import {
  ExperimentOutlined,
  FileProtectOutlined,
  ReadOutlined,
  RocketOutlined,
  SolutionOutlined,
} from '@ant-design/icons';
import {
  EditableProTable,
  type ProColumns,
} from '@ant-design/pro-components';
import { Button, Collapse, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type {
  OutlineExpectedAppliedProduct,
  OutlineExpectedIpProduct,
  OutlineExpectedPublication,
  OutlineExpectedResults,
  OutlineExpectedTangibleProduct,
  OutlineExpectedTraining,
} from '@/services/api/projectOutlines';

type Props = {
  value: OutlineExpectedResults;
  onChange: (next: OutlineExpectedResults) => void;
  editable: boolean;
};

const CATEGORY_OPTIONS = [
  { label: 'Trong nước', value: 'DOMESTIC' },
  { label: 'Quốc tế', value: 'INTERNATIONAL' },
];

function demDong(n: number) {
  return n > 0 ? <Tag>{n}</Tag> : null;
}

function ExpectedResultsPanels({ value, onChange, editable }: Props) {
  const [keysPub, setKeysPub] = useState<React.Key[]>([]);
  const [keysApp, setKeysApp] = useState<React.Key[]>([]);
  const [keysTan, setKeysTan] = useState<React.Key[]>([]);
  const [keysIp, setKeysIp] = useState<React.Key[]>([]);
  const [keysTrn, setTrnKeys] = useState<React.Key[]>([]);

  // Mở sẵn chế độ sửa khi danh sách id đổi (thêm/xóa dòng)
  const pubIds = value.publications.map((r) => r.id).join(',');
  const appIds = value.appliedProducts.map((r) => r.id).join(',');
  const tanIds = value.tangibleProducts.map((r) => r.id).join(',');
  const ipIds = value.ipProducts.map((r) => r.id).join(',');
  const trnIds = value.postgraduateTraining.map((r) => r.id).join(',');
  useEffect(() => {
    setKeysPub(value.publications.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pubIds]);
  useEffect(() => {
    setKeysApp(value.appliedProducts.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appIds]);
  useEffect(() => {
    setKeysTan(value.tangibleProducts.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanIds]);
  useEffect(() => {
    setKeysIp(value.ipProducts.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipIds]);
  useEffect(() => {
    setTrnKeys(value.postgraduateTraining.map((r) => r.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trnIds]);

  const patch = <K extends keyof OutlineExpectedResults>(
    key: K,
    rows: OutlineExpectedResults[K],
  ) => {
    onChange({ ...value, [key]: rows });
  };

  const cotPub: ProColumns<OutlineExpectedPublication>[] = useMemo(
    () => [
      {
        title: 'STT',
        width: 56,
        editable: false,
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Phạm vi',
        dataIndex: 'category',
        width: 130,
        valueType: 'select',
        fieldProps: { options: CATEGORY_OPTIONS },
      },
      {
        title: 'Bài báo; sách chuyên khảo và sản phẩm khác',
        dataIndex: 'content',
        fieldProps: { placeholder: 'Tên / loại công bố' },
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        width: 100,
        fieldProps: { placeholder: 'VD: 02' },
      },
      {
        title: 'Yêu cầu khoa học cần đạt',
        dataIndex: 'scienceRequirement',
        fieldProps: { placeholder: 'Chỉ tiêu khoa học' },
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        width: 140,
      },
      {
        title: '',
        valueType: 'option',
        width: 70,
        render: () => null,
      },
    ],
    [],
  );

  const cotApp: ProColumns<OutlineExpectedAppliedProduct>[] = useMemo(
    () => [
      {
        title: 'STT',
        width: 56,
        editable: false,
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Tên sản phẩm',
        dataIndex: 'name',
        fieldProps: { placeholder: 'Tên sản phẩm' },
      },
      {
        title: 'Yêu cầu khoa học cần đạt',
        dataIndex: 'scienceRequirement',
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        width: 160,
      },
      {
        title: '',
        valueType: 'option',
        width: 70,
        render: () => null,
      },
    ],
    [],
  );

  const cotTan: ProColumns<OutlineExpectedTangibleProduct>[] = useMemo(
    () => [
      {
        title: 'STT',
        width: 56,
        editable: false,
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Tên sản phẩm & chỉ tiêu chất lượng chủ yếu',
        dataIndex: 'name',
        width: 220,
        fieldProps: {
          placeholder: 'Tên sản phẩm cụ thể và chỉ tiêu chất lượng',
        },
      },
      {
        title: 'Đơn vị đo',
        dataIndex: 'unit',
        width: 100,
      },
      {
        title: 'Mức CL cần đạt',
        dataIndex: 'qualityRequired',
        width: 130,
        fieldProps: { placeholder: 'Cần đạt' },
      },
      {
        title: 'Mẫu tương tự (trong nước)',
        dataIndex: 'qualitySampleDomestic',
        width: 150,
        fieldProps: { placeholder: 'Theo TC mới nhất' },
      },
      {
        title: 'Mẫu tương tự (thế giới)',
        dataIndex: 'qualitySampleWorld',
        width: 150,
        fieldProps: { placeholder: 'Theo TC mới nhất' },
      },
      {
        title: 'Số lượng / quy mô',
        dataIndex: 'quantityScale',
        width: 130,
      },
      {
        title: '',
        valueType: 'option',
        width: 70,
        render: () => null,
      },
    ],
    [],
  );

  const cotIp: ProColumns<OutlineExpectedIpProduct>[] = useMemo(
    () => [
      {
        title: 'STT',
        width: 56,
        editable: false,
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Tên sản phẩm',
        dataIndex: 'name',
      },
      {
        title: 'Yêu cầu khoa học cần đạt',
        dataIndex: 'scienceRequirement',
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        width: 160,
      },
      {
        title: '',
        valueType: 'option',
        width: 70,
        render: () => null,
      },
    ],
    [],
  );

  const cotTrn: ProColumns<OutlineExpectedTraining>[] = useMemo(
    () => [
      {
        title: 'STT',
        width: 56,
        editable: false,
        render: (_, __, i) => i + 1,
      },
      {
        title: 'Cấp đào tạo',
        dataIndex: 'level',
        width: 160,
        fieldProps: { placeholder: 'Thạc sĩ / Tiến sĩ / …' },
      },
      {
        title: 'Số lượng',
        dataIndex: 'quantity',
        width: 100,
      },
      {
        title: 'Chuyên ngành đào tạo',
        dataIndex: 'major',
      },
      {
        title: 'Ghi chú',
        dataIndex: 'note',
        width: 160,
      },
      {
        title: '',
        valueType: 'option',
        width: 70,
        render: () => null,
      },
    ],
    [],
  );

  const bangXoa = <T extends { id: string }>(
    row: T,
    list: T[],
    setList: (rows: T[]) => void,
    setKeys: React.Dispatch<React.SetStateAction<React.Key[]>>,
  ) => (
    <Button
      type="link"
      danger
      size="small"
      disabled={!editable}
      onClick={() => {
        setList(list.filter((d) => d.id !== row.id));
        setKeys((ks) => ks.filter((k) => k !== row.id));
      }}
    >
      Xóa
    </Button>
  );

  return (
    <Collapse
      defaultActiveKey={['pub', 'app', 'tan', 'ip', 'trn']}
      bordered={false}
      style={{ background: 'transparent' }}
      items={[
        {
          key: 'pub',
          label: (
            <Space>
              <ReadOutlined style={{ color: '#1677ff' }} />
              <Typography.Text strong>Công bố khoa học</Typography.Text>
              {demDong(value.publications.filter((r) => r.content?.trim()).length)}
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
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Bài báo; sách chuyên khảo và các sản phẩm công bố khác. Phân loại
                theo phạm vi Trong nước / Quốc tế; nêu số lượng và yêu cầu khoa học
                cần đạt.
              </Typography.Paragraph>
              <EditableProTable<OutlineExpectedPublication>
                rowKey="id"
                size="middle"
                value={value.publications}
                onChange={(list) =>
                  patch('publications', [...(list || [])] as OutlineExpectedPublication[])
                }
                recordCreatorProps={
                  editable
                    ? {
                        newRecordType: 'dataSource',
                        record: () => ({
                          id: `pub-${Date.now()}`,
                          category: 'DOMESTIC',
                          content: '',
                          quantity: '',
                          scienceRequirement: '',
                          note: '',
                        }),
                        creatorButtonText: 'Thêm công bố',
                      }
                    : false
                }
                columns={cotPub}
                editable={
                  editable
                    ? {
                        type: 'multiple',
                        editableKeys: keysPub,
                        onChange: setKeysPub,
                        onValuesChange: (_r, list) =>
                          patch('publications', [...(list || [])]),
                        actionRender: (row) => [
                          bangXoa(
                            row,
                            value.publications,
                            (rows) => patch('publications', rows),
                            setKeysPub,
                          ),
                        ],
                      }
                    : undefined
                }
                pagination={false}
                scroll={{ x: 960 }}
              />
            </>
          ),
        },
        {
          key: 'app',
          label: (
            <Space>
              <SolutionOutlined style={{ color: '#13c2c2' }} />
              <Typography.Text strong>
                Nguyên lý, phương pháp, tiêu chuẩn, phần mềm & sản phẩm khác
              </Typography.Text>
              {demDong(value.appliedProducts.filter((r) => r.name?.trim()).length)}
            </Space>
          ),
          style: {
            marginBottom: 12,
            borderRadius: 10,
            border: '1px solid #87e8de',
            background: 'linear-gradient(180deg, #e6fffb 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Gồm: nguyên lý ứng dụng; phương pháp; tiêu chuẩn; quy phạm; phần mềm
                máy tính; bản vẽ thiết kế; quy trình công nghệ; sơ đồ, bản đồ; số liệu,
                CSDL; báo cáo phân tích; tài liệu dự báo; quy hoạch; luận chứng kinh
                tế–kỹ thuật; báo cáo NCKT / tư vấn chính sách và sản phẩm khác.
              </Typography.Paragraph>
              <EditableProTable<OutlineExpectedAppliedProduct>
                rowKey="id"
                size="middle"
                value={value.appliedProducts}
                onChange={(list) =>
                  patch('appliedProducts', [...(list || [])] as OutlineExpectedAppliedProduct[])
                }
                recordCreatorProps={
                  editable
                    ? {
                        newRecordType: 'dataSource',
                        record: () => ({
                          id: `app-${Date.now()}`,
                          name: '',
                          scienceRequirement: '',
                          note: '',
                        }),
                        creatorButtonText: 'Thêm sản phẩm',
                      }
                    : false
                }
                columns={cotApp}
                editable={
                  editable
                    ? {
                        type: 'multiple',
                        editableKeys: keysApp,
                        onChange: setKeysApp,
                        onValuesChange: (_r, list) =>
                          patch('appliedProducts', [...(list || [])]),
                        actionRender: (row) => [
                          bangXoa(
                            row,
                            value.appliedProducts,
                            (rows) => patch('appliedProducts', rows),
                            setKeysApp,
                          ),
                        ],
                      }
                    : undefined
                }
                pagination={false}
                scroll={{ x: 800 }}
              />
            </>
          ),
        },
        {
          key: 'tan',
          label: (
            <Space>
              <ExperimentOutlined style={{ color: '#fa8c16' }} />
              <Typography.Text strong>
                Mẫu, sản phẩm hàng hóa, vật liệu, thiết bị, giống…
              </Typography.Text>
              {demDong(value.tangibleProducts.filter((r) => r.name?.trim()).length)}
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
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Mẫu (model, maket); sản phẩm hàng hóa; vật liệu; thiết bị, máy móc;
                dây chuyền công nghệ; giống cây trồng, vật nuôi và các loại khác.
                So sánh mức chất lượng cần đạt với mẫu tương tự trong nước / thế giới
                theo tiêu chuẩn mới nhất.
              </Typography.Paragraph>
              <EditableProTable<OutlineExpectedTangibleProduct>
                rowKey="id"
                size="middle"
                value={value.tangibleProducts}
                onChange={(list) =>
                  patch(
                    'tangibleProducts',
                    [...(list || [])] as OutlineExpectedTangibleProduct[],
                  )
                }
                recordCreatorProps={
                  editable
                    ? {
                        newRecordType: 'dataSource',
                        record: () => ({
                          id: `tan-${Date.now()}`,
                          name: '',
                          unit: '',
                          qualityRequired: '',
                          qualitySampleDomestic: '',
                          qualitySampleWorld: '',
                          quantityScale: '',
                        }),
                        creatorButtonText: 'Thêm sản phẩm',
                      }
                    : false
                }
                columns={cotTan}
                editable={
                  editable
                    ? {
                        type: 'multiple',
                        editableKeys: keysTan,
                        onChange: setKeysTan,
                        onValuesChange: (_r, list) =>
                          patch('tangibleProducts', [...(list || [])]),
                        actionRender: (row) => [
                          bangXoa(
                            row,
                            value.tangibleProducts,
                            (rows) => patch('tangibleProducts', rows),
                            setKeysTan,
                          ),
                        ],
                      }
                    : undefined
                }
                pagination={false}
                scroll={{ x: 1200 }}
              />
            </>
          ),
        },
        {
          key: 'ip',
          label: (
            <Space>
              <FileProtectOutlined style={{ color: '#722ed1' }} />
              <Typography.Text strong>
                Đăng ký bảo hộ quyền sở hữu trí tuệ / công nghiệp
              </Typography.Text>
              {demDong(value.ipProducts.filter((r) => r.name?.trim()).length)}
            </Space>
          ),
          style: {
            marginBottom: 12,
            borderRadius: 10,
            border: '1px solid #d3adf7',
            background: 'linear-gradient(180deg, #f9f0ff 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Đăng ký bảo hộ quyền sở hữu trí tuệ, sở hữu công nghiệp, quyền đối với
                giống cây trồng và các loại hình khác.
              </Typography.Paragraph>
              <EditableProTable<OutlineExpectedIpProduct>
                rowKey="id"
                size="middle"
                value={value.ipProducts}
                onChange={(list) =>
                  patch('ipProducts', [...(list || [])] as OutlineExpectedIpProduct[])
                }
                recordCreatorProps={
                  editable
                    ? {
                        newRecordType: 'dataSource',
                        record: () => ({
                          id: `ip-${Date.now()}`,
                          name: '',
                          scienceRequirement: '',
                          note: '',
                        }),
                        creatorButtonText: 'Thêm sản phẩm SHTT',
                      }
                    : false
                }
                columns={cotIp}
                editable={
                  editable
                    ? {
                        type: 'multiple',
                        editableKeys: keysIp,
                        onChange: setKeysIp,
                        onValuesChange: (_r, list) =>
                          patch('ipProducts', [...(list || [])]),
                        actionRender: (row) => [
                          bangXoa(
                            row,
                            value.ipProducts,
                            (rows) => patch('ipProducts', rows),
                            setKeysIp,
                          ),
                        ],
                      }
                    : undefined
                }
                pagination={false}
                scroll={{ x: 800 }}
              />
            </>
          ),
        },
        {
          key: 'trn',
          label: (
            <Space>
              <RocketOutlined style={{ color: '#eb2f96' }} />
              <Typography.Text strong>
                Kết quả tham gia đào tạo sau đại học
              </Typography.Text>
              {demDong(
                value.postgraduateTraining.filter(
                  (r) => r.level?.trim() || r.major?.trim(),
                ).length,
              )}
            </Space>
          ),
          style: {
            marginBottom: 4,
            borderRadius: 10,
            border: '1px solid #ffadd2',
            background: 'linear-gradient(180deg, #fff0f6 0%, #fff 48px)',
            overflow: 'hidden',
          },
          children: (
            <>
              <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                Nếu có: ghi cấp đào tạo (Thạc sĩ, Tiến sĩ…), số lượng và chuyên ngành
                đào tạo dự kiến tham gia.
              </Typography.Paragraph>
              <EditableProTable<OutlineExpectedTraining>
                rowKey="id"
                size="middle"
                value={value.postgraduateTraining}
                onChange={(list) =>
                  patch(
                    'postgraduateTraining',
                    [...(list || [])] as OutlineExpectedTraining[],
                  )
                }
                recordCreatorProps={
                  editable
                    ? {
                        newRecordType: 'dataSource',
                        record: () => ({
                          id: `trn-${Date.now()}`,
                          level: '',
                          quantity: '',
                          major: '',
                          note: '',
                        }),
                        creatorButtonText: 'Thêm dòng đào tạo',
                      }
                    : false
                }
                columns={cotTrn}
                editable={
                  editable
                    ? {
                        type: 'multiple',
                        editableKeys: keysTrn,
                        onChange: setTrnKeys,
                        onValuesChange: (_r, list) =>
                          patch('postgraduateTraining', [...(list || [])]),
                        actionRender: (row) => [
                          bangXoa(
                            row,
                            value.postgraduateTraining,
                            (rows) => patch('postgraduateTraining', rows),
                            setTrnKeys,
                          ),
                        ],
                      }
                    : undefined
                }
                pagination={false}
                scroll={{ x: 800 }}
              />
            </>
          ),
        },
      ]}
    />
  );
}

export default ExpectedResultsPanels;
