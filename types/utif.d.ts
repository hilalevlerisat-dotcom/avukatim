// UTIF (TIFF decoder) type declarations
declare module 'utif' {
  interface IFD {
    width: number
    height: number
    data: Uint8Array
    t256?: number[]   // ImageWidth
    t257?: number[]   // ImageLength
    [key: string]: unknown
  }

  function decode(buffer: ArrayBuffer | Uint8Array): IFD[]
  function decodeImages(buffer: ArrayBuffer | Uint8Array, ifds: IFD[]): void
  function toRGBA8(ifd: IFD): Uint8Array
  function encodeImage(rgba: Uint8Array, w: number, h: number): ArrayBuffer
}
