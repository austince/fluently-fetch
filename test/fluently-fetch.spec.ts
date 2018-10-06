import fluentlyFetch from '../src/fluently-fetch'
import * as chai from 'chai'

const { expect } = chai

describe('fluently-fetch', function () {
  this.timeout(20000)

  describe('res.statusCode', () => {
    it('should set statusCode', async () => {
      const res = await fluentlyFetch('http://example.com')
        .get('/')

      expect(res.status).to.equal(200)
    })
  })

  it('should attach bodies', async () => {
    const res = await fluentlyFetch('http://example.com')
      .post('/')
      .send({
        test: 1,
      })
      .send({
        another: 2,
      })

    expect(res.status).to.equal(200)
    const data = await res.text()
    expect(data).to.exist;
  })
})
