import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { getBangLuong } from '../api/endpoints'
import type { LuongNhanVien } from '../api/types'
import {
  BaseAlert,
  BaseCard,
  BaseCol,
  BaseErrorAlert,
  BaseMonthPicker,
  BaseRow,
  BaseStatistic,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
  BaseText,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateVN, money, monthVN } from '../utils/format'

/**
 * F3 — lương bác sĩ, y tá trong tháng hiện tại (tính đến thời điểm hiện tại) hoặc tháng chỉ định.
 * Lương = hệ số × lương cơ sở + 1.000.000 ₫ / đợt bác sĩ chữa khỏi + 200.000 ₫ / lượt y tá hỗ trợ.
 */
export function LuongPage() {
  const { site, branch } = useSite()
  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf('month'))
  const thang = month.format('YYYY-MM')

  const query = useQuery({ queryKey: ['bang-luong', site, thang], queryFn: () => getBangLuong(site, thang), retry: false })
  const data = query.data
  const rows = data?.nhanVien ?? []
  const sum = (f: (r: LuongNhanVien) => number) => rows.reduce((s, r) => s + f(r), 0)

  const columns: BaseColumns<LuongNhanVien> = [
    { title: 'Mã NV', dataIndex: 'maNV', render: (v: string) => <code>{v}</code>, width: 120 },
    {
      title: 'Họ tên',
      render: (_, r) => (
        <>
          <BaseText strong>{r.hoTen}</BaseText>{' '}
          <BaseTag color={r.loaiNV === 'BS' ? 'blue' : 'purple'}>{r.loaiNV === 'BS' ? 'Bác sĩ' : 'Y tá'}</BaseTag>
          {r.trangThai === 'Ngừng hoạt động' && <BaseTag>Ngừng hoạt động</BaseTag>}
          <div className="muted">{r.tenKhoa ?? r.maKhoa}</div>
        </>
      ),
    },
    { title: 'Hệ số', dataIndex: 'heSoLuong', align: 'right', render: (v: number) => v.toFixed(2), width: 80 },
    { title: 'Lương cơ bản', dataIndex: 'luongCoBan', align: 'right', render: money, width: 140 },
    {
      title: 'Căn cứ thưởng',
      key: 'can-cu',
      width: 180,
      render: (_, r) => (r.loaiNV === 'BS' ? `${r.soDotKhoi} đợt chữa khỏi` : `${r.soLanHoTro} lượt hỗ trợ`),
    },
    { title: 'Thưởng', dataIndex: 'thuong', align: 'right', render: money, width: 130 },
    { title: 'Tổng lương', dataIndex: 'tongLuong', align: 'right', render: (v: number) => <strong>{money(v)}</strong>, width: 150 },
  ]

  return (
    <>
      <PageTitle
        title="Lương bác sĩ & y tá"
        description={`F3 — bảng lương tháng của ${branch?.tenCn ?? site}, tính trực tiếp từ dữ liệu khám chữa (tháng hiện tại tính đến thời điểm hiện tại).`}
        extra={<BaseMonthPicker value={month} onChange={setMonth} aria-label="Chọn tháng" />}
      />

      {data && (
        <BaseAlert
          type="info"
          title="Công thức"
          description={
            <>
              Lương = hệ số × lương cơ sở <strong>{money(data.mucLuongCoSo)}</strong> (áp dụng từ {dateVN(data.ngayApDungLuongCoSo)}) ·
              bác sĩ + <strong>{money(data.thuongMoiDotKhoi)}</strong> cho mỗi đợt điều trị "Đã khỏi" kết thúc trong tháng (đợt "Ngừng
              điều trị" không tính) · y tá + <strong>{money(data.thuongMoiLanHoTro)}</strong> cho mỗi lượt khám/chữa có hỗ trợ trong tháng.
              Chưa có chốt lương vì CSDL phân tán không có bảng BANG_LUONG.
            </>
          }
        />
      )}

      {query.error && <BaseErrorAlert title={`Không tính được lương tháng ${monthVN(thang)}`} error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic title={`Tổng quỹ lương · ${monthVN(thang)}`} value={money(data?.tongQuyLuong)} loading={query.isLoading} />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic title="Tổng thưởng" value={money(sum((r) => r.thuong))} loading={query.isLoading} />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic
              title="Nhân viên"
              value={`${rows.filter((r) => r.loaiNV === 'BS').length} BS · ${rows.filter((r) => r.loaiNV === 'YT').length} YT`}
              loading={query.isLoading}
            />
          </BaseCard>
        </BaseCol>
      </BaseRow>

      <BaseTable<LuongNhanVien>
        rowKey="maNV"
        unit="nhân viên"
        pagination={false}
        columns={columns}
        dataSource={rows}
        loading={query.isLoading}
        scroll={{ x: 950 }}
        summary={() =>
          rows.length > 0 && (
            <BaseSummaryRow>
              <BaseSummaryCell index={0} colSpan={3}>
                <strong>Tổng cộng</strong>
              </BaseSummaryCell>
              <BaseSummaryCell index={3} align="right">
                {money(sum((r) => r.luongCoBan))}
              </BaseSummaryCell>
              <BaseSummaryCell index={4} />
              <BaseSummaryCell index={5} align="right">
                {money(sum((r) => r.thuong))}
              </BaseSummaryCell>
              <BaseSummaryCell index={6} align="right">
                <strong>{money(data?.tongQuyLuong)}</strong>
              </BaseSummaryCell>
            </BaseSummaryRow>
          )
        }
      />
    </>
  )
}
