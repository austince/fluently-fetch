import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import FluentRequestTimeoutError from '../../src/errors/FluentRequestTimeoutError'
import getBaseUri from '../support/get-base-uri'

const { expect } = chai

describe('fluently-fetch method', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should send HEAD requests', async () => {
    const req = fluentlyFetch(uri).head('/echo')
    expect(req.method).to.equal('HEAD')
    const res = await req
    expect(res).to.be.ok
  })

  ; [
    'get',
    'put',
    'post',
    'patch',
    'delete',
    'options',
  ].forEach(method => it(`should send ${method.toUpperCase()} requests`, async () => {
    const res = await fluentlyFetch(uri)[method]('/echo')
    expect(res).to.be.ok
    const { method: sentMethod } = await res.json()
    expect(method).to.equal(sentMethod.toLowerCase())
  }))

  ; [
    ['del', 'delete'],
  ].forEach(([alias, method]) => it(`should expose '${alias}' as ${method.toUpperCase()}`, async () => {
    const res = await fluentlyFetch(uri)[alias]('/echo')
    expect(res).to.be.ok
    const { method: sentMethod } = await res.json()
    expect(method).to.equal(sentMethod.toLowerCase())
  }))
})
