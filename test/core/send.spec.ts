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

  it('should send json data by default', async () => {
    const data = { name: 'jobi' }
    const res = await fluentlyFetch(uri)
      .post('/echo')
      .send(data)

    expect(res).to.be.ok
    const { body } = await res.json()
    expect(body).to.deep.equal(data)
  })

  it('should send concatenated encoded form data', async () => {
    const data = {
      form: 'true',
      cats: '1',
      bagels: 'yes please',
    }
    const req = fluentlyFetch(uri)
      .post('/echo')

    Object.entries(data)
      .forEach(([key, val]) => req.send(`${key}=${val}`))

    const res = await req

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.equal('application/x-www-form-urlencoded')
    expect(body).to.deep.equal(data)
  })
})
