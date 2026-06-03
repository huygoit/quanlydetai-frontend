/** Đoán loại file chứng chỉ từ đuôi URL (bỏ query string). */
const pathWithoutQuery = (url: string) => String(url).split('?')[0] || '';

export const laDuongDanAnhChungChi = (url: string) =>
  /\.(png|jpe?g|jfif|gif|webp|bmp|svg|heic|heif)$/i.test(pathWithoutQuery(url));

export const laDuongDanPdfChungChi = (url: string) => /\.pdf$/i.test(pathWithoutQuery(url));
