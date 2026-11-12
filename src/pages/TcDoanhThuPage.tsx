import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { getDoanhThuToanChuoi } from '../api/endpoints'
import type { DoanhThuChiNhanh, DoanhThuChiTiet } from '../api/types'
import {
  BaseAlert,
  BaseCard,
  BaseCol,
  BaseDateRangePicker,
  BaseErrorAlert,
  BaseProgress,
  BaseRow,
  BaseStatistic,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { money, monthVN } from '../utils/format'

const LOAI: Record<DoanhThuChiTiet['loai'], { label: string; color: string }> = {
  DICH_VU: { label: 'Dịch vụ', color: 'blue' },
  THUOC: { label: 'Thuốc', color: 'green' },
  THIET_BI: { label: 'Thiết bị', color: 'orange' },
}

interface ThangRow {
  thang: string
  [maCn: string]: number | string
}

/**
 * Doanh thu toàn chuỗi — S0 gộp 3 chi nhánh qua view toàn cục (LUOT_KHAM_CHUA.MaCN_PhatSinh, SU_DUNG_DV, KE_DON,
 * SU_DUNG_TB qua postgres_fdw). Một chi nhánh mất kết nối thì báo rõ trạm nào.
 */
export function TcDoanhThuPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month')])
  const tu = range[0].format('YYYY-MM-DD')
  const den = range[1].format('YYYY-MM-DD')
  const query = useQuery({ queryKey: ['doanh-thu', 'tc', tu, den], queryFn: () => getDoanhThuToanChuoi(tu, den), retry: false })
  const data = query.data
  const tong = data?.tongHop
  const chiNhanh = data?.chiNhanh ?? []
  const max = Math.max(1, ...chiNhanh.map((c) => c.tong))

  // Bảng tháng × chi nhánh
  const thang = [...new Set((data?.theoThangChiNhanh ?? []).map((r) => r.thang))].sort()
  const thangRows: ThangRow[] = thang.map((t) => {
    const row: ThangRow = { thang: t }
    chiNhanh.forEach((c) => {
      row[c.maCn] = data!.theoThangChiNhanh.find((r) => r.thang === t && r.maCn === c.maCn)?.tong ?? 0
    })
    row.tong = chiNhanh.reduce((s, c) => s + (row[c.maCn] as number), 0)
    return row
  })

  const cnColumns: BaseColumns<DoanhThuChiNhanh> = [
    { title: 'Chi nhánh', render: (_, c) => <><b>{c.tenCn}</b> <BaseTag>{c.maCn}</BaseTag></> },
    { title: 'Số lượt', dataIndex: 'soLuot', align: 'right', width: 90 },
    { title: 'Tiền khám', dataIndex: 'tienKham', align: 'right', render: money },
    { title: 'Dịch vụ y tế', dataIndex: 'tienDichVu', align: 'right', render: money },
    { title: 'Thuốc', dataIndex: 'tienThuoc', align: 'right', render: money },
    { title: 'Thiết bị', dataIndex: 'tienThietBi', align: 'right', render: money },
    { title: 'Doanh thu', dataIndex: 'tong', align: 'right', render: (v: number) => <strong>{money(v)}</strong> },
    {
      title: 'Tỉ trọng',
      key: 'ty-trong',
      width: 200,
      render: (_, c) => <BaseProgress percent={c.tyTrong} strokeColor="#1677ff" style={{ width: `${Math.max(30, (c.tong / max) * 100)}%`, margin: 0 }} />,
    },
  ]

  const thangColumns: BaseColumns<ThangRow> = [
    { title: 'Tháng', dataIndex: 'thang', width: 100, render: (v: string) => <strong>{monthVN(v)}</strong> },
    ...chiNhanh.map((c) => ({ title: c.tenCn.replace('Phòng khám Đa khoa ', ''), dataIndex: c.maCn, align: 'right' as const, render: money })),
    { title: 'Toàn chuỗi', dataIndex: 'tong', align: 'right', render: (v: number) => <strong>{money(v)}</strong> },
  ]

  const chiTietColumns: BaseColumns<DoanhThuChiTiet> = [
    { title: 'Loại', dataIndex: 'loai', width: 110, render: (v: DoanhThuChiTiet['loai']) => <BaseTag color={LOAI[v].color}>{LOAI[v].label}</BaseTag> },
    { title: 'Khoản thu', dataIndex: 'ten', render: (v: string, r) => <>{v} <span className="muted">· {r.nhom ?? r.ma}</span></> },
    { title: 'Số lượng', dataIndex: 'soLuong', align: 'right', width: 110 },
    { title: 'Doanh thu', dataIndex: 'soTien', align: 'right', render: money, width: 150 },
  ]

  return (
    <>
      <PageTitle
        title="Doanh thu toàn chuỗi"
        hub
        description="Gộp doanh thu 3 chi nhánh tại trạm trung tâm S0 qua view toàn cục (postgres_fdw) — tiền khám, dịch vụ, thuốc, thiết bị."
        extra={<BaseDateRangePicker value={range} onChange={setRange} aria-label="Kỳ báo cáo" />}
      />

      <BaseAlert
        type="info"
        title="Truy vấn chạy ở S0"
        description="S0 kéo LUOT_KHAM_CHUA, SU_DUNG_DV, KE_DON, SU_DUNG_TB của S1–S3 qua postgres_fdw rồi GROUP BY MaCN_PhatSinh. Một chi nhánh tắt thì câu lệnh lỗi — báo cáo toàn chuỗi cần cả 4 trạm."
      />

      {query.error && <BaseErrorAlert title="Không tính được doanh thu toàn chuỗi" error={query.error} />}

      <BaseRow gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <BaseCol xs={24} md={6}>
          <BaseCard style={{ height: '100%' }}>
            <BaseStatistic title="Doanh thu toàn chuỗi" value={money(tong?.tongDoanhThu)} loading={query.isLoading} valueStyle={{ color: '#1677ff' }} />
            <div className="muted">{tong?.soLuot ?? 0} lượt khám/chữa</div>
          </BaseCard>
        </BaseCol>
        {chiNhanh.map((c) => (
          <BaseCol key={c.maCn} xs={24} sm={8} md={6}>
            <BaseCard style={{ height: '100%' }}>
              <BaseStatistic title={c.tenCn.replace('Phòng khám Đa khoa ', '')} value={money(c.tong)} valueStyle={{ fontSize: 20 }} />
              <div className="muted">
                {c.tyTrong}% · {c.soLuot} lượt · {c.maCn}
              </div>
            </BaseCard>
          </BaseCol>
        ))}
      </BaseRow>

      <BaseCard title="Theo chi nhánh" style={{ marginBottom: 16 }}>
        <BaseTable<DoanhThuChiNhanh>
          rowKey="maCn"
          pagination={false}
          columns={cnColumns}
          dataSource={chiNhanh}
          loading={query.isLoading}
          scroll={{ x: 1000 }}
          summary={() =>
            tong && (
              <BaseSummaryRow>
                <BaseSummaryCell index={0}>
                  <strong>Toàn chuỗi</strong>
                </BaseSummaryCell>
                <BaseSummaryCell index={1} align="right">
                  {tong.soLuot}
                </BaseSummaryCell>
                <BaseSummaryCell index={2} align="right">
                  {money(tong.tienKham)}
                </BaseSummaryCell>
                <BaseSummaryCell index={3} align="right">
                  {money(tong.tienDichVu)}
                </BaseSummaryCell>
                <BaseSummaryCell index={4} align="right">
                  {money(tong.tienThuoc)}
                </BaseSummaryCell>
                <BaseSummaryCell index={5} align="right">
                  {money(tong.tienThietBi)}
                </BaseSummaryCell>
                <BaseSummaryCell index={6} align="right">
                  <strong>{money(tong.tongDoanhThu)}</strong>
                </BaseSummaryCell>
                <BaseSummaryCell index={7} />
              </BaseSummaryRow>
            )
          }
        />
      </BaseCard>

      <BaseRow gutter={16}>
        <BaseCol xs={24} xl={10}>
          <BaseCard title="Theo tháng × chi nhánh" style={{ marginBottom: 16 }}>
            <BaseTable<ThangRow> rowKey="thang" size="small" pagination={false} columns={thangColumns} dataSource={thangRows} loading={query.isLoading} scroll={{ x: 520 }} />
          </BaseCard>
        </BaseCol>
        <BaseCol xs={24} xl={14}>
          <BaseCard title="Chi tiết theo dịch vụ / thuốc / thiết bị (toàn chuỗi)">
            <BaseTable<DoanhThuChiTiet>
              rowKey={(r) => `${r.loai}-${r.ma}`}
              size="small"
              unit="khoản"
              columns={chiTietColumns}
              dataSource={tong?.chiTiet ?? []}
              loading={query.isLoading}
              scroll={{ x: 560 }}
            />
          </BaseCard>
        </BaseCol>
      </BaseRow>
    </>
  )
}
