import { Server } from 'net'
import { IncomingMessage, ServerResponse } from 'http'
import assignUrl from './util/assign-url'
import assignFormData from './util/assign-form-data'
import serverAddress from './util/server-address'
import shortHandTypes from './util/short-hand-types'
import base64Encode from './util/base64-encode'
import startServer from './util/start-server'
import FluentResponseError from './errors/FluentResponseError'
import timedFetch from './timed-fetch'
import URL from './URL'
import URLSearchParams from './URLSearchParams'

if (typeof fetch === 'undefined') {
  require('isomorphic-fetch')
}

function serializeBody(body) {
  let serialized = body
  if (body && typeof body !== 'string') {
    serialized = JSON.stringify(body)
  }
  return serialized
}

export interface FluentRequestInit extends RequestInit {
  url?: string
  body?: any
}

export interface AuthOptions {
  type: 'basic' | 'bearer'
}

export type HttpApp = (request: IncomingMessage, response: ServerResponse) => void

export type FluentRequestPlugin = (req: FluentRequest) => FluentRequest

export default class FluentRequest extends Request {
  protected server?: Server
  /**
   * Body before it is serialized for the request.
   */
  protected rawBody?: any
  protected pluginPipe
  protected responsePipe: (res: Response) => Promise<Response>
  protected reqBodyPipe
  protected timeoutMs: number | undefined

  constructor(
    input: FluentRequest | Server | HttpApp | string = 'http://localhost',
    initOptions: FluentRequestInit = {},
  ) {
    let url = input
    const defaults: any = {
      responsePipe: async (res: Response) => res,
      pluginPipe: (req: FluentRequest) => req,
      reqBodyPipe: async body => serializeBody(body),
      server: undefined,
    }

    if (input instanceof FluentRequest) {
      initOptions = input.initOptions
      url = input.url
      defaults.responsePipe = input.responsePipe
      defaults.pluginPipe = input.pluginPipe
      defaults.reqBodyPipe = input.reqBodyPipe
    } else if (typeof input !== 'string') {
      defaults.server = startServer(input)
      url = initOptions.url || serverAddress(defaults.server)
    }

    if (!initOptions.credentials) {
      initOptions.credentials = 'same-origin'
    }

    super(url as string, initOptions)
    this.server = defaults.server
    this.responsePipe = defaults.responsePipe
    this.pluginPipe = defaults.pluginPipe
    this.reqBodyPipe = defaults.reqBodyPipe
  }

  protected get initOptions(): RequestInit {
    return {
      method: this.method,
      headers: this.headers,
      mode: this.mode,
      credentials: this.credentials,
      cache: this.cache,
      redirect: this.redirect,
      referrer: this.referrer,
      integrity: this.integrity,
      body: this.body,
    }
  }

  protected pipeBody(pipe: (body: any) => Response | Promise<any>): FluentRequest {
    const currentPipe = this.reqBodyPipe
    this.reqBodyPipe = body => (async body => pipe(body))(body).then(currentPipe)
    return this
  }

  protected pipeRes(pipe: (res: Response) => Response | Promise<Response>): FluentRequest {
    const currentPipe = this.responsePipe
    this.responsePipe = res => currentPipe(res).then(pipe)
    return this
  }

  use(plugin: FluentRequestPlugin): FluentRequest {
    const currentPipe = this.pluginPipe
    this.pluginPipe = req => plugin(currentPipe(req))
    return this
  }

  clone(overrides: FluentRequestInit = {}): FluentRequest {
    const initOptions = Object.assign(this.initOptions, overrides)
    let cloned
    if (this.server) {
      initOptions.url = overrides.url || this.url
      cloned = new FluentRequest(this.server, initOptions)
    } else {
      const url = overrides.url || this.url
      cloned = new FluentRequest(url, initOptions)
    }

    cloned.responsePipe = this.responsePipe
    cloned.pluginPipe = this.pluginPipe
    cloned.reqBodyPipe = this.reqBodyPipe
    cloned.rawBody = this.rawBody

    return cloned
  }

  private setMethodAndPath(method: string, pathname: string): FluentRequest {
    return this.clone({
      method,
      url: assignUrl(this.url, { pathname }),
    })
  }

  get(pathname: string): FluentRequest {
    return this.setMethodAndPath('GET', pathname)
  }

  put(pathname: string): FluentRequest {
    return this.setMethodAndPath('PUT', pathname)
  }

  patch(pathname: string): FluentRequest {
    return this.setMethodAndPath('PATCH', pathname)
  }

  post(pathname: string): FluentRequest {
    return this.setMethodAndPath('POST', pathname)
  }

  delete(pathname: string): FluentRequest {
    return this.setMethodAndPath('DELETE', pathname)
  }

  del(pathname: string): FluentRequest {
    return this.delete(pathname)
  }

  head(pathname: string): FluentRequest {
    return this.setMethodAndPath('HEAD', pathname)
  }

  options(pathname: string): FluentRequest {
    return this.setMethodAndPath('OPTIONS', pathname)
  }

  set(keyOrMap: object | string, value?: string): FluentRequest {
    if (typeof keyOrMap === 'object') {
      for (const objKey of Object.keys(keyOrMap)) {
        this.headers.set(objKey, keyOrMap[objKey])
      }
    } else if (typeof keyOrMap === 'string') {
      if (value === undefined) {
        throw new TypeError('value must be defined.')
      }

      this.headers.set(keyOrMap, value)
    }
    return this
  }

  type(type: string): FluentRequest {
    return this.set('Content-Type', shortHandTypes[type] || type)
  }

  accept(type: string): FluentRequest {
    return this.set('Accept', shortHandTypes[type] || type)
  }

  query(query: string[][] | string | URLSearchParams| { [key: string]: any }): FluentRequest {
    const queryParams = new URLSearchParams(query)
    const { searchParams } = new URL(this.url)
    for (const [key, value] of queryParams.entries()) {
      searchParams.set(key, value)
    }
    return this.clone({
      url: assignUrl(this.url, { search: searchParams.toString() }),
    })
  }

  // Breaking change from the SuperAgent api
  // Sort comparator takes two tuples of form [param, value]
  sortQuery(comparator?: (a: [string, string], b: [string, string]) => number): FluentRequest {
    const { searchParams } = new URL(this.url)
    const queryArr = Array.from(searchParams) as [string, string][]
    if (comparator) {
      queryArr.sort(comparator)
    } else {
      queryArr.sort()
    }
    const sortedParams = new URLSearchParams(queryArr)
    return this.clone({
      url: assignUrl(this.url, { search: sortedParams.toString() }),
    })
  }

  setAuth(usernameOrToken: string, password: AuthOptions | string = '', options?: AuthOptions): FluentRequest {
    if (typeof password === 'object') {
      options = password as AuthOptions
      password = ''
    }

    if (!options) {
      options = {
        type: 'basic',
      }
    }

    switch (options.type) {
      case 'basic':
        return this.set('Authorization', `Basic ${base64Encode(`${usernameOrToken}:${password}`)}`)
      case 'bearer':
        return this.set('Authorization', `Bearer ${usernameOrToken}`)
      default:
        throw new TypeError('Auth type must be either `basic`, `auto`, or `bearer`.')
    }
  }

  setMode(mode: RequestMode): FluentRequest {
    return this.clone({
      mode,
    })
  }

  withCredentials(): FluentRequest {
    return this.clone({
      credentials: 'include',
    })
  }

  ok(filter: (res: Response) => boolean | Promise<Boolean>): FluentRequest {
    this.pipeRes(async (res: Response) => {
      const isOk = await filter(res)
      if (!isOk) {
        throw new FluentResponseError(res)
      }
      return res
    })
    return this
  }

  setTimeout(amount: number)
  /**
   * @deprecated
   * @param timoutOptions
   */
  setTimeout(timoutOptions: { response: number })
  /**
   * @deprecated
   * @param timoutOptions
   */
  setTimeout(timoutOptions: { response: number, deadline?: number })

  setTimeout(amount: number | { response: number, deadline?: number }): FluentRequest {
    if (typeof amount === 'object') {
      if (amount.deadline !== undefined) {
        throw new TypeError('Deadline timeout is not supported.')
      }
      this.timeoutMs = amount.response
    } else {
      this.timeoutMs = amount
    }
    return this
  }

  serialize(fn: (body: any) => any | Promise<any>): FluentRequest {
    return this.pipeBody(async body => fn(body))
  }

  field() {
    // Todo
  }

  attach() {
    // Todo
  }

  retry() {
    // todo
  }

  buffer() {
    // todo
  }

  redirects(count: number) {
    // todo
  }

  send(data: string | object): FluentRequest {
    let newType = this.headers.get('Content-Type')
    if (!newType) {
      if (typeof data === 'string') {
        newType = shortHandTypes.urlencoded
      } else if (typeof FormData !== 'undefined' && data instanceof FormData) {
        newType = shortHandTypes.multipart
      } else {
        // Default to json
        newType = shortHandTypes.json
      }
    }

    // Either overwrite or append to the body
    if (typeof this.rawBody === 'string' && typeof data === 'string') {
      // Concatenate string form data
      this.rawBody = `${this.rawBody}&${data}`
    } else if (typeof FormData !== 'undefined' && data instanceof FormData) {
      this.rawBody = assignFormData(this.rawBody, data)
    } else if (Array.isArray(this.rawBody) && Array.isArray(data)) {
      this.rawBody.push(...data)
    } else if (typeof this.rawBody === 'object' && typeof data === 'object') {
      this.rawBody = Object.assign(this.rawBody, data)
    } else {
      this.rawBody = data
    }

    return this.type(newType)
  }

  private async invoke(): Promise<Response> {
    let req: FluentRequest = this // tslint:disable-line:no-this-assignment
    if (this.rawBody !== undefined) {
      const bodyContent = await this.reqBodyPipe(this.rawBody)
      req = this.clone({ body: bodyContent })
    }

    // Apply plugins
    req = this.pluginPipe(req)

    // Apply timeout, if specified
    let res
    if (req.timeoutMs !== undefined) {
      res = await timedFetch(req, req.timeoutMs)
    } else {
      res = await fetch(req)
    }
    res = await this.responsePipe(res)

    return new Promise<Response>((resolve) => {
      if (this.server) {
        this.server.close(() => resolve(res))
      } else {
        resolve(res)
      }
    })
  }

  async then<TResult1 = Response, TResult2 = never>(
    resolve?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null)
    : Promise<TResult1 | TResult2> {
    let res
    try {
      res = await this.invoke()
      if (resolve) {
        return resolve(res)
      }
    } catch (err) {
      if (reject) {
        return reject(err)
      }
    }
    return res
  }

  /**
   * @deprecated
   * @param handler
   */
  end(handler: (err: Error | null, res?: Response) => any) {
    return this.then(
      res => handler(null, res),
      err => handler(err),
    )
  }
}
