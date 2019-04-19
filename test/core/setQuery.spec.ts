import fluentlyFetch from '../../src'
import URLSearchParams from '../../src/URLSearchParams'
import { expect } from '../util/chai'
import getBaseUri from '../util/get-base-uri'

describe('fluently-fetch setQuery', function () {
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
    it(`should set query from ${typeof input} '${JSON.stringify(input)}'`, async () => {
      const res = await fluentlyFetch(uri)
        .get('/echo')
        .setQuery(input)

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
    it(`should join queries ${typeof first} '${JSON.stringify(first)}' and ${typeof second} '${JSON.stringify(second)}'`,
      async () => {
        const res = await fluentlyFetch(uri)
          .get('/echo')
          .setQuery(first)
          .setQuery(second)

        expect(res).to.be.ok
        const { query } = await res.json()
        expect(query).to.deep.equal(expected)
      }))
})
