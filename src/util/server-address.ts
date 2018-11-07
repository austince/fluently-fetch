import * as https from 'https'
import { Server } from 'net'

/**
 *
 * @param {Server} server
 */
export default function serverAddress(server: Server): string {
  const addr = server.address()
  if (!addr) {
    throw new Error('Server is not listening')
  }

  // @ts-ignore : weird error where @types/node only exports a type for https.Server
  const protocol = (server instanceof https.Server) ? 'https' : 'http'
  // If address is "unroutable" IPv4/6 address, then set to localhost
  if (addr.address === '0.0.0.0' || addr.address === '::') {
    addr.address = '127.0.0.1'
  }

  return `${protocol}://${addr.address}:${addr.port}`
}
