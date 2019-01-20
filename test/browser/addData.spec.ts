import * as chai from 'chai'
import fluentlyFetch from '../../src'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch addData', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should merge form data objects', async () => {
    const data = new FormData();
    data.append('name', 'jobi')
    const other = new FormData();
    other.append('job', "jobin' around")
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .addData(data)
      .addData(other)

    expect(res).to.be.ok
    const { body } = await res.json()
    expect(body).to.deep.equal({ name: 'jobi', job: "jobin' around" })
  })
})
