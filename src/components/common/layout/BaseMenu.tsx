import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

export interface BaseMenuItem {
  key: string
  label: ReactNode
  icon?: ReactNode
}

export interface BaseMenuGroup {
  key: string
  label: ReactNode
  items: BaseMenuItem[]
}

interface BaseMenuProps {
  groups: BaseMenuGroup[]
  selectedKey?: string
  onSelect?: (key: string) => void
}

/** Menu dọc chia nhóm (menu trái của ứng dụng). */
export function BaseMenu({ groups, selectedKey, onSelect }: BaseMenuProps) {
  const items = useMemo<MenuProps['items']>(
    () =>
      groups.map((group) => ({
        type: 'group' as const,
        key: group.key,
        label: group.label,
        children: group.items.map((item) => ({ key: item.key, icon: item.icon, label: item.label })),
      })),
    [groups],
  )
  return (
    <Menu
      mode="inline"
      items={items}
      selectedKeys={selectedKey ? [selectedKey] : []}
      onClick={({ key }) => onSelect?.(key)}
      style={{ borderInlineEnd: 0 }}
    />
  )
}
