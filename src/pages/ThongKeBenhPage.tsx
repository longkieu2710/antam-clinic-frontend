import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { getThongKeBenh } from '../api/endpoints'
import type { ThongKeBenhItem } from '../api/types'
import {
  BaseAlert,
  BaseCard,
  BaseCol,
  BaseErrorAlert,
  BaseMonthPicker,
  BaseProgress,
  BaseRow,
  BaseStatistic,
  BaseTable,
  BaseTag,
  BaseText,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { monthVN } from '../utils/format'

/**
 * F2 — các bệnh mắc phải trong một tháng tại chi nhánh, sắp xếp giảm dần theo số lần mắc.
 * Một lần mắc = một đợt điều trị có lượt khám/chữa trong tháng: các lượt liên tiếp của cùng đợt chỉ tính 1 lần,
 * mắc lại sau khi khỏi là đợt mới nên tính thêm.
 */
export function ThongKeBenhPage() {
  const { site, branch } = useSite()
  const [month, setMonth] = useState<Dayjs>(() => dayjs().startOf('month'))
  const thang = month.format('YYYY-MM')

  const query = useQuery({ queryKey: ['thong-ke-benh', site, thang], queryFn: () => getThongKeBenh(site, thang) })
  const data = query.data
  const max = Math.max(1, ...(data?.benh ?? []).map((b) => b.soLanMac))

  const columns: BaseColumns<ThongKeBenhItem> = [
    { title: '#', key: 'rank', width: 50, render: (_, __, i) => i + 1 },
    {
      title: 'Bệnh',
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBenh}</BaseText>{' '}
          {r.maICD10 && <BaseTag>{r.maICD10}</BaseTag>}
          <div className="muted">
            <code>{r.maBenh}</code>
          </div>
        </>
      ),
    },
    { title: 'Số lần mắc', dataIndex: 'soLanMac', align: 'right', width: 110 },
    { title: 'Số bệnh nhân', dataIndex: 'soBenhNhan', align: 'right', width: 120 },
    {
      title: 'Tỉ lệ',
      key: 'bar',
      width: 220,
      render: (_, r) => (
        <BaseProgress
          percent={Math.round((r.soLanMac / (data?.tongLanMac || 1)) * 100)}
          success={{ percent: 0 }}
          strokeColor="#1677ff"
          showInfo
          style={{ width: `${Math.max(30, (r.soLanMac / max) * 100)}%`, margin: 0 }}
        />
      ),
    },
  ]

  return (
    <>
      <PageTitle
        title="Thống kê bệnh theo tháng"
        description={`F2 — các bệnh bệnh nhân mắc phải tại ${branch?.tenCn ?? site}, sắp xếp giảm dần theo số lần mắc.`}
        extra={<BaseMonthPicker value={month} onChange={setMonth} aria-label="Chọn tháng" />}
      />

      <BaseAlert
        type="info"
        title="Cách đếm"
        description="Mỗi đợt điều trị (CHAN_DOAN_DIEU_TRI) có lần khám mở đợt hoặc lần chữa nằm trong tháng được tính 1 lần mắc. Nhiều lượt liên tiếp của cùng một đợt chỉ tính 1 lần; bệnh nhân mắc lại sau khi đã khỏi là đợt mới nên tính thêm. Lần khám không phát hiện bệnh không được tính (BR13)."
      />

      {query.error && <BaseErrorAlert title="Không lấy được thống kê" error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic title={`Tổng số lần mắc · ${monthVN(thang)}`} value={data?.tongLanMac ?? 0} loading={query.isLoading} />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic title="Số loại bệnh" value={data?.benh.length ?? 0} loading={query.isLoading} />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} sm={8}>
          <BaseCard>
            <BaseStatistic title="Bệnh mắc nhiều nhất" value={data?.benh[0]?.tenBenh ?? '—'} loading={query.isLoading} valueStyle={{ fontSize: 18 }} />
          </BaseCard>
        </BaseCol>
      </BaseRow>

      <BaseTable<ThongKeBenhItem>
        rowKey="maBenh"
        unit="bệnh"
        columns={columns}
        dataSource={data?.benh ?? []}
        loading={query.isLoading}
        locale={{ emptyText: `Không có lượt khám/chữa nào có chẩn đoán bệnh trong tháng ${monthVN(thang)}` }}
        scroll={{ x: 700 }}
      />
    </>
  )
}
