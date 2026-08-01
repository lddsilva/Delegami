// Client-side image normalization: HEIC/HEIF → JPEG and resize to a max side.
// Use in any browser upload flow that targets the Vercel Blob / OpenAI image APIs
// (which do not accept HEIC and benefit from smaller, web-friendly files).

export const DEFAULT_MAX_IMAGE_SIDE = 2000
export const DEFAULT_JPEG_QUALITY = 0.86

export function isHeicFile(file: File) {
  const name = file.name.toLowerCase()
  return file.type === 'image/heic'
    || file.type === 'image/heif'
    || name.endsWith('.heic')
    || name.endsWith('.heif')
}

export function isImageFile(file: File) {
  return file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|heif|bmp)$/i.test(file.name)
}

function fileBaseName(file: File) {
  return file.name.replace(/\.[^.]+$/, '') || 'foto'
}

function loadImage(blob: Blob) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Immagine non leggibile'))
    }
    img.src = url
  })
}

async function jpegFromImageBlob(blob: Blob, maxSide: number, quality: number) {
  const img = await loadImage(blob)
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas non disponibile')
  ctx.drawImage(img, 0, 0, width, height)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Conversione JPEG non riuscita'))
    }, 'image/jpeg', quality)
  })
}

export interface NormalizeOptions {
  maxSide?: number
  quality?: number
}

export async function normalizeImageFile(file: File, opts: NormalizeOptions = {}): Promise<File> {
  const maxSide = opts.maxSide ?? DEFAULT_MAX_IMAGE_SIDE
  const quality = opts.quality ?? DEFAULT_JPEG_QUALITY

  let source: Blob = file
  if (isHeicFile(file)) {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality })
    source = Array.isArray(converted) ? converted[0] : converted
  }

  const jpeg = await jpegFromImageBlob(source, maxSide, quality)
  return new File([jpeg], `${fileBaseName(file)}.jpg`, {
    type: 'image/jpeg',
    lastModified: file.lastModified || Date.now(),
  })
}
