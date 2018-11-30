import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch method', () => {
  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should send OPTIONS requests', async () => {
    const req = fluentlyFetch(uri).options('/echo')
    expect(req.method).to.equal('OPTIONS')
    const res = await req
    expect(res).to.be.ok
  })
})
