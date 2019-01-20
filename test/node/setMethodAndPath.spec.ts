import fluentlyFetch from '../../src'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch setMethodAndPath', () => {
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
