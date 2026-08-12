/**
 * Thống kê kết quả NCKH — ma trận theo cột loại KQNC (cấu hình L1/L2/L3).
 */
import { PageContainer } from '@ant-design/pro-components';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Select,
  Space,
  Spin,
  Tree,
  message,
} from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  PrinterOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getNckhDataColumnConfig,
  getNckhDataReport,
  saveNckhDataColumnConfig,
  type NckhDataColumnNode,
  type NckhDataColumnSelection,
  type NckhDataReport,
} from '@/services/api/kpiReports';
import ReportPeriodFilters, {
  nhanKhoangKyTuState,
  stateThanhQueryBaoCao,
  trangThaiLocKyMacDinh,
  type ReportPeriodFilterState,
} from '@/components/ReportPeriodFilters';
import './index.less';

/** Đếm số lá L3 trong một nhánh (đã lọc sẵn theo cấu hình). */
function demLa(node: NckhDataColumnNode): number {
  if (node.level === 3) return 1;
  return (node.children || []).reduce((s, c) => s + demLa(c), 0);
}

/** Cây danh mục → Tree antd + map id → level. */
function cayThanhTreeData(nodes: NckhDataColumnNode[]): {
  treeData: DataNode[];
  levelById: Map<number, number>;
} {
  const levelById = new Map<number, number>();
  const walk = (list: NckhDataColumnNode[]): DataNode[] =>
    list.map((n) => {
      levelById.set(n.id, n.level);
      return {
        key: String(n.id),
        title: n.name,
        children: n.children?.length ? walk(n.children) : undefined,
      };
    });
  return { treeData: walk(nodes), levelById };
}

const NckhDataReportPage: React.FC = () => {
  const [periodFilter, setPeriodFilter] = useState<ReportPeriodFilterState>(trangThaiLocKyMacDinh);
  const [faculty, setFaculty] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<NckhDataReport | null>(null);

  const [configOpen, setConfigOpen] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [canConfigure, setCanConfigure] = useState(false);
  const [catalogTree, setCatalogTree] = useState<NckhDataColumnNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [levelById, setLevelById] = useState<Map<number, number>>(new Map());

  const fetchReport = async (period: ReportPeriodFilterState, fac?: string) => {
    setLoading(true);
    try {
      const res = await getNckhDataReport(stateThanhQueryBaoCao(period, fac));
      if (res.success) {
        setReport(res.data);
        setFaculty(res.data.faculty);
      } else {
        message.error(res.message || 'Không tải được dữ liệu');
      }
    } catch (e: any) {
      message.error(e?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(periodFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const facultyOptions = useMemo(
    () => (report?.faculties || []).map((f) => ({ label: f, value: f })),
    [report?.faculties],
  );

  const hasData = !!report && report.rows.length > 0;
  const leafColumns = report?.leafColumns || [];
  const columnTree = report?.columnTree || [];
  const t = report?.totals;
  const periodLabel =
    report?.period_label || nhanKhoangKyTuState(periodFilter) || report?.academic_year || '';

  const moCauHinhCot = useCallback(async () => {
    setConfigOpen(true);
    setConfigLoading(true);
    try {
      const res = await getNckhDataColumnConfig();
      if (!res.success || !res.data) {
        message.error(res.message || 'Không tải được cấu hình cột');
        return;
      }
      setCanConfigure(!!res.data.canConfigure);
      setCatalogTree(res.data.catalogTree || []);
      const { treeData: _td, levelById: map } = cayThanhTreeData(res.data.catalogTree || []);
      setLevelById(map);
      const sel = res.data.selection;
      const keys = [
        ...(sel.level1Ids || []),
        ...(sel.level2Ids || []),
        ...(sel.level3Ids || []),
      ].map(String);
      setCheckedKeys(keys);
    } catch (e: any) {
      message.error(e?.message || 'Lỗi tải cấu hình cột');
    } finally {
      setConfigLoading(false);
    }
  }, []);

  const luuCauHinhCot = async () => {
    if (!canConfigure) {
      message.warning('Bạn không có quyền cấu hình cột');
      return;
    }
    const selection: NckhDataColumnSelection = {
      level1Ids: [],
      level2Ids: [],
      level3Ids: [],
    };
    for (const key of checkedKeys) {
      const id = Number(key);
      if (!Number.isFinite(id)) continue;
      const level = levelById.get(id);
      if (level === 1) selection.level1Ids.push(id);
      else if (level === 2) selection.level2Ids.push(id);
      else if (level === 3) selection.level3Ids.push(id);
    }
    setConfigSaving(true);
    try {
      const res = await saveNckhDataColumnConfig(selection);
      if (!res.success) {
        message.error(res.message || 'Lưu cấu hình thất bại');
        return;
      }
      message.success(res.message || 'Đã lưu cấu hình cột');
      setConfigOpen(false);
      await fetchReport(periodFilter, faculty);
    } catch (e: any) {
      message.error(e?.message || 'Lỗi lưu cấu hình');
    } finally {
      setConfigSaving(false);
    }
  };

  const treeData = useMemo(() => cayThanhTreeData(catalogTree).treeData, [catalogTree]);

  const chonTatCa = () => {
    const keys: string[] = [];
    const walk = (nodes: NckhDataColumnNode[]) => {
      for (const n of nodes) {
        keys.push(String(n.id));
        if (n.children?.length) walk(n.children);
      }
    };
    walk(catalogTree);
    setCheckedKeys(keys);
  };

  const boChonTatCa = () => setCheckedKeys([]);

  return (
    <PageContainer
      header={{
        title: 'Thống kê kết quả NCKH',
        breadcrumb: {},
        extra: [
          <Space key="controls" wrap>
            <Select
              value={faculty || undefined}
              placeholder="Chọn Khoa/đơn vị"
              onChange={(val) => {
                setFaculty(val);
                fetchReport(periodFilter, val);
              }}
              options={facultyOptions}
              style={{ width: 280 }}
              showSearch
            />
            <ReportPeriodFilters
              value={periodFilter}
              onChange={setPeriodFilter}
              onApply={(next) => fetchReport(next, faculty)}
            />
            <Button icon={<SettingOutlined />} onClick={moCauHinhCot}>
              Cấu hình cột
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => fetchReport(periodFilter, faculty)}>
              Tải lại
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              disabled={!hasData}
              onClick={() => window.print()}
            >
              In / Lưu PDF
            </Button>
          </Space>,
        ],
      }}
    >
      <Card>
        <Alert
          type="info"
          style={{ marginBottom: 12 }}
          message="Số liệu đếm theo loại kết quả NCKH đã chọn trong Cấu hình cột (L1 → L2 → L3). Cột Giờ NCKH tính theo ngày xuất bản trong khoảng lọc."
        />
        <Spin spinning={loading}>
          {!hasData && !loading ? (
            <Empty description="Chưa có dữ liệu cho Khoa/đơn vị này" />
          ) : (
            <div className="nckh-data-scroll">
              <div id="nckh-print-area" className="nckh-data-doc">
                <div className="nckh-data-title">
                  <div className="nckh-data-title-main">
                    DỮ LIỆU NCKH CỦA {(report?.faculty || '').toUpperCase()}
                  </div>
                  <div className="nckh-data-title-sub">{periodLabel}</div>
                </div>

                {leafColumns.length === 0 ? (
                  <Empty description="Chưa chọn cột loại kết quả. Mở Cấu hình cột để chọn L1/L2/L3." />
                ) : (
                  <table className="nckh-data-table">
                    <thead>
                      {/* Hàng 1: nhóm level 1 */}
                      <tr>
                        <th rowSpan={3}>Số TT</th>
                        <th rowSpan={3} colSpan={2}>
                          Họ và tên
                        </th>
                        {columnTree.map((l1) => (
                          <th key={l1.id} colSpan={demLa(l1)}>
                            {l1.name}
                          </th>
                        ))}
                        <th rowSpan={3}>Giờ Nghiên cứu khoa học</th>
                        <th rowSpan={3}>Ghi chú</th>
                      </tr>
                      {/* Hàng 2: level 2 */}
                      <tr>
                        {columnTree.flatMap((l1) =>
                          (l1.children || []).map((l2) => (
                            <th key={l2.id} colSpan={demLa(l2)}>
                              {l2.name}
                            </th>
                          )),
                        )}
                      </tr>
                      {/* Hàng 3: level 3 (lá) */}
                      <tr>
                        {leafColumns.map((leaf) => (
                          <th key={leaf.id}>{leaf.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {report?.rows.map((r) => (
                        <tr key={r.stt}>
                          <td className="c">{r.stt}</td>
                          <td>{r.hoTenDem}</td>
                          <td className="b">{r.ten}</td>
                          {leafColumns.map((leaf) => {
                            const v = r.counts?.[String(leaf.id)] || 0;
                            return (
                              <td key={leaf.id} className="c">
                                {v || ''}
                              </td>
                            );
                          })}
                          <td className="c">{r.hours || ''}</td>
                          <td>{r.note}</td>
                        </tr>
                      ))}
                      {t && (
                        <tr className="nckh-data-total">
                          <td className="c b" colSpan={3}>
                            Tổng cộng
                          </td>
                          {leafColumns.map((leaf) => (
                            <td key={leaf.id} className="c b">
                              {t.counts?.[String(leaf.id)] || 0}
                            </td>
                          ))}
                          <td className="c b">{t.hours}</td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </Spin>
      </Card>

      <Drawer
        title="Cấu hình cột báo cáo"
        width={560}
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={chonTatCa} disabled={!canConfigure || configLoading}>
              Chọn tất cả
            </Button>
            <Button onClick={boChonTatCa} disabled={!canConfigure || configLoading}>
              Bỏ chọn
            </Button>
            <Button
              type="primary"
              loading={configSaving}
              disabled={!canConfigure}
              onClick={luuCauHinhCot}
            >
              Lưu
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message="Chọn cấp 1 → cấp 2 → cấp 3. Chỉ các cột cấp 3 được chọn mới hiện trên báo cáo."
        />
        {!canConfigure && (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message="Tài khoản hiện tại chỉ xem được cấu hình, không lưu được thay đổi."
          />
        )}
        <Spin spinning={configLoading}>
          <div style={{ maxHeight: 'calc(100vh - 220px)', overflow: 'auto' }}>
            <Tree
              checkable
              defaultExpandAll
              treeData={treeData}
              checkedKeys={checkedKeys}
              disabled={!canConfigure}
              onCheck={(keys) => {
                const list = Array.isArray(keys) ? keys : keys.checked;
                setCheckedKeys(list.map(String));
              }}
            />
          </div>
        </Spin>
      </Drawer>
    </PageContainer>
  );
};

export default NckhDataReportPage;
