import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog } from '@base-ui/react/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Full-screen photo viewer.
 *
 * Built on the same Base UI dialog that backs components/ui/dialog and
 * MobileNav, so focus trapping, Escape, backdrop dismissal, page-scroll locking
 * and focus return all come from the primitive. `finalFocus` is pointed at the
 * thumbnail that opened it, so closing puts the caret back where the customer
 * left it rather than at the top of the page.
 *
 * URLs come from the caller, which gets them from useSignedPhotos -- the one
 * signing path in the app. The viewer never signs anything itself: a second
 * fetch path would 403 on this private bucket the moment the two clocks drifted.
 * `onExpired` hands a failed image back to that hook to re-sign.
 *
 * Zoom and pan are hand-rolled on pointer events rather than pulled from a
 * dependency: the whole behaviour is one transform and a clamp, and adding a
 * gesture library for it would be more code to audit, not less.
 */

const MIN_SCALE = 1
const MAX_SCALE = 6
/** What a double-tap or a single zoom-button press jumps to. */
const STEP = 1.6
const DOUBLE_TAP_SCALE = 2.5

/** A horizontal drag longer than this, while not zoomed in, changes photo. */
const SWIPE_PX = 48

interface Transform {
  scale: number
  x: number
  y: number
}

const IDENTITY: Transform = { scale: 1, x: 0, y: 0 }

export interface PhotoViewerProps {
  /** Signed URLs, in display order. A null slot is a photo that failed to sign. */
  urls: readonly (string | null)[]
  /** Index currently shown, or null when the viewer is closed. */
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
  /** Element focus returns to on close -- normally the clicked thumbnail. */
  returnFocusRef: React.RefObject<HTMLElement | null>
  /** Vehicle name, used in the dialog title and the alt text. */
  title: string
  /** Called when a photo 403s, so the caller can re-sign its URLs. */
  onExpired?: () => void
}

export function PhotoViewer({
  urls,
  index,
  onIndexChange,
  onClose,
  returnFocusRef,
  title,
  onExpired,
}: PhotoViewerProps) {
  const { t } = useTranslation(['photos', 'common'])
  const [transform, setTransform] = useState<Transform>(IDENTITY)
  const [failed, setFailed] = useState(false)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const open = index !== null
  const total = urls.length
  const current = index === null ? null : (urls[index] ?? null)

  /**
   * Keeps the image from being dragged off screen: at scale s the image
   * overhangs the stage by (s * size - stage) / 2 in each direction, and that
   * overhang is exactly how far it may travel.
   */
  const clamp = useCallback((next: Transform): Transform => {
    const stage = stageRef.current
    const image = imageRef.current
    if (!stage || !image) return next

    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next.scale))
    const maxX = Math.max(0, (image.offsetWidth * scale - stage.clientWidth) / 2)
    const maxY = Math.max(
      0,
      (image.offsetHeight * scale - stage.clientHeight) / 2,
    )

    return {
      scale,
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    }
  }, [])

  /**
   * Scales around a fixed point (the cursor, or the midpoint of a pinch) so the
   * pixel under the fingers stays under the fingers. `cx`/`cy` are measured
   * from the centre of the stage, which is also the transform origin.
   */
  const zoomAround = useCallback(
    (nextScale: number, cx: number, cy: number) => {
      setTransform((previous) => {
        const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale))
        const ratio = scale / previous.scale
        return clamp({
          scale,
          x: cx - (cx - previous.x) * ratio,
          y: cy - (cy - previous.y) * ratio,
        })
      })
    },
    [clamp],
  )

  const zoomBy = useCallback(
    (factor: number) => {
      setTransform((previous) => clamp({ ...previous, scale: previous.scale * factor }))
    },
    [clamp],
  )

  const reset = useCallback(() => setTransform(IDENTITY), [])

  const go = useCallback(
    (delta: number) => {
      if (index === null || total === 0) return
      // Wraps, so the arrows are never dead ends on a two-photo vehicle.
      onIndexChange((index + delta + total) % total)
    },
    [index, onIndexChange, total],
  )

  // A new photo always starts unzoomed and centred.
  useEffect(() => {
    setTransform(IDENTITY)
    setFailed(false)
  }, [index])

  // Keyboard. Escape is the dialog primitive's job, not ours.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          go(-1)
          break
        case 'ArrowRight':
          event.preventDefault()
          go(1)
          break
        case '+':
        case '=':
          event.preventDefault()
          zoomBy(STEP)
          break
        case '-':
          event.preventDefault()
          zoomBy(1 / STEP)
          break
        case '0':
          event.preventDefault()
          reset()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, go, zoomBy, reset])

  /*
    Wheel zoom has to be a native non-passive listener: React registers its
    onWheel handler passively, so preventDefault() inside it is ignored and the
    page scrolls behind the viewer while you zoom.
  */
  useEffect(() => {
    const stage = stageRef.current
    if (!open || !stage) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = stage.getBoundingClientRect()
      const cx = event.clientX - rect.left - rect.width / 2
      const cy = event.clientY - rect.top - rect.height / 2
      // A smooth multiplier rather than a step, so a trackpad feels continuous.
      setTransform((previous) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, previous.scale * Math.exp(-event.deltaY / 320)),
        )
        const ratio = scale / previous.scale
        return clamp({
          scale,
          x: cx - (cx - previous.x) * ratio,
          y: cy - (cy - previous.y) * ratio,
        })
      })
    }

    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [open, clamp])

  /*
    Pointer bookkeeping for drag-to-pan, pinch-to-zoom and swipe-to-navigate.
    Pointer events cover mouse, touch and pen in one path; `touch-action: none`
    on the stage is what stops the browser claiming the gesture first.
  */
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<{
    startX: number
    startY: number
    startAt: number
    origin: Transform
    pinchDistance: number | null
  } | null>(null)
  const lastTap = useRef(0)

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })
    event.currentTarget.setPointerCapture(event.pointerId)

    const points = [...pointers.current.values()]
    gesture.current = {
      startX: event.clientX,
      startY: event.clientY,
      startAt: Date.now(),
      origin: transform,
      pinchDistance:
        points.length === 2 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : null,
    }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    })

    const state = gesture.current
    if (!state) return
    const points = [...pointers.current.values()]

    // Two fingers: pinch. Scale relative to the distance at gesture start.
    if (points.length === 2) {
      const distance = Math.hypot(
        points[0].x - points[1].x,
        points[0].y - points[1].y,
      )
      if (state.pinchDistance === null) {
        state.pinchDistance = distance
        state.origin = transform
        return
      }
      const stage = stageRef.current
      if (!stage) return
      const rect = stage.getBoundingClientRect()
      const midX = (points[0].x + points[1].x) / 2 - rect.left - rect.width / 2
      const midY = (points[0].y + points[1].y) / 2 - rect.top - rect.height / 2
      zoomAround(
        state.origin.scale * (distance / state.pinchDistance),
        midX,
        midY,
      )
      return
    }

    // One finger, zoomed in: pan. Zoomed out, the drag is a swipe and is
    // resolved on release instead.
    if (transform.scale > 1) {
      setTransform(
        clamp({
          scale: state.origin.scale,
          x: state.origin.x + (event.clientX - state.startX),
          y: state.origin.y + (event.clientY - state.startY),
        }),
      )
    }
  }

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = gesture.current
    pointers.current.delete(event.pointerId)

    if (state && pointers.current.size === 0) {
      const dx = event.clientX - state.startX
      const dy = event.clientY - state.startY
      const elapsed = Date.now() - state.startAt

      // Swipe: only while unzoomed, and only when it is clearly horizontal.
      if (
        state.origin.scale === 1 &&
        state.pinchDistance === null &&
        Math.abs(dx) > SWIPE_PX &&
        Math.abs(dx) > Math.abs(dy) * 1.5
      ) {
        go(dx < 0 ? 1 : -1)
      } else if (
        Math.abs(dx) < 8 &&
        Math.abs(dy) < 8 &&
        elapsed < 300
      ) {
        // Tap. A second one inside 300ms toggles zoom -- the gesture people
        // already expect from every photo app.
        const now = Date.now()
        if (now - lastTap.current < 300) {
          const stage = stageRef.current
          if (stage) {
            const rect = stage.getBoundingClientRect()
            if (transform.scale > 1) {
              reset()
            } else {
              zoomAround(
                DOUBLE_TAP_SCALE,
                event.clientX - rect.left - rect.width / 2,
                event.clientY - rect.top - rect.height / 2,
              )
            }
          }
          lastTap.current = 0
        } else {
          lastTap.current = now
        }
      }

      gesture.current = null
    }
  }

  const zoomed = transform.scale > 1

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/90 duration-200 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0" />

        <Dialog.Popup
          finalFocus={returnFocusRef}
          className="fixed inset-0 z-50 flex flex-col outline-none"
        >
          <Dialog.Title className="sr-only">
            {t('photos:viewerTitle', { vehicle: title })}
          </Dialog.Title>

          {/* Top bar: counter left, zoom center, close right. */}
          <div className="flex items-center justify-between p-4 text-white">
            <div className="flex flex-1 justify-start">
              <span
                className="rounded-full bg-black/50 px-3 py-1 text-sm font-medium tabular-nums"
                aria-live="polite"
              >
                {t('photos:counter', {
                  index: (index ?? 0) + 1,
                  total,
                })}
              </span>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Button
                variant="ghost"
                className="size-11 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label={t('photos:zoomOut')}
                onClick={() => zoomBy(1 / STEP)}
                disabled={transform.scale <= MIN_SCALE}
              >
                <ZoomOut className="size-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                className="h-11 rounded-full bg-black/50 px-4 text-white hover:bg-black/70 hover:text-white"
                aria-label={t('photos:resetZoom')}
                onClick={reset}
              >
                <Maximize className="size-5" aria-hidden="true" />
                <span className="text-sm tabular-nums">
                  {Math.round(transform.scale * 100)}%
                </span>
              </Button>
              <Button
                variant="ghost"
                className="size-11 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                aria-label={t('photos:zoomIn')}
                onClick={() => zoomBy(STEP)}
                disabled={transform.scale >= MAX_SCALE}
              >
                <ZoomIn className="size-5" aria-hidden="true" />
              </Button>
            </div>

            <div className="flex flex-1 justify-end">
              <Dialog.Close
                render={
                  <Button
                    variant="ghost"
                    className="size-11 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                    aria-label={t('photos:close')}
                  />
                }
              >
                <X className="size-6" aria-hidden="true" />
              </Dialog.Close>
            </div>
          </div>

          {/* The stage. touch-action:none is what makes pinch and pan ours. */}
          <div
            ref={stageRef}
            className="relative flex flex-1 touch-none items-center justify-center overflow-hidden select-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {current && !failed ? (
              <div className="relative flex max-h-full max-w-full items-center justify-center">
                <img
                  ref={imageRef}
                  src={current}
                  alt={t('photos:photoAlt', {
                    vehicle: title,
                    index: (index ?? 0) + 1,
                    total,
                  })}
                  draggable={false}
                  onError={() => {
                    setFailed(true)
                    onExpired?.()
                  }}
                  className={cn(
                    'max-h-full max-w-full object-contain',
                    zoomed ? 'cursor-grab' : 'cursor-zoom-in',
                  )}
                  style={{
                    transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`,
                    // No transition while pinching or dragging: it would lag the
                    // finger. Button-driven zoom gets one.
                    transition: pointers.current.size > 0 ? 'none' : 'transform 120ms ease-out',
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 p-6 text-center text-white">
                <p className="text-sm">{t('photos:loadFailed')}</p>
                <Button
                  variant="outline"
                  className="h-11 rounded-full border-white/40 bg-transparent px-5 text-white hover:bg-white/15 hover:text-white"
                  onClick={() => {
                    setFailed(false)
                    onExpired?.()
                  }}
                >
                  {t('photos:retry')}
                </Button>
              </div>
            )}

            {total > 1 && !zoomed && (
              <>
                <Button
                  variant="ghost"
                  className="absolute top-1/2 left-4 size-11 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  aria-label={t('photos:previous')}
                  onClick={() => go(-1)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ChevronLeft className="size-6" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  className="absolute top-1/2 right-4 size-11 -translate-y-1/2 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-white"
                  aria-label={t('photos:next')}
                  onClick={() => go(1)}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <ChevronRight className="size-6" aria-hidden="true" />
                </Button>
              </>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
