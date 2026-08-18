/**
 * Browser-side downscale and re-encode, using canvas only.
 *
 * No dependency: `createImageBitmap` + `<canvas>` + `toBlob` are enough, and a
 * library would add hundreds of kilobytes to do the same thing. The trade-off
 * is format support -- see `canCompress()` below.
 */

/** Long edge cap. Plenty for a listing photo, and it is what kills the size. */
export const MAX_EDGE_PX = 2000

/** What we aim for per photo. Quality is stepped down until we get near it. */
export const TARGET_BYTES = 2 * 1024 * 1024

/** Below this a photo is left exactly as it is -- re-encoding would only hurt. */
export const SKIP_COMPRESSION_BELOW_BYTES = 1.5 * 1024 * 1024

/** Quality ladder, tried in order until the result fits TARGET_BYTES. */
const QUALITY_STEPS = [0.82, 0.7, 0.6, 0.5, 0.4]

/**
 * Formats the canvas pipeline can actually decode everywhere.
 *
 * HEIC is deliberately absent. Chrome and Firefox cannot decode it at all, so
 * `createImageBitmap` throws and there is nothing to draw. Supporting it would
 * mean shipping a libheif wasm build (~2 MB), which is far more weight than
 * this feature justifies -- so HEIC is rejected up front with a message that
 * tells the customer what to do instead.
 */
export const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export function canCompress(file: File): boolean {
  return COMPRESSIBLE_TYPES.includes(file.type)
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function scaledSize(width: number, height: number): { w: number; h: number } {
  const longEdge = Math.max(width, height)
  if (longEdge <= MAX_EDGE_PX) return { w: width, h: height }
  // Ratio applied to both axes, so the aspect ratio is preserved exactly.
  const ratio = MAX_EDGE_PX / longEdge
  return { w: Math.round(width * ratio), h: Math.round(height * ratio) }
}

function toBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

export interface CompressionResult {
  file: File
  originalBytes: number
  compressed: boolean
}

/**
 * Downscales to MAX_EDGE_PX on the long edge and re-encodes as JPEG, stepping
 * quality down until the result is near TARGET_BYTES.
 *
 * Never throws and never returns something worse than the input: on any
 * failure -- unsupported format, decode error, or an output that came out
 * bigger than the original -- the original file is returned untouched, and the
 * caller's size check is what decides whether it may be uploaded.
 */
export async function compressImage(file: File): Promise<CompressionResult> {
  const unchanged: CompressionResult = {
    file,
    originalBytes: file.size,
    compressed: false,
  }

  if (!canCompress(file)) return unchanged
  if (file.size <= SKIP_COMPRESSION_BELOW_BYTES) return unchanged

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return unchanged
  }

  try {
    const { w, h } = scaledSize(bitmap.width, bitmap.height)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h

    const context = canvas.getContext('2d')
    if (!context) return unchanged
    context.drawImage(bitmap, 0, 0, w, h)

    let best: Blob | null = null
    for (const quality of QUALITY_STEPS) {
      const blob = await toBlob(canvas, 'image/jpeg', quality)
      if (!blob) continue
      best = blob
      if (blob.size <= TARGET_BYTES) break
    }

    // Re-encoding does not always win -- a small PNG can grow as a JPEG.
    if (!best || best.size >= file.size) return unchanged

    const renamed = file.name.replace(/\.[^.]+$/, '') + '.jpg'
    return {
      file: new File([best], renamed, {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      }),
      originalBytes: file.size,
      compressed: true,
    }
  } finally {
    bitmap.close()
  }
}
