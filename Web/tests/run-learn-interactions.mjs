import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/learn',
})
for (const name of [
  'window',
  'document',
  'localStorage',
  'HTMLElement',
  'HTMLInputElement',
  'HTMLTextAreaElement',
  'HTMLDialogElement',
  'Event',
  'FormData',
  'MouseEvent',
  'Node',
])
  Object.defineProperty(globalThis, name, { value: dom.window[name], configurable: true })
const errors = []
dom.window.addEventListener('error', (event) => errors.push(event.error))
globalThis.IS_REACT_ACT_ENVIRONMENT = true
HTMLDialogElement.prototype.showModal = function () {
  this.open = true
}
HTMLDialogElement.prototype.close = function () {
  this.open = false
}
const server = await createServer({
  root: new URL('..', import.meta.url).pathname,
  server: { middlewareMode: true },
  appType: 'custom',
})
try {
  const { checkInteractions } = await server.ssrLoadModule('/tests/learn-interactions.tsx')
  await checkInteractions()
  if (errors.length) throw new AggregateError(errors, 'Unhandled errors in Learn interactions')
} finally {
  await server.close()
  dom.window.close()
}
