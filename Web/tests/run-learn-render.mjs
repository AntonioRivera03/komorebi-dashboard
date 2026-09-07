import { createServer } from 'vite'
const server = await createServer({
  root: new URL('..', import.meta.url).pathname,
  server: { middlewareMode: true },
  appType: 'custom',
})
try {
  const { checkRendering } = await server.ssrLoadModule('/tests/learn-render.tsx')
  checkRendering()
} finally {
  await server.close()
}
