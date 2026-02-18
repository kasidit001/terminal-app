declare module 'bwip-js' {
  interface ToCanvasOptions {
    bcid: string
    text: string
    scale?: number
    height?: number
    backgroundcolor?: string
    barcolor?: string
    [key: string]: any
  }
  function toCanvas(canvas: HTMLCanvasElement, options: ToCanvasOptions): void
  export { toCanvas, ToCanvasOptions }
}
