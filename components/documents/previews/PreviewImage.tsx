'use client'

interface PreviewImageProps {
  url: string
  filename: string
}

export default function PreviewImage({ url, filename }: PreviewImageProps) {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px] bg-checkerboard rounded-xl overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={filename}
        className="max-w-full max-h-[70vh] object-contain rounded shadow-xl"
        loading="lazy"
      />
    </div>
  )
}
