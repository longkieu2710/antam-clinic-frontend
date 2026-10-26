import { useNavigate } from 'react-router'
import type { TaoLuot } from '../../api/types'
import { BaseAlert, BaseButton, BaseModal, BaseResult } from '../../components/common'
import { money } from '../../utils/format'

interface Props {
  saved: TaoLuot | null
  onClose: () => void
}

/** Hộp thoại sau khi lưu lượt: mã lượt vừa sinh, đợt mở / kết thúc, cảnh báo, đường dẫn tiếp theo. */
export function LuotSavedModal({ saved, onClose }: Props) {
  const navigate = useNavigate()
  if (!saved) return null
  const kham = saved.loaiLuot === 'KHAM'
  const detail = kham
    ? saved.maCDDT.length > 0
      ? `Mở ${saved.maCDDT.length} đợt điều trị: ${saved.maCDDT.join(', ')}`
      : 'Không phát hiện bệnh — không mở đợt điều trị (BR13)'
    : `Lần chữa thứ ${saved.lanThu} của đợt ${saved.maCDDT[0]}${saved.ketThucDot ? ' — đợt kết thúc "Đã khỏi" (BR10)' : ''}`
  const go = (path: string) => {
    onClose()
    navigate(path)
  }
  return (
    <BaseModal
      open
      title={kham ? 'Đã lưu lượt khám' : 'Đã lưu lượt chữa'}
      onCancel={onClose}
      width={640}
      footer={[
        <BaseButton key="list" onClick={() => go(`/luot?ma=${encodeURIComponent(saved.maLuot)}`)}>
          Xem lượt vừa tạo
        </BaseButton>,
        <BaseButton key="ho-so" onClick={() => go(`/ho-so?maBN=${encodeURIComponent(saved.maBN)}`)}>
          Hồ sơ bệnh nhân
        </BaseButton>,
        <BaseButton key="new" type="primary" onClick={onClose}>
          {kham ? 'Tạo lượt khám khác' : 'Tạo lượt chữa khác'}
        </BaseButton>,
      ]}
    >
      <BaseResult
        status="success"
        title={<code style={{ fontSize: 16 }}>{saved.maLuot}</code>}
        subTitle={`${saved.tenBN ?? saved.maBN} · ${detail} · Tổng ${money(saved.tongTien)}`}
        style={{ padding: '16px 0' }}
      />
      {saved.daChepBenhNhan && (
        <BaseAlert
          type="info"
          title="Đã chép hồ sơ bệnh nhân sang chi nhánh"
          description="Bệnh nhân chưa có hồ sơ ở chi nhánh này — bản ghi BENH_NHAN (giữ nguyên mã) được chép từ view toàn chuỗi trong cùng transaction."
          style={{ marginBottom: 8 }}
        />
      )}
      {saved.canhBao.map((c) => (
        <BaseAlert key={c} type="warning" title={c} style={{ marginBottom: 8 }} />
      ))}
    </BaseModal>
  )
}
