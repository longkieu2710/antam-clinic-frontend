import { Typography } from 'antd'
import type { ComponentProps } from 'react'

type TitleProps = ComponentProps<typeof Typography.Title>
type TextProps = ComponentProps<typeof Typography.Text>
type ParagraphProps = ComponentProps<typeof Typography.Paragraph>

/** Tiêu đề — mặc định cỡ h4, không có khoảng cách ngoài. */
export function BaseTitle({ level = 4, style, ...rest }: TitleProps) {
  return <Typography.Title level={level} style={{ margin: 0, ...style }} {...rest} />
}

/** Đoạn chữ ngắn trong dòng (strong, code, type="secondary"…). */
export function BaseText(props: TextProps) {
  return <Typography.Text {...props} />
}

/** Đoạn văn. */
export function BaseParagraph(props: ParagraphProps) {
  return <Typography.Paragraph {...props} />
}
