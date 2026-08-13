/**
 * Xuất báo cáo Thống kê kết quả NCKH ra file Excel (HTML table → .xls).
 * Không gọi API — dùng dữ liệu đã tải trên trang (tránh 504 proxy khi nhiều cột).
 */
import type { NckhDataColumnNode, NckhDataReport } from '@/services/api/kpiReports';
import { downloadBlob } from '@/utils/download';

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function demLa(node: NckhDataColumnNode): number {
  if (node.level === 3) return 1;
  return (node.children || []).reduce((s, c) => s + demLa(c), 0);
}

/** Tạo file .xls (Excel mở được) từ payload báo cáo đã có. */
export function downloadNckhDataReportExcel(report: NckhDataReport): void {
  const leafColumns = report.leafColumns || [];
  const columnTree = report.columnTree || [];
  if (!leafColumns.length) {
    throw new Error('Chưa chọn cột loại kết quả. Mở Cấu hình cột trước.');
  }

  const title = `DỮ LIỆU NCKH CỦA ${(report.faculty || '').toUpperCase()}`;
  const period = report.period_label || report.academic_year || '';
  const colSpanAll = 3 + leafColumns.length + 2;

  let thead = '<tr>';
  thead += `<th rowspan="3">Số TT</th>`;
  thead += `<th rowspan="3" colspan="2">Họ và tên</th>`;
  for (const l1 of columnTree) {
    thead += `<th colspan="${demLa(l1)}">${escapeHtml(l1.name)}</th>`;
  }
  thead += `<th rowspan="3">Giờ Nghiên cứu khoa học</th>`;
  thead += `<th rowspan="3">Ghi chú</th>`;
  thead += '</tr><tr>';
  for (const l1 of columnTree) {
    for (const l2 of l1.children || []) {
      thead += `<th colspan="${demLa(l2)}">${escapeHtml(l2.name)}</th>`;
    }
  }
  thead += '</tr><tr>';
  for (const leaf of leafColumns) {
    thead += `<th>${escapeHtml(leaf.name)}</th>`;
  }
  thead += '</tr>';

  let tbody = '';
  for (const r of report.rows || []) {
    tbody += '<tr>';
    tbody += `<td>${r.stt}</td>`;
    tbody += `<td>${escapeHtml(r.hoTenDem)}</td>`;
    tbody += `<td>${escapeHtml(r.ten)}</td>`;
    for (const leaf of leafColumns) {
      const v = r.counts?.[String(leaf.id)] || 0;
      tbody += `<td>${v || ''}</td>`;
    }
    tbody += `<td>${r.hours || ''}</td>`;
    tbody += `<td>${escapeHtml(r.note)}</td>`;
    tbody += '</tr>';
  }

  const t = report.totals;
  if (t) {
    tbody += '<tr>';
    tbody += `<td colspan="3"><b>Tổng cộng</b></td>`;
    for (const leaf of leafColumns) {
      tbody += `<td><b>${t.counts?.[String(leaf.id)] || 0}</b></td>`;
    }
    tbody += `<td><b>${t.hours || 0}</b></td>`;
    tbody += '<td></td>';
    tbody += '</tr>';
  }

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>Du lieu NCKH</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
<style>
  table { border-collapse: collapse; font-family: "Times New Roman", Times, serif; font-size: 11pt; }
  th, td {
    border: .5pt solid windowtext;
    mso-border-alt: solid windowtext .5pt;
    padding: 2px 4px;
    vertical-align: top;
  }
  th { background: #fbf4cf; font-weight: bold; text-align: center; }
  .title { font-size: 14pt; font-weight: bold; text-align: center; }
  .sub { font-weight: bold; text-align: center; }
</style>
</head>
<body>
<table>
  <tr><td class="title" colspan="${colSpanAll}">${escapeHtml(title)}</td></tr>
  <tr><td class="sub" colspan="${colSpanAll}">${escapeHtml(period)}</td></tr>
  <thead>${thead}</thead>
  <tbody>${tbody}</tbody>
</table>
</body>
</html>`;

  const safe =
    (report.faculty || 'don-vi')
      .replace(/[^\p{L}\p{N}\-_ ]/gu, '')
      .trim()
      .slice(0, 40) || 'don-vi';

  // .xls (HTML) — Excel / LibreOffice mở được; không phụ thuộc API.
  const blob = new Blob(['\uFEFF', html], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  downloadBlob(blob, `thong-ke-ket-qua-nckh-${safe}.xls`);
}
