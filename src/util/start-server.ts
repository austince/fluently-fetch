import { Server } from 'net'
import createServer, { HttpApp } from './create-server'

export { HttpApp } from './create-server'

export default (server: HttpApp | Server, port = 0): Server => {
  if (typeof server === 'function') {
    server = createServer(server) as Server
  }

  const addr = server.address()
  if (!addr) {
    server.listen(port)
  }

  return server
}
