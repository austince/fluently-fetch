import * as chai from 'chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch from '../../src/fluently-fetch'
import FluentRequestTimeoutError from '../../src/errors/FluentRequestTimeoutError'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch setTimeout', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should error when request exceeds timeout', async () => {
    const req = fluentlyFetch(uri)
      .get('/delay/2')
      .setTimeout(1)

    await expect(req).to.be.eventually.rejectedWith(FluentRequestTimeoutError)
  })

  it('should return response normally when the timeout is not exceeded', async () => {
    const res = await fluentlyFetch(uri)
      .get('/delay/1')
      .setTimeout(20)

    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.OK)
  })

  it('should use deprecated parameters when possible', async () => {
    const res = await fluentlyFetch(uri)
      .get('/delay/1')
      .setTimeout({ response: 20 })

    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.OK)
  })

  it('should reject deprecated parameters', () => {
    const req = fluentlyFetch(uri)
    expect(() => req.setTimeout({ response: 10, deadline: 10 })).to.throw(TypeError)
  })
})
