import { expect } from '../util/chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch from '../../src'
import getBaseUri from '../util/get-base-uri'


describe('fluently-fetch setAuth', function () {
  this.timeout(5000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should fail authorization when no auth given', async () => {
    const res = await fluentlyFetch(uri)
      .get('/auth/totally/bogus')

    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.UNAUTHORIZED)
  })

  it('should fail authorization when given incorrect credentials', async () => {
    const res = await fluentlyFetch(uri)
      .get('/auth/totally/bogus')
      .setAuth('not', 'correct')

    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.FORBIDDEN)
  })

  it('should authorize with basic auth', async () => {
    const username = 'shaggy'
    const password = 'farOutMan'
    const res = await fluentlyFetch(uri)
      .get(`/auth/${username}/${password}`)
      .setAuth(username, password)

    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.OK)
  })

  it('should use bearer when specified', async () => {
    const token = 'ruhrohToken'
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .setAuth(token)

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('authorization')
    expect(headers.authorization).to.include('Bearer')
    expect(headers.authorization).to.include(token)
  })
})
