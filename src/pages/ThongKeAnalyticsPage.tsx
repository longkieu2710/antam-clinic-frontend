import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  getApiOverview,
  getInvoiceMongoOverview,
  getInvoicesByBranchMongo,
  getPaymentMethodStatsMongo,
  getRecentApiLogs,
  getTopDebtorsMongo,
  getTopErrorApis,
  getTopSlowApis,
  triggerBulkSyncInvoices,
} from '../api/endpoints'
import { errorText } from '../api/http'
import type { ApiLogEntry, InvoiceBranchStat, PaymentMethodStat, TopDebtor, TopErrorApi, TopSlowApi } from '../api/types'
import {
  ApiIcon,
  BaseAlert,
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseCol,
  BaseRow,
  BaseSelect,
  BaseSkeleton,
  BaseSpace,
  BaseStatistic,
  BaseTable,
  BaseTabs,
  BaseTag,
  BaseText,
  CheckCircleIcon,
  ClockIcon,
  DollarIcon,
  ReloadIcon,
  SyncIcon,
  useNotify,
  WalletIcon,
  WarningIcon,
} from '../components/common'
import type { BaseColumns } from '../components/common'
import { PageTitle } from '../layout/PageTitle'
import { dateTimeVN, money } from '../utils/format'

export function ThongKeAnalyticsPage() {
  const queryClient = useQueryClient()
  const notify = useNotify()
  const [activeTab, setActiveTab] = useState('api')
  const [logFilterStatus, setLogFilterStatus] = useState<'all' | 'errors' | 'success'>('all')

  // ---- Query Tab 1: API Monitoring
  const apiOverviewQuery = useQuery({
    queryKey: ['analytics', 'api-overview'],
    queryFn: getApiOverview,
    refetchInterval: 10000,
  })

  const apiLogsQuery = useQuery({
    queryKey: ['analytics', 'api-logs', logFilterStatus],
    queryFn: () => {
      const q: Record<string, string | null | undefined> = { limit: '50' }
      if (logFilterStatus === 'errors') q.hasError = 'true'
      if (logFilterStatus === 'success') q.statusCode = '200'
      return getRecentApiLogs(q)
    },
    refetchInterval: 10000,
  })

  const topSlowQuery = useQuery({
    queryKey: ['analytics', 'top-slow'],
    queryFn: getTopSlowApis,
    refetchInterval: 15000,
  })

  const topErrorsQuery = useQuery({
    queryKey: ['analytics', 'top-errors'],
    queryFn: getTopErrorApis,
    refetchInterval: 15000,
  })

  // ---- Query Tab 2: Invoice MongoDB Replica
  const invoiceOverviewQuery = useQuery({
    queryKey: ['analytics', 'invoice-overview'],
    queryFn: getInvoiceMongoOverview,
    refetchInterval: 15000,
  })

  const invoiceBranchQuery = useQuery({
    queryKey: ['analytics', 'invoice-branch'],
    queryFn: getInvoicesByBranchMongo,
    refetchInterval: 15000,
  })

  const paymentMethodsQuery = useQuery({
    queryKey: ['analytics', 'payment-methods'],
    queryFn: getPaymentMethodStatsMongo,
    refetchInterval: 15000,
  })

  const topDebtorsQuery = useQuery({
    queryKey: ['analytics', 'top-debtors'],
    queryFn: getTopDebtorsMongo,
    refetchInterval: 15000,
  })

  // ---- Bulk Sync Mutation
  const bulkSyncMutation = useMutation({
    mutationFn: triggerBulkSyncInvoices,
    onSuccess: (res) => {
      notify.success(res.message || `Đã đẩy ${res.queuedToKafka} hóa đơn vào Kafka để đồng bộ sang MongoDB!`)
      void queryClient.invalidateQueries({ queryKey: ['analytics'] })
    },
    onError: (err) => {
      notify.error(`Lỗi đồng bộ: ${errorText(err)}`)
    },
  })

  // ---- Table Columns
  const logColumns: BaseColumns<ApiLogEntry> = [
    {
      title: 'Thời gian',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 170,
      render: (v: string) => dateTimeVN(v),
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (m: string) => {
        const color = m === 'GET' ? 'blue' : m === 'POST' ? 'green' : m === 'PUT' ? 'orange' : 'red'
        return <BaseTag color={color}>{m}</BaseTag>
      },
    },
    {
      title: 'Endpoint / Route',
      dataIndex: 'route',
      key: 'route',
      ellipsis: true,
      render: (r: string, record) => (
        <span>
          <BaseText strong>{r}</BaseText>
          {record.url !== r && (
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>{record.url}</div>
          )}
        </span>
      ),
    },
    {
      title: 'Mã HTTP',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 90,
      render: (code: number) => {
        const color = code >= 500 ? 'red' : code >= 400 ? 'gold' : 'green'
        return <BaseTag color={color}>{code}</BaseTag>
      },
    },
    {
      title: 'Thời gian xử lý',
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 130,
      render: (ms: number) => {
        const color = ms > 500 ? '#cf1322' : ms > 150 ? '#d48806' : '#389e0d'
        return (
          <span style={{ color, fontWeight: 500 }}>
            <ClockIcon style={{ marginRight: 4 }} />
            {ms} ms
          </span>
        )
      },
    },
    {
      title: 'Chi nhánh / IP',
      key: 'client',
      width: 140,
      render: (_, r) => (
        <div>
          {r.site ? <BaseTag color="purple">{r.site}</BaseTag> : <BaseText type="secondary">—</BaseText>}
          <span style={{ fontSize: '11px', color: '#8c8c8c', marginLeft: 4 }}>{r.clientIp}</span>
        </div>
      ),
    },
    {
      title: 'Chi tiết lỗi (nếu có)',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (err: string | null) =>
        err ? (
          <BaseText type="danger" style={{ fontSize: '12px' }}>
            {err}
          </BaseText>
        ) : (
          <BaseText type="secondary">—</BaseText>
        ),
    },
  ]

  const topSlowColumns: BaseColumns<TopSlowApi> = [
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (m: string) => <BaseTag color="blue">{m}</BaseTag>,
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (r: string) => <BaseText strong>{r}</BaseText>,
    },
    {
      title: 'Số lần gọi',
      dataIndex: 'count',
      key: 'count',
      width: 100,
    },
    {
      title: 'TB (ms)',
      dataIndex: 'avgDurationMs',
      key: 'avgDurationMs',
      width: 110,
      render: (v: number | undefined, r) => {
        const val = v ?? r.avgDuration ?? 0
        return <span style={{ color: '#d48806', fontWeight: 600 }}>{val} ms</span>
      },
    },
    {
      title: 'Min (ms)',
      dataIndex: 'minDurationMs',
      key: 'minDurationMs',
      width: 100,
      render: (v: number | undefined, r) => {
        const val = v ?? r.minDuration ?? 0
        return `${val} ms`
      },
    },
    {
      title: 'Max (ms)',
      dataIndex: 'maxDurationMs',
      key: 'maxDurationMs',
      width: 100,
      render: (v: number | undefined, r) => {
        const val = v ?? r.maxDuration ?? 0
        return <span style={{ color: '#cf1322', fontWeight: 600 }}>{val} ms</span>
      },
    },
  ]

  const topErrorColumns: BaseColumns<TopErrorApi> = [
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      width: 90,
      render: (m: string) => <BaseTag color="red">{m}</BaseTag>,
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      render: (r: string) => <BaseText strong>{r}</BaseText>,
    },
    {
      title: 'Mã HTTP',
      dataIndex: 'statusCode',
      key: 'statusCode',
      width: 90,
      render: (c: number) => <BaseTag color="volcano">{c}</BaseTag>,
    },
    {
      title: 'Số lỗi',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: (v: number) => <span style={{ color: '#cf1322', fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Thông điệp lỗi gần nhất',
      dataIndex: 'errorMessage',
      key: 'errorMessage',
      render: (m: string | null) => (
        <span style={{ color: '#cf1322', fontSize: '12px' }}>{m || 'Không có mô tả'}</span>
      ),
    },
    {
      title: 'Lỗi lần cuối',
      dataIndex: 'lastOccurred',
      key: 'lastOccurred',
      width: 160,
      render: (d: string) => dateTimeVN(d),
    },
  ]

  const branchStatColumns: BaseColumns<InvoiceBranchStat> = [
    {
      title: 'Chi nhánh',
      dataIndex: 'siteName',
      key: 'siteName',
      render: (name: string, r) => (
        <div>
          <BaseText strong>{name}</BaseText>
          <BaseTag color="purple" style={{ marginLeft: 8 }}>
            {r.site}
          </BaseTag>
        </div>
      ),
    },
    {
      title: 'Số hóa đơn',
      dataIndex: 'totalInvoices',
      key: 'totalInvoices',
      width: 120,
    },
    {
      title: 'Tổng phải thu',
      dataIndex: 'phaiTra',
      key: 'phaiTra',
      width: 150,
      render: (v: number) => money(v),
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'daThanhToan',
      key: 'daThanhToan',
      width: 150,
      render: (v: number) => <span style={{ color: '#389e0d', fontWeight: 600 }}>{money(v)}</span>,
    },
    {
      title: 'Còn nợ viện phí',
      dataIndex: 'conThieu',
      key: 'conThieu',
      width: 150,
      render: (v: number) => (
        <span style={{ color: v > 0 ? '#cf1322' : '#8c8c8c', fontWeight: 600 }}>{money(v)}</span>
      ),
    },
    {
      title: 'Tỷ lệ thu hồi',
      dataIndex: 'tyLeThu',
      key: 'tyLeThu',
      width: 130,
      render: (v: number) => {
        const color = v >= 90 ? 'green' : v >= 50 ? 'blue' : 'orange'
        return <BaseTag color={color}>{v}%</BaseTag>
      },
    },
  ]

  const paymentColumns: BaseColumns<PaymentMethodStat> = [
    {
      title: 'Hình thức thanh toán',
      dataIndex: 'hinhThuc',
      key: 'hinhThuc',
      render: (h: string) => <BaseText strong>{h}</BaseText>,
    },
    {
      title: 'Số lượt giao dịch',
      dataIndex: 'soLuotThanhToan',
      key: 'soLuotThanhToan',
      width: 160,
    },
    {
      title: 'Tổng tiền thu',
      dataIndex: 'tongTienThu',
      key: 'tongTienThu',
      render: (v: number) => <span style={{ color: '#389e0d', fontWeight: 600 }}>{money(v)}</span>,
    },
  ]

  const debtorColumns: BaseColumns<TopDebtor> = [
    {
      title: 'Mã BN',
      dataIndex: 'maBN',
      key: 'maBN',
      width: 140,
      render: (m: string) => <BaseText strong>{m}</BaseText>,
    },
    {
      title: 'Họ tên bệnh nhân',
      dataIndex: 'tenBN',
      key: 'tenBN',
      render: (name: string, r) => (
        <div>
          <span>{name}</span>
          {r.soDienThoai && (
            <span style={{ fontSize: '11px', color: '#8c8c8c', marginLeft: 8 }}>({r.soDienThoai})</span>
          )}
        </div>
      ),
    },
    {
      title: 'Số HĐ nợ',
      dataIndex: 'soHoaDonNo',
      key: 'soHoaDonNo',
      width: 110,
    },
    {
      title: 'Tổng viện phí',
      dataIndex: 'tongPhaiTra',
      key: 'tongPhaiTra',
      width: 140,
      render: (v: number) => money(v),
    },
    {
      title: 'Đã thanh toán',
      dataIndex: 'tongDaTra',
      key: 'tongDaTra',
      width: 140,
      render: (v: number) => money(v),
    },
    {
      title: 'Còn nợ',
      dataIndex: 'tongNo',
      key: 'tongNo',
      width: 150,
      render: (v: number) => (
        <span style={{ color: '#cf1322', fontWeight: 700 }}>{money(v)}</span>
      ),
    },
  ]

  const apiOverview = apiOverviewQuery.data
  const invoiceOverview = invoiceOverviewQuery.data

  return (
    <div>
      <PageTitle
        title="Thống kê MongoDB & Kafka"
        hub={true}
        description="Giám sát API & Bản sao Hóa đơn bất đồng bộ đặt tại Site Trung tâm S0"
        extra={
          <BaseSpace>
            <BaseBadge
              status={apiOverview?.mongoConnected ? 'success' : 'error'}
              text={apiOverview?.mongoConnected ? 'MongoDB: Đang kết nối' : 'MongoDB: Mất kết nối'}
            />
            <BaseBadge
              status={apiOverview?.kafkaConnected ? 'processing' : 'warning'}
              text={apiOverview?.kafkaConnected ? 'Kafka: Broker sẵn sàng' : 'Kafka: Chờ broker'}
            />
            <BaseButton
              icon={<ReloadIcon />}
              onClick={() => {
                void queryClient.invalidateQueries({ queryKey: ['analytics'] })
                notify.info('Đang làm mới dữ liệu thống kê...')
              }}
            >
              Làm mới
            </BaseButton>
          </BaseSpace>
        }
      />

      <BaseAlert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Kiến trúc Giám sát & Báo cáo tập trung tại Site Trung tâm (S0)"
        description="Hệ thống cơ sở dữ liệu MongoDB và Kafka Broker được triển khai tập trung tại Site Trung tâm (S0). Mọi API và sự kiện hóa đơn từ các Site Chi nhánh (S1, S2, S3) được các chi nhánh gửi bất đồng bộ về Kafka Trung tâm. Consumer tại S0 xử lý lưu trữ vào MongoDB để phục vụ giám sát và báo cáo toàn chuỗi cho Quản trị viên."
      />

      <BaseTabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'api',
            label: (
              <span>
                <ApiIcon style={{ marginRight: 6 }} />
                Giám sát & Thống kê API
              </span>
            ),
            children: (
              <div>
                {/* 4 Cards Overview */}
                <BaseRow gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Tổng lượt gọi API"
                        value={apiOverview?.totalCalls ?? 0}
                        prefix={<ApiIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Số lượt API lỗi"
                        value={apiOverview?.totalErrors ?? 0}
                        valueStyle={{ color: (apiOverview?.totalErrors ?? 0) > 0 ? '#cf1322' : '#389e0d' }}
                        prefix={<WarningIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Tỷ lệ lỗi"
                        value={apiOverview?.errorRate ?? 0}
                        suffix="%"
                        valueStyle={{ color: (apiOverview?.errorRate ?? 0) > 5 ? '#cf1322' : '#389e0d' }}
                        prefix={<CheckCircleIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Thời gian phản hồi TB"
                        value={apiOverview?.avgDurationMs ?? 0}
                        suffix="ms"
                        valueStyle={{ color: '#0958d9' }}
                        prefix={<ClockIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                </BaseRow>

                {/* Top Slow & Top Errors */}
                <BaseRow gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <BaseCol xs={24} lg={12}>
                    <BaseCard title="Top API phản hồi chậm nhất (MongoDB Aggregation)">
                      {topSlowQuery.isLoading ? (
                        <BaseSkeleton active />
                      ) : (
                        <BaseTable<TopSlowApi>
                          rowKey={(r) => `${r.method}-${r.route}`}
                          dataSource={topSlowQuery.data ?? []}
                          columns={topSlowColumns}
                          pagination={false}
                          size="small"
                        />
                      )}
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} lg={12}>
                    <BaseCard title="Top API phát sinh lỗi (MongoDB Aggregation)">
                      {topErrorsQuery.isLoading ? (
                        <BaseSkeleton active />
                      ) : (
                        <BaseTable<TopErrorApi>
                          rowKey={(r) => `${r.method}-${r.route}-${r.statusCode}`}
                          dataSource={topErrorsQuery.data ?? []}
                          columns={topErrorColumns}
                          pagination={false}
                          size="small"
                        />
                      )}
                    </BaseCard>
                  </BaseCol>
                </BaseRow>

                {/* Recent API Logs Table */}
                <BaseCard
                  title="Nhật ký gọi API thời gian thực (Lưu trữ MongoDB qua Kafka)"
                  extra={
                    <BaseSpace>
                      <span>Lọc trạng thái:</span>
                      <BaseSelect
                        value={logFilterStatus}
                        onChange={(v) => setLogFilterStatus(v as any)}
                        style={{ width: 160 }}
                        options={[
                          { value: 'all', label: 'Tất cả trạng thái' },
                          { value: 'errors', label: 'Chỉ các lượt lỗi' },
                          { value: 'success', label: 'Chỉ 200 OK' },
                        ]}
                      />
                      <BaseButton
                        icon={<ReloadIcon />}
                        onClick={() => void apiLogsQuery.refetch()}
                      >
                        Tải lại logs
                      </BaseButton>
                    </BaseSpace>
                  }
                >
                  <BaseTable<ApiLogEntry>
                    rowKey={(r) => r._id || r.requestId}
                    loading={apiLogsQuery.isLoading}
                    dataSource={apiLogsQuery.data?.data ?? []}
                    columns={logColumns}
                    pagination={{ pageSize: 15 }}
                    size="small"
                    scroll={{ x: 1000 }}
                  />
                </BaseCard>
              </div>
            ),
          },
          {
            key: 'invoices',
            label: (
              <span>
                <WalletIcon style={{ marginRight: 6 }} />
                Thống kê Hóa đơn (MongoDB Replica)
              </span>
            ),
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <BaseText type="secondary">
                    Bản sao hóa đơn được phi chuẩn hóa (denormalized) trên MongoDB, cho phép chạy tổng hợp công nợ và doanh thu tức thì mà không cần JOIN nhiều bảng trên PostgreSQL.
                  </BaseText>
                  <BaseButton
                    type="primary"
                    icon={<SyncIcon />}
                    loading={bulkSyncMutation.isPending}
                    onClick={() => bulkSyncMutation.mutate()}
                  >
                    Đồng bộ toàn bộ HĐ sang MongoDB
                  </BaseButton>
                </div>

                {/* Invoices Overview Cards */}
                <BaseRow gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Tổng hóa đơn"
                        value={invoiceOverview?.totalInvoices ?? 0}
                        prefix={<WalletIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Tổng số tiền phải trả"
                        value={invoiceOverview?.phaiTra ?? 0}
                        formatter={(v) => money(Number(v))}
                        prefix={<DollarIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Đã thực thu"
                        value={invoiceOverview?.daThanhToan ?? 0}
                        formatter={(v) => money(Number(v))}
                        valueStyle={{ color: '#389e0d' }}
                        prefix={<CheckCircleIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} sm={12} md={6}>
                    <BaseCard>
                      <BaseStatistic
                        title="Công nợ còn thiếu"
                        value={invoiceOverview?.conThieu ?? 0}
                        formatter={(v) => money(Number(v))}
                        valueStyle={{ color: (invoiceOverview?.conThieu ?? 0) > 0 ? '#cf1322' : '#8c8c8c' }}
                        prefix={<WarningIcon />}
                      />
                    </BaseCard>
                  </BaseCol>
                </BaseRow>

                {/* Branch Breakdown and Payment Methods */}
                <BaseRow gutter={[16, 16]} style={{ marginBottom: 20 }}>
                  <BaseCol xs={24} lg={15}>
                    <BaseCard title="Doanh thu & Công nợ theo Chi nhánh (MongoDB Replica)">
                      <BaseTable<InvoiceBranchStat>
                        rowKey="site"
                        loading={invoiceBranchQuery.isLoading}
                        dataSource={invoiceBranchQuery.data ?? []}
                        columns={branchStatColumns}
                        pagination={false}
                        size="small"
                      />
                    </BaseCard>
                  </BaseCol>
                  <BaseCol xs={24} lg={9}>
                    <BaseCard title="Cơ cấu hình thức thanh toán">
                      <BaseTable<PaymentMethodStat>
                        rowKey="hinhThuc"
                        loading={paymentMethodsQuery.isLoading}
                        dataSource={paymentMethodsQuery.data ?? []}
                        columns={paymentColumns}
                        pagination={false}
                        size="small"
                      />
                    </BaseCard>
                  </BaseCol>
                </BaseRow>

                {/* Top Debtors */}
                <BaseCard title="Top Bệnh nhân còn nợ viện phí (Theo dõi công nợ trên MongoDB)">
                  <BaseTable<TopDebtor>
                    rowKey="maBN"
                    loading={topDebtorsQuery.isLoading}
                    dataSource={topDebtorsQuery.data ?? []}
                    columns={debtorColumns}
                    pagination={{ pageSize: 10 }}
                    size="small"
                  />
                </BaseCard>
              </div>
            ),
          },
        ]}
      />
    </div>
  )
}
