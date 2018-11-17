import { Server } from 'net'
import { IncomingMessage, ServerResponse } from 'http'
import assignUrl from './util/assign-url'
import serverAddress from './util/server-address'
import shortHandTypes from './util/short-hand-types'
import base64Encode from './util/base64-encode'
import startServer from './util/start-server'
import FluentResponseError from './errors/FluentResponseError'
import timedFetch from './timed-fetch'
import fetch from './fetch'
import URL from './URL'
import URLSearchParams from './URLSearchParams'

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
  type: 'basic' | 'auto' | 'bearer'
}

export type HttpApp = (request: IncomingMessage, response: ServerResponse) => void

export class FluentRequest extends Request {
  server: Server | undefined
  url: string
  credentials: RequestCredentials
  /**
   * Body before it is serialized for the request.
   */
  private rawBody: any
  private pluginPipe
  private responsePipe: (res: Response) => Promise<Response>
  private reqBodyPipe
  private timeoutMs: number | undefined

  constructor(app: Server | HttpApp | string = '', initOptions: FluentRequestInit = {}) {
    let url = app
    let server
    if (typeof app !== 'string') {
      server = startServer(app)
      url = initOptions.url || serverAddress(server)
    }

    if (!url) {
      // Default to localhost if nothing is specified
      url = 'http://localhost'
    }

    super(url as string, initOptions)
    this.server = server
    this.url = url as string
    this.credentials = 'same-origin'

    this.responsePipe = async res => res
    this.pluginPipe = req => req
    this.reqBodyPipe = async body => serializeBody(body)
  }

  private pipeBody(pipe: (body: any) => Response | Promise<any>) {
    const currentPipe = this.reqBodyPipe
    this.reqBodyPipe = body => (async body => pipe(body))(body).then(currentPipe)
  }

  private pipeRes(pipe: (res: Response) => Response | Promise<Response>) {
    const currentPipe = this.responsePipe
    this.responsePipe = res => currentPipe(res).then(pipe)
  }

  use(plugin: (req: FluentRequest) => FluentRequest): FluentRequest {
    const currentPipe = this.pluginPipe
    this.pluginPipe = req => plugin(currentPipe(req))
    return this
  }

  clone(overrides: FluentRequestInit = {}) {
    const initOptions = Object.assign({
      method: this.method,
      headers: this.headers,
      mode: this.mode,
      credentials: this.credentials,
      cache: this.cache,
      redirect: this.redirect,
      referrer: this.referrer,
      integrity: this.integrity,
      body: this.body,
    }, overrides)
    let cloned
    if (this.server) {
      initOptions.url = overrides.url || this.url
      cloned = new FluentRequest(this.server, initOptions)
    } else {
      cloned = new FluentRequest(this.url, initOptions)
    }

    cloned.responsePipe = this.responsePipe
    cloned.pluginPipe = this.pluginPipe
    cloned.reqBodyPipe = this.reqBodyPipe
    cloned.rawBody = this.rawBody

    return cloned
  }

  private setMethodAndPath(method: string, pathname: string) {
    return this.clone({
      method,
      url: assignUrl(this.url, { pathname }),
    })
  }

  get(pathname: string) {
    return this.setMethodAndPath('GET', pathname)
  }

  put(pathname: string) {
    return this.setMethodAndPath('PUT', pathname)
  }

  patch(pathname: string) {
    return this.setMethodAndPath('PATCH', pathname)
  }

  post(pathname: string) {
    return this.setMethodAndPath('POST', pathname)
  }

  delete(pathname: string) {
    return this.setMethodAndPath('DELETE', pathname)
  }

  del(pathname: string) {
    return this.delete(pathname)
  }

  head(pathname: string) {
    return this.setMethodAndPath('HEAD', pathname)
  }

  options(pathname: string) {
    return this.setMethodAndPath('OPTIONS', pathname)
  }

  set(key: object | string, value: string) {
    if (typeof key === 'object') {
      for (const [objKey, value] of Object.entries(key)) {
        this.headers.set(objKey, value)
      }
    } else if (typeof key === 'string') {
      this.headers.set(key, value)
    }
    return this
  }

  type(type: string) {
    return this.set('Content-Type', shortHandTypes[type] || type)
  }

  accept(type: string) {
    return this.set('Accept', shortHandTypes[type] || type)
  }

  query(query: string[][] | string | URLSearchParams) {
    const queryParams = new URLSearchParams(query)
    const { searchParams } = new URL(this.url)
    for (const [key, value] of queryParams.entries()) {
      searchParams.set(key, value)
    }
    this.url = assignUrl(this.url, { searchParams })
    return this
  }

  // Breaking change from the SuperAgent api
  // Sort comparator takes two tuples of form [param, value]
  sortQuery(comparator?: (a: [string, string], b: [string, string]) => number) {
    const { searchParams } = new URL(this.url)
    const queryArr = Array.from(searchParams) as [string, string][]
    if (comparator) {
      queryArr.sort(comparator)
    } else {
      queryArr.sort()
    }
    const sortedParams = new URLSearchParams(queryArr)
    this.url = assignUrl(this.url, { searchParams: sortedParams })
    return this
  }

  auth(username: string, password: AuthOptions | string = '', options?: AuthOptions) {
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
        return this.set('Authorization', `Basic ${username}:${password}`)
      case 'bearer':
        return this.set('Authorization', `Bearer ${base64Encode(`${username}:${password}`)}`)
      case 'auto':
        return this.clone({
          url: assignUrl(this.url, {
            username,
            password,
          }),
        })
      default:
        throw new TypeError('Auth type must be either `basic`, `auto`, or `bearer`.')
    }
  }

  withCredentials() {
    this.credentials = 'include'
    return this
  }

  ok(filter: (res: Response) => boolean) {
    this.pipeRes(async (res: Response) => {
      if (!filter(res)) {
        throw new FluentResponseError(res)
      }
      return res
    })
    return this
  }

  setTimeout(amount: number | { response?: number, deadline?: number }) {
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

  serialize(fn: (body: any) => any | Promise<any>) {
    this.pipeBody(async body => fn(body))
    return this
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

  responseType(type: 'blob' | 'arraybuffer') {
    // deprecate
  }

  send(data: string | object) {
    let newType = this.headers.get('Content-Type')
    if (!newType) {
      if (typeof data === 'string') {
        newType = shortHandTypes.urlencoded
      } else if (typeof FormData !== 'undefined' && this.rawBody instanceof FormData) {
        newType = shortHandTypes.multipart
      } else {
        // Default to json
        newType = shortHandTypes.json
      }
    }

    // Either overwrite or append to the body
    if (typeof this.rawBody === 'string') {
      // Concatenate form data
      this.rawBody = `${this.rawBody}&`
    } else if (typeof FormData !== 'undefined' && this.rawBody instanceof FormData) {
      this.rawBody = data
    } else if (typeof this.rawBody === 'object') {
      this.rawBody = Object.assign(this.rawBody, data)
    } else {
      this.rawBody = data
    }

    return this.type(newType)
  }

  protected async invoke(): Promise<Response> {
    const bodyContent = await this.reqBodyPipe(this.rawBody)
    let req: FluentRequest = this // tslint:disable-line:no-this-assignment
    if (this.rawBody) {
      req = this.clone({ body: bodyContent })
    }

    // Apply plugins
    req = this.pluginPipe(req)

    // Apply timeout, if specified
    let res
    if (req.timeoutMs !== undefined) {
      try {
        res = await timedFetch(req, req.timeoutMs)
      } catch (err) {
        throw err
      }
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

  async then(resolve: Function, reject: Function) {
    try {
      const res = await this.invoke()
      resolve(res)
    } catch (err) {
      reject(err)
    }
  }

  end(handler: (err: Error|null, res?: Response) => any) {
    return this.then(
      res => handler(null, res),
      err => handler(err),
    )
  }
}
