import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import FormData from '../../src/FormData'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch field', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should create a new FormData body if none exists', async () => {
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .field('billy', 'bob')
      .field('thorton', true)

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ billy: 'bob', thorton: 'true' })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })

  it('should append an array field', async () => {
    const vals = ['bob', true]
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .field('billy[]', vals)

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ 'billy[]': vals.map(val => val.toString()) })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })

  it('should append from a dictionary', async () => {
    const dict = {
      billy: 'bob',
      thorton: true,
    }
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .field(dict)

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ billy: 'bob', thorton: 'true' })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })

  it('should append to a previously passed FormData', async () => {
    const data = new FormData();
    data.append('name', 'jobi')
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .send(data)
      .field('hog', 'wild')

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ name: 'jobi', hog: 'wild' })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })
})
