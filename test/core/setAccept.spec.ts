import fluentlyFetch from '../../src'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch setAccept', () => {
  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  ; [
    'application/json',
    'text/html',
    'application/some-object+vnd',
  ].forEach(type => it(`should set Accept to ${type}`, async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .setAccept(type)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('accept', type)
  }))

  ; [
    ['json', 'application/json'],
    ['html', 'text/html'],
    ['xml', 'text/xml'],
    ['urlencoded', 'application/x-www-form-urlencoded'],
    ['form', 'application/x-www-form-urlencoded'],
    ['form-data', 'multipart/form-data'],
    ['multipart', 'multipart/form-data'],
  ].forEach(([shorthand, type]) => it(`should accept shorthand ${shorthand} to ${type}`, async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .setAccept(shorthand)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('accept', type)
  }))
})
