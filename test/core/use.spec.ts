import * as chai from 'chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch, { FluentRequest } from '../../src/fluently-fetch'
import setupSandbox from '../util/setup-sandbox'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch use', () => {
  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  const sandbox = setupSandbox()

  it('should use a plugin successfully', async () => {
    const now = `${Date.now()}`

    const plugins = {
      uuid(req: FluentRequest) {
        req.set('X-UUID', now)
        return req
      },
      timeout(req: FluentRequest) {
        req.setTimeout(100)
        return req
      },
    }
    sandbox.spy(plugins, 'uuid')
    sandbox.spy(plugins, 'timeout')

    const req = fluentlyFetch(uri)
      .get('/echo')
      .use(plugins.uuid)
      .use(plugins.timeout)

    const res = await req
    expect(res).to.be.ok
    expect(plugins.uuid).to.have.been.calledOnceWithExactly(req)
    expect(req.headers.get('X-UUID')).to.equal(now)
    expect(plugins.timeout).to.have.been.calledOnceWithExactly(req)
  })
})
