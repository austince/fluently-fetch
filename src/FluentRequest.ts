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
  private readonly bodyContent: any
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

    const body = initOptions.body
    initOptions.body = serializeBody(body)

    super(url as string, initOptions)
    this.server = server
    this.url = url as string
    this.credentials = 'same-origin'
    this.bodyContent = body

    this.responsePipe = async res => res
    this.pluginPipe = req => req
    this.reqBodyPipe = async body => body
  }

  private pipeBody(pipe: (body: any) => Response | Promise<any>) {
    const currentPipe = this.reqBodyPipe
    this.reqBodyPipe = body => currentPipe(body).then(pipe)
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
    }, overrides)
    let cloned
    if (this.server) {
      cloned = new FluentRequest(this.server, initOptions)
    } else {
      cloned = new FluentRequest(this.url, initOptions)
    }

    cloned.responsePipe = this.responsePipe
    cloned.pluginPipe = this.pluginPipe
    cloned.reqBodyPipe = this.reqBodyPipe
    cloned.body = this.body

    return cloned
  }

  get(pathname: string) {
    return this.clone({
      method: 'GET',
      url: assignUrl(this.url, { pathname }),
    })
  }

  put(pathname: string) {
    return this.clone({
      method: 'PUT',
      url: assignUrl(this.url, { pathname }),
    })
  }

  patch(pathname: string) {
    return this.clone({
      method: 'PATCH',
      url: assignUrl(this.url, { pathname }),
    })
  }

  post(pathname: string) {
    return this.clone({
      method: 'POST',
      url: assignUrl(this.url, { pathname }),
    })
  }

  delete(pathname: string) {
    return this.clone({
      method: 'DELETE',
      url: assignUrl(this.url, { pathname }),
    })
  }

  del(pathname: string) {
    return this.delete(pathname)
  }

  head(pathname: string) {
    return this.clone({
      method: 'HEAD',
      url: assignUrl(this.url, { pathname }),
    })
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
        throw new FluentResponseError(res.toString())
      }
      return res
    })
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
      } else if (typeof FormData !== 'undefined' && this.bodyContent instanceof FormData) {
        newType = shortHandTypes.multipartForm
      } else {
        // Default to json
        newType = shortHandTypes.json
      }
    }

    // Either overwrite or append to the body
    let body = data
    if (typeof this.bodyContent === 'string') {
      // Concatenate form data
      body = `${this.bodyContent}&`
    } else if (typeof FormData !== 'undefined' && this.bodyContent instanceof FormData) {
      body = data
    } else if (typeof this.bodyContent === 'object') {
      body = Object.assign(this.bodyContent, data)
    }

    return this
      .type(newType)
      .clone({
        body,
      })
  }

  async invoke(): Promise<Response> {
    const bodyContent = await this.reqBodyPipe(this.bodyContent)
    let req: FluentRequest = this // tslint:disable-line:no-this-assignment
    if (bodyContent) {
      req = this.send(bodyContent)
    }

    // Apply plugins
    const plugged = this.pluginPipe(this)

    // Apply timeout, if specified
    let res
    if (this.timeoutMs !== undefined) {
      try {
        res = await timedFetch(req, plugged.timeoutMs)
      } catch (err) {
        throw err
      }
    } else {
      res = await fetch(req)
    }
    const pipedRes: Response = await this.responsePipe(res)

    return new Promise<Response>((resolve) => {
      if (this.server) {
        this.server.close(() => resolve(pipedRes))
      } else {
        resolve(res)
      }
    })
  }

  async then(resolve, reject) {
    try {
      const res = await this.invoke()
      resolve(res)
    } catch (err) {
      reject(err)
    }
  }

  end(resolve: (res: Response) => any, reject: (reason: any) => any) {
    return this.then(resolve, reject)
  }
}
