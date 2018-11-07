import * as http from 'http'
import * as https from 'https'
import { Server } from 'net'

export default (app, protocol = 'http'): Server => {
  let server
  if (protocol === 'http') {
    server = http.createServer(app)
  } else {
    server = https.createServer(app)
  }
  return server
}
