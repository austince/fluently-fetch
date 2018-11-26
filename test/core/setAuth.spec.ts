import * as chai from 'chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../support/get-base-uri'
import URL from '../../src/URL'

const { expect } = chai

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

  it('should use auto auth when specified', async () => {
    const username = 'shaggy'
    const password = 'farOutMan'
    const req = fluentlyFetch(uri)
      .get(`/auth/${username}/${password}`)
      .setAuth(username, password, { type: 'auto' })

    const reqURL = new URL(req.url)
    expect(reqURL.username).to.equal(username)
    expect(reqURL.password).to.equal(password)

    const res = await req
    expect(res).to.be.ok
    expect(res).to.have.status(HttpStatus.OK)
  })

  it('should use bearer when specified', async () => {
    const token = 'ruhrohToken'
    const res = await fluentlyFetch(uri)
      .get('/echo')
      .setAuth(token, { type: 'bearer' })

    expect(res).to.be.ok
    const { headers } = await res.json()
    expect(headers).to.have.property('authorization')
    expect(headers.authorization).to.include('Bearer')
    expect(headers.authorization).to.include(token)
  })
})
