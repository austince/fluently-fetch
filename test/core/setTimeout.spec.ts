import * as chai from 'chai'
import * as express from 'express'
import fluentlyFetch from '../../src/fluently-fetch'
import FluentRequestTimeoutError from '../../src/errors/FluentRequestTimeoutError'

const { expect } = chai

const app = express()
app.get('/setTimeout/delay/:amount', (req, res, done) => {
  const amount = Number(req.params.amount)
  setTimeout(() => {
    res.sendStatus(200)
  }, amount)
})

describe('fluently-fetch setTimeout', function () {
  this.timeout(10000)

  it('should error when request exceeds timeout', async () => {
      const req = fluentlyFetch(app)
        .get('/setTimeout/delay/300')
        .setTimeout(200)

      await expect(req.invoke()).to.be.eventually.rejectedWith(FluentRequestTimeoutError)
    })

  it('should return response normally when the timeout is not exceeded', async () => {
      const res = await fluentlyFetch(app)
        .get('/setTimeout/delay/100')
        .setTimeout(200)

      expect(res).to.be.ok
      expect(res).to.have.status(200)
    })

  it('should reject deprecated parameters', () => {
      const req = fluentlyFetch(app)
      expect(() => req.setTimeout({ deadline: 10 })).to.throw(TypeError)
    })
})
