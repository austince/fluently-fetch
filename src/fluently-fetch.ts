import { Server } from 'net'
import FluentRequest, { HttpApp, FluentRequestInit } from './FluentRequest'

if (typeof fetch === 'undefined') {
  require('isomorphic-fetch')
}

interface FluentlyFetch {
  (app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  get(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  put(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  post(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  patch(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  options(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  delete(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  del(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest

  head(app?: Server | HttpApp | string, initOptions?: FluentRequestInit): FluentRequest
}

function fetcher(app: Server | HttpApp | string = '', initOptions: FluentRequestInit = {}): FluentRequest {
  return new FluentRequest(app, initOptions)
}

const fluentlyFetch: FluentlyFetch = fetcher as FluentlyFetch

[
  'get',
  'put',
  'post',
  'patch',
  'delete',
  'options',
  'head',
].forEach((method) => {
  fluentlyFetch[method] = (app: Server | HttpApp | string = '', initOptions: FluentRequestInit = {}) => {
    initOptions.method = method.toUpperCase()
    return fetcher(app, initOptions)
  }
})

// Aliases
fluentlyFetch.del = fluentlyFetch.delete

export default fluentlyFetch
export { FluentRequest, FluentRequestInit, FluentlyFetch }
