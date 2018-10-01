import 'isomorphic-fetch';
import assignURL from './util/assign-url';
import serverAddress from './util/server-address';
import { Server } from 'http'

if (typeof URLSearchParams === 'undefined') {
  // Node 
  const { URL, URLSearchParams } = require('url')
}

const shortHandTypes: { [type:string]: string } = {
  html: 'text/html',
  json: 'application/json',
  xml: 'text/xml',
  urlencoded: 'application/x-www-form-urlencoded',
  form: 'application/x-www-form-urlencoded',
  'form-data': 'application/x-www-form-urlencoded'
};

interface FluentRequestInit extends RequestInit {
  url?: string;
}

class ResponseError extends Error {}

const pipe = async (res: Response) => res

export default class FluentRequest extends Request {
  app: boolean | Server | undefined;
  url: string;
  body: ReadableStream | null;
  credentials: RequestCredentials
  private responsePipe: (res: Response) => Promise<Response>;
  private reqBodyPipe: (body: any) => Promise<any>

  constructor(app: Server | string, initOptions: FluentRequestInit = {}) {
    let url = app
    if (typeof app === 'function') {
      url = initOptions.url || serverAddress(app) as string
    }
    url = url as string
    super(url, initOptions)
    this.url = url
    this.body = null
    this.credentials = 'same-origin'

    this.responsePipe = async (res) => res
    this.reqBodyPipe = async (body) => body
  }

  private addReqBodyPipe(pipe: (body: any) => Promise<any>) {
    const currentPipe = this.reqBodyPipe;
    this.reqBodyPipe = (body) => {
      return currentPipe(body).then(pipe)
    }
  }

  private addResponsePipe(pipe: (res: Response) => Promise<Response>) {
    const currentPipe = this.responsePipe;
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
      url: assignURL(this.url, { pathname })
    })
  }

  put(pathname: string) {
    return this.clone({
      method: 'PUT',
      url: assignURL(this.url, { pathname })
    })
  }

  post(pathname: string) {
    return this.clone({
      method: 'POST',
      url: assignURL(this.url, { pathname })
    })
  }

  delete(pathname: string) {
    return this.clone({
      method: 'DELETE',
      url: assignURL(this.url, { pathname })
    })
  }

  head(pathname: string) {
    return this.clone({
      method: 'HEAD',
      url: assignURL(this.url, { pathname })
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
    this.url = assignURL(this.url, { searchParams })
    return this
  }

  // Breaking change from the SuperAgent api
  // Sort comparitor takes two tuples of form [param, value]
  sortQuery(comparitor?: (a: [string, string], b: [string, string]) => boolean) {
    const { searchParams } = new URL(this.url)
    const queryArr = Array.from(searchParams)
    if (comparitor) {
      queryArr.sort(comparitor)
    } else {
      queryArr.sort()
    }
    const sortedParams = new URLSearchParams(queryArr)
    this.url = assignURL(this.url, { searchParams })
    return this
  }

  redirects(count: number) {
    // todo
  }

  // Breaking: currently only supports basic auth
  auth(username: string, password: string) {
    const auth = `${username}:${password}`;
    const basicAuth = `Basic ${Buffer.from(auth).toString('base64')}`;
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
    this.addResponsePipe(async (res: Response) => {
      if (!filter(res)) {
        throw new ResponseError(res.toString());
      }
      return res;
    });
  }

  timeout(amount: number|{ response?: number, deadline?: number}) {
    // todo
  }

  buffer() {
    // todo
  }

  serialize(fn: (body: any) => any) {
    this.addReqBodyPipe(fn)
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
    if (typeof this.body === 'string') {
      // Concatenate form data
      data = this.body + '&'
    } else if (typeof this.body === 'object') {
      data = Object.assign(this.body, data)
    }

    this.body = data as ReadableStream

    return this
  }

  async then(resolve: (res: Response) => any, reject: (reason: any) => any) {
    this.body = await this.reqBodyPipe(this.body)
    return fetch(this)
      .then(res => this.responsePipe(res))
      .then(resolve)
      .catch(reject)
  }

  end(resolve: (res: Response) => any, reject: (reason: any) => any) {
    return this.then(resolve, reject)
  }
}