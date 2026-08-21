import { useCallback, useRef, useState } from 'react'

/**
 * Opens the full-screen PhotoViewer and remembers which element to hand focus
 * back to.
 *
 * Call `open(index, event)` straight from a thumbnail's onClick: the event's
 * currentTarget is the element focus returns to on close.
 *
 * Lives here rather than beside the component so PhotoViewer.tsx exports only
 * components and keeps working with fast refresh.
 */
export function usePhotoViewer() {
  const [index, setIndex] = useState<number | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const open = useCallback(
    (next: number, event?: { currentTarget: HTMLElement }) => {
      returnFocusRef.current = event?.currentTarget ?? null
      setIndex(next)
    },
    [],
  )

  /*
    Navigating between photos must NOT touch returnFocusRef: the element to
    return focus to is the thumbnail that opened the viewer, not whatever the
    customer paged to afterwards.
  */
  const goTo = useCallback((next: number) => setIndex(next), [])

  const close = useCallback(() => setIndex(null), [])

  return { index, open, goTo, close, returnFocusRef }
}
