import 'isomorphic-fetch'
import { Server } from 'net'
import assignUrl from './util/assign-url'
import serverAddress from './util/server-address'
import shortHandTypes from './util/short-hand-types'
import FluentResponseError from './FluentResponseError'

if (typeof URLSearchParams === 'undefined') {
  // Node
  const { URL, URLSearchParams } = require('url')
}

export interface FluentRequestInit extends RequestInit {
  url?: string;
  body?: string
}

export class FluentRequest extends Request {
  app: boolean | Server | undefined
  url: string
  credentials: RequestCredentials
  body: any
  private responsePipe: (res: Response) => Promise<Response>
  private reqBodyPipe: (body: any) => Promise<any>

  constructor(app: Server | string = '', initOptions: FluentRequestInit = {}) {
    let url = app
    if (typeof app === 'function') {
      url = initOptions.url || serverAddress(app)
    }
    url = url as string
    if (!url) {
      url = 'http://localhost'
    }
    super(url, initOptions)
    this.url = url
    this.credentials = 'same-origin'

    this.responsePipe = async res => res
    this.reqBodyPipe = async body => body
  }

  private pipeBody(pipe: (body: any) => Promise<any>) {
    const currentPipe = this.reqBodyPipe
    this.reqBodyPipe = (body) => {
      return currentPipe(body).then(pipe)
    }
  }

  private pipeRes(pipe: (res: Response) => Promise<Response>) {
    const currentPipe = this.responsePipe
    this.responsePipe = (res) => {
      return currentPipe(res).then(pipe)
    }
  }

  clone(overrides: FluentRequestInit = {}) {
    const initOptions = Object.assign({
      method: this.method,
      headers: this.headers,
      body: this.body,
      mode: this.mode,
      credentials: this.credentials,
      cache: this.cache,
      redirect: this.redirect,
      referrer: this.referrer,
      integrity: this.integrity,
    }, overrides)
    if (this.app) {
      return new FluentRequest(this.app as Server, initOptions)
    }
    return new FluentRequest(this.url, initOptions)
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
    this.set('Content-Type', shortHandTypes[type] || type)
    return this
  }

  accept(type: string) {
    this.set('Accept', shortHandTypes[type] || type)
    return this
  }

  query(query: string[][] | Record<string, string> | string | URLSearchParams) {
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
    const queryArr = Array.from(searchParams)
    if (comparator) {
      queryArr.sort(comparator)
    } else {
      queryArr.sort()
    }
    const sortedParams = new URLSearchParams(queryArr)
    this.url = assignUrl(this.url, { searchParams })
    return this
  }

  redirects(count: number) {
    // todo
  }

  // Breaking: currently only supports basic auth
  auth(username: string, password: string) {
    const auth = `${username}:${password}`
    const basicAuth = `Basic ${Buffer.from(auth).toString('base64')}`
    return this.set('Authorization', basicAuth)
  }

  withCredentials() {
    this.credentials = 'include'
    return this
  }

  retry() {
    // todo
  }

  ok(filter: (res: Response) => boolean) {
    this.pipeRes(async (res: Response) => {
      if (!filter(res)) {
        throw new FluentResponseError(res.toString())
      }
      return res
    })
  }

  timeout(amount: number | { response?: number, deadline?: number }) {
    // todo
  }

  buffer() {
    // todo
  }

  serialize(fn: (body: any) => any) {
    this.pipeBody(fn)
  }

  parse() {
    // todo
  }

  // Node
  ca(ca: string) {
    // todo
  }

  key(key: string) {
    // todo
  }

  pfx(pfx: string) {
    // todo
  }

  cert(cert: string) {
    // todo
  }

  responseType(type: 'blob' | 'arraybuffer') {
    // deprecate
  }

  send(data: string | object) {
    // todo: Handle things like FormData
    if (typeof data === 'string') {
      this.type(shortHandTypes.urlencoded)
    } else {
      // Default to json
      this.type(shortHandTypes.json)
    }

    // Either overwrite or append to the body
    let body = data
    if (typeof this.body === 'string') {
      // Concatenate form data
      body = `${this.body}&`
    } else if (typeof this.body === 'object') {
      body = Object.assign(this.body, data)
    }

    this.body = body
    return this
  }

  async then(resolve: (res: Response) => any, reject: (reason: any) => any) {
    let body = await this.reqBodyPipe(this.body)

    if (typeof body === 'object') {
      body = JSON.stringify(body)
    }

    const pipped = this.clone({ body })

    return fetch(pipped)
      .then(res => this.responsePipe(res))
      .then(resolve)
      .catch(reject)
  }

  end(resolve: (res: Response) => any, reject: (reason: any) => any): Promise<Response> {
    return this.then(resolve, reject)
  }
}
