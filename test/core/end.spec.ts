import * as chai from 'chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

describe('fluently-fetch end', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should util callback response handlers on success', (done) => {
    fluentlyFetch(uri)
      .get('/echo')
      .end((err, res) => {
        expect(err).to.not.exist
        expect(res).to.be.ok
        done()
      })
  })

  it('should util callback response handlers on request error', (done) => {
    fluentlyFetch(uri)
      .get('/error')
      .ok(res => res.status !== HttpStatus.INTERNAL_SERVER_ERROR)
      .end((err, res) => {
        expect(err).to.exist
        expect(res).to.not.exist;
        done()
      })
  })
})
