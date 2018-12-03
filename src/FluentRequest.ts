import { Server } from 'net'
import { ReadStream } from 'fs';
import { IncomingMessage, ServerResponse } from 'http'
import 'isomorphic-fetch'
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
import FormData from './FormData'

function serializeBody(body) {
  let serialized = body
  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    serialized = JSON.stringify(body)
  }
  return serialized
}

function getTypeForBody(body) {
  if (body instanceof FormData) {
    return null
  }

  if (typeof body === 'string') {
    return shortHandTypes.urlencoded
  }

  // Default to json
  return shortHandTypes.json
}

function getInitOptions(req: Request): RequestInit {
  return {
    method: req.method,
    headers: req.headers,
    mode: req.mode,
    credentials: req.credentials,
    cache: req.cache,
    redirect: req.redirect,
    referrer: req.referrer,
    integrity: req.integrity,
    body: req.body,
  }
}

export interface FluentRequestInit extends RequestInit {
  url?: string
  body?: any
}

export interface AuthOptions {
  type: 'basic' | 'bearer'
}

export type HttpApp = (request: IncomingMessage, response: ServerResponse) => void

export type Plugin = (req: FluentRequest) => FluentRequest

export type FormField = string | boolean | Blob | File | ReadStream

export interface FormAttachOptions {
  filename?: string
  contentType?: string
}
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

    if (input instanceof Request) {
      initOptions = getInitOptions(input)
      url = input.url

      if (input instanceof FluentRequest) {
        defaults.responsePipe = input.responsePipe
        defaults.pluginPipe = input.pluginPipe
        defaults.reqBodyPipe = input.reqBodyPipe
      }
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

  use(plugin: Plugin): FluentRequest {
    const currentPipe = this.pluginPipe
    this.pluginPipe = req => plugin(currentPipe(req))
    return this
  }

  clone(overrides: FluentRequestInit = {}): FluentRequest {
    const initOptions = Object.assign(getInitOptions(this), overrides)
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

  query(query: string[][] | string | URLSearchParams | { [key: string]: any }): FluentRequest {
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

  field(nameOrDict: string | { [name: string]: FormField }, val?: FormField | FormField[]): FluentRequest {
    if (nameOrDict === undefined || nameOrDict === null) {
      throw new TypeError(`Must supply a field name or object, not ${nameOrDict}.`)
    }

    if (!(this.rawBody instanceof FormData)) {
      this.rawBody = new FormData()
    }

    if (typeof nameOrDict === 'object') {
      return Object.keys(nameOrDict)
        .reduce((acc: FluentRequest, key: string) => {
          return acc.field(key, nameOrDict[key])
        }, this)
    }

    if (Array.isArray(val)) {
      return val.reduce((acc: FluentRequest, item: FormField) => {
        return acc.field(nameOrDict, item)
      }, this)
    }

    if (val === undefined) {
      throw new TypeError(`Must supply a value to append for field ${nameOrDict}.`)
    }

    if (typeof val === 'boolean') {
      val = val.toString()
    }

    this.rawBody.append(nameOrDict, val)
    return this
  }

  attach(name: string, data: Blob | Buffer | ReadStream, options: FormAttachOptions|string = {}): FluentRequest {
    if (!(this.rawBody instanceof FormData)) {
      this.rawBody = new FormData()
    }

    if (typeof options === 'string') {
      options = { filename: options }
    }

    if (!options.filename && (data as ReadStream).path) {
      options.filename = (data as ReadStream).path.toString()
    }

    this.rawBody.append(name, data, options)
    return this
  }

  send(data: string | object | FormData | URLSearchParams): FluentRequest {
    // Either overwrite or append to the body
    if (typeof this.rawBody === 'string' && typeof data === 'string') {
      // Concatenate string form data
      this.rawBody = `${this.rawBody}&${data}`
    } else if (this.rawBody instanceof FormData && data instanceof FormData) {
      this.rawBody = assignFormData(this.rawBody, data as FormData)
    } else if (Array.isArray(this.rawBody) && Array.isArray(data)) {
      this.rawBody = this.rawBody.concat(data)
    } else if (typeof this.rawBody === 'object' && typeof data === 'object') {
      this.rawBody = Object.assign(this.rawBody, data)
    } else {
      this.rawBody = data
    }

    return this
  }

  private async invoke(): Promise<Response> {
    // Todo: move this to a out-of-class util function that fetches one of these guyz
    let req: FluentRequest = this // tslint:disable-line:no-this-assignment
    if (req.rawBody !== undefined) {
      const bodyContent = await req.reqBodyPipe(req.rawBody)
      req = req.clone({ body: bodyContent })
      const newType = getTypeForBody(req.rawBody)
      if (newType) {
        req = req.type(newType)
      }
    }

    // Apply plugins
    req = req.pluginPipe(req)

    // Apply timeout, if specified
    let res
    if (req.timeoutMs !== undefined) {
      res = await timedFetch(req, req.timeoutMs)
    } else {
      res = await fetch(req)
    }
    res = await req.responsePipe(res)

    return new Promise<Response>((resolve) => {
      if (req.server) {
        req.server.close(() => resolve(res))
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
