/**
 * Danh sách KQNC — ProTable + bộ lọc chuẩn Ant Design Pro (table-list)
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { history, useAccess, useParams } from '@umijs/max';
import { Button, Input, Popconfirm, Tag, Tooltip, Typography, message } from 'antd';
import type { FormItemProps } from 'antd/es/form';
import { DeleteOutlined, EditOutlined, PlusOutlined, CalculatorOutlined } from '@ant-design/icons';
import {
  PageContainer,
  ProTable,
  type ActionType,
  type ProColumns,
  type ProFormInstance,
} from '@ant-design/pro-components';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  deleteAdminPublication,
  queryAdminPublications,
  type AdminPublicationListItem,
} from '@/services/api/adminPublications';
import { taiCayLoaiKqncQuanLy } from '@/utils/researchOutputCatalogTree';
import {
  layNhanLoaiKqncTheoCap,
  publicationThuocNhomGoc,
  type ResearchOutputTypeTreeNode,
} from '@/services/api/profilePublications';
import {
  coBoLocNgayDangBat,
  khoangMacDinhChiSoNckh,
  khoangNgayTheoPreset,
  namThamChieuNamTaiChinh,
  PRESET_LOC_KQNC,
  namThamChieuBoLoc,
  presetCanChonNam,
  publicationTrongKhoangNgay,
  type PublicationFilterPreset,
} from '@/utils/publicationDateFilter';
import { duongDanMenuNhomGoc } from '@/utils/researchOutputMenu';
import { hienThiNgayXuatBan } from '@/utils/publicationDate';
import {
  PUBLICATION_REVIEW_STATUS_MAP,
  PUBLICATION_REVIEW_STATUS_OPTIONS,
  type PublicationReviewStatus,
} from '@/utils/publicationReviewStatus';
import ConvertedHoursPreviewModal from '@/components/ConvertedHoursPreviewModal';
import './index.less';

const { Text } = Typography;

/** Nhãn sát ô giá trị — không dùng chung độ rộng nhãn của ProQueryFilter */
const FORM_ITEM_GAN_NHAN: FormItemProps = {
  labelCol: { flex: '0 0 auto' },
  wrapperCol: { flex: '1 1 0', style: { minWidth: 0 } },
};

type TimKiemKqnc = {
  keyword?: string;
  rootTypeId?: number;
  reviewStatus?: PublicationReviewStatus;
  filterPreset?: PublicationFilterPreset;
  filterRefYear?: number;
  publishedAtRange?: [string, string] | [Dayjs, Dayjs];
  current?: number;
  pageSize?: number;
};

const ResearchOutputsListPage: React.FC = () => {
  const { rootTypeKey } = useParams<{ rootTypeKey: string }>();
  const access = useAccess();
  const actionRef = useRef<ActionType>();
  const formRef = useRef<ProFormInstance>();

  const [researchOutputTree, setResearchOutputTree] = useState<ResearchOutputTypeTreeNode[]>([]);
  const [tuKhoaTimNhanh, setTuKhoaTimNhanh] = useState('');
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewPubId, setPreviewPubId] = useState<number | null>(null);
  const [previewPubTitle, setPreviewPubTitle] = useState<string>('');

  const rootTypeIdFromMenu =
    rootTypeKey && rootTypeKey !== 'all' && /^\d+$/.test(rootTypeKey)
      ? Number(rootTypeKey)
      : undefined;

  const returnPath = duongDanMenuNhomGoc(rootTypeIdFromMenu ?? 'all');

  const rootTypeOptions = useMemo(
    () =>
      researchOutputTree.map((n) => ({
        label: n.name,
        value: Number(n.id),
      })),
    [researchOutputTree],
  );

  const rootTypeValueEnum = useMemo(() => {
    const map: Record<number, { text: string }> = {};
    for (const n of researchOutputTree) {
      map[Number(n.id)] = { text: n.name };
    }
    return map;
  }, [researchOutputTree]);

  const presetOptions = useMemo(
    () => PRESET_LOC_KQNC.filter((o) => o.value !== 'custom').map((o) => ({ label: o.label, value: o.value })),
    []
  );

  const yearOptions = useMemo(() => {
    const y = dayjs().year();
    return Array.from({ length: 8 }, (_, i) => {
      const year = y - i;
      return { label: String(year), value: year };
    });
  }, []);

  const taiCayDanhMuc = useCallback(async () => {
    try {
      const tree = await taiCayLoaiKqncQuanLy();
      setResearchOutputTree(tree);
    } catch {
      message.warning('Không tải được danh mục loại KQNC');
    }
  }, []);

  useEffect(() => {
    taiCayDanhMuc();
  }, [taiCayDanhMuc]);

  useEffect(() => {
    if (!researchOutputTree.length) return;
    const id =
      rootTypeIdFromMenu != null && Number.isFinite(rootTypeIdFromMenu)
        ? Number(rootTypeIdFromMenu)
        : undefined;
    formRef.current?.setFieldsValue({ rootTypeId: id });
    actionRef.current?.reload();
  }, [rootTypeIdFromMenu, researchOutputTree]);

  const layKhoangNgayTuTimKiem = (params: TimKiemKqnc): [Dayjs, Dayjs] | null => {
    const raw = params.publishedAtRange;
    if (raw?.[0] && raw?.[1]) {
      const from = dayjs(raw[0]);
      const to = dayjs(raw[1]);
      if (from.isValid() && to.isValid()) return [from, to];
    }
    const preset = params.filterPreset ?? 'fiscal_year';
    if (preset === 'all') return null;
    return khoangNgayTheoPreset(preset, namThamChieuBoLoc(preset, params.filterRefYear));
  };

  const handleThemMoi = () => {
    const rootTypeId = formRef.current?.getFieldValue('rootTypeId') as number | undefined;
    const q = new URLSearchParams({
      returnTo: returnPath,
      ...(rootTypeId != null ? { rootTypeId: String(rootTypeId) } : {}),
    });
    history.push(`/research-outputs/new?${q.toString()}`);
  };

  const taiLaiBang = () => actionRef.current?.reload();

  const handleDelete = async (record: AdminPublicationListItem) => {
    try {
      const res = await deleteAdminPublication(record.id);
      if (res.success) {
        message.success('Đã xóa kết quả NCKH');
        actionRef.current?.reload();
      }
    } catch {
      message.error('Không thể xóa kết quả NCKH');
    }
  };

  const handleXemDiemQuyDoi = (record: AdminPublicationListItem) => {
    setPreviewPubId(record.id);
    setPreviewPubTitle(record.title ?? '');
    setPreviewModalVisible(true);
  };

  const columns: ProColumns<AdminPublicationListItem>[] = [
    {
      title: 'Lọc theo',
      dataIndex: 'filterPreset',
      hideInTable: true,
      valueType: 'select',
      order: 40,
      colSize: 1,
      initialValue: 'fiscal_year',
      formItemProps: {
        ...FORM_ITEM_GAN_NHAN,
        className: 'kqnc-filter-preset-item',
      },
      fieldProps: {
        allowClear: false,
        className: 'kqnc-filter-preset',
        popupMatchSelectWidth: false,
        dropdownStyle: { minWidth: 188 },
        options: presetOptions,
        onChange: (preset: PublicationFilterPreset) => {
          const refYear = namThamChieuBoLoc(
            preset,
            formRef.current?.getFieldValue('filterRefYear') as number | undefined,
          );
          if (preset === 'all') {
            formRef.current?.setFieldsValue({ publishedAtRange: undefined });
            actionRef.current?.reload();
            return;
          }
          const range = khoangNgayTheoPreset(preset, refYear);
          formRef.current?.setFieldsValue({ publishedAtRange: range ?? undefined });
          actionRef.current?.reload();
        },
      },
    },
    {
      title: '',
      dataIndex: 'publishedAtRange',
      hideInTable: true,
      valueType: 'dateRange',
      order: 30,
      colSize: 2,
      initialValue: khoangMacDinhChiSoNckh(),
      formItemProps: {
        ...FORM_ITEM_GAN_NHAN,
        className: 'kqnc-filter-date-range',
        colon: false,
      },
      fieldProps: {
        format: 'DD/MM/YYYY',
        placeholder: ['Từ ngày', 'Đến ngày'],
        style: { width: '100%' },
      },
      search: {
        transform: (value) => ({
          publishedAtRange: value,
        }),
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'reviewStatus',
      hideInTable: true,
      valueType: 'select',
      order: 29,
      colSize: 1,
      formItemProps: {
        ...FORM_ITEM_GAN_NHAN,
        className: 'kqnc-filter-review-status-item',
      },
      fieldProps: {
        allowClear: true,
        className: 'kqnc-filter-review-status',
        placeholder: 'Tất cả',
        popupMatchSelectWidth: false,
        dropdownStyle: { minWidth: 200 },
        options: PUBLICATION_REVIEW_STATUS_OPTIONS,
        onChange: () => actionRef.current?.reload(),
      },
    },
    {
      title: 'Năm',
      dataIndex: 'filterRefYear',
      hideInTable: true,
      valueType: 'select',
      order: 20,
      colSize: 1,
      initialValue: namThamChieuNamTaiChinh(),
      formItemProps: FORM_ITEM_GAN_NHAN,
      dependencies: ['filterPreset'],
      renderFormItem: (_, { type, defaultRender }, form) => {
        const preset = form.getFieldValue('filterPreset') as PublicationFilterPreset;
        if (!presetCanChonNam(preset)) return null;
        return defaultRender(_);
      },
      fieldProps: {
        allowClear: false,
        options: yearOptions,
        onChange: (year: number) => {
          const preset = formRef.current?.getFieldValue('filterPreset') as PublicationFilterPreset;
          if (presetCanChonNam(preset)) {
            const range = khoangNgayTheoPreset(preset, year);
            formRef.current?.setFieldsValue({ publishedAtRange: range ?? undefined });
          }
          actionRef.current?.reload();
        },
      },
    },
    {
      title: 'Loại kết quả NCKH',
      dataIndex: 'rootTypeId',
      hideInTable: true,
      valueType: 'select',
      valueEnum: rootTypeValueEnum,
      order: 10,
      colSize: 3,
      formItemProps: {
        ...FORM_ITEM_GAN_NHAN,
        className: 'kqnc-filter-root-type-item',
      },
      fieldProps: {
        allowClear: true,
        className: 'kqnc-filter-root-type',
        placeholder: 'Tất cả loại',
        popupMatchSelectWidth: false,
        dropdownStyle: { minWidth: 400 },
        options: rootTypeOptions,
        loading: !researchOutputTree.length,
        onChange: (v: number | string | undefined) => {
          const id =
            v != null && v !== '' && Number.isFinite(Number(v)) ? Number(v) : undefined;
          formRef.current?.setFieldsValue({ rootTypeId: id });
          history.replace(duongDanMenuNhomGoc(id ?? 'all'));
        },
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'reviewStatus',
      width: 130,
      hideInSearch: true,
      render: (_, r) => {
        const status = (r.reviewStatus ?? 'NEW') as PublicationReviewStatus;
        const meta = PUBLICATION_REVIEW_STATUS_MAP[status] ?? PUBLICATION_REVIEW_STATUS_MAP.NEW;
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      ellipsis: true,
      width: 280,
      hideInSearch: true,
      render: (_, r) => <Text strong>{r.title}</Text>,
    },
    {
      title: 'Loại KQNC',
      dataIndex: ['researchOutputType', 'name'],
      width: 240,
      hideInSearch: true,
      render: (_, r) => {
        const nhan = layNhanLoaiKqncTheoCap(researchOutputTree, r);
        if (!nhan) return '—';

        const cell = (
          <div className="kqnc-loai-cell">
            {nhan.level2 ? (
              <div className="kqnc-loai-cell__level2" title={nhan.level2}>
                {nhan.level2}
              </div>
            ) : null}
            <div className="kqnc-loai-cell__leaf">{nhan.leaf}</div>
          </div>
        );

        const tooltipLines = [nhan.level1, nhan.level2, nhan.leaf].filter(Boolean) as string[];
        if (tooltipLines.length <= 1) return cell;

        return (
          <Tooltip
            overlayClassName="kqnc-loai-tooltip"
            title={
              <div className="kqnc-loai-tooltip__body">
                {nhan.level1 ? <div>{nhan.level1}</div> : null}
                {nhan.level2 ? <div>{nhan.level2}</div> : null}
                <div>{nhan.leaf}</div>
              </div>
            }
          >
            {cell}
          </Tooltip>
        );
      },
    },
    {
      title: 'Ngày XB',
      dataIndex: 'publishedAt',
      width: 110,
      hideInSearch: true,
      valueType: 'text',
      render: (_, r) => hienThiNgayXuatBan(r),
      renderText: (_, r) => hienThiNgayXuatBan(r),
    },
    {
      title: 'Tác giả',
      dataIndex: 'authors',
      ellipsis: true,
      hideInSearch: true,
      width: 200,
    },
    {
      title: 'Điểm/giờ NCKH',
      dataIndex: 'convertedPointsPreview',
      width: 150,
      hideInSearch: true,
      hideInSetting: true,
      render: (_: unknown, record: AdminPublicationListItem) => (
        <Button
          type="link"
          size="small"
          icon={<CalculatorOutlined />}
          onClick={() => handleXemDiemQuyDoi(record)}
        >
          Điểm/giờ NCKH
        </Button>
      ),
    },
    {
      title: 'Thao tác',
      valueType: 'option',
      width: 130,
      fixed: 'right',
      render: (_, record) => [
        access.canUpdateResearchOutput && (
          <Button
            key="edit"
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() =>
              history.push(
                `/research-outputs/edit/${record.id}?returnTo=${encodeURIComponent(returnPath)}`
              )
            }
          >
            Kiểm tra
          </Button>
        ),
        access.canDeleteResearchOutput && (
          <Popconfirm
            key="del"
            title="Xóa kết quả NCKH này?"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        ),
      ].filter(Boolean),
    },
  ];

  return (
    <PageContainer className="research-outputs-list-page">
      <ProTable<AdminPublicationListItem, TimKiemKqnc>
        className="research-outputs-pro-table"
        actionRef={actionRef}
        formRef={formRef}
        rowKey="id"
        columns={columns}
        params={{
          rootTypeIdFromMenu,
          keyword: tuKhoaTimNhanh,
        }}
        toolbar={{
          title: (
            <Input
              allowClear
              className="kqnc-quick-search"
              placeholder="Tìm theo tiêu đề, tên tác giả"
              value={tuKhoaTimNhanh}
              onChange={(e) => setTuKhoaTimNhanh(e.target.value)}
              onPressEnter={taiLaiBang}
              onClear={taiLaiBang}
            />
          ),
          actions: [
            access.canCreateResearchOutput ? (
              <Button key="add" type="primary" icon={<PlusOutlined />} onClick={handleThemMoi}>
                Thêm kết quả NCKH
              </Button>
            ) : null,
          ].filter(Boolean),
        }}
        form={{
          initialValues: {
            filterPreset: 'fiscal_year',
            filterRefYear: namThamChieuNamTaiChinh(),
            publishedAtRange: khoangMacDinhChiSoNckh(),
          },
          syncToUrl: false,
        }}
        search={{
          className: 'kqnc-query-filter',
          labelWidth: 'auto',
          /**
           * Thu gọn mặc định. defaultColsNumber tính theo colSize (không phải số ô):
           * Lọc theo(1) + Khoảng thời gian(2) + Trạng thái(1) = 4
           */
          defaultCollapsed: true,
          defaultColsNumber: 4,
          span: { xs: 24, sm: 12, md: 8, lg: 4, xl: 4 },
          collapseRender: (collapsed) => (collapsed ? 'Mở rộng' : 'Thu gọn'),
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: true,
        }}
        columnsState={{
          persistenceKey: 'research-outputs-list-v2',
          defaultValue: {
            profileFullName: { show: false },
            academicYear: { show: false },
          },
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} bản ghi`,
        }}
        scroll={{ x: 1200 }}
        request={async (params) => {
          const rawRoot = params.rootTypeId ?? rootTypeIdFromMenu;
          const rootTypeId =
            rawRoot != null && rawRoot !== '' && Number.isFinite(Number(rawRoot))
              ? Number(rawRoot)
              : undefined;
          const dateRange = layKhoangNgayTuTimKiem(params);
          const from = dateRange?.[0];
          const to = dateRange?.[1];

          try {
            const res = await queryAdminPublications({
              page: params.current,
              perPage: params.pageSize,
              keyword: params.keyword,
              rootTypeId,
              reviewStatus: params.reviewStatus,
              publishedFrom:
                coBoLocNgayDangBat(from, to) && from ? from.format('YYYY-MM-DD') : undefined,
              publishedTo:
                coBoLocNgayDangBat(from, to) && to ? to.format('YYYY-MM-DD') : undefined,
            });

            let data = res.data ?? [];

            if (rootTypeId != null && researchOutputTree.length) {
              data = data.filter((p) =>
                publicationThuocNhomGoc(researchOutputTree, p, rootTypeId)
              );
            }

            const preset = params.filterPreset ?? 'fiscal_year';
            if (preset !== 'all' && coBoLocNgayDangBat(from, to)) {
              data = data.filter((p) => publicationTrongKhoangNgay(p, from, to));
            }

            if (params.keyword?.trim()) {
              const kw = params.keyword.trim().toLowerCase();
              data = data.filter(
                (p) =>
                  p.title?.toLowerCase().includes(kw) ||
                  p.authors?.toLowerCase().includes(kw),
              );
            }

            return {
              data,
              total: res.meta?.total ?? data.length,
              success: res.success !== false,
            };
          } catch {
            return { data: [], total: 0, success: false };
          }
        }}
      />

      <ConvertedHoursPreviewModal
        open={previewModalVisible}
        publicationId={previewPubId}
        publicationTitle={previewPubTitle}
        adminScope
        onClose={() => setPreviewModalVisible(false)}
      />
    </PageContainer>
  );
};

export default ResearchOutputsListPage;
