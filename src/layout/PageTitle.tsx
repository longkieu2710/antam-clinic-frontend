import type { ReactNode } from 'react'
import { BaseParagraph, BaseSpace, BaseTag, BaseTitle } from '../components/common'
import { useSite } from '../site/useSite'

interface Props {
  title: string
  /** true: trang làm việc với trạm trung tâm S0 */
  hub?: boolean
  description?: ReactNode
  extra?: ReactNode
}

/** Tiêu đề trang + nhãn trạm CSDL mà trang đang làm việc. */
export function PageTitle({ title, hub, description, extra }: Props) {
  const { site, branch } = useSite()
  return (
    <div className="page-head">
      <div>
        <BaseTitle>
          {title}{' '}
          {hub ? (
            <BaseTag color="orange">Trung tâm · S0</BaseTag>
          ) : (
            <BaseTag color="green">
              {branch?.shortName ?? site} · {site}
            </BaseTag>
          )}
        </BaseTitle>
        {description && (
          <BaseParagraph type="secondary" style={{ margin: '4px 0 0' }}>
            {description}
          </BaseParagraph>
        )}
      </div>
      {extra && <BaseSpace wrap>{extra}</BaseSpace>}
    </div>
  )
}
