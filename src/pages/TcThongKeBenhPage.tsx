import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { getThongKeBenhToanChuoi } from '../api/endpoints'
import type { ThongKeBenhToanChuoiItem } from '../api/types'
import {
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
import { monthVN } from '../utils/format'

/** F2 toàn chuỗi — các bệnh mắc trong tháng trên cả 3 chi nhánh (S0, view toàn cục), kèm số lần mắc tại từng chi nhánh. */
export function TcThongKeBenhPage() {
  const { branches } = useSite()
  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf('month'))
  const thang = month.format('YYYY-MM')
  const query = useQuery({ queryKey: ['thong-ke-benh', 'tc', thang], queryFn: () => getThongKeBenhToanChuoi(thang), retry: false })
  const data = query.data
  const chiNhanh = data?.chiNhanh ?? []
  const tenCn = (maCn: string) => branches.find((b) => b.maCn === maCn)?.shortName ?? maCn

  const columns: BaseColumns<ThongKeBenhToanChuoiItem> = [
    { title: '#', key: 'rank', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'Bệnh',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBenh}</BaseText> {r.maICD10 && <BaseTag>{r.maICD10}</BaseTag>}
          <div className="muted">
            <code>{r.maBenh}</code>
          </div>
        </>
      ),
    },
    { title: 'Toàn chuỗi', dataIndex: 'soLanMac', align: 'right', width: 110, render: (v: number) => <strong>{v}</strong> },
    ...chiNhanh.map((cn) => ({
      title: tenCn(cn),
      key: cn,
      align: 'right' as const,
      width: 120,
      render: (_: unknown, r: ThongKeBenhToanChuoiItem) => (r.theoChiNhanh[cn] ? r.theoChiNhanh[cn] : <span className="muted">0</span>),
    })),
    { title: 'Số bệnh nhân', dataIndex: 'soBenhNhan', align: 'right', width: 120 },
  ]

  return (
    <>
      <PageTitle
        title="Thống kê bệnh toàn chuỗi"
        hub
        description="F2 gộp 3 chi nhánh tại S0: mỗi đợt điều trị có lượt khám/chữa trong tháng = 1 lần mắc; sắp xếp giảm dần theo số lần mắc."
        extra={<BaseMonthPicker value={month} onChange={setMonth} aria-label="Chọn tháng" />}
      />

      {query.error && <BaseErrorAlert title="Không lấy được thống kê toàn chuỗi" error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <BaseCol xs={24} md={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title={`Toàn chuỗi · ${monthVN(thang)}`} value={data?.tongLanMac ?? 0} suffix="lần mắc" loading={query.isLoading} />
          </BaseCard>
        </BaseCol>
        {chiNhanh.map((cn) => (
          <BaseCol key={cn} xs={24} sm={8} md={6}>
            <BaseCard style={{ height: '100%' }}>
              <BaseStatistic title={tenCn(cn)} value={data?.tongTheoChiNhanh[cn] ?? 0} suffix="lần mắc" valueStyle={{ fontSize: 20 }} />
            </BaseCard>
          </BaseCol>
        ))}
      </BaseRow>

      <BaseTable<ThongKeBenhToanChuoiItem>
        rowKey="maBenh"
        unit="bệnh"
        columns={columns}
        dataSource={data?.benh ?? []}
        loading={query.isLoading}
        locale={{ emptyText: `Không có lượt khám/chữa nào có chẩn đoán bệnh trong tháng ${monthVN(thang)}` }}
        scroll={{ x: 800 }}
        summary={() =>
          data &&
          data.benh.length > 0 && (
            <BaseSummaryRow>
              <BaseSummaryCell index={0} colSpan={2}>
                <strong>Tổng</strong>
              </BaseSummaryCell>
              <BaseSummaryCell index={2} align="right">
                <strong>{data.tongLanMac}</strong>
              </BaseSummaryCell>
              {chiNhanh.map((cn, i) => (
                <BaseSummaryCell key={cn} index={3 + i} align="right">
                  {data.tongTheoChiNhanh[cn]}
                </BaseSummaryCell>
              ))}
              <BaseSummaryCell index={3 + chiNhanh.length} />
            </BaseSummaryRow>
          )
        }
      />
    </>
  )
}
