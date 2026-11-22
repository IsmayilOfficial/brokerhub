import { useEffect, useMemo, useState } from 'react'
import { CompareContext } from './CompareStore.js'

const STORAGE_KEY = 'brokerhub-compare'

export function CompareProvider({ children }) {
  const [selectedIds, setSelectedIds] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      return Array.isArray(stored) ? stored.slice(0, 3) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedIds))
  }, [selectedIds])

  const value = useMemo(
    () => ({
      selectedIds,
      toggleCompare(id) {
        setSelectedIds((current) =>
          current.includes(id)
            ? current.filter((selectedId) => selectedId !== id)
            : current.length < 3
              ? [...current, id]
              : current,
        )
      },
      removeFromCompare(id) {
        setSelectedIds((current) => current.filter((selectedId) => selectedId !== id))
      },
    }),
    [selectedIds],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}
