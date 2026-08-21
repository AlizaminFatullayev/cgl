import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import {
  PHOTO_CATEGORIES,
  type PhotoCategory,
  type VehiclePhoto,
} from '@/types/database'
import { photoCategoryLabel } from '@/i18n/labels'
import { useSignedPhotos } from '@/lib/use-signed-photos'
import { usePhotoViewer } from '@/lib/use-photo-viewer'
import { PhotoViewer } from '@/components/PhotoViewer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/**
 * The reference gallery: four fixed columns, photos stacked vertically inside
 * their column, and an empty category still showing its header so the customer
 * can see that the column exists and is simply empty.
 *
 * The VIEWER, though, does not respect the columns: clicking any photo browses
 * ALL of that vehicle's photos, in the flattened order below. Being unable to
 * swipe from the last Auction photo to the first Stock photo would be a worse
 * gallery than the reference, not a better one.
 *
 * Signing happens ONCE for the whole flattened list, through the shared hook,
 * so a thumbnail and its full-size view are the same URL with one expiry clock.
 *
 * Passing `onCategoryChange` turns on the per-photo category picker. Only the
 * admin panel passes it -- vehicle_photos UPDATE is admin-only in RLS, so a
 * customer holding this component could not write the column anyway.
 */
export function VehicleGallery({
  photos,
  title,
  onCategoryChange,
  savingPhotoId,
}: {
  photos: readonly VehiclePhoto[]
  title: string
  onCategoryChange?: (photoId: string, category: PhotoCategory) => void
  savingPhotoId?: string | null
}) {
  const { t } = useTranslation(['photos', 'cars'])
  const viewer = usePhotoViewer()

  /*
    One flat list in column order, so a photo's index here is the index the
    viewer opens at. Photos with no storage path are dropped: there is nothing
    to sign and nothing to show.
  */
  const ordered = useMemo(() => {
    const byCategory = new Map<PhotoCategory, VehiclePhoto[]>()
    for (const category of PHOTO_CATEGORIES) byCategory.set(category, [])
    for (const photo of photos) {
      if (!photo.url) continue
      // A category outside the four is impossible (CHECK constraint), but a
      // row that somehow had one would vanish silently -- so it lands in the
      // first column rather than nowhere.
      const bucket = byCategory.get(photo.category) ?? byCategory.get('auction')
      bucket?.push(photo)
    }
    const flat: VehiclePhoto[] = []
    for (const category of PHOTO_CATEGORIES) {
      flat.push(...(byCategory.get(category) ?? []))
    }
    return { byCategory, flat }
  }, [photos])

  const paths = useMemo(
    () => ordered.flat.map((photo) => photo.url ?? ''),
    [ordered],
  )
  const { urls, loading, refresh } = useSignedPhotos(paths)

  /** Index of a photo in the flattened list -- what the viewer opens at. */
  const indexOf = (photoId: string) =>
    ordered.flat.findIndex((photo) => photo.id === photoId)

  if (loading && paths.length > 0) {
    return (
      <div className="flex items-center gap-2 py-8">
        <Loader2 className="text-muted-foreground size-5 animate-spin" />
        <span className="text-muted-foreground text-sm">
          {t('photos:loading')}
        </span>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {PHOTO_CATEGORIES.map((category) => {
          const column = ordered.byCategory.get(category) ?? []
          return (
            <div key={category} className="flex flex-col gap-2">
              {/* The header renders whether or not the column has photos. */}
              <h3 className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-center text-sm font-semibold">
                {photoCategoryLabel(category)}
              </h3>

              {column.length === 0 ? (
                <p className="text-muted-foreground border-border/60 rounded-lg border border-dashed py-6 text-center text-xs">
                  {t('photos:categoryEmpty')}
                </p>
              ) : (
                column.map((photo) => {
                  const index = indexOf(photo.id)
                  return (
                    <div key={photo.id} className="space-y-1">
                      <button
                        type="button"
                        onClick={(event) => viewer.open(index, event)}
                        className="bg-secondary focus-visible:ring-ring border-border/60 block aspect-4/3 w-full overflow-hidden rounded-lg border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                        aria-label={t('photos:openViewer', {
                          index: index + 1,
                          total: ordered.flat.length,
                        })}
                      >
                        {urls[index] ? (
                          <img
                            src={urls[index] ?? undefined}
                            alt=""
                            loading="lazy"
                            onError={refresh}
                            className="size-full object-cover"
                          />
                        ) : null}
                      </button>

                      {onCategoryChange && (
                        <div className="flex items-center gap-1">
                          <Select
                            items={PHOTO_CATEGORIES.map((value) => ({
                              value,
                              label: photoCategoryLabel(value),
                            }))}
                            value={photo.category}
                            onValueChange={(next) =>
                              next &&
                              onCategoryChange(photo.id, next as PhotoCategory)
                            }
                          >
                            <SelectTrigger
                              size="sm"
                              className="w-full"
                              aria-label={t('photos:changeCategory', {
                                index: index + 1,
                              })}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PHOTO_CATEGORIES.map((value) => (
                                <SelectItem key={value} value={value}>
                                  {photoCategoryLabel(value)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {savingPhotoId === photo.id && (
                            <Loader2 className="text-muted-foreground size-4 shrink-0 animate-spin" />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>

      <PhotoViewer
        urls={urls}
        index={viewer.index}
        onIndexChange={viewer.goTo}
        onClose={viewer.close}
        returnFocusRef={viewer.returnFocusRef}
        title={title}
        onExpired={refresh}
      />
    </>
  )
}
