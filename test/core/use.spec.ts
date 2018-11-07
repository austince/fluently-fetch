import fluentlyFetch from '../../src/fluently-fetch'
import * as chai from 'chai'
import setupSandbox from '../support/setup-sandbox'

const { expect } = chai

describe('fluently-fetch', () => {
  describe('use', () => {
    const sandbox = setupSandbox()

    it('should use a plugin successfully', async () => {
      const now = `${Date.now()}`

      const plugins = {
        uuid(req) {
          req.set('X-UUID', now)
          return req
        },
      }
      sandbox.spy(plugins, 'uuid')

      const req = fluentlyFetch('http://example.com')
        .get('/echo')
        .use(plugins.uuid)

      const res = await req
      expect(res).to.be.ok
      expect(res).to.have.status(200)
      expect(plugins.uuid).to.have.been.calledOnceWithExactly(req)
      expect(req.headers.get('X-UUID')).to.equal(now)
    })
  })
})
