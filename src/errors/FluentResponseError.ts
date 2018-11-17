import FluentFetchError from './FluentFetchError'

export default class FluentResponseError extends FluentFetchError {
  /**
   * The raw response.
   */
  public response: Response

  constructor(response: Response) {
    super(`${response.statusText} ${response.url}`)
    this.response = response
  }
}
