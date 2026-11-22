/**
 * Editor rich text tối giản (contentEditable + toolbar).
 * Không thêm package — tái dùng cho CFP / thuyết minh.
 */
import React, { useEffect, useRef } from 'react';
import { Button, Form, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  MinusOutlined,
  PlusOutlined,
  LinkOutlined,
  ClearOutlined,
} from '@ant-design/icons';
import './index.less';

export type RichTextHtmlFieldProps = {
  value?: string;
  onChange?: (html: string) => void;
  disabled?: boolean;
  /** Chiều cao tối thiểu vùng soạn (px) */
  minHeight?: number;
  placeholder?: string;
};

type KieuDanhSach = 'bullet' | 'dash' | 'plus';

/** Bỏ HTML rỗng / khối thừa (p/div/br) — tránh ô chữ nhật trống trong editor */
export function cleanRichHtml(html?: string | null): string {
  if (!html) return '';
  let s = String(html).trim();
  if (!s) return '';

  // Chỉ bỏ thuộc tính viền/nền gây “hộp” — giữ font-weight / font-style / underline
  s = s.replace(/\s*style\s*=\s*(["'])([\s\S]*?)\1/gi, (_full, q, css: string) => {
    const cleaned = String(css)
      .split(';')
      .map((x) => x.trim())
      .filter(Boolean)
      .filter(
        (x) =>
          !/^(border|outline|box-shadow|background|background-color)\s*:/i.test(
            x,
          ),
      )
      .join('; ');
    if (!cleaned) return '';
    return ` style=${q}${cleaned}${q}`;
  });

  const text = s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return s;
}

/**
 * HTML để HIỂN THỊ (xem): gắn marker gạch/cộng/chấm thành chữ thật + ép đậm inline.
 * Không phụ thuộc CSS ::before (dễ mất khi form disabled / overflow).
 */
export function htmlChoXem(html?: string | null): string {
  let s = cleanRichHtml(html);
  if (!s) return '';

  const ganMarker = (
    nguon: string,
    nhanUl: RegExp,
    kyTu: string,
  ): string =>
    nguon.replace(nhanUl, (_m, open: string, inner: string, close: string) => {
      const body = inner.replace(
        /<li\b([^>]*)>([\s\S]*?)<\/li>/gi,
        (_li, attrs: string, content: string) => {
          const plain = content
            .replace(/<[^>]+>/g, '')
            .replace(/&nbsp;/gi, ' ')
            .trim();
          if (/^[-–—•+]/.test(plain)) {
            return `<li${attrs}>${content}</li>`;
          }
          return `<li${attrs}><span class="rt-li-marker">${kyTu} </span>${content}</li>`;
        },
      );
      return `${open}${body}${close}`;
    });

  // Dash / plus theo class hoặc data-list
  s = ganMarker(
    s,
    /(<ul\b[^>]*(?:rt-list-dash|data-list\s*=\s*['"]dash['"])[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    '-',
  );
  s = ganMarker(
    s,
    /(<ul\b[^>]*(?:rt-list-plus|data-list\s*=\s*['"]plus['"])[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    '+',
  );
  // UL thường (chưa gắn marker)
  s = ganMarker(
    s,
    /(<ul\b(?![^>]*(?:rt-list-dash|rt-list-plus|data-list\s*=))[^>]*>)([\s\S]*?)(<\/ul>)/gi,
    '•',
  );

  // Ép đậm/nghiêng/gạch chân — bổ sung style nếu chưa có
  const epStyle = (tag: string, css: string) => {
    s = s.replace(
      new RegExp(`<${tag}\\b([^>]*)>`, 'gi'),
      (_m, attrs: string) => {
        if (/style\s*=/i.test(attrs)) {
          return `<${tag}${attrs.replace(
            /style\s*=\s*(["'])([\s\S]*?)\1/i,
            (_s, q, val) => ` style=${q}${css};${val}${q}`,
          )}>`;
        }
        return `<${tag}${attrs} style="${css}">`;
      },
    );
  };
  epStyle('strong', 'font-weight:700');
  epStyle('b', 'font-weight:700');
  epStyle('em', 'font-style:italic');
  epStyle('i', 'font-style:italic');
  epStyle('u', 'text-decoration:underline');

  return s;
}

/** Form.Item rich text: khi chỉ xem truyền value tường minh (Form disabled hay nuốt value). */
export function RichTextFormItem({
  name,
  label,
  rules,
  editable,
  minHeight = 140,
  viewValue,
  placeholder,
}: {
  name: string;
  label: React.ReactNode;
  rules?: any[];
  editable: boolean;
  minHeight?: number;
  /** Giá trị khi xem — lấy từ formInitial / state, không phụ thuộc Form.Item inject */
  viewValue?: string | null;
  placeholder?: string;
}) {
  if (!editable) {
    return (
      <Form.Item label={label}>
        <RichTextHtmlField
          disabled
          value={viewValue ?? ''}
          minHeight={minHeight}
          placeholder={placeholder}
        />
      </Form.Item>
    );
  }
  return (
    <Form.Item name={name} label={label} rules={rules}>
      <RichTextHtmlField minHeight={minHeight} placeholder={placeholder} />
    </Form.Item>
  );
}

/** Tìm thẻ UL gần selection trong vùng editor */
function timUlGanSelection(goc: HTMLElement | null): HTMLUListElement | null {
  const sel = window.getSelection();
  let node: Node | null = sel?.anchorNode || null;
  while (node && node !== goc) {
    if (node instanceof HTMLUListElement) return node;
    node = node.parentNode;
  }
  return null;
}

const RichTextHtmlField: React.FC<RichTextHtmlFieldProps> = ({
  value = '',
  onChange,
  disabled,
  minHeight = 120,
  placeholder,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const dangSoan = useRef(false);

  // Chỉ đồng bộ DOM khi đang biên soạn (contentEditable)
  useEffect(() => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el || dangSoan.current) return;
    if (document.activeElement === el) return;
    const next = cleanRichHtml(value);
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value, disabled]);

  const phatSinhThayDoi = () => {
    const raw = editorRef.current?.innerHTML || '';
    onChange?.(cleanRichHtml(raw));
  };

  const chayLenh = (cmd: string, arg?: string) => {
    if (disabled) return;
    const el = editorRef.current;
    el?.focus();
    document.execCommand(cmd, false, arg);
    phatSinhThayDoi();
  };

  /** Danh sách không thứ tự: chấm tròn / gạch / cộng */
  const chenDanhSach = (kieu: KieuDanhSach) => {
    if (disabled) return;
    const el = editorRef.current;
    el?.focus();

    let ul = timUlGanSelection(el);
    if (!ul) {
      document.execCommand('insertUnorderedList', false);
      ul = timUlGanSelection(el);
    }
    if (ul) {
      ul.classList.remove('rt-list-bullet', 'rt-list-dash', 'rt-list-plus');
      ul.classList.add(`rt-list-${kieu}`);
      ul.setAttribute('data-list', kieu);
    }
    phatSinhThayDoi();
  };

  const xoaDinhDang = () => {
    if (disabled) return;
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;

    try {
      if (document.queryCommandState('insertUnorderedList')) {
        document.execCommand('insertUnorderedList', false);
      }
      if (document.queryCommandState('insertOrderedList')) {
        document.execCommand('insertOrderedList', false);
      }
    } catch {
      // trình duyệt cũ
    }

    document.execCommand('unlink', false);
    document.execCommand('removeFormat', false);

    const sel2 = window.getSelection();
    if (sel2 && sel2.rangeCount && !sel2.getRangeAt(0).collapsed) {
      const plain = sel2.toString();
      const ok = document.execCommand('insertText', false, plain);
      if (!ok) {
        const esc = plain
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br>');
        document.execCommand('insertHTML', false, esc);
      }
    }

    phatSinhThayDoi();
  };

  const chenLienKet = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (!url) return;
    chayLenh('createLink', url);
  };

  // Chế độ xem: HTML tĩnh + marker chữ thật
  if (disabled) {
    const html = htmlChoXem(value);
    return (
      <div className="rich-text-html-field rich-text-html-field--readonly">
        <div
          className="rich-text-html-field__body"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{
            __html: html || '<p></p>',
          }}
        />
      </div>
    );
  }

  return (
    <div className="rich-text-html-field">
      <div className="rich-text-html-field__toolbar">
        <Space size={2} wrap>
          <Tooltip title="In đậm">
            <Button
              type="text"
              size="small"
              icon={<BoldOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('bold');
              }}
            />
          </Tooltip>
          <Tooltip title="In nghiêng">
            <Button
              type="text"
              size="small"
              icon={<ItalicOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('italic');
              }}
            />
          </Tooltip>
          <Tooltip title="Gạch chân">
            <Button
              type="text"
              size="small"
              icon={<UnderlineOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('underline');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách chấm tròn">
            <Button
              type="text"
              size="small"
              icon={<UnorderedListOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chenDanhSach('bullet');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách gạch (-)">
            <Button
              type="text"
              size="small"
              icon={<MinusOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chenDanhSach('dash');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách cộng (+)">
            <Button
              type="text"
              size="small"
              icon={<PlusOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chenDanhSach('plus');
              }}
            />
          </Tooltip>
          <Tooltip title="Danh sách số">
            <Button
              type="text"
              size="small"
              icon={<OrderedListOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chayLenh('insertOrderedList');
              }}
            />
          </Tooltip>
          <Tooltip title="Chèn liên kết">
            <Button
              type="text"
              size="small"
              icon={<LinkOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                chenLienKet();
              }}
            />
          </Tooltip>
          <Tooltip title="Xóa định dạng (vùng bôi đen)">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onMouseDown={(e) => {
                e.preventDefault();
                xoaDinhDang();
              }}
            />
          </Tooltip>
        </Space>
      </div>
      <div
        ref={editorRef}
        className="rich-text-html-field__body"
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder || 'Nhập nội dung...'}
        style={{ minHeight, cursor: 'text' }}
        onFocus={() => {
          dangSoan.current = true;
        }}
        onBlur={() => {
          dangSoan.current = false;
          phatSinhThayDoi();
        }}
        onInput={phatSinhThayDoi}
      />
    </div>
  );
};

export default RichTextHtmlField;
