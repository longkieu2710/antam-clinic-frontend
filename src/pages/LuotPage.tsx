import { useQuery } from '@tanstack/react-query'
import dayjs, { type Dayjs } from 'dayjs'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { getLuot } from '../api/endpoints'
import type { Luot } from '../api/types'
import {
  AddIcon,
  BaseButton,
  BaseDateRangePicker,
  BaseErrorAlert,
  BaseSearchInput,
  BaseSelect,
  BaseSummaryCell,
  BaseSummaryRow,
  BaseTable,
  BaseTag,
  BaseText,
  RetweetIcon,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateTimeVN, money } from '../utils/format'
import { LuotDetailDrawer } from './luot/LuotDetailDrawer'
import { useLuotCatalogs } from './luot/useLuotCatalogs'

/** Danh sách lượt khám / chữa của chi nhánh — lọc theo kỳ, loại, khoa, bác sĩ; bấm một dòng để xem chi tiết. */
export function LuotPage() {
  const { site, branch } = useSite()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [range, setRange] = useState<[Dayjs, Dayjs]>(() => [dayjs().subtract(2, 'month').startOf('month'), dayjs()])
  const [loai, setLoai] = useState<string>()
  const [khoa, setKhoa] = useState<string>()
  const [bs, setBs] = useState<string>()
  const [q, setQ] = useState('')
  const cat = useLuotCatalogs(site)
  const maLuot = params.get('ma')

  const filter = { tu: range[0].format('YYYY-MM-DD'), den: range[1].format('YYYY-MM-DD'), loai, khoa, bs, q }
  const query = useQuery({ queryKey: ['luot', site, filter], queryFn: () => getLuot(site, filter) })
  const rows = query.data ?? []
  const tong = rows.reduce((s, r) => s + r.tongTien, 0)

  const columns: BaseColumns<Luot> = [
    {
      title: 'Lượt',
      width: 200,
      render: (_, r) => (
        <>
          <BaseTag color={r.loaiLuot === 'KHAM' ? 'blue' : 'purple'}>{r.loaiLuot === 'KHAM' ? 'Khám' : `Chữa lần ${r.lanThu ?? '?'}`}</BaseTag>
          <div>{dateTimeVN(r.thoiGian)}</div>
          <code className="muted">{r.maLuot}</code>
        </>
      ),
    },
    {
      title: 'Bệnh nhân',
      width: 180,
      render: (_, r) => (
        <>
          <BaseText strong>{r.tenBN ?? '—'}</BaseText>
          <div className="muted">{r.maBN}</div>
        </>
      ),
    },
    {
      title: 'Bệnh / nội dung',
      render: (_, r) => (
        <>
          {r.benh ?? <span className="muted">Không phát hiện bệnh</span>}
          <div className="muted">
            {r.loaiLuot === 'KHAM'
              ? [r.lyDoKham, r.ketLuanKham && `KL: ${r.ketLuanKham}`].filter(Boolean).join(' · ')
              : [r.hinhThucChua, r.tinhTrangSauChua].filter(Boolean).join(' · ')}
          </div>
        </>
      ),
    },
    { title: 'Khoa', dataIndex: 'tenKhoa', width: 170, render: (v: string | null, r) => v ?? r.maKhoa },
    { title: 'Bác sĩ', dataIndex: 'tenBS', width: 170, render: (v: string | null, r) => v ?? r.maBS },
    { title: 'Y tá', dataIndex: 'yTaHoTro', width: 150, render: (v: string | null) => v ?? '—' },
    { title: 'Tổng tiền', dataIndex: 'tongTien', align: 'right', width: 120, render: (v: number) => <strong>{money(v)}</strong> },
  ]

  return (
    <>
      <PageTitle
        title="Danh sách lượt khám / chữa"
        description={`Các lượt tại ${branch?.tenCn ?? site} — bấm một dòng để xem chẩn đoán, y tá hỗ trợ, chi phí; xoá được lượt nhập nhầm trong tháng.`}
        extra={
          <>
            <BaseButton icon={<RetweetIcon />} onClick={() => navigate('/luot-chua-moi')}>
              Lượt chữa
            </BaseButton>
            <BaseButton type="primary" icon={<AddIcon />} onClick={() => navigate('/luot-kham-moi')}>
              Lượt khám
            </BaseButton>
          </>
        }
      />

      <div className="toolbar">
        <BaseSearchInput placeholder="Mã lượt, mã hoặc tên bệnh nhân…" allowClear onSearch={setQ} style={{ width: 280 }} />
        <BaseDateRangePicker value={range} onChange={setRange} aria-label="Kỳ" />
        <BaseSelect
          allowClear
          placeholder="Loại: tất cả"
          value={loai}
          onChange={setLoai}
          options={[
            { value: 'KHAM', label: 'Khám' },
            { value: 'CHUA', label: 'Chữa' },
          ]}
          style={{ width: 140 }}
          aria-label="Loại lượt"
        />
        <BaseSelect
          allowClear
          placeholder="Khoa: tất cả"
          value={khoa}
          onChange={setKhoa}
          options={cat.khoa.map((k) => ({ value: k.maKhoa, label: k.tenKhoa }))}
          style={{ width: 220 }}
          aria-label="Khoa"
        />
        <BaseSelect
          allowClear
          showSearch={{ optionFilterProp: 'label' }}
          placeholder="Bác sĩ: tất cả"
          value={bs}
          onChange={setBs}
          options={cat.bacSi.map((b) => ({ value: b.maNV, label: b.hoTen }))}
          style={{ width: 220 }}
          aria-label="Bác sĩ"
        />
      </div>

      {query.error && <BaseErrorAlert title="Không tải được danh sách lượt" error={query.error} />}

      <BaseTable<Luot>
        rowKey="maLuot"
        unit="lượt"
        columns={columns}
        dataSource={rows}
        loading={query.isLoading}
        scroll={{ x: 1150 }}
        onRow={(r) => ({ onClick: () => setParams({ ma: r.maLuot }), className: 'clickable-row' })}
        summary={() =>
          rows.length > 0 && (
            <BaseSummaryRow>
              <BaseSummaryCell index={0} colSpan={6}>
                <strong>{rows.length} lượt</strong>
                {rows.length >= 500 && <span className="muted"> · hiển thị tối đa 500 lượt mới nhất, thu hẹp bộ lọc để xem thêm</span>}
              </BaseSummaryCell>
              <BaseSummaryCell index={6} align="right">
                <strong>{money(tong)}</strong>
              </BaseSummaryCell>
            </BaseSummaryRow>
          )
        }
      />

      <LuotDetailDrawer site={site} maLuot={maLuot} onClose={() => setParams({})} />
    </>
  )
}
