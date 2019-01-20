import fluentlyFetch from '../../src'
import FormData from '../../src/FormData'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch setField', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should create a new FormData body if none exists', async () => {
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .setField('billy', 'bob')
      .setField('thorton', true)

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
      .setField('billy[]', vals)

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
      .setField(dict)

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
      .addData(data)
      .setField('hog', 'wild')

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ name: 'jobi', hog: 'wild' })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })
})
