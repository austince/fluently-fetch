import { Server } from 'net'
import { IncomingMessage, ServerResponse } from 'http'

export type HttpApp = (request: IncomingMessage, response: ServerResponse) => void

let startServer: (app: HttpApp, protocol?: 'http'|'https') => Server
// @ts-ignore
if (process.browser) {
  startServer = (app: HttpApp, protocol = 'http'): Server => {
    throw new Error('Cannot start a server from a browser.')
  }
} else {
  const http = require('http')
  const https = require('https')
  startServer = (app: HttpApp, protocol = 'http'): Server => {
    let server
    if (protocol === 'http') {
      server = http.createServer(app)
    } else {
      server = https.createServer({}, app)
    }
    return server
  }
}

export default startServer
