import { Statistic } from 'antd'
import type { StatisticProps } from 'antd'

/** Một con số lớn kèm nhãn (tổng doanh thu, tổng quỹ lương…). */
export function BaseStatistic(props: StatisticProps) {
  return <Statistic {...props} />
}
