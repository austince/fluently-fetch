import * as chai from 'chai'
import startServer, { HttpApp } from './start-server'
import { Server } from 'net'
import * as http from 'http'

const { expect } = chai

describe('start-server', () => {
  context('HttpApp', () => {
    let server: Server
    afterEach(() => new Promise(resolve => server.close(resolve)))

    it('should start a server given an HttpApp on a random port', () => {
      const app: HttpApp = (req, res) => {
      }
      server = startServer(app)
      expect(server.address()).to.exist
    })

    it('should start a server on a port given an HttpApp and a port', () => {
      const app: HttpApp = (req, res) => {
      }
      const port = 1234
      server = startServer(app, port)
      expect(server.address().port).to.equal(port)
    })
  })

  context('server', () => {
    let server: Server
    beforeEach(() => server = http.createServer())
    afterEach(() => new Promise(resolve => server.close(resolve)))

    it('should start listening on a port given an un-listening server', () => {
      server = startServer(server)
      expect(server.address()).to.exist
    })

    it('should do nothing if given a server that is already listening', () => {
      server.listen(1234)
      const addr = server.address()
      server = startServer(server)
      expect(server.address()).to.deep.equal(addr)
    })
  })
})
