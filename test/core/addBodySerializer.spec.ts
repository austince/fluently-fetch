import fluentlyFetch from '../../src'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'
import setupSandbox from '../util/setup-sandbox'

describe('fluently-fetch addBodySerializer', function () {
  this.timeout(10000)

  let uri
  const sandbox = setupSandbox()
  before(async () => {
    uri = await getBaseUri()
  })

  const serializeFn = (body) => {
    if (typeof body === 'object') {
      body.hey = 'jude'
    } else if (typeof body === 'string') {
      body = `${body}&hey=jude`
    }

    return body
  }

  const data = [
    {
      input: { hey: 'paul' },
      expected: { hey: 'jude' },
    },
    {
      input: { hey: 'paul', sad: false },
      expected: { hey: 'jude', sad: false },
    },
    {
      input: 'sad=am-not',
      expected: { sad: 'am-not', hey: 'jude' },
    },
  ]

  function runTestsForSerializer(fn: (any) => any | Promise<any>) {
    data.forEach(({ input, expected }) => it(`should serialize '${input}'`, async () => {
      const serializer = sandbox.spy(fn)
      const res = await fluentlyFetch(uri)
        .post('/echo')
        .addData(input)
        .addBodySerializer(serializer)

      expect(res).to.be.ok
      const { body } = await res.json()
      expect(body).to.deep.equal(expected)
      expect(serializer).to.have.been.calledOnceWithExactly(input)
    }))
  }

  context('sync serialize function', () => {
    runTestsForSerializer(serializeFn)
  })

  context('async serialize function', () => {
    runTestsForSerializer(async body => serializeFn(body))
  })

  it('should not serialize when there is no body present', async () => {
    const serializer = sandbox.spy(body => body)
    const res = await fluentlyFetch(uri)
      .post('/echo')
      .addBodySerializer(serializer)

    expect(res).to.be.ok
    expect(serializer).to.not.have.been.called
  })
})
