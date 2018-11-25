import * as chai from 'chai'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../support/get-base-uri'

const { expect } = chai

describe('fluently-fetch sortQuery', function () {
  this.timeout(5000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  function reverseAlphaNumericKeySort([aKey, aVal]: [string, string], [bKey, bVal]: [string, string]): number {
    if (bKey === aKey) {
      return 0
    }
    return bKey > aKey ? 1 : -1
  }

  it('should sort query with a custom function', async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .query('c=1&a=1&b=1')
      .sortQuery(reverseAlphaNumericKeySort)

    expect(res).to.be.ok
    const { url } = await res.json()
    const sentQuery = url.split('?')[1]
    expect(sentQuery).to.deep.equal('c=1&b=1&a=1')
  })

  it('should sort by keys alphabetically by default', async () => {
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .query('c=1&a=1&b=1')
      .sortQuery()

    expect(res).to.be.ok
    const { url } = await res.json()
    const sentQuery = url.split('?')[1]
    expect(sentQuery).to.deep.equal('a=1&b=1&c=1')
  })
})
