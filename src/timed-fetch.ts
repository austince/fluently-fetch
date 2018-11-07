import fetch from './fetch'
import FluentRequestTimeoutError from './errors/FluentRequestTimeoutError'

export default (req: Request, timeout: number) => {
  return new Promise(async (resolve, reject) => {
    let timedOut = false
    let res
    const timeoutId = setTimeout(() => {
      timedOut = true
      if (!res) {
        reject(new FluentRequestTimeoutError(timeout))
      }
    }, timeout)

    try {
      res = await fetch(req)
    } catch (err) {
      reject(err)
    }

    clearTimeout(timeoutId)
    if (!timedOut) {
      resolve(res)
    }
  })
}
