import { useTranslation } from 'react-i18next'
import { ImageOff, Images, Loader2 } from 'lucide-react'
import { useSignedPhotos } from '@/lib/use-signed-photos'
import { PhotoViewer } from '@/components/PhotoViewer'
import { usePhotoViewer } from '@/lib/use-photo-viewer'
import { cn } from '@/lib/utils'

/**
 * Vehicle photos, wired to the full-screen viewer.
 *
 * Two shapes, one behaviour:
 *
 *   variant="grid"  -- every photo as a thumbnail (the gallery dialogs)
 *   variant="cover" -- ONE photo, sized like a hero (the My Vehicles card)
 *
 * The viewer is identical either way: it always receives every photo on the
 * vehicle, so a customer who clicks the single cover can still page, swipe and
 * zoom through the whole set. "Cover" is only about how much is on the card
 * before you click, never about how much you can reach afterwards.
 *
 * Thumbnail and full-size share one signed URL from useSignedPhotos -- the same
 * bytes, one request, one expiry clock. The browser has the image cached by the
 * time the viewer paints, so opening is instant.
 *
 * Each thumbnail is a real <button>, so it is reachable by keyboard and is what
 * focus returns to when the viewer closes.
 */
export function VehiclePhotoGrid({
  paths,
  title,
  className,
  variant = 'grid',
}: {
  paths: readonly string[]
  title: string
  className?: string
  variant?: 'grid' | 'cover'
}) {
  const { t } = useTranslation('photos')
  const { urls, loading, refresh } = useSignedPhotos(paths)
  const viewer = usePhotoViewer()

  if (paths.length === 0) {
    // A card keeps its shape when the car has no photos yet; a gallery says so
    // in words, because there is nothing else on screen to explain the gap.
    return variant === 'cover' ? (
      <div
        className={cn(
          'bg-secondary flex aspect-video items-center justify-center overflow-hidden rounded-xl',
          className,
        )}
      >
        <ImageOff className="text-muted-foreground size-6" aria-hidden="true" />
      </div>
    ) : (
      <p className="text-muted-foreground py-6 text-center text-sm">
        {t('none')}
      </p>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground text-sm">{t('loading')}</span>
      </div>
    )
  }

  const viewerElement = (
    <PhotoViewer
      urls={urls}
      index={viewer.index}
      onIndexChange={viewer.goTo}
      onClose={viewer.close}
      returnFocusRef={viewer.returnFocusRef}
      title={title}
      onExpired={refresh}
    />
  )

  if (variant === 'cover') {
    const cover = urls[0] ?? null
    return (
      <>
        <button
          type="button"
          onClick={(event) => viewer.open(0, event)}
          className={cn(
            'bg-secondary focus-visible:ring-ring relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            className,
          )}
          aria-label={t('openViewer', { index: 1, total: urls.length })}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              loading="lazy"
              onError={refresh}
              className="size-full object-cover"
            />
          ) : (
            <ImageOff className="text-muted-foreground size-6" aria-hidden="true" />
          )}

          {/* The count is the affordance: it says there is more behind this. */}
          {urls.length > 1 && (
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white tabular-nums">
              <Images className="size-3.5" aria-hidden="true" />
              {urls.length}
            </span>
          )}
        </button>

        {viewerElement}
      </>
    )
  }

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 gap-3 sm:grid-cols-3',
          className,
        )}
      >
        {urls.map((url, index) => (
          <button
            key={paths[index]}
            type="button"
            onClick={(event) => viewer.open(index, event)}
            className="bg-secondary focus-visible:ring-ring transition-smooth border-border/60 relative aspect-4/3 overflow-hidden rounded-xl border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none hover:opacity-90"
            aria-label={t('openViewer', { index: index + 1, total: urls.length })}
          >
            {url ? (
              <img
                src={url}
                alt=""
                loading="lazy"
                onError={refresh}
                className="size-full object-cover"
              />
            ) : (
              <ImageOff
                className="text-muted-foreground absolute top-1/2 left-1/2 size-6 -translate-x-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>

      {viewerElement}
    </>
  )
}
