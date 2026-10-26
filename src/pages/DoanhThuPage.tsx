import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { getDoanhThu } from '../api/endpoints'
import type { DoanhThuChiTiet, DoanhThuThang } from '../api/types'
import {
  BaseAlert,
  BaseCard,
  BaseCol,
  BaseDateRangePicker,
  BaseErrorAlert,
  BaseRow,
  BaseStatistic,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateVN, money, monthVN } from '../utils/format'

const LOAI: Record<DoanhThuChiTiet['loai'], { label: string; color: string }> = {
  DICH_VU: { label: 'Dịch vụ', color: 'blue' },
  THUOC: { label: 'Thuốc', color: 'green' },
  THIET_BI: { label: 'Thiết bị', color: 'orange' },
}

/**
 * F5 — doanh thu của chi nhánh theo kỳ: tiền khám, dịch vụ y tế, thuốc, thiết bị / cơ sở vật chất.
 * Mọi khoản tính theo đơn giá áp dụng lưu tại thời điểm dùng (BR7).
 */
export function DoanhThuPage() {
  const { site, branch } = useSite()
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().startOf('month'), dayjs().endOf('month')])
  const tu = range[0].format('YYYY-MM-DD')
  const den = range[1].format('YYYY-MM-DD')

  const query = useQuery({ queryKey: ['doanh-thu', site, tu, den], queryFn: () => getDoanhThu(site, tu, den) })
  const data = query.data

  const cards = [
    { title: 'Tổng doanh thu', value: data?.tongDoanhThu, strong: true },
    { title: 'Tiền khám', value: data?.tienKham },
    { title: 'Dịch vụ y tế', value: data?.tienDichVu },
    { title: 'Thuốc', value: data?.tienThuoc },
    { title: 'Thiết bị / CSVC', value: data?.tienThietBi },
  ]

  const thangColumns: BaseColumns<DoanhThuThang> = [
    { title: 'Tháng', dataIndex: 'thang', render: (v: string) => <strong>{monthVN(v)}</strong>, width: 100 },
    { title: 'Số lượt', dataIndex: 'soLuot', align: 'right', width: 90 },
    { title: 'Tiền khám', dataIndex: 'tienKham', align: 'right', render: money },
    { title: 'Dịch vụ y tế', dataIndex: 'tienDichVu', align: 'right', render: money },
    { title: 'Thuốc', dataIndex: 'tienThuoc', align: 'right', render: money },
    { title: 'Thiết bị', dataIndex: 'tienThietBi', align: 'right', render: money },
    { title: 'Tổng', dataIndex: 'tong', align: 'right', render: (v: number) => <strong>{money(v)}</strong> },
  ]

  const chiTietColumns: BaseColumns<DoanhThuChiTiet> = [
    { title: 'Loại', dataIndex: 'loai', width: 110, render: (v: DoanhThuChiTiet['loai']) => <BaseTag color={LOAI[v].color}>{LOAI[v].label}</BaseTag> },
    { title: 'Khoản thu', dataIndex: 'ten', render: (v: string, r) => <>{v} <span className="muted">· {r.nhom ?? r.ma}</span></> },
    { title: 'Số lượng', dataIndex: 'soLuong', align: 'right', width: 110 },
    { title: 'Doanh thu', dataIndex: 'soTien', align: 'right', render: money, width: 150 },
    {
      title: 'Tỉ trọng',
      key: 'ty-trong',
      align: 'right',
      width: 100,
      render: (_, r) => (data?.tongDoanhThu ? `${((r.soTien / data.tongDoanhThu) * 100).toFixed(1)}%` : '—'),
    },
  ]

  return (
    <>
      <PageTitle
        title="Doanh thu"
        description={`F5 — doanh thu của ${branch?.tenCn ?? site} từ tiền khám, dịch vụ y tế, thuốc và thiết bị (theo thời gian của lượt khám/chữa).`}
        extra={<BaseDateRangePicker value={range} onChange={setRange} aria-label="Kỳ báo cáo" />}
      />

      <BaseAlert
        type="info"
        title={`Kỳ ${dateVN(tu)} – ${dateVN(den)}`}
        description='Tiền khám = dịch vụ loại "Khám bệnh" (lần chữa trong đợt điều trị miễn phí khám — BR11). Thành tiền = số lượng × đơn giá áp dụng lưu ở SU_DUNG_DV, KE_DON, SU_DUNG_TB (BR7).'
      />

      {query.error && <BaseErrorAlert title="Không tính được doanh thu" error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {cards.map((c) => (
          <BaseCol key={c.title} xs={12} md={8} xl={c.strong ? 8 : 4}>
            <BaseCard style={{ height: '100%' }}>
              <BaseStatistic
                title={c.title}
                value={money(c.value)}
                loading={query.isLoading}
                valueStyle={c.strong ? { color: '#1677ff' } : { fontSize: 20 }}
              />
              {c.strong && <div className="muted">{data?.soLuot ?? 0} lượt khám/chữa</div>}
            </BaseCard>
          </BaseCol>
        ))}
      </BaseRow>

      <BaseCard title="Theo tháng" style={{ marginBottom: 16 }}>
        <BaseTable<DoanhThuThang>
          rowKey="thang"
          pagination={false}
          columns={thangColumns}
          dataSource={data?.theoThang ?? []}
          loading={query.isLoading}
          scroll={{ x: 800 }}
          summary={() =>
            data && data.theoThang.length > 1 && (
              <BaseSummaryRow>
                <BaseSummaryCell index={0}>
                  <strong>Tổng</strong>
                </BaseSummaryCell>
                <BaseSummaryCell index={1} align="right">
                  {data.soLuot}
                </BaseSummaryCell>
                <BaseSummaryCell index={2} align="right">
                  {money(data.tienKham)}
                </BaseSummaryCell>
                <BaseSummaryCell index={3} align="right">
                  {money(data.tienDichVu)}
                </BaseSummaryCell>
                <BaseSummaryCell index={4} align="right">
                  {money(data.tienThuoc)}
                </BaseSummaryCell>
                <BaseSummaryCell index={5} align="right">
                  {money(data.tienThietBi)}
                </BaseSummaryCell>
                <BaseSummaryCell index={6} align="right">
                  <strong>{money(data.tongDoanhThu)}</strong>
                </BaseSummaryCell>
              </BaseSummaryRow>
            )
          }
        />
      </BaseCard>

      <BaseCard title="Chi tiết theo dịch vụ / thuốc / thiết bị">
        <BaseTable<DoanhThuChiTiet>
          rowKey={(r) => `${r.loai}-${r.ma}`}
          unit="khoản"
          columns={chiTietColumns}
          dataSource={data?.chiTiet ?? []}
          loading={query.isLoading}
          scroll={{ x: 700 }}
        />
      </BaseCard>
    </>
  )
}
