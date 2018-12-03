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

  it('should throw when given multiple form data objects', async () => {
    const data = new FormData();
    data.append('name', 'jobi')
    const other = new FormData();
    other.append('job', "jobin' around")
    expect(() => fluentlyFetch(uri)
      .post('/echo-form')
      .send(data)
      .send(other)).to.throw(Error, 'Cannot assign FormData')
  })
})
