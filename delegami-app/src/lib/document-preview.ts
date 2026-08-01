export function isPreviewableImage(fileType: string | null | undefined): boolean {
  return Boolean(fileType && fileType.startsWith('image/'))
}

export function isPreviewablePdf(fileType: string | null | undefined): boolean {
  return fileType === 'application/pdf'
}

const IMAGE_URL_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|bmp|avif)(\?.*)?$/i

export function isImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return IMAGE_URL_EXTENSIONS.test(url)
}
