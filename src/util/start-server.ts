import { Server } from 'net'
import createServer from './create-server'
import { HttpApp } from '../FluentRequest'

export default (server: Server | HttpApp, port = 0) => {
  if (typeof server === 'function') {
    server = createServer(server)
  }

  const addr = server.address()
  if (!addr) {
    server.listen(port)
  }

  return server
}
