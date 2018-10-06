import { Server } from 'net'
import { FluentRequest, FluentRequestInit } from './FluentRequest'

export { FluentRequest, FluentRequestInit } from './FluentRequest'

export function fluentlyFetch(app: Server | string = '', initOptions: FluentRequestInit = {}) {
  return new FluentRequest(app, initOptions)
}

export default fluentlyFetch
