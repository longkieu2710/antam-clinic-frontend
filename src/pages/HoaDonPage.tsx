import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { createPayment, getHoaDon, getHoaDonDetail } from '../api/endpoints'
import { errorText } from '../api/http'
import type { HoaDonItem } from '../api/types'
import {
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseCol,
  BaseDescriptions,
  BaseDrawer,
  BaseForm,
  BaseFormItem,
  BaseModal,
  BaseMoneyInput,
  BaseRow,
  BaseSearchInput,
  BaseSelect,
  BaseSkeleton,
  BaseSpace,
  BaseTable,
  BaseTag,
  BaseText,
  DollarIcon,
  EyeIcon,
  useBaseForm,
  useNotify,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { useSite } from '../site/useSite'
import { dateTimeVN, money } from '../utils/format'

interface PaymentFormValues {
  soTien: number
  hinhThuc: 'Tiền mặt' | 'Chuyển khoản' | 'Thẻ'
}

export function HoaDonPage() {
  const { site, branch } = useSite()
  const notify = useNotify()
  const queryClient = useQueryClient()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') ?? ''
  const trangThai = params.get('trangThai') ?? ''

  const [selectedHD, setSelectedHD] = useState<string | null>(null)
  const [payingHD, setPayingHD] = useState<HoaDonItem | null>(null)
  const payForm = useBaseForm<PaymentFormValues>()

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['hoa-don', site, q, trangThai],
    queryFn: () => getHoaDon(site, { q: q || undefined, trangThai: trangThai || undefined }),
    staleTime: 10_000,
  })

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['hoa-don-detail', site, selectedHD],
    queryFn: () => (selectedHD ? getHoaDonDetail(site, selectedHD) : null),
    enabled: !!selectedHD,
  })

  const payMutation = useMutation({
    mutationFn: ({ maHD, values }: { maHD: string; values: PaymentFormValues }) =>
      createPayment(site, maHD, values),
    onSuccess: (res) => {
      notify.success(`Đã thu ${money(payForm.getFieldValue('soTien'))} cho hóa đơn ${res.maHD}. Trạng thái: ${res.trangThai}`)
      queryClient.invalidateQueries({ queryKey: ['hoa-don'] })
      queryClient.invalidateQueries({ queryKey: ['hoa-don-detail'] })
      queryClient.invalidateQueries({ queryKey: ['luot'] })
      setPayingHD(null)
      payForm.resetFields()
    },
    onError: (err) => {
      notify.error(errorText(err))
    },
  })

  const openPayModal = (hd: HoaDonItem) => {
    setPayingHD(hd)
    payForm.setFieldsValue({
      soTien: hd.conThieu,
      hinhThuc: 'Tiền mặt',
    })
  }

  const handlePaySubmit = async () => {
    if (!payingHD) return
    try {
      const values = await payForm.validateFields()
      payMutation.mutate({ maHD: payingHD.maHD, values })
    } catch {
      // Form validation failed
    }
  }

  const columns: BaseColumns<HoaDonItem> = [
    {
      title: 'Mã HĐ',
      dataIndex: 'maHD',
      width: 170,
      render: (val: string) => <code style={{ fontWeight: 600 }}>{val}</code>,
    },
    {
      title: 'Ngày lập',
      dataIndex: 'ngayLap',
      width: 150,
      render: (val: string) => dateTimeVN(val),
    },
    {
      title: 'Loại',
      dataIndex: 'loaiPhieu',
      width: 90,
      render: (val: string) => (
        <BaseTag color={val === 'KHAM' ? 'blue' : 'purple'}>
          {val === 'KHAM' ? 'Khám' : 'Điều trị'}
        </BaseTag>
      ),
    },
    {
      title: 'Mã phiếu',
      dataIndex: 'maPhieu',
      width: 210,
      render: (val: string) => <code>{val}</code>,
    },
    {
      title: 'Bệnh nhân',
      key: 'benhNhan',
      render: (_: unknown, r: HoaDonItem) => (
        <div>
          <div style={{ fontWeight: 500 }}>{r.tenBN}</div>
          <BaseText type="secondary" style={{ fontSize: 12 }}>{r.maBN}</BaseText>
        </div>
      ),
    },
    {
      title: 'Phải trả',
      dataIndex: 'soTienPhaiTra',
      align: 'right',
      width: 120,
      render: (val: number) => <span style={{ fontWeight: 600 }}>{money(val)}</span>,
    },
    {
      title: 'Đã thu',
      dataIndex: 'daThu',
      align: 'right',
      width: 120,
      render: (val: number) => money(val),
    },
    {
      title: 'Còn thiếu',
      dataIndex: 'conThieu',
      align: 'right',
      width: 120,
      render: (val: number) => (
        <span style={{ color: val > 0 ? '#cf1322' : '#389e0d', fontWeight: 600 }}>
          {money(val)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'trangThai',
      width: 120,
      render: (val: string) => {
        const color = val === 'Đã trả' ? 'success' : val === 'Trả một phần' ? 'warning' : 'error'
        return <BaseBadge status={color} text={val} />
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 160,
      render: (_: unknown, r: HoaDonItem) => (
        <BaseSpace size="small">
          <BaseButton
            size="small"
            icon={<EyeIcon />}
            onClick={() => setSelectedHD(r.maHD)}
          >
            Chi tiết
          </BaseButton>
          {r.conThieu > 0 && (
            <BaseButton
              size="small"
              type="primary"
              icon={<DollarIcon />}
              onClick={() => openPayModal(r)}
            >
              Thu tiền
            </BaseButton>
          )}
        </BaseSpace>
      ),
    },
  ]

  return (
    <div>
      <PageTitle
        title="Quản lý Hóa đơn & Viện phí"
        description={`Cơ sở: ${branch?.tenCn ?? site} · Theo dõi viện phí và ghi nhận các đợt thanh toán`}
      />

      <BaseCard style={{ marginBottom: 16 }}>
        <BaseRow gutter={16} align="middle">
          <BaseCol xs={24} sm={12} md={8}>
            <BaseSearchInput
              placeholder="Tìm theo Mã HĐ, Mã phiếu, Bệnh nhân..."
              defaultValue={q}
              onSearch={(val) => {
                const next = new URLSearchParams(params)
                if (val) next.set('q', val)
                else next.delete('q')
                setParams(next)
              }}
              allowClear
            />
          </BaseCol>
          <BaseCol xs={24} sm={12} md={6}>
            <BaseSelect
              placeholder="Trạng thái thanh toán"
              style={{ width: '100%' }}
              value={trangThai || undefined}
              allowClear
              onChange={(val) => {
                const next = new URLSearchParams(params)
                if (val) next.set('trangThai', String(val))
                else next.delete('trangThai')
                setParams(next)
              }}
              options={[
                { label: 'Tất cả trạng thái', value: '' },
                { label: 'Chưa trả', value: 'Chưa trả' },
                { label: 'Trả một phần', value: 'Trả một phần' },
                { label: 'Đã trả', value: 'Đã trả' },
              ]}
            />
          </BaseCol>
          <BaseCol xs={24} sm={24} md={10} style={{ textAlign: 'right' }}>
            <BaseText type="secondary">
              Tổng cộng: <b>{list.length}</b> hóa đơn
            </BaseText>
          </BaseCol>
        </BaseRow>
      </BaseCard>

      <BaseTable
        rowKey="maHD"
        dataSource={list}
        columns={columns}
        loading={isLoading}
      />

      {/* MODAL THU TIỀN */}
      <BaseModal
        open={!!payingHD}
        title={`Thu tiền viện phí: ${payingHD?.maHD}`}
        onCancel={() => {
          setPayingHD(null)
          payForm.resetFields()
        }}
        onOk={handlePaySubmit}
        confirmLoading={payMutation.isPending}
        okText="Xác nhận thanh toán"
        cancelText="Đóng"
      >
        {payingHD && (
          <BaseForm form={payForm} layout="vertical">
            <BaseDescriptions
              size="small"
              column={1}
              bordered
              style={{ marginBottom: 16 }}
              items={[
                { key: 'bn', label: 'Bệnh nhân', children: <><b>{payingHD.tenBN}</b> ({payingHD.maBN})</> },
                { key: 'mp', label: 'Mã phiếu', children: <code>{payingHD.maPhieu}</code> },
                { key: 'pt', label: 'Tổng số tiền phải trả', children: money(payingHD.soTienPhaiTra) },
                { key: 'dt', label: 'Đã thanh toán', children: money(payingHD.daThu) },
                {
                  key: 'ct',
                  label: 'Số tiền còn thiếu',
                  children: (
                    <span style={{ color: '#cf1322', fontWeight: 'bold', fontSize: 16 }}>
                      {money(payingHD.conThieu)}
                    </span>
                  ),
                },
              ]}
            />

            <BaseFormItem
              name="soTien"
              label="Số tiền thanh toán đợt này (đ)"
              rules={[
                { required: true, message: 'Vui lòng nhập số tiền' },
                {
                  validator: async (_, val) => {
                    if (val <= 0) throw new Error('Số tiền phải lớn hơn 0')
                    if (val > payingHD.conThieu) {
                      throw new Error(`Số tiền không được vượt quá số tiền còn thiếu ${money(payingHD.conThieu)}`)
                    }
                  },
                },
              ]}
            >
              <BaseMoneyInput style={{ width: '100%' }} />
            </BaseFormItem>

            <BaseFormItem
              name="hinhThuc"
              label="Hình thức thanh toán"
              rules={[{ required: true, message: 'Vui lòng chọn hình thức' }]}
            >
              <BaseSelect
                options={[
                  { label: 'Tiền mặt', value: 'Tiền mặt' },
                  { label: 'Chuyển khoản ngân hàng', value: 'Chuyển khoản' },
                  { label: 'Thẻ thanh toán (POS)', value: 'Thẻ' },
                ]}
              />
            </BaseFormItem>
          </BaseForm>
        )}
      </BaseModal>

      {/* DRAWER CHI TIẾT HÓA ĐƠN */}
      <BaseDrawer
        open={!!selectedHD}
        onClose={() => setSelectedHD(null)}
        title={`Chi tiết hóa đơn: ${selectedHD}`}
        width={680}
      >
        {detailLoading || !detailData ? (
          <BaseSkeleton active paragraph={{ rows: 10 }} />
        ) : (
          <div>
            <BaseDescriptions
              size="small"
              column={2}
              bordered
              style={{ marginBottom: 20 }}
              items={[
                { key: 'hd', label: 'Mã hóa đơn', children: <code>{detailData.hoaDon.maHD}</code> },
                { key: 'nl', label: 'Ngày lập', children: dateTimeVN(detailData.hoaDon.ngayLap) },
                { key: 'bn', label: 'Bệnh nhân', children: <><b>{detailData.hoaDon.tenBN}</b> ({detailData.hoaDon.maBN})</> },
                { key: 'bs', label: 'Bác sĩ', children: detailData.hoaDon.tenBS },
                { key: 'mp', label: 'Mã phiếu', children: <code>{detailData.hoaDon.maPhieu}</code> },
                {
                  key: 'tt',
                  label: 'Trạng thái',
                  children: (
                    <BaseBadge
                      status={
                        detailData.hoaDon.trangThai === 'Đã trả'
                          ? 'success'
                          : detailData.hoaDon.trangThai === 'Trả một phần'
                          ? 'warning'
                          : 'error'
                      }
                      text={detailData.hoaDon.trangThai}
                    />
                  ),
                },
                { key: 'tong', label: 'Tổng chi phí', children: money(detailData.hoaDon.tongTien) },
                { key: 'gt', label: 'Giảm trừ', children: money(detailData.hoaDon.giamTru) },
                { key: 'pt', label: 'Phải trả', children: <b>{money(detailData.hoaDon.soTienPhaiTra)}</b> },
                {
                  key: 'ct',
                  label: 'Còn thiếu',
                  children: (
                    <span style={{ color: detailData.hoaDon.conThieu > 0 ? '#cf1322' : '#389e0d', fontWeight: 'bold' }}>
                      {money(detailData.hoaDon.conThieu)}
                    </span>
                  ),
                },
              ]}
            />

            <BaseCard title="Chi tiết chi phí phiếu" size="small" style={{ marginBottom: 16 }}>
              <BaseTable
                rowKey="maMatHang"
                pagination={false}
                size="small"
                dataSource={detailData.chiTietChiPhi}
                columns={[
                  {
                    title: 'Khoản chi phí',
                    dataIndex: 'tenMatHang',
                    render: (t: string, r) => (
                      <div>
                        <b>{t}</b> <BaseTag>{r.loaiChiPhi}</BaseTag>
                      </div>
                    ),
                  },
                  { title: 'SL', dataIndex: 'soLuong', width: 60, align: 'center' },
                  { title: 'Đơn giá', dataIndex: 'donGia', width: 100, align: 'right', render: (v: number) => money(v) },
                  { title: 'Thành tiền', dataIndex: 'thanhTien', width: 110, align: 'right', render: (v: number) => money(v) },
                ]}
              />
            </BaseCard>

            <BaseCard
              title="Lịch sử các lần thanh toán"
              size="small"
              extra={
                detailData.hoaDon.conThieu > 0 && (
                  <BaseButton
                    type="primary"
                    size="small"
                    icon={<DollarIcon />}
                    onClick={() => openPayModal(detailData.hoaDon)}
                  >
                    Thu tiền
                  </BaseButton>
                )
              }
            >
              {detailData.lanThanhToan.length === 0 ? (
                <BaseText type="secondary">Chưa có lần thanh toán nào.</BaseText>
              ) : (
                <BaseTable
                  rowKey="stt"
                  pagination={false}
                  size="small"
                  dataSource={detailData.lanThanhToan}
                  columns={[
                    { title: 'Lần', dataIndex: 'stt', width: 60, align: 'center' },
                    { title: 'Thời gian', dataIndex: 'thoiGian', render: (t: string) => dateTimeVN(t) },
                    { title: 'Hình thức', dataIndex: 'hinhThuc', width: 140 },
                    {
                      title: 'Số tiền',
                      dataIndex: 'soTien',
                      align: 'right',
                      width: 120,
                      render: (v: number) => <b>{money(v)}</b>,
                    },
                  ]}
                />
              )}
            </BaseCard>
          </div>
        )}
      </BaseDrawer>
    </div>
  )
}
