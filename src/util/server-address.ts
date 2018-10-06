import { Server as HttpsServer } from 'https'
import { Server } from 'http'

/**
 *
 * @param {string|*} app
 * @param {string} [path]
 */
export default function serverAddress(app: Server|string, path?: string): string {
  if ('string' === typeof app) {
    return app + path
  }

  const addr = app.address()

  if (!addr) {
    throw new Error('Server is not listening')
  }

  // @ts-ignore : weird error where @types/node only exports a type for https.Server
  const protocol = (app instanceof HttpsServer) ? 'https' : 'http'
  // If address is "unroutable" IPv4/6 address, then set to localhost
  if (addr.address === '0.0.0.0' || addr.address === '::') {
    addr.address = '127.0.0.1'
  }

  return `${protocol}://${addr.address}:${addr.port}${path}`
}
