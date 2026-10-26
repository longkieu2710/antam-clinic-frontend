import { useQuery } from '@tanstack/react-query'
import { getSiteStatus } from '../api/endpoints'
import {
  BaseAlert,
  BaseBadge,
  BaseButton,
  BaseCard,
  BaseCol,
  BaseDescriptions,
  BaseErrorAlert,
  BaseRow,
  BaseSkeleton,
  BaseTag,
  BaseText,
  ReloadIcon,
} from '../components/common'
import type { SiteStatus } from '../api/types'
import { PageTitle } from '../layout/PageTitle'

/** Trạng thái 4 trạm CSDL — kiểm tra nhanh cụm Docker đã chạy đúng chưa. */
export function DashboardPage() {
  const query = useQuery({ queryKey: ['system-sites'], queryFn: getSiteStatus, refetchInterval: 15_000 })

  return (
    <>
      <PageTitle
        title="Tổng quan hệ thống"
        description="Trạng thái kết nối tới 4 trạm CSDL phân tán. Tự làm mới mỗi 15 giây."
        extra={
          <BaseButton icon={<ReloadIcon />} loading={query.isFetching} onClick={() => query.refetch()}>
            Kiểm tra lại
          </BaseButton>
        }
      />

      {query.error && <BaseErrorAlert title="Không lấy được trạng thái" error={query.error} />}

      <BaseRow gutter={[16, 16]}>
        {query.isLoading &&
          [0, 1, 2, 3].map((i) => (
            <BaseCol xs={24} md={12} xl={6} key={i}>
              <BaseCard>
                <BaseSkeleton />
              </BaseCard>
            </BaseCol>
          ))}
        {query.data?.map((s) => (
          <BaseCol xs={24} md={12} xl={6} key={s.site}>
            <SiteCard status={s} />
          </BaseCol>
        ))}
      </BaseRow>

      <BaseAlert
        style={{ marginTop: 16 }}
        type="info"
        title="Ứng dụng chọn trạm như thế nào?"
        description={
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            <li>Các màn của chi nhánh gửi header <code>X-Site</code> theo ô "Chi nhánh đang làm việc" trên thanh tiêu đề.</li>
            <li>Danh mục chung (thuốc, chi nhánh…) luôn ghi ở S0 qua <code>/api/master/**</code>; Logical Replication tự đẩy xuống S1–S3.</li>
            <li>Báo cáo toàn chuỗi đọc ở S0 qua <code>/api/hq/**</code> (view gộp 3 chi nhánh bằng postgres_fdw).</li>
          </ul>
        }
      />
    </>
  )
}

function SiteCard({ status: s }: { status: SiteStatus }) {
  return (
    <BaseCard
      title={
        <span>
          <BaseBadge status={s.up ? 'success' : 'error'} /> {s.site} · {s.name}
        </span>
      }
      extra={<BaseTag color={s.role === 'HUB' ? 'orange' : 'green'}>{s.role === 'HUB' ? 'Trung tâm' : s.maCn}</BaseTag>}
    >
      <BaseText type="secondary" style={{ fontSize: 12 }} copyable={{ text: s.jdbcUrl }}>
        <code>{s.jdbcUrl.replace('jdbc:postgresql://', '')}</code>
      </BaseText>
      {s.up ? (
        <BaseDescriptions
          column={1}
          style={{ marginTop: 12 }}
          items={[
            { key: 'db', label: 'Database', children: s.database },
            { key: 'ms', label: 'Độ trễ', children: `${s.latencyMs} ms` },
            ...Object.entries(s.counts ?? {}).map(([label, value]) => ({ key: label, label, children: value })),
          ]}
        />
      ) : null}
      {s.error && (
        <BaseAlert type={s.up ? 'warning' : 'error'} style={{ marginTop: 12, marginBottom: 0 }} title={s.up ? 'Chưa có dữ liệu' : 'Không kết nối được'} description={s.error} />
      )}
    </BaseCard>
  )
}
