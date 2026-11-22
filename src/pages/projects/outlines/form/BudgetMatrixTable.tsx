/**
 * Bảng ma trận kinh phí — editable + tự tính.
 * State local để gõ mượt; debounce đồng bộ lên form cha (tránh re-render cả trang).
 */
import {
  EMPTY_BUDGET_MATRIX,
  OUTLINE_BUDGET_EXPENSE_COLUMNS,
  OUTLINE_BUDGET_SOURCE_ROWS,
  addExpenseRows,
  calcRowTotal,
  money0,
  normalizeBudgetMatrix,
  type OutlineBudgetExpenseAmounts,
  type OutlineBudgetExpenseCode,
  type OutlineBudgetMatrix,
  type OutlineBudgetSourceKey,
} from '@/constants/outlineBudgetMatrix';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { InfoCircleOutlined } from '@ant-design/icons';
import { Alert, InputNumber, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type Props = {
  value: OutlineBudgetMatrix;
  onChange: (next: OutlineBudgetMatrix) => void;
  editable: boolean;
  stateBudgetHint?: number;
  nonStateBudgetHint?: number;
};

type MatrixRow = {
  key: OutlineBudgetSourceKey | 'HEADER';
  stt: string;
  label: string;
  kind: 'total' | 'group' | 'input' | 'header';
  indent: number;
  amounts: Record<OutlineBudgetExpenseCode, number>;
  tong: number;
};

type InputSource = 'STATE_LUMP' | 'STATE_NON_LUMP' | 'NON_STATE';

/** Ô nhập tiền — memo để Table không remount không cần thiết */
const MoneyCell = memo(function MoneyCell({
  value,
  disabled,
  onChange,
  onBlurFlush,
}: {
  value: number;
  disabled?: boolean;
  onChange: (v: number | null) => void;
  onBlurFlush?: () => void;
}) {
  return (
    <InputNumber
      size="small"
      min={0}
      precision={0}
      disabled={disabled}
      value={value > 0 ? value : null}
      onChange={onChange}
      onBlur={onBlurFlush}
      style={{ width: '100%' }}
      controls={false}
      {...vndInputNumberProps}
    />
  );
});

function buildRows(matrix: OutlineBudgetMatrix): MatrixRow[] {
  const lump = calcRowTotal(matrix.STATE_LUMP);
  const nonLump = calcRowTotal(matrix.STATE_NON_LUMP);
  const nonState = calcRowTotal(matrix.NON_STATE);
  const stateMerged = calcRowTotal(
    addExpenseRows(matrix.STATE_LUMP, matrix.STATE_NON_LUMP),
  );
  const totalMerged = calcRowTotal(
    addExpenseRows(
      addExpenseRows(matrix.STATE_LUMP, matrix.STATE_NON_LUMP),
      matrix.NON_STATE,
    ),
  );

  const byKey: Record<
    string,
    { amounts: Record<OutlineBudgetExpenseCode, number>; tong: number }
  > = {
    TOTAL: totalMerged,
    STATE: stateMerged,
    STATE_LUMP: lump,
    STATE_NON_LUMP: nonLump,
    NON_STATE: nonState,
  };

  const list: MatrixRow[] = [
    {
      key: 'TOTAL',
      stt: '1',
      label: 'Tổng kinh phí',
      kind: 'total',
      indent: 0,
      amounts: byKey.TOTAL.amounts,
      tong: byKey.TOTAL.tong,
    },
    {
      key: 'HEADER',
      stt: '',
      label: 'Trong đó:',
      kind: 'header',
      indent: 0,
      amounts: {} as Record<OutlineBudgetExpenseCode, number>,
      tong: 0,
    },
  ];

  for (const meta of OUTLINE_BUDGET_SOURCE_ROWS) {
    if (meta.key === 'TOTAL') continue;
    const computed = byKey[meta.key];
    list.push({
      key: meta.key,
      stt: meta.stt,
      label: meta.label,
      kind: meta.kind,
      indent: meta.indent || 0,
      amounts: computed.amounts,
      tong: computed.tong,
    });
  }
  return list;
}

function BudgetMatrixTable({
  value,
  onChange,
  editable,
  stateBudgetHint = 0,
  nonStateBudgetHint = 0,
}: Props) {
  // State local — cập nhật ngay khi gõ, không chờ form cha
  const [local, setLocal] = useState<OutlineBudgetMatrix>(() =>
    normalizeBudgetMatrix(value),
  );
  const localRef = useRef(local);
  localRef.current = local;

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipSyncFromProps = useRef(false);

  // Đồng bộ từ props khi load/lưu (không ghi đè lúc đang gõ)
  useEffect(() => {
    if (skipSyncFromProps.current) return;
    setLocal(normalizeBudgetMatrix(value));
  }, [value]);

  const flushToParent = useCallback((next: OutlineBudgetMatrix) => {
    skipSyncFromProps.current = true;
    onChangeRef.current(next);
    // Cho phép sync props lại sau 1 tick (sau khi cha setState)
    window.setTimeout(() => {
      skipSyncFromProps.current = false;
    }, 0);
  }, []);

  const scheduleParentSync = useCallback(
    (next: OutlineBudgetMatrix) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        debounceTimer.current = null;
        flushToParent(next);
      }, 200);
    },
    [flushToParent],
  );

  const flushNow = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    flushToParent(localRef.current);
  }, [flushToParent]);

  // Unmount: đẩy số đang gõ lên cha trước khi mất state local
  useEffect(
    () => () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        onChangeRef.current(localRef.current);
      }
    },
    [],
  );

  const setCell = useCallback(
    (source: InputSource, code: OutlineBudgetExpenseCode, amount: number | null) => {
      if (code === 'QUAN_LY') return;
      const prev = localRef.current;
      const nextRow: OutlineBudgetExpenseAmounts = {
        ...prev[source],
        [code]: money0(amount),
      };
      const next: OutlineBudgetMatrix = {
        ...prev,
        [source]: nextRow,
      };
      localRef.current = next;
      setLocal(next);
      scheduleParentSync(next);
    },
    [scheduleParentSync],
  );

  const setCellRef = useRef(setCell);
  setCellRef.current = setCell;
  const flushNowRef = useRef(flushNow);
  flushNowRef.current = flushNow;

  const rows = useMemo(() => buildRows(local), [local]);

  // columns CHỈ phụ thuộc editable — không rebuild khi gõ số
  const columns: ColumnsType<MatrixRow> = useMemo(() => {
    const base: ColumnsType<MatrixRow> = [
      {
        title: 'STT',
        dataIndex: 'stt',
        width: 56,
        fixed: 'left',
        align: 'center',
        render: (v, row) =>
          row.kind === 'header' ? null : (
            <Typography.Text strong={row.kind === 'total'}>{v}</Typography.Text>
          ),
      },
      {
        title: 'Nguồn kinh phí',
        dataIndex: 'label',
        width: 220,
        fixed: 'left',
        render: (v, row) => (
          <span
            style={{
              paddingLeft: (row.indent || 0) * 12,
              fontWeight:
                row.kind === 'total' ||
                row.kind === 'group' ||
                row.kind === 'header'
                  ? 600
                  : 400,
              fontStyle: row.kind === 'header' ? 'italic' : undefined,
            }}
          >
            {v}
          </span>
        ),
      },
      {
        title: (
          <Tooltip title="Tự cộng các khoản chi (kể cả quản lý 5%)">
            <span>
              Tổng số <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
            </span>
          </Tooltip>
        ),
        dataIndex: 'tong',
        width: 120,
        fixed: 'left',
        align: 'right',
        render: (v, row) =>
          row.kind === 'header' ? null : (
            <Typography.Text
              strong
              type={row.kind === 'total' ? 'success' : undefined}
            >
              {formatVnd(v)}
            </Typography.Text>
          ),
      },
    ];

    const expenseCols: ColumnsType<MatrixRow> =
      OUTLINE_BUDGET_EXPENSE_COLUMNS.map((col) => ({
        title: (
          <Tooltip
            title={col.hint ? `${col.label} — ${col.hint}` : col.label}
          >
            <div style={{ lineHeight: 1.25, whiteSpace: 'normal' }}>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>{col.colNo}</div>
              <div style={{ fontSize: 12 }}>{col.label}</div>
              {col.hint ? (
                <div style={{ fontSize: 11, color: '#1677ff' }}>
                  ({col.hint})
                </div>
              ) : null}
            </div>
          </Tooltip>
        ),
        dataIndex: ['amounts', col.code],
        width: col.code === 'QUAN_LY' ? 110 : 130,
        align: 'right' as const,
        render: (_: unknown, row: MatrixRow) => {
          if (row.kind === 'header') return null;
          const amount = row.amounts?.[col.code] || 0;
          const canEdit =
            editable && row.kind === 'input' && !col.auto && row.key !== 'HEADER';
          if (!canEdit) {
            return (
              <Typography.Text type={col.auto ? 'secondary' : undefined}>
                {amount ? formatVnd(amount) : '—'}
              </Typography.Text>
            );
          }
          return (
            <MoneyCell
              value={amount}
              onChange={(v) =>
                setCellRef.current(row.key as InputSource, col.code, v)
              }
              onBlurFlush={() => flushNowRef.current()}
            />
          );
        },
      }));

    return [...base, ...expenseCols];
  }, [editable]);

  const stateTong = rows.find((r) => r.key === 'STATE')?.tong || 0;
  const nonStateTong = rows.find((r) => r.key === 'NON_STATE')?.tong || 0;
  // Cảnh báo khi dòng ma trận lớn hơn nguồn đề xuất tương ứng
  const lechState = stateBudgetHint > 0 && stateTong > stateBudgetHint;
  const lechNonState =
    nonStateBudgetHint > 0 && nonStateTong > nonStateBudgetHint;

  return (
    <div>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
        Nhập số tiền theo từng khoản chi cho các dòng a/b và ngoài NSNN. Cột{' '}
        <strong>Tổng số</strong> và <strong>Quản lý chung (5%)</strong> tự tính.
        Dòng Tổng / NSNN tự cộng từ các dòng con.
      </Typography.Paragraph>
      {(lechState || lechNonState) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          message="Tổng ma trận lớn hơn nguồn kinh phí đề xuất"
          description={
            <>
              {lechState && (
                <div>
                  NSNN: ma trận {formatVnd(stateTong)} &gt; đề xuất{' '}
                  {formatVnd(stateBudgetHint)}
                </div>
              )}
              {lechNonState && (
                <div>
                  Ngoài NSNN: ma trận {formatVnd(nonStateTong)} &gt; đề xuất{' '}
                  {formatVnd(nonStateBudgetHint)}
                </div>
              )}
            </>
          }
        />
      )}
      <Table<MatrixRow>
        size="small"
        bordered
        pagination={false}
        rowKey="key"
        dataSource={rows}
        columns={columns}
        scroll={{ x: 2200 }}
        rowClassName={(row) => {
          if (row.kind === 'total') return 'budget-row-total';
          if (row.kind === 'group') return 'budget-row-group';
          if (row.kind === 'header') return 'budget-row-header';
          return '';
        }}
      />
      <style>{`
        .budget-row-total td { background: #e6f4ff !important; }
        .budget-row-group td { background: #f6ffed !important; }
        .budget-row-header td { background: #fafafa !important; }
      `}</style>
    </div>
  );
}

export { EMPTY_BUDGET_MATRIX };
export default memo(BudgetMatrixTable);
