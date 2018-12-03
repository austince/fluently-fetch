import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import FormData from '../../src/FormData'
import getBaseUri from '../util/get-base-uri'

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
    const { body, headers } = await res.json()
    expect(body).to.deep.equal(data)
    expect(headers).to.have.property('content-type', 'application/json')
  })

  it('should merge json data', async () => {
    const data = { name: 'jobi' }
    const other = { job: "jobin' around" }
    const res = await fluentlyFetch(uri)
      .post('/echo')
      .send(data)
      .send(other)

    expect(res).to.be.ok
    const { body } = await res.json()
    expect(body).to.deep.equal(Object.assign({}, data, other))
  })

  it('should send and merge arrays', async () => {
    const arr = ['blue', 'yellow', 'green']
    const otherArr = ['red', 'purple']
    const res = await fluentlyFetch(uri)
      .post('/echo')
      .send(arr)
      .send(otherArr)

    expect(res).to.be.ok
    const { body } = await res.json()
    expect(body).to.deep.equal(arr.concat(otherArr))
  })

  it('should merge concatenated encoded form data', async () => {
    const data = {
      form: 'true',
      cats: '1',
      bagels: 'yes please',
    }
    const req = fluentlyFetch(uri)
      .post('/echo')

    Object.keys(data)
      .forEach(key => req.send(`${key}=${data[key]}`))

    const res = await req

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(headers).to.have.property('content-type', 'application/x-www-form-urlencoded')
    expect(body).to.deep.equal(data)
  })

  it('should send form data', async () => {
    const data = new FormData();
    data.append('name', 'jobi')
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .send(data)

    expect(res).to.be.ok
    const { body, headers } = await res.json()
    expect(body).to.deep.equal({ name: 'jobi' })
    expect(headers).to.have.property('content-type')
    expect(headers['content-type']).to.include('multipart/form-data')
  })
})
