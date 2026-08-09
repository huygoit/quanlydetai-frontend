/**
 * Editor rich text tối giản (contentEditable + toolbar).
 * Không thêm package — tái dùng cho CFP / thuyết minh.
 */
import React, { useEffect, useRef } from 'react';
import { Button, Space, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
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

/** Bỏ HTML rỗng / khối thừa (p/div/br) — tránh ô chữ nhật trống trong editor */
export function cleanRichHtml(html?: string | null): string {
  if (!html) return '';
  let s = String(html).trim();
  if (!s) return '';

  // Bỏ style viền/nền hay gây “hộp” thừa (paste Word / trình duyệt)
  s = s.replace(/\s*style\s*=\s*(["'])[\s\S]*?\1/gi, (full) => {
    if (/border|outline|box-shadow|background/i.test(full)) return '';
    return full;
  });

  const text = s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return '';
  return s;
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

  useEffect(() => {
    const el = editorRef.current;
    if (!el || dangSoan.current) return;
    if (document.activeElement === el) return;
    const next = cleanRichHtml(value);
    if (el.innerHTML !== next) {
      el.innerHTML = next;
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.contentEditable = disabled ? 'false' : 'true';
    }
  }, [disabled]);

  const phatSinhThayDoi = () => {
    const raw = editorRef.current?.innerHTML || '';
    onChange?.(cleanRichHtml(raw));
  };

  const chayLenh = (cmd: string, arg?: string) => {
    if (disabled) return;
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    phatSinhThayDoi();
  };

  const chenLienKet = () => {
    const url = window.prompt('Nhập URL liên kết:');
    if (!url) return;
    chayLenh('createLink', url);
  };

  return (
    <div className="rich-text-html-field">
      {!disabled && (
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
            <Tooltip title="Danh sách">
              <Button
                type="text"
                size="small"
                icon={<UnorderedListOutlined />}
                onMouseDown={(e) => {
                  e.preventDefault();
                  chayLenh('insertUnorderedList');
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
            <Tooltip title="Xóa định dạng">
              <Button
                type="text"
                size="small"
                icon={<ClearOutlined />}
                onMouseDown={(e) => {
                  e.preventDefault();
                  chayLenh('removeFormat');
                }}
              />
            </Tooltip>
          </Space>
        </div>
      )}
      <div
        ref={editorRef}
        className="rich-text-html-field__body"
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder || 'Nhập nội dung...'}
        style={{ minHeight, cursor: disabled ? 'default' : 'text' }}
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
