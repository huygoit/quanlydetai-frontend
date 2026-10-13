import {
  HAN_FILE,
  MUC_CHI,
  NHAN_TRIEN_KHAI,
  NHAN_VAI_TRO_HD,
  NHAN_XEP_LOAI,
  nhanMuc,
} from '@/constants/module56';
import {
  bghThanhLy,
  cnnvThanhLy,
  duyetHoSoCuoiKy,
  giaHanGiaiTrinh,
  hoSoCuoiKy,
  luuBienBan,
  luuGiaiTrinh,
  luuHoiDong,
  luuHoSoCuoiKy,
  luuPhieuCham,
  luuQuyetToan,
  luuThanhLy,
  moLaiBienBanCuoiKy,
  nhacPhanBien,
  phatHanhThanhLy,
  pkhQuyetToan,
  quyetDinhKhongDat,
  tcQuyetToan,
  thongBaoCuoiKy,
  trinhThanhLy,
  xacNhanChenhLech,
  xacNhanGiaiTrinh,
  type HoSoCuoiKy,
  type TepModule56,
} from '@/services/api/module56';
import { getAvailableOutlineReviewers } from '@/services/api/projectOutlineReviews';
import { isAdminKeKhaiUser } from '@/utils/adminKeKhai';
import { formatVnd, vndInputNumberProps } from '@/utils/format';
import { resolvePublicAssetUrl } from '@/utils/publicAssetUrl';
import { useModel } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { ChonTep } from './ChonTep';
import type { VaiTro } from './types';

function bao(e: any) {
  return e?.data?.message || e?.message || 'Thất bại';
}

function PhieuCham({
  outlineId,
  ten,
  onXong,
}: {
  outlineId: number;
  ten: string[];
  onXong: () => void;
}) {
  const [volumeComment, setVolume] = useState('');
  const [qualityComment, setQuality] = useState('');
  const [reportComment, setReport] = useState('');
  const [generalComment, setGeneral] = useState('');
  const [rows, setRows] = useState(
    ten.map((name) => ({ name, actual: '', comment: '' })),
  );
  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 12 }}>
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét khối lượng"
        value={volumeComment}
        onChange={(e) => setVolume(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét chất lượng"
        value={qualityComment}
        onChange={(e) => setQuality(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Nhận xét báo cáo"
        value={reportComment}
        onChange={(e) => setReport(e.target.value)}
      />
      <Input.TextArea
        rows={4}
        placeholder="Nhận xét chung (≥ 100 ký tự)"
        value={generalComment}
        onChange={(e) => setGeneral(e.target.value)}
      />
      {rows.map((r, i) => (
        <Space key={r.name}>
          <span>{r.name}</span>
          <Input
            placeholder="Thực tế"
            value={r.actual}
            onChange={(e) =>
              setRows((s) =>
                s.map((x, j) =>
                  j === i ? { ...x, actual: e.target.value } : x,
                ),
              )
            }
          />
          <Input
            placeholder="Nhận xét"
            value={r.comment}
            onChange={(e) =>
              setRows((s) =>
                s.map((x, j) =>
                  j === i ? { ...x, comment: e.target.value } : x,
                ),
              )
            }
          />
        </Space>
      ))}
      <Button
        type="primary"
        onClick={() =>
          luuPhieuCham(outlineId, {
            volumeComment,
            qualityComment,
            reportComment,
            generalComment,
            productRows: rows,
          })
            .then(() => onXong())
            .catch((e) => message.error(bao(e)))
        }
      >
        Nộp phiếu chấm
      </Button>
    </Space>
  );
}

function BienBan({
  outlineId,
  members,
  ten,
  onXong,
}: {
  outlineId: number;
  members: { userId: number; role: string; fullName?: string; name?: string }[];
  ten: string[];
  onXong: () => void;
}) {
  const [present, setPresent] = useState<number[]>([]);
  const [classification, setClassification] = useState('DAT_YEU_CAU');
  const [discussion, setDiscussion] = useState('');
  const [volume, setVolume] = useState('');
  const [quality, setQuality] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [marks, setMarks] = useState<Record<string, boolean>>({});
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {members.map((m) => (
        <Checkbox
          key={m.userId}
          checked={present.includes(m.userId)}
          onChange={(e) =>
            setPresent((s) =>
              e.target.checked
                ? [...s, m.userId]
                : s.filter((id) => id !== m.userId),
            )
          }
        >
          Có mặt {m.fullName || m.name || `#${m.userId}`} (
          {NHAN_VAI_TRO_HD[m.role as 'CHU_TICH'] || m.role})
        </Checkbox>
      ))}
      <Select
        value={classification}
        options={Object.entries(NHAN_XEP_LOAI).map(([value, label]) => ({
          value,
          label,
        }))}
        onChange={setClassification}
      />
      <Input.TextArea
        rows={2}
        placeholder="Thảo luận"
        value={discussion}
        onChange={(e) => setDiscussion(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Khối lượng"
        value={volume}
        onChange={(e) => setVolume(e.target.value)}
      />
      <Input.TextArea
        rows={2}
        placeholder="Chất lượng"
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
      />
      <Input.TextArea
        rows={3}
        placeholder="Mỗi kiến nghị một dòng"
        value={recommendation}
        onChange={(e) => setRecommendation(e.target.value)}
      />
      {ten.map((name) => (
        <Checkbox
          key={name}
          checked={!!marks[name]}
          onChange={(e) =>
            setMarks((s) => ({ ...s, [name]: e.target.checked }))
          }
        >
          Đạt: {name}
        </Checkbox>
      ))}
      <Button
        type="primary"
        onClick={() =>
          luuBienBan(outlineId, {
            presentUserIds: present,
            classification,
            discussion,
            volume,
            quality,
            recommendation,
            productMarks: ten.map((name) => ({ name, met: !!marks[name] })),
          })
            .then(() => onXong())
            .catch((e) => message.error(bao(e)))
        }
      >
        Lưu biên bản
      </Button>
    </Space>
  );
}

function GiaiTrinh({
  hs,
  vaiTro,
  toiRole,
  outlineId,
  onXong,
}: {
  hs: HoSoCuoiKy;
  vaiTro: VaiTro;
  toiRole?: string;
  outlineId: number;
  onXong: () => void;
}) {
  const dong = hs.minutes?.recommendation
    ? hs.minutes.recommendation
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : (hs.explanation.items || []).map((it) => it.text || '');
  const [items, setItems] = useState(
    dong.map((text, i) => hs.explanation.items?.[i]?.response || ''),
  );
  const [reportFile, setReportFile] = useState<TepModule56 | null>(
    hs.explanation.reportFile,
  );
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      {hs.explanation.deadline && (
        <div>Hạn: {dayjs(hs.explanation.deadline).format('DD/MM/YYYY')}</div>
      )}
      {hs.explanation.returnReason && (
        <Alert type="warning" message={hs.explanation.returnReason} />
      )}
      {dong.map((text, i) => (
        <div key={i}>
          <div>{text || `Kiến nghị ${i + 1}`}</div>
          <Input.TextArea
            rows={2}
            value={items[i]}
            onChange={(e) =>
              setItems((s) => s.map((x, j) => (j === i ? e.target.value : x)))
            }
          />
        </div>
      ))}
      {vaiTro.canCnnv &&
        (!hs.explanation.status || hs.explanation.status === 'TRA_LAI') && (
          <>
            <ChonTep
              maxBytes={HAN_FILE.tomTat}
              nhan="File báo cáo giải trình"
              onCo={setReportFile}
            />
            <Button
              type="primary"
              onClick={() =>
                luuGiaiTrinh(outlineId, {
                  submit: true,
                  items: items.map((response) => ({ response })),
                  reportFile,
                })
                  .then(onXong)
                  .catch((e) => message.error(bao(e)))
              }
            >
              Nộp giải trình
            </Button>
          </>
        )}
      {toiRole === 'THU_KY' && hs.explanation.status === 'CHO_THU_KY' && (
        <Button
          onClick={() =>
            xacNhanGiaiTrinh(outlineId, { accept: true })
              .then(onXong)
              .catch((e) => message.error(bao(e)))
          }
        >
          Thư ký xác nhận
        </Button>
      )}
      {toiRole === 'CHU_TICH' && hs.explanation.status === 'CHO_CHU_TICH' && (
        <Button
          onClick={() =>
            xacNhanGiaiTrinh(outlineId, { accept: true })
              .then(onXong)
              .catch((e) => message.error(bao(e)))
          }
        >
          Chủ tịch xác nhận
        </Button>
      )}
      {vaiTro.canManage && (
        <Button
          onClick={() => {
            const deadline = window.prompt('Hạn mới YYYY-MM-DD') || '';
            if (!deadline.trim()) return;
            giaHanGiaiTrinh(outlineId, deadline.trim())
              .then(onXong)
              .catch((e) => message.error(bao(e)));
          }}
        >
          Gia hạn giải trình
        </Button>
      )}
    </Space>
  );
}

export function TabCuoiKy({
  outlineId,
  vaiTro,
  sanPham,
  ketThuc,
  onXong,
  onDaMoLai,
}: {
  outlineId: number;
  vaiTro: VaiTro;
  sanPham: string[];
  ketThuc?: string | null;
  onXong: (t: string) => void;
  onDaMoLai?: () => void;
}) {
  const { initialState } = useModel('@@initialState');
  const laAdmin = isAdminKeKhaiUser(initialState?.currentUser);
  const [hs, setHs] = useState<HoSoCuoiKy | null>(null);
  const [loi, setLoi] = useState('');
  const [resultVi, setResultVi] = useState('');
  const [resultEn, setResultEn] = useState('');
  const [products, setProducts] = useState<
    { name: string; fileUrl?: string; link?: string }[]
  >([]);
  const [summaryFile, setSummaryFile] = useState<TepModule56 | null>(null);
  const [briefFile, setBriefFile] = useState<TepModule56 | null>(null);
  const [councilFile, setCouncilFile] = useState<TepModule56 | null>(null);
  const [publicationsNote, setPublicationsNote] = useState('');
  const [soTrangOk, setSoTrangOk] = useState(false);
  const [fileCongNhan, setFileCongNhan] = useState('');
  const [thanhVien, setThanhVien] = useState<
    { userId: number; role: string; name?: string }[]
  >([]);
  const [nguoi, setNguoi] = useState<{ value: number; label: string }[]>([]);
  const [khai, setKhai] = useState<Record<string, number>>({});
  const [taiSan, setTaiSan] = useState<
    { name: string; quantity: string; amount: number; note: string }[]
  >([]);
  const [surplusHandling, setSurplusHandling] = useState('KHONG_PHAT_SINH');
  const [tepQt, setTepQt] = useState<TepModule56[]>([]);

  const tai = () =>
    hoSoCuoiKy(outlineId)
      .then((res) => {
        const d = res.data;
        setHs(d);
        setLoi('');
        setResultVi(d.dossier.resultVi || '');
        setResultEn(d.dossier.resultEn || '');
        const ten = sanPham.length
          ? sanPham
          : (d.dossier.products || []).map((p) => p.name);
        setProducts(
          ten.map((name) => {
            const cu = (d.dossier.products || []).find((p) => p.name === name);
            return { name, fileUrl: cu?.fileUrl || '', link: cu?.link || '' };
          }),
        );
        setSummaryFile(d.dossier.summaryFile);
        setBriefFile(d.dossier.briefFile);
        setCouncilFile(d.dossier.councilFile);
        setPublicationsNote(d.dossier.publicationsNote || '');
        setSoTrangOk(!!d.dossier.briefPagesOk);
        setFileCongNhan(d.liquidation.recognitionFileUrl || '');
        setThanhVien(
          (d.council.members || []).map((m) => ({
            userId: m.userId,
            role: m.role,
            name: m.fullName || m.name,
          })),
        );
        const map: Record<string, number> = {};
        MUC_CHI.forEach((m) => {
          map[m.code] =
            d.settlement.lines.find((l) => l.code === m.code)?.declaredAmount ||
            0;
        });
        setKhai(map);
        setTaiSan(
          (d.assets || []).map((a) => ({
            name: a.name,
            quantity: a.quantity || '1',
            amount: a.amount || 0,
            note: a.note || '',
          })),
        );
        setSurplusHandling(d.liquidation.surplusHandling || 'KHONG_PHAT_SINH');
      })
      .catch((e) => setLoi(bao(e)));

  useEffect(() => {
    tai();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlineId, sanPham.join('|')]);

  if (loi && !hs) return <Alert type="error" message={loi} />;
  if (!hs) return <Alert type="info" message="Đang tải hồ sơ đánh giá..." />;

  const st = hs.executionStatus;
  const con30 = ketThuc ? dayjs(ketThuc).diff(dayjs(), 'day') <= 30 : false;
  const duocNop = !!hs.dossier.notifiedAt || con30;
  const toi = hs.council.members.find((m) => m.userId === vaiTro.userId);
  const chenh = MUC_CHI.some((m) => {
    const spent = hs.finance.lines.find((l) => l.code === m.code)?.spent || 0;
    return Number(khai[m.code] || 0) !== spent;
  });

  const nopHoSo = async (submit: boolean) => {
    try {
      await luuHoSoCuoiKy(outlineId, {
        submit,
        summaryFile,
        briefFile,
        resultVi,
        resultEn,
        products,
        publicationsNote,
        councilFile,
      });
      onXong(submit ? 'Đã nộp hồ sơ' : 'Đã lưu hồ sơ');
      await tai();
    } catch (e: any) {
      message.error(bao(e));
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type={hs.overdueExplanation ? 'warning' : 'info'}
        message={`Vòng đời: ${NHAN_TRIEN_KHAI[st || ''] || st || '—'}`}
        description={
          hs.overdueExplanation ? 'Đã quá hạn giải trình.' : undefined
        }
      />
      {hs.reviewDeadlineTight && (
        <Alert type="warning" message="Hạn phản biện đang sát." />
      )}
      {hs.minutesLocked && laAdmin && (
        <Button
          onClick={() => {
            let reason = '';
            Modal.confirm({
              title: 'Mở lại biên bản',
              okText: 'Mở lại',
              cancelText: 'Hủy',
              content: (
                <Input.TextArea
                  rows={3}
                  placeholder="Lý do (tối thiểu 5 ký tự)"
                  onChange={(e) => {
                    reason = e.target.value;
                  }}
                />
              ),
              onOk: async () => {
                if (reason.trim().length < 5) {
                  message.warning('Lý do tối thiểu 5 ký tự');
                  return Promise.reject();
                }
                await moLaiBienBanCuoiKy(outlineId, reason.trim());
                onXong('Đã mở lại biên bản');
                await tai();
                onDaMoLai?.();
              },
            });
          }}
        >
          Mở lại biên bản
        </Button>
      )}

      {vaiTro.canManage &&
        !hs.dossier.notifiedAt &&
        ['DANG_THUC_HIEN', 'DGCK_DRAFT', 'DGCK_BS', null].includes(st) && (
          <Button
            onClick={() =>
              thongBaoCuoiKy(outlineId)
                .then(() => {
                  onXong('Đã gửi thông báo');
                  tai();
                })
                .catch((e) => message.error(bao(e)))
            }
          >
            PKH gửi thông báo nộp hồ sơ
          </Button>
        )}

      <Card size="small" title="Hồ sơ cuối kỳ">
        {!duocNop && (
          <Alert
            style={{ marginBottom: 8 }}
            type="warning"
            message="Chưa tới hạn nộp chính thức (còn hơn 30 ngày và chưa có thông báo)."
          />
        )}
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            Báo cáo tổng hợp (≤ 30MB): {summaryFile?.fileName || 'chưa có'}{' '}
            {vaiTro.canCnnv && (
              <ChonTep
                maxBytes={HAN_FILE.tomTat}
                nhan="Tải"
                onCo={setSummaryFile}
              />
            )}
          </div>
          <div>
            Báo cáo tóm tắt (≤ 10MB): {briefFile?.fileName || 'chưa có'}{' '}
            {vaiTro.canCnnv && (
              <ChonTep
                maxBytes={HAN_FILE.tomTatNgan}
                nhan="Tải"
                onCo={setBriefFile}
              />
            )}
          </div>
          <Input.TextArea
            rows={3}
            value={resultVi}
            placeholder="Kết quả tiếng Việt"
            onChange={(e) => setResultVi(e.target.value)}
          />
          <Input.TextArea
            rows={3}
            value={resultEn}
            placeholder="Kết quả tiếng Anh"
            onChange={(e) => setResultEn(e.target.value)}
          />
          <Input.TextArea
            rows={2}
            value={publicationsNote}
            placeholder="Ghi chú công bố"
            onChange={(e) => setPublicationsNote(e.target.value)}
          />
          <div>
            File hội đồng (nếu có): {councilFile?.fileName || 'chưa có'}{' '}
            {vaiTro.canCnnv && (
              <ChonTep
                maxBytes={HAN_FILE.tomTat}
                nhan="Tải"
                onCo={setCouncilFile}
              />
            )}
          </div>
          {products.map((p, i) => (
            <Space key={p.name} style={{ display: 'flex' }}>
              <span style={{ minWidth: 160 }}>{p.name}</span>
              <Input
                placeholder="Link"
                value={p.link}
                onChange={(e) =>
                  setProducts((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, link: e.target.value } : x,
                    ),
                  )
                }
              />
              <ChonTep
                maxBytes={HAN_FILE.tomTat}
                nhan={p.fileUrl ? 'Đổi file' : 'File'}
                onCo={(t) =>
                  setProducts((s) =>
                    s.map((x, j) =>
                      j === i ? { ...x, fileUrl: t.fileUrl } : x,
                    ),
                  )
                }
              />
            </Space>
          ))}
          {vaiTro.canCnnv &&
            ['DANG_THUC_HIEN', 'DGCK_DRAFT', 'DGCK_BS', null].includes(st) && (
              <Space>
                <Button onClick={() => nopHoSo(false)}>Lưu nháp</Button>
                <Button
                  type="primary"
                  disabled={!duocNop}
                  onClick={() => nopHoSo(true)}
                >
                  Nộp chính thức
                </Button>
              </Space>
            )}
          {vaiTro.canManage && st === 'DGCK_CHO_PKH' && (
            <Space direction="vertical">
              <Checkbox
                checked={soTrangOk}
                onChange={(e) => setSoTrangOk(e.target.checked)}
              >
                Báo cáo tóm tắt không quá 15 trang
              </Checkbox>
              <Space>
                <Button
                  type="primary"
                  disabled={!soTrangOk}
                  onClick={() =>
                    duyetHoSoCuoiKy(outlineId, {
                      accept: true,
                      briefPagesOk: true,
                    })
                      .then(tai)
                      .catch((e) => message.error(bao(e)))
                  }
                >
                  Chuyển họp hội đồng
                </Button>
                <Button
                  onClick={() => {
                    const note = window.prompt('Lý do trả') || '';
                    if (!note.trim()) return;
                    duyetHoSoCuoiKy(outlineId, {
                      accept: false,
                      briefPagesOk: false,
                      note: note.trim(),
                    })
                      .then(tai)
                      .catch((e) => message.error(bao(e)));
                  }}
                >
                  Trả bổ sung
                </Button>
              </Space>
            </Space>
          )}
        </Space>
      </Card>

      {st === 'DGCK_HOP_HD' && (
        <Card size="small" title="Hội đồng">
          {vaiTro.canManage && !hs.minutesLocked && (
            <Space
              direction="vertical"
              style={{ width: '100%', marginBottom: 12 }}
            >
              <DatePicker
                showTime
                placeholder="Thời gian họp"
                defaultValue={
                  hs.council.meetingAt ? dayjs(hs.council.meetingAt) : undefined
                }
                onChange={(v) =>
                  setHs({
                    ...hs,
                    council: {
                      ...hs.council,
                      meetingAt: v ? v.toISOString() : null,
                    },
                  })
                }
              />
              <Input
                placeholder="Địa điểm"
                value={hs.council.location || ''}
                onChange={(e) =>
                  setHs({
                    ...hs,
                    council: { ...hs.council, location: e.target.value },
                  })
                }
              />
              <Select
                showSearch
                filterOption={false}
                placeholder="Thêm thành viên"
                options={nguoi}
                onSearch={async (kw) => {
                  const res = await getAvailableOutlineReviewers(
                    outlineId,
                    kw,
                  ).catch(() => null);
                  setNguoi(
                    (res?.data || [])
                      .filter((r) => r.reviewerUserId)
                      .map((r) => ({
                        value: r.reviewerUserId as number,
                        label: r.reviewerName,
                      })),
                  );
                }}
                onChange={(userId, opt) => {
                  const label = (opt as { label?: string }).label;
                  setThanhVien((s) =>
                    s.some((m) => m.userId === userId)
                      ? s
                      : [...s, { userId, role: 'UY_VIEN', name: label }],
                  );
                }}
              />
              {thanhVien.map((m) => (
                <Space key={m.userId}>
                  <span>{m.name || m.userId}</span>
                  <Select
                    style={{ width: 140 }}
                    value={m.role}
                    options={Object.entries(NHAN_VAI_TRO_HD).map(
                      ([value, label]) => ({ value, label }),
                    )}
                    onChange={(role) =>
                      setThanhVien((s) =>
                        s.map((x) =>
                          x.userId === m.userId ? { ...x, role } : x,
                        ),
                      )
                    }
                  />
                  <a
                    onClick={() =>
                      setThanhVien((s) =>
                        s.filter((x) => x.userId !== m.userId),
                      )
                    }
                  >
                    Xóa
                  </a>
                  {m.role === 'PHAN_BIEN' && (
                    <a
                      onClick={() =>
                        nhacPhanBien(outlineId, m.userId)
                          .then(() => onXong('Đã nhắc'))
                          .catch((e) => message.error(bao(e)))
                      }
                    >
                      Nhắc
                    </a>
                  )}
                </Space>
              ))}
              <Button
                type="primary"
                onClick={() =>
                  luuHoiDong(outlineId, {
                    meetingAt: hs.council.meetingAt,
                    location: hs.council.location,
                    members: thanhVien.map((m) => ({
                      userId: m.userId,
                      role: m.role,
                    })),
                  })
                    .then(tai)
                    .catch((e) => message.error(bao(e)))
                }
              >
                Lưu hội đồng
              </Button>
            </Space>
          )}
          {toi?.role === 'PHAN_BIEN' && !hs.minutesLocked && (
            <PhieuCham
              outlineId={outlineId}
              ten={products.map((p) => p.name)}
              onXong={() => tai()}
            />
          )}
          {vaiTro.canManage &&
            !hs.minutesLocked &&
            hs.council.members.length > 0 && (
              <BienBan
                outlineId={outlineId}
                members={hs.council.members}
                ten={products.map((p) => p.name)}
                onXong={tai}
              />
            )}
          {hs.minutesFileUrl && (
            <a
              href={resolvePublicAssetUrl(hs.minutesFileUrl)}
              target="_blank"
              rel="noreferrer"
            >
              Tải biên bản
            </a>
          )}
        </Card>
      )}

      {st === 'DGCK_KHONG_DAT' && vaiTro.canManage && (
        <Space>
          <Button
            onClick={() =>
              quyetDinhKhongDat(outlineId, true)
                .then(tai)
                .catch((e) => message.error(bao(e)))
            }
          >
            Cho làm lại
          </Button>
          <Button
            danger
            onClick={() =>
              quyetDinhKhongDat(outlineId, false)
                .then(tai)
                .catch((e) => message.error(bao(e)))
            }
          >
            Đình chỉ
          </Button>
        </Space>
      )}

      {st === 'DGCK_CHINH_SUA' && (
        <Card size="small" title="Giải trình">
          <GiaiTrinh
            hs={hs}
            vaiTro={vaiTro}
            toiRole={toi?.role}
            outlineId={outlineId}
            onXong={tai}
          />
        </Card>
      )}

      {st === 'DGCK_CHO_QUYET_TOAN' && (
        <Card size="small" title="Quyết toán">
          {MUC_CHI.map((m) => (
            <div key={m.code} style={{ marginBottom: 6 }}>
              {nhanMuc(m.code)} (đã chi{' '}
              {formatVnd(
                hs.finance.lines.find((l) => l.code === m.code)?.spent,
              )}
              ){' '}
              <InputNumber
                {...vndInputNumberProps}
                min={0}
                value={khai[m.code] || 0}
                disabled={!vaiTro.canCnnv}
                onChange={(v) =>
                  setKhai((s) => ({ ...s, [m.code]: Number(v || 0) }))
                }
              />
            </div>
          ))}
          {vaiTro.canCnnv &&
            (!hs.settlement.status ||
              ['QT_DRAFT', 'QT_BS'].includes(hs.settlement.status)) && (
              <>
                <ChonTep
                  maxBytes={HAN_FILE.phieu}
                  nhan="File quyết toán"
                  onCo={(t) => setTepQt((s) => [...s, t])}
                />
                {tepQt.map((t) => (
                  <div key={t.fileUrl}>{t.fileName}</div>
                ))}
                <Button
                  type="primary"
                  onClick={() =>
                    luuQuyetToan(outlineId, {
                      submit: true,
                      lines: MUC_CHI.map((m) => ({
                        code: m.code,
                        declaredAmount: Number(khai[m.code] || 0),
                      })),
                      files: tepQt,
                    })
                      .then(tai)
                      .catch((e) => message.error(bao(e)))
                  }
                >
                  Nộp quyết toán
                </Button>
              </>
            )}
          {vaiTro.canManage && hs.settlement.status === 'QT_CHO_PKH' && (
            <Space>
              <Button
                onClick={() =>
                  pkhQuyetToan(outlineId, { accept: true })
                    .then(tai)
                    .catch((e) => message.error(bao(e)))
                }
              >
                Chuyển KH-TC
              </Button>
              {chenh && !hs.settlement.varianceAck && (
                <Button
                  onClick={() => {
                    const reason =
                      window.prompt('Lý do chênh với sổ chi') || '';
                    if (!reason.trim()) return;
                    xacNhanChenhLech(outlineId, reason.trim())
                      .then(tai)
                      .catch((e) => message.error(bao(e)));
                  }}
                >
                  Xác nhận chênh lệch
                </Button>
              )}
            </Space>
          )}
          {vaiTro.canTc && hs.settlement.status === 'QT_CHO_TC' && (
            <Button
              type="primary"
              onClick={() => {
                const date =
                  window.prompt(
                    'Ngày quyết toán YYYY-MM-DD',
                    dayjs().format('YYYY-MM-DD'),
                  ) || '';
                if (!date.trim()) return;
                tcQuyetToan(outlineId, { accept: true, date: date.trim() })
                  .then(tai)
                  .catch((e) => message.error(bao(e)));
              }}
            >
              KH-TC xác nhận
            </Button>
          )}
          {hs.settlement.status && <Tag>{hs.settlement.status}</Tag>}
        </Card>
      )}

      {st === 'DGCK_CHO_THANH_LY' && (
        <Card
          size="small"
          title={`Thanh lý · số dư ${formatVnd(hs.liquidation.surplus)}`}
          extra={
            hs.liquidation.fileUrl ? (
              <a href={resolvePublicAssetUrl(hs.liquidation.fileUrl)}>BM.14</a>
            ) : null
          }
        >
          <Select
            style={{ width: 220, marginBottom: 8 }}
            value={surplusHandling}
            disabled={!vaiTro.canManage}
            options={[
              { value: 'HOAN_TRA', label: 'Hoàn trả' },
              { value: 'KHONG_PHAT_SINH', label: 'Không phát sinh' },
            ]}
            onChange={setSurplusHandling}
          />
          <div style={{ marginBottom: 8 }}>
            File công nhận (tuỳ chọn):{' '}
            {fileCongNhan ? (
              <a
                href={resolvePublicAssetUrl(fileCongNhan)}
                target="_blank"
                rel="noreferrer"
              >
                Xem file
              </a>
            ) : (
              'chưa có'
            )}{' '}
            {vaiTro.canManage && (
              <ChonTep
                maxBytes={HAN_FILE.phieu}
                nhan="Tải"
                onCo={(t) => setFileCongNhan(t.fileUrl)}
              />
            )}
          </div>
          <Table
            size="small"
            pagination={false}
            rowKey={(_, i) => String(i)}
            dataSource={taiSan}
            columns={[
              {
                title: 'Tên',
                render: (_, r, i) => (
                  <Input
                    value={r.name}
                    onChange={(e) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                title: 'SL',
                width: 80,
                render: (_, r, i) => (
                  <Input
                    value={r.quantity}
                    onChange={(e) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, quantity: e.target.value } : x,
                        ),
                      )
                    }
                  />
                ),
              },
              {
                title: 'Số tiền',
                width: 140,
                render: (_, r, i) => (
                  <InputNumber
                    {...vndInputNumberProps}
                    value={r.amount}
                    onChange={(v) =>
                      setTaiSan((s) =>
                        s.map((x, j) =>
                          j === i ? { ...x, amount: Number(v || 0) } : x,
                        ),
                      )
                    }
                  />
                ),
              },
            ]}
          />
          <Button
            style={{ margin: '8px 0' }}
            onClick={() =>
              setTaiSan((s) => [
                ...s,
                { name: '', quantity: '1', amount: 0, note: '' },
              ])
            }
          >
            Thêm tài sản
          </Button>
          <Space wrap>
            {vaiTro.canManage &&
              (!hs.liquidation.status ||
                ['TL_DRAFT', 'TL_TRA_LAI'].includes(hs.liquidation.status)) && (
                <>
                  <Button
                    onClick={() =>
                      luuThanhLy(outlineId, {
                        surplusHandling,
                        assets: taiSan,
                        recognitionFileUrl: fileCongNhan,
                      })
                        .then(tai)
                        .catch((e) => message.error(bao(e)))
                    }
                  >
                    Lưu thanh lý
                  </Button>
                  <Button
                    type="primary"
                    onClick={() =>
                      trinhThanhLy(outlineId)
                        .then(tai)
                        .catch((e) => message.error(bao(e)))
                    }
                  >
                    Trình BGH
                  </Button>
                </>
              )}
            {vaiTro.canBgh && hs.liquidation.status === 'TL_CHO_BGH' && (
              <Button
                onClick={() =>
                  bghThanhLy(outlineId, { accept: true })
                    .then(tai)
                    .catch((e) => message.error(bao(e)))
                }
              >
                BGH ký
              </Button>
            )}
            {vaiTro.canPublish &&
              hs.liquidation.status === 'TL_CHO_PHAT_HANH' && (
                <Button
                  onClick={() => {
                    const issueNo = window.prompt('Số phát hành') || '';
                    if (!issueNo.trim()) return;
                    phatHanhThanhLy(outlineId, issueNo.trim())
                      .then(tai)
                      .catch((e) => message.error(bao(e)));
                  }}
                >
                  Phát hành
                </Button>
              )}
            {vaiTro.canCnnv && hs.liquidation.status === 'TL_CHO_CNNV' && (
              <Button
                type="primary"
                onClick={() =>
                  cnnvThanhLy(outlineId)
                    .then(tai)
                    .catch((e) => message.error(bao(e)))
                }
              >
                CNNV xác nhận hoàn thành
              </Button>
            )}
          </Space>
        </Card>
      )}
    </Space>
  );
}
