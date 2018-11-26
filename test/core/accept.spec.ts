import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../support/get-base-uri'

const { expect } = chai

describe('fluently-fetch accept', () => {
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
      .accept(type)

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
      .accept(shorthand)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('accept', type)
  }))
})
