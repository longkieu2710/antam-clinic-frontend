import { useContext } from 'react'
import { SiteContext, type SiteContextValue } from './context'

export function useSite(): SiteContextValue {
  const value = useContext(SiteContext)
  if (!value) throw new Error('useSite phải nằm trong <SiteProvider>')
  return value
}
