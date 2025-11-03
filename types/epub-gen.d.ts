declare module 'epub-gen' {
  interface EPubOptions {
    title: string
    author: string
    description?: string
    content: Array<{
      title: string
      data: string
    }>
  }

  class EPub {
    constructor(options: EPubOptions)
    on(event: 'end', callback: () => void): void
    on(event: 'error', callback: (error: Error) => void): void
    on(event: 'data', callback: (chunk: Buffer) => void): void
    pipe(destination: any): void
  }

  export = EPub
}

