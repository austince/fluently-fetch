import fluentlyFetch from '../../src'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch setHeader', function () {
  this.timeout(2000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should set a header when given a string', async () => {
    const headers = [
      ['accept', 'application/json'],
      ['x-api-key', 'api-key'],
      ['x-forwarded-for', 'example.com'],
    ]
    const req = fluentlyFetch(uri)
      .get('/echo')

    headers.forEach(([header, val]) => {
      req.setHeader(header, val)
    })

    const res = await req
    expect(res).to.be.ok
    const { headers: sentHeaders } = await res.json()
    headers.forEach(([header, val]) => {
      expect(sentHeaders).to.have.property(header)
      expect(sentHeaders[header]).to.equal(val)
    })
  })

  it('should reject when given incomplete data', () => {
    expect(() => fluentlyFetch(uri).setHeader('key')).to.throw(TypeError)
  })

  it('should set headers from an object', async () => {
    const headers = {
      accept: 'application/json',
      'x-api-key': 'api-key',
      'x-forwarded-for': 'example.com',
    }
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .setHeader(headers)

    expect(res).to.be.ok
    const { headers: sentHeaders } = await res.json()
    Object
      .keys(headers)
      .forEach((header) => {
        expect(sentHeaders).to.have.property(header)
        expect(sentHeaders[header]).to.equal(headers[header])
      })
  })
})
