import '@testing-library/jest-dom/vitest'

// jsdom does not implement scrolling. Provide a no-op so route-change scrolling
// does not emit "Not implemented" noise during tests.
Object.defineProperty(window, 'scrollTo', {
  value: () => {},
  writable: true,
  configurable: true,
})

// jsdom's Blob (and therefore File) has no `arrayBuffer()`, but every browser
// does. Tools that read a file's bytes — the hash and PDF tools — need it, so
// back it with FileReader, which jsdom does implement.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.arrayBuffer !== 'function') {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the blob.'))
      reader.readAsArrayBuffer(this)
    })
  }
}

// Likewise, `Blob.text()` is missing and is used when reading text files.
if (typeof Blob !== 'undefined' && typeof Blob.prototype.text !== 'function') {
  Blob.prototype.text = function text(this: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error ?? new Error('Could not read the blob.'))
      reader.readAsText(this)
    })
  }
}
