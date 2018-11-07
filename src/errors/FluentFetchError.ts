export default class FluentFetchError extends Error {
  constructor(...args) {
    super(...args)
    this.name = this.constructor.name
  }
}
