import * as chai from 'chai'
import assignUrl from './assign-url'
import URL from '../URL'

const { expect } = chai

describe('assign-url', () => {
  it('should assign specified parts and not overwrite other parts', () => {
    const url = new URL('http://user:pass@google.com/?query=true')
    const origStr = url.toString()
    url.host = 'mozilla.com'
    expect(assignUrl(origStr, {
      host: 'mozilla.com',
    })).to.equal(url.toString())
  })
})
