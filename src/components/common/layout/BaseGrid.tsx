import { Col, Row } from 'antd'
import type { ColProps, RowProps } from 'antd'

/** Hàng lưới 24 cột — mặc định khoảng cách ngang 16px. */
export function BaseRow({ gutter = 16, ...rest }: RowProps) {
  return <Row gutter={gutter} {...rest} />
}

/** Cột trong lưới: xs / md / xl… là số cột (trên 24) theo độ rộng màn hình. */
export function BaseCol(props: ColProps) {
  return <Col {...props} />
}
