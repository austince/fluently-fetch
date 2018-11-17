import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../support/get-base-uri'

const { expect } = chai

describe('fluently-fetch send', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should send json data', async () => {
    const data = { name: 'jobi' }
    const res = await fluentlyFetch(uri)
      .post('/echo')
      .send(data)

    expect(res).to.be.ok
    const { body } = await res.json()
    expect(body).to.deep.equal(data)
  })
})
