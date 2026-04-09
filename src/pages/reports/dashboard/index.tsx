/**
 * Dashboard tổng quan VIP - dữ liệu nghiên cứu/khởi nghiệp toàn trường
 */
import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  BarChartOutlined,
  ExperimentOutlined,
  FundProjectionScreenOutlined,
  PieChartOutlined,
  ReloadOutlined,
  RiseOutlined,
  RocketOutlined,
  TeamOutlined,
  TrophyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import { history, useAccess } from '@umijs/max';
import {
  fetchHomeOverview,
  type HomeOverviewData,
  type OverviewFieldStat,
  type OverviewUnitStat,
} from '@/services/api/home';

const { Text, Title } = Typography;

const colorSet = {
  research: '#1677ff',
  studentResearch: '#52c41a',
  startup: '#fa8c16',
};

const severityColor: Record<string, 'error' | 'warning' | 'info'> = {
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
};

const donutColors = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];

const DonutChartCard: React.FC<{
  title: string;
  icon?: React.ReactNode;
  data: Array<{ name: string; value: number }>;
}> = ({ title, icon, data }) => {
  const compactData = useMemo(() => {
    const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, 5);
    const otherTotal = sorted.slice(5).reduce((sum, item) => sum + item.value, 0);
    return otherTotal > 0 ? [...top, { name: 'Khác', value: otherTotal }] : top;
  }, [data]);

  const total = compactData.reduce((sum, item) => sum + item.value, 0);
  const safeData = compactData;

  const gradient = useMemo(() => {
    if (safeData.length === 0 || total <= 0) return '#f5f5f5';
    let cursor = 0;
    const segments = safeData.map((item, index) => {
      const ratio = (item.value / total) * 100;
      const start = cursor;
      const end = cursor + ratio;
      cursor = end;
      const color = donutColors[index % donutColors.length];
      return `${color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    });
    return `conic-gradient(${segments.join(', ')})`;
  }, [safeData, total]);

  return (
    <Card
      title={
        <span>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </span>
      }
      bordered={false}
    >
      {safeData.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Row gutter={16} align="middle" style={{ minHeight: 220 }}>
          <Col xs={24} md={10}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: 164,
                  height: 164,
                  borderRadius: '50%',
                  background: gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Tổng
                  </Text>
                  <Title level={5} style={{ margin: 0 }}>
                    {total}
                  </Title>
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} md={14}>
            <div style={{ maxHeight: 220, overflow: 'auto' }}>
              {safeData.map((item, index) => {
                const percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0.0';
                return (
                  <div
                    key={`${item.name}-legend-${index}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      lineHeight: '20px',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: donutColors[index % donutColors.length],
                          flexShrink: 0,
                        }}
                      />
                      <Text style={{ fontSize: 13 }}>{item.name}</Text>
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 13, textAlign: 'right', paddingLeft: 8 }}>
                      <Text strong>{item.value}</Text>
                      <Text type="secondary"> ({percent}%)</Text>
                    </span>
                  </div>
                );
              })}
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );
};

const ResearchPieChart: React.FC<{
  title: string;
  icon?: React.ReactNode;
  data: Array<{ name: string; value: number }>;
}> = ({ title, icon, data }) => {
  const filteredData = useMemo(() => data.filter((d) => d.value > 0), [data]);
  const total = filteredData.reduce((sum, item) => sum + item.value, 0);

  const pieConfig = useMemo(
    () => ({
      data: filteredData.map((d) => ({ type: d.name, value: d.value })),
      angleField: 'value',
      colorField: 'type',
      innerRadius: 0.6,
      radius: 0.75,
      label: {
        text: (d: any) => `${d.type}: ${d.value}`,
        position: 'spider' as const,
        connector: true,
        transform: [{ type: 'overlapDodgeY' }],
        style: { fontSize: 12, fill: '#595959' },
      },
      legend: false as const,
      tooltip: { title: 'type' },
      interaction: { elementHighlight: true },
      state: {
        inactive: { opacity: 0.5 },
      },
      annotations: [
        {
          type: 'text' as const,
          style: {
            text: `Tổng\n${total}`,
            x: '50%',
            y: '50%',
            textAlign: 'center',
            fontSize: 16,
            fontWeight: '600',
            lineHeight: 28,
          },
        },
      ],
      height: 340,
      style: { stroke: '#fff', lineWidth: 2 },
    }),
    [filteredData, total],
  );

  return (
    <Card
      title={
        <span>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </span>
      }
      bordered={false}
    >
      {filteredData.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Pie {...pieConfig} />
      )}
    </Card>
  );
};

const TrendColumnChart: React.FC<{
  title: string;
  icon?: React.ReactNode;
  data: Array<{ year: number; researchProject: number; studentResearch: number; startup: number }>;
}> = ({ title, icon, data }) => {
  const chartData = useMemo(() => {
    return data.flatMap((d) => [
      { year: String(d.year), value: d.researchProject, type: 'Đề tài NCKH giảng viên' },
      { year: String(d.year), value: d.studentResearch, type: 'NCKH sinh viên' },
      { year: String(d.year), value: d.startup, type: 'Khởi nghiệp sinh viên' },
    ]);
  }, [data]);

  const config = useMemo(
    () => ({
      data: chartData,
      xField: 'year',
      yField: 'value',
      colorField: 'type',
      group: true,
      height: 340,
      scale: {
        color: { range: [colorSet.research, colorSet.studentResearch, colorSet.startup] },
      },
      style: { radiusEndTopLeft: 3, radiusEndTopRight: 3, maxWidth: 28 },
      axis: {
        y: { title: 'Số lượng' },
      },
      legend: { color: { position: 'top' as const, layout: { justifyContent: 'center' } } },
      interaction: { elementHighlight: true },
    }),
    [chartData],
  );

  return (
    <Card
      title={
        <span>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </span>
      }
      bordered={false}
    >
      {chartData.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Column {...config} />
      )}
    </Card>
  );
};

const StackedBar: React.FC<{
  researchProject: number;
  studentResearch: number;
  startup: number;
}> = ({ researchProject, studentResearch, startup }) => {
  const total = researchProject + studentResearch + startup;
  const pResearch = total > 0 ? (researchProject / total) * 100 : 0;
  const pStudent = total > 0 ? (studentResearch / total) * 100 : 0;
  const pStartup = total > 0 ? (startup / total) * 100 : 0;

  return (
    <div style={{ display: 'flex', width: '100%', height: 12, borderRadius: 999, overflow: 'hidden', background: '#f0f0f0' }}>
      <div style={{ width: `${pResearch}%`, background: colorSet.research }} />
      <div style={{ width: `${pStudent}%`, background: colorSet.studentResearch }} />
      <div style={{ width: `${pStartup}%`, background: colorSet.startup }} />
    </div>
  );
};

const TopTable: React.FC<{
  title: string;
  icon?: React.ReactNode;
  data: Array<OverviewUnitStat | OverviewFieldStat>;
  nameKey: 'unit' | 'field';
}> = ({ title, icon, data, nameKey }) => {
  const max = Math.max(1, ...data.map((d) => d.total));
  return (
    <Card
      title={
        <span>
          {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
          {title}
        </span>
      }
      bordered={false}
    >
      <Table
        size="small"
        pagination={false}
        rowKey={(r) => `${(r as any)[nameKey]}-${r.total}`}
        dataSource={data}
        columns={[
          {
            title: nameKey === 'unit' ? 'Đơn vị' : 'Lĩnh vực',
            dataIndex: nameKey,
            render: (v: string) => <Text strong>{v}</Text>,
          },
          {
            title: 'Tỷ trọng',
            width: 180,
            render: (_, record: any) => (
              <Progress percent={Math.round((record.total / max) * 100)} size="small" showInfo={false} />
            ),
          },
          { title: 'Tổng', dataIndex: 'total', width: 80, align: 'right' as const },
        ]}
      />
    </Card>
  );
};

type DashboardKpiCard = {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  /** Có thì click sẽ chuyển trang (vd danh sách staffs) */
  path?: string;
};

const ReportsDashboardPage: React.FC = () => {
  const access = useAccess();
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<HomeOverviewData | null>(null);
  const defaultYear = useMemo(() => new Date().getFullYear(), []);
  const [filters, setFilters] = useState<{ year?: number; departmentId?: number; field?: string }>(() => ({
    year: defaultYear,
  }));

  const loadData = async (nextFilters: { year?: number; departmentId?: number; field?: string } = filters) => {
    setLoading(true);
    try {
      const res = await fetchHomeOverview(nextFilters);
      if (res.success) {
        setOverview(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData({ year: defaultYear });
  }, []);

  const kpiCards = useMemo((): DashboardKpiCard[] => {
    if (!overview) return [];
    return [
      {
        title: 'Chuyên viên',
        value: overview.kpis.totalLecturers,
        icon: <UserOutlined />,
        color: '#1677ff',
        path: '/admin/staffs',
      },
      { title: 'Sinh viên', value: overview.kpis.totalStudents, icon: <TeamOutlined />, color: '#13c2c2' },
      { title: 'Hồ sơ khoa học đã xác thực', value: overview.kpis.verifiedProfiles, icon: <TrophyOutlined />, color: '#722ed1' },
      { title: 'Đề tài nghiên cứu', value: overview.kpis.researchProjects, icon: <FundProjectionScreenOutlined />, color: colorSet.research },
      { title: 'Dự án sinh viên nghiên cứu khoa học', value: overview.kpis.studentResearchProjects, icon: <RiseOutlined />, color: colorSet.studentResearch },
      { title: 'Dự án sinh viên khởi nghiệp', value: overview.kpis.startupProjects, icon: <RiseOutlined />, color: colorSet.startup },
      { title: 'Đơn vị hoạt động', value: overview.kpis.activeUnits, icon: <TeamOutlined />, color: '#fa541c' },
      { title: 'Lĩnh vực hoạt động', value: overview.kpis.activeFields, icon: <TrophyOutlined />, color: '#eb2f96' },
    ];
  }, [overview]);

  const startupByField = useMemo(
    () =>
      (overview?.fieldStats || [])
        .filter((x) => x.startup > 0)
        .map((x) => ({ name: x.field, value: x.startup }))
        .slice(0, 8),
    [overview]
  );

  const studentResearchByField = useMemo(
    () =>
      (overview?.fieldStats || [])
        .filter((x) => x.studentResearch > 0)
        .map((x) => ({ name: x.field, value: x.studentResearch }))
        .slice(0, 8),
    [overview]
  );

  const researchByUnit = useMemo(
    () =>
      (overview?.unitStats || [])
        .filter((x) => x.researchProject > 0)
        .map((x) => ({ name: x.unit, value: x.researchProject }))
        .slice(0, 8),
    [overview]
  );

  return (
    <PageContainer
      header={{
        title: 'Dashboard tổng quan VIP',
        subTitle: 'Nghiên cứu giảng viên - NCKH sinh viên - Khởi nghiệp sinh viên',
      }}
    >
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap size={12}>
          <Select
            placeholder="Năm"
            style={{ width: 120 }}
            allowClear
            value={filters.year}
            options={(overview?.filters.yearOptions || []).map((y) => ({ label: `Năm ${y}`, value: y }))}
            onChange={(v) => setFilters((p) => ({ ...p, year: v }))}
          />
          <Select
            placeholder="Đơn vị"
            style={{ width: 260 }}
            allowClear
            value={filters.departmentId}
            options={(overview?.filters.departments || []).map((d) => ({ label: d.name, value: d.id }))}
            onChange={(v) => setFilters((p) => ({ ...p, departmentId: v }))}
          />
          <Select
            placeholder="Lĩnh vực"
            style={{ width: 240 }}
            allowClear
            showSearch
            value={filters.field}
            options={(overview?.filters.fields || []).map((f) => ({ label: f, value: f }))}
            onChange={(v) => setFilters((p) => ({ ...p, field: v }))}
          />
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => loadData(filters)}>
            Làm mới dashboard
          </Button>
        </Space>
      </Card>

      <Spin spinning={loading}>
        {!overview ? (
          <Card bordered={false}>
            <Empty description="Chưa có dữ liệu dashboard" />
          </Card>
        ) : (
          <>
            <Row gutter={[16, 16]}>
              {kpiCards.map((kpi) => {
                const goStaffs = kpi.path === '/admin/staffs' && access.canViewDepartments;
                const card = (
                  <Card
                    bordered={false}
                    bodyStyle={{ padding: 16 }}
                    hoverable={goStaffs}
                    onClick={goStaffs ? () => history.push('/admin/staffs') : undefined}
                    style={goStaffs ? { cursor: 'pointer' } : undefined}
                  >
                    <Statistic
                      title={<Text type="secondary">{kpi.title}</Text>}
                      value={kpi.value}
                      prefix={<span style={{ color: kpi.color }}>{kpi.icon}</span>}
                      valueStyle={{ color: kpi.color, fontWeight: 700, fontSize: 26 }}
                    />
                  </Card>
                );
                return (
                  <Col key={kpi.title} xs={24} sm={12} md={8} lg={6}>
                    {goStaffs ? <Tooltip title="Xem danh sách nhân sự">{card}</Tooltip> : card}
                  </Col>
                );
              })}
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} lg={12}>
                <DonutChartCard
                  title="Dự án sinh viên khởi nghiệp theo lĩnh vực"
                  icon={<RocketOutlined style={{ color: colorSet.startup }} />}
                  data={startupByField}
                />
              </Col>
              <Col xs={24} lg={12}>
                <DonutChartCard
                  title="Đề tài sinh viên thực hiện theo lĩnh vực"
                  icon={<ExperimentOutlined style={{ color: colorSet.studentResearch }} />}
                  data={studentResearchByField}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} lg={12}>
                <ResearchPieChart
                  title="Đề tài nghiên cứu khoa học theo đơn vị"
                  icon={<PieChartOutlined style={{ color: colorSet.research }} />}
                  data={researchByUnit}
                />
              </Col>
              <Col xs={24} lg={12}>
                <TrendColumnChart
                  title="Nghiên cứu khoa học, dự án khởi nghiệp theo năm"
                  icon={<BarChartOutlined style={{ color: '#722ed1' }} />}
                  data={overview.trend}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Card
                  title={
                    <span>
                      <RiseOutlined style={{ color: '#13c2c2', marginRight: 8 }} />
                      Xu hướng theo năm
                    </span>
                  }
                  bordered={false}
                  extra={
                    <Space size={16}>
                      <Tag color="blue">Nghiên cứu giảng viên</Tag>
                      <Tag color="green">NCKH sinh viên</Tag>
                      <Tag color="orange">Startup sinh viên</Tag>
                    </Space>
                  }
                >
                  <Table
                    size="small"
                    pagination={false}
                    rowKey="year"
                    dataSource={overview.trend}
                    columns={[
                      { title: 'Năm', dataIndex: 'year', width: 90, render: (v) => <Text strong>{v}</Text> },
                      {
                        title: 'Cơ cấu hoạt động',
                        render: (_, r) => (
                          <StackedBar
                            researchProject={r.researchProject}
                            studentResearch={r.studentResearch}
                            startup={r.startup}
                          />
                        ),
                      },
                      { title: 'Nghiên cứu GV', dataIndex: 'researchProject', width: 120, align: 'right' as const },
                      { title: 'NCKH SV', dataIndex: 'studentResearch', width: 120, align: 'right' as const },
                      { title: 'Startup SV', dataIndex: 'startup', width: 120, align: 'right' as const },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col xs={24} lg={12}>
                <TopTable
                  title="Top đơn vị hoạt động"
                  icon={<TeamOutlined style={{ color: '#fa541c' }} />}
                  data={overview.topUnits}
                  nameKey="unit"
                />
              </Col>
              <Col xs={24} lg={12}>
                <TopTable
                  title="Top lĩnh vực hoạt động"
                  icon={<TrophyOutlined style={{ color: '#eb2f96' }} />}
                  data={overview.topFields}
                  nameKey="field"
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
              <Col span={24}>
                <Card
                  title={
                    <span>
                      <FundProjectionScreenOutlined style={{ color: '#faad14', marginRight: 8 }} />
                      Cảnh báo và gợi ý điều hành
                    </span>
                  }
                  bordered={false}
                >
                  {overview.alerts.length === 0 ? (
                    <Empty description="Không có cảnh báo nổi bật" />
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {overview.alerts.map((alert) => (
                        <Alert
                          key={alert.key}
                          type={severityColor[alert.severity] || 'info'}
                          showIcon
                          message={alert.title}
                          description={alert.description}
                        />
                      ))}
                    </Space>
                  )}
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Spin>
    </PageContainer>
  );
};

export default ReportsDashboardPage;
