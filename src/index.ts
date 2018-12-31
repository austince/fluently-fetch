import FluentRequest, {
  FluentRequestInit,
  FluentRequestInput,
} from './FluentRequest'
import {
  FluentResponseError,
  FluentFetchError,
  FluentRequestTimeoutError,
} from './errors'

export interface FluentlyFetch {
  (app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  get(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  put(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  post(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  patch(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  options(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  delete(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  del(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest

  head(app?: FluentRequestInput, initOptions?: FluentRequestInit): FluentRequest
}

const methods = [
  ['get'],
  ['put'],
  ['post'],
  ['patch'],
  ['delete', 'del'],
  ['options'],
  ['head'],
].reduce((props: object, [method, ...aliases]) => {
  props[method] = (app: FluentRequestInput = 'http://localhost', initOptions: FluentRequestInit = {}) => {
    initOptions.method = method.toUpperCase()
    return new FluentRequest(app, initOptions)
  }
  // Attach aliases
  aliases.forEach(alias => props[alias] = props[method])
  return props
}, {})

const fluentlyFetch = <FluentlyFetch>(
  app: FluentRequestInput = 'http://localhost',
  initOptions: FluentRequestInit = {},
): FluentRequest => new FluentRequest(app, initOptions)

export default Object.assign(fluentlyFetch, methods)

// Classes
export {
  FluentRequest,
  FluentResponseError,
  FluentFetchError,
  FluentRequestTimeoutError,
}
