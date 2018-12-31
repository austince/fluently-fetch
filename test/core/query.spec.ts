import * as chai from 'chai'
import fluentlyFetch from '../../src'
import getBaseUri from '../util/get-base-uri'
import URLSearchParams from '../../src/URLSearchParams'

const { expect } = chai

describe('fluently-fetch query', function () {
  this.timeout(5000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  ; [
    {
      input: '',
      expected: {},
    },
    {
      input: 'hey=there',
      expected: { hey: 'there' },
    },
    {
      input: 'hey=there&you=kids',
      expected: { hey: 'there', you: 'kids' },
    },
    {
      input: { hey: 'there', you: 'kids' },
      expected: { hey: 'there', you: 'kids' },
    },
    {
      input: [['get', 'off'], ['my-lawn', true]],
      expected: { get: 'off', 'my-lawn': 'true' },
    },
    {
      input: new URLSearchParams({ meddling: 'kids' }),
      expected: { meddling: 'kids' },
    },
  ].forEach(({ input, expected }) =>
    it(`should set query from ${input.constructor.name} '${input}'`, async () => {
      const res = await fluentlyFetch(uri)
        .get('/echo')
        .query(input)

      expect(res).to.be.ok
      const { query } = await res.json()
      expect(query).to.deep.equal(expected)
    }))

  ; [
    {
      input: ['kids=meddling', 'dog=scooby'],
      expected: { kids: 'meddling', dog: 'scooby' },
    },
    {
      input: ['kids=meddling', { dog: 'scooby' }],
      expected: { kids: 'meddling', dog: 'scooby' },
    },
  ].forEach(({ input: [first, second], expected }) =>
    it(`should join queries ${first.constructor.name} '${first}' and ${second.constructor.name} '${second}'`,
      async () => {
        const res = await fluentlyFetch(uri)
          .get('/echo')
          .query(first)
          .query(second)

        expect(res).to.be.ok
        const { query } = await res.json()
        expect(query).to.deep.equal(expected)
      }))
})
