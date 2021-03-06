import * as chai from 'chai'
import fluentlyFetch from '../../src'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch type', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  ; [
    'application/json',
    'text/html',
    'application/some-object+vnd',
  ].forEach(type => it(`should set Content-Type to ${type}`, async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .type(type)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.equal(type)
  }))

  ; [
    ['json', 'application/json'],
    ['html', 'text/html'],
    ['xml', 'text/xml'],
    ['urlencoded', 'application/x-www-form-urlencoded'],
    ['form', 'application/x-www-form-urlencoded'],
    ['form-data', 'multipart/form-data'],
    ['multipart', 'multipart/form-data'],
  ].forEach(([shorthand, type]) => it(`should set shorthand ${shorthand} to ${type}`, async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .type(shorthand)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.equal(type)
  }))
})
