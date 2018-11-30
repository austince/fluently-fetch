import * as chai from 'chai'
import * as HttpStatus from 'http-status-codes'
import fluentlyFetch from '../../src/fluently-fetch'
import getBaseUri from '../util/get-base-uri'
import setupSandbox from '../util/setup-sandbox'
import FluentResponseError from '../../src/errors/FluentResponseError'

const { expect } = chai

describe('fluently-fetch ok', function () {
  this.timeout(5000)

  let uri
  const sandbox = setupSandbox()
  before(async () => {
    uri = await getBaseUri()
  })

  function okIfStatusIsCreated(res: Response) {
    return res.status === HttpStatus.CREATED
  }

  function runTestsForOkFn(fn: (res: Response) => boolean|Promise<boolean>) {
    it('should allow responses that pass check through', async () => {
      const spiedFn = sandbox.spy(fn)
      const res = await fluentlyFetch(uri)
        .get(`/status/${HttpStatus.CREATED}`)
        .ok(spiedFn)

      expect(res).to.be.ok
      expect(spiedFn).to.have.been.calledOnceWithExactly(res)
    })

    it('should reject responses that fail the check', async () => {
      const spiedFn = sandbox.spy(fn)
      const req = fluentlyFetch(uri)
        .get(`/status/${HttpStatus.BAD_REQUEST}`)
        .ok(spiedFn)

      const err: FluentResponseError = await expect(req).to.be.rejectedWith(FluentResponseError)
      expect(spiedFn).to.have.been.calledOnceWith(err.response)
    })
  }

  context('sync ok functions', () => {
    const fn = okIfStatusIsCreated
    runTestsForOkFn(fn)
  })

  context('async ok functions', () => {
    const fn = async res => okIfStatusIsCreated(res)
    runTestsForOkFn(fn)
  })
})
