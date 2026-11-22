import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function FilterSheet({ open, onClose, children }) {
  const sheetRef = useRef(null)
  const returnFocusRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    returnFocusRef.current = document.activeElement
    const sheet = sheetRef.current
    const focusableSelector = 'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    sheet?.querySelector(focusableSelector)?.focus()

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose()
      } else if (event.key === 'Tab' && sheet) {
        const focusable = [...sheet.querySelectorAll(focusableSelector)]
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.body.classList.add('sheet-open')
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.classList.remove('sheet-open')
      returnFocusRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <section
        aria-label="Broker filters"
        aria-modal="true"
        className="filter-sheet"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={(event) => { sheetRef.current.dataset.touchStart = String(event.touches[0].clientY) }}
        onTouchEnd={(event) => {
          const start = Number(sheetRef.current.dataset.touchStart)
          if (event.changedTouches[0].clientY - start > 100) onClose()
        }}
        ref={sheetRef}
        role="dialog"
      >
        <div className="sheet-heading">
          <h2>Filters</h2>
          <button aria-label="Close filters" className="icon-button" onClick={onClose} type="button"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  )
}
