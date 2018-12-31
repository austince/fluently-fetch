import FluentRequestTimeoutError from './errors/FluentRequestTimeoutError'

export default (req: Request, timeout: number) => {
  return new Promise((resolve, reject) => {
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      reject(new FluentRequestTimeoutError(timeout))
    }, timeout)

    fetch(req)
      .then((res) => {
        clearTimeout(timeoutId)
        if (!timedOut) {
          resolve(res)
        }
        return res
      })
      .catch(reject)
  })
}
