/**
 * Lấy message lỗi thân thiện từ response API.
 * Bỏ qua chuỗi Axios kiểu "Request failed with status code 422".
 */

const MAU_AXIOS = /^Request failed with status code \d+/i
const MAU_NETWORK = /^(Network Error|Failed to fetch|timeout of \d+ms exceeded)/i

function chuoiHopLe(v: unknown): string {
  if (v == null) return ''
  const s = String(v).trim()
  if (!s) return ''
  if (MAU_AXIOS.test(s) || MAU_NETWORK.test(s)) return ''
  return s
}

/** Message từ body Adonis / API (message | errors[]). */
export function layThongBaoLoi(
  error: any,
  fallback = 'Đã có lỗi xảy ra.',
): string {
  const data =
    error?.response?.data ?? error?.data ?? error?.info ?? error?.cause ?? {}

  let msg =
    chuoiHopLe(data?.message) ||
    chuoiHopLe(error?.displayMessage) ||
    chuoiHopLe(error?.userMessage)

  if (!msg && Array.isArray(data?.errors) && data.errors.length > 0) {
    const first = data.errors[0]
    msg =
      chuoiHopLe(first?.message) ||
      chuoiHopLe(typeof first === 'string' ? first : '')
  }

  if (!msg && data?.errors && typeof data.errors === 'object') {
    const firstVal = Object.values(data.errors)[0]
    msg = Array.isArray(firstVal)
      ? chuoiHopLe(firstVal[0])
      : chuoiHopLe(firstVal)
  }

  if (!msg) msg = chuoiHopLe(error?.message)

  return msg || fallback
}

/** request() đã toast → catch không toast lại. */
export function daHienThiLoi(error: any): boolean {
  return !!error?.__toastShown
}

/** Toast lỗi một lần: ưu tiên message API, không hiện mã status. */
export function hienThiLoi(
  error: any,
  fallback: string,
  toast: (msg: string) => void,
): void {
  if (daHienThiLoi(error)) return
  toast(layThongBaoLoi(error, fallback))
}
