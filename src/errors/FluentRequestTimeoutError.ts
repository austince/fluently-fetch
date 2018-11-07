import FluentFetchError from './FluentFetchError'

export default class FluentResponseError extends FluentFetchError {
  constructor(timeoutMs: number) {
    super(`Timeout after ${timeoutMs} ms`)
  }
}
