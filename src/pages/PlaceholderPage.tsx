import { useLocation } from 'react-router'
import { BaseResult, BaseText } from '../components/common'
import { findEntry } from '../layout/menu'
import { PageTitle } from '../layout/PageTitle'

/** Màn hình chưa làm — giữ chỗ trong menu, thiết kế xem ở prototype. */
export function PlaceholderPage() {
  const { pathname } = useLocation()
  const entry = findEntry(pathname)
  return (
    <>
      <PageTitle title={entry?.label ?? 'Không tìm thấy trang'} hub={entry?.hub} />
      <BaseResult
        status={entry ? 'info' : '404'}
        title={entry ? 'Màn hình đang phát triển' : 'Không có trang này'}
        subTitle={
          entry ? (
            <>
              Thiết kế giao diện và API dự kiến: mở <BaseText code>requirements/02_ui-prototype.html#{pathname.slice(1)}</BaseText>
            </>
          ) : undefined
        }
      />
    </>
  )
}
