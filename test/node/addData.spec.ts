import fluentlyFetch from '../../src'
import FormData from '../../src/FormData'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch addData', function () {
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
      .addData(data)
      .addData(other)).to.throw(Error, 'Cannot assign FormData')
  })
})
