import fluentlyFetch from '../../src/fluently-fetch'
import * as chai from 'chai'
import setupSandbox from '../support/setup-sandbox'
import getBaseUri from '../support/get-base-uri'

const { expect } = chai

describe('fluently-fetch', () => {
  let uri
  before(async () => {
    uri = await getBaseUri()
  })

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

      const req = fluentlyFetch(uri)
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
