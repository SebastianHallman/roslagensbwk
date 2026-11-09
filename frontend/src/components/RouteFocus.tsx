import { useEffect } from 'react'
import { useLocation } from 'react-router'

function RouteFocus() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main')?.focus()
  }, [pathname])
  return null
}

export default RouteFocus
