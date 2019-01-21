import FluentRequest, {
  FluentRequestInit,
  FluentRequestInfo,
} from './FluentRequest'
import {
  FluentResponseError,
  FluentFetchError,
  FluentRequestTimeoutError,
} from './errors'

export interface FluentlyFetch {
  (app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  get(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  put(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  post(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  patch(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  options(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  delete(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  del(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest

  head(app?: FluentRequestInfo, initOptions?: FluentRequestInit): FluentRequest
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
  props[method] = (app: FluentRequestInfo = 'http://localhost', initOptions: FluentRequestInit = {}) => {
    initOptions.method = method.toUpperCase()
    return new FluentRequest(app, initOptions)
  }
  // Attach aliases
  aliases.forEach(alias => props[alias] = props[method])
  return props
}, {})

const fluentlyFetch = <FluentlyFetch>(
  app: FluentRequestInfo = 'http://localhost',
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
