import * as chai from 'chai'
import base64Encode from './base64-encode'

const { expect } = chai

describe('base64-encode', () => {
  it('should base64 encode a string', () => {
    expect(base64Encode('Oreos are vegan. Did you know?')).to.equal('T3Jlb3MgYXJlIHZlZ2FuLiBEaWQgeW91IGtub3c/')
  })
})
