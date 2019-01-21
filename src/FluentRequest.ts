import { Server } from 'net'
import { ReadStream } from 'fs'
import assignUrl from './util/assign-url'
import assignFormData from './util/assign-form-data'
import serverAddress from './util/server-address'
import shortHandTypes from './util/short-hand-types'
import base64Encode from './util/base64-encode'
import startServer, { HttpApp } from './util/start-server'
import FluentResponseError from './errors/FluentResponseError'
import timedFetch from './timed-fetch'
import URL from './URL'
import URLSearchParams from './URLSearchParams'
import FormData from './FormData'

/**
 * The serializer for request bodies before they are sent.
 *
 * @param body
 */
function serializeBody(body) {
  let serialized = body
  if (body && typeof body !== 'string' && !(body instanceof FormData)) {
    serialized = JSON.stringify(body)
  }
  return serialized
}

/**
 * Get the Content-Type for a body, or null if no type is applicable.
 *
 * @param body
 */
function getContentTypeForBody(body): string | null {
  if (body instanceof FormData) {
    return null
  }

  if (typeof body === 'string') {
    return shortHandTypes.urlencoded
  }

  // Default to json
  return shortHandTypes.json
}

export interface FluentRequestInit extends RequestInit {
  url?: string
  body?: any
  timeoutMillis?: number
}

/**
 * Extended input options to accept servers and other FluentRequests.
 */
export type FluentRequestInfo = FluentRequest | Server | HttpApp | RequestInfo

export type FluentRequestPlugin = (req: FluentRequest) => FluentRequest

export type FormField = string | boolean | Blob | File | ReadStream

export interface FormAttachOptions {
  filename?: string
  contentType?: string
}

/**
 * A fluent Request that is fully compatible with {@link fetch}.
 *
 * @extends Request
 * @implements PromiseLike<Response>
 */
export default class FluentRequest extends Request {
  protected server?: Server
  /**
   * Body before it is serialized for the request.
   */
  protected rawBody?: any
  protected pluginPipe: FluentRequestPlugin
  protected responsePipe: (res: Response) => Response|Promise<Response>
  protected reqBodyPipe: (body: any) => any|Promise<any>
  protected timeoutMillis: number | undefined

  /**
   * Clone over the {@link FluentRequestInit} options from a request.
   *
   * @param req
   */
  static getInitOptions(req: Request): FluentRequestInit {
    const base = {
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

    if (req instanceof FluentRequest) {
      return Object.assign(base, {
        timeoutMillis: req.timeoutMillis,
      })
    }

    return base
  }

  constructor(
    input: FluentRequestInfo = 'http://localhost',
    initOptions: FluentRequestInit = {},
  ) {
    let url = input
    const defaults: any = {
      responsePipe: async (res: Response) => res,
      pluginPipe: (req: FluentRequest) => req,
      reqBodyPipe: async body => body,
      server: undefined,
    }

    const defaultInitOptions: FluentRequestInit = Object.assign({
      timeoutMillis: undefined,
      credentials: 'same-origin',
    }, initOptions)

    if (input instanceof Request) {
      initOptions = Object.assign(
        defaultInitOptions,
        FluentRequest.getInitOptions(input),
        initOptions,
      )
      url = initOptions.url || input.url
      if (input instanceof FluentRequest) {
        defaults.responsePipe = input.responsePipe
        defaults.pluginPipe = input.pluginPipe
        defaults.reqBodyPipe = input.reqBodyPipe
      }
    } else if (typeof input !== 'string') {
      // Must be an HttpApp
      defaults.server = startServer(input)
      url = initOptions.url || serverAddress(defaults.server)
    }

    super(url as string, initOptions)
    // FluentRequest specific init options
    this.timeoutMillis = defaultInitOptions.timeoutMillis
    // Default property configs
    this.server = defaults.server
    this.responsePipe = defaults.responsePipe
    this.pluginPipe = defaults.pluginPipe
    this.reqBodyPipe = defaults.reqBodyPipe
  }

  /**
   * Sequentially pipes the body through a chain of functions.
   *
   * @param pipe
   */
  protected pipeBody(pipe: (body: any) => any | Promise<any>): FluentRequest {
    const currentPipe = this.reqBodyPipe
    this.reqBodyPipe = body =>
      Promise.resolve(currentPipe(body))
        .then(body => pipe(body))
    return this
  }

  /**
   * Add a pipe to the incoming response.
   *
   * @param pipe
   */
  protected pipeResponse(pipe: (res: Response) => Response | Promise<Response>): FluentRequest {
    const currentPipe = this.responsePipe
    this.responsePipe = res => Promise.resolve(currentPipe(res)).then(pipe)
    return this
  }

  /**
   * Send the request.
   */
  private static async invoke(req: FluentRequest): Promise<Response> {
    // Apply plugins
    req = req.pluginPipe(req)

    if (req.rawBody !== undefined) {
      const bodyContent = await req.reqBodyPipe(req.rawBody)
      req = req.clone({ body: serializeBody(bodyContent) })
      const newType = getContentTypeForBody(req.rawBody)
      if (newType) {
        req = req.setType(newType)
      }
    }

    // Apply timeout, if specified
    let res
    if (req.timeoutMillis !== undefined) {
      res = await timedFetch(req, req.timeoutMillis)
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

  /**
   * Add a plugin for customization.
   *
   * @param plugin
   */
  use(plugin: FluentRequestPlugin): FluentRequest {
    const currentPipe = this.pluginPipe
    this.pluginPipe = req => plugin(currentPipe(req));
    return this
  }

  /**
   * Clone the entire request
   *
   * @override
   * @param overrides
   */
  clone(overrides: FluentRequestInit = {}): FluentRequest {
    const initOptions = Object.assign(FluentRequest.getInitOptions(this), overrides)
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

  /**
   * Set the method and path of the request.
   * There are aliases for most request methods.
   *
   * @param method
   * @param pathname
   */
  setMethodAndPath(method: string, pathname: string): FluentRequest {
    return this.clone({
      method,
      url: assignUrl(this.url, { pathname }),
    })
  }

  /**
   * Send a GET request.
   *
   * @param pathname
   */
  get(pathname: string): FluentRequest {
    return this.setMethodAndPath('GET', pathname)
  }

  /**
   * Send a PUT request.
   *
   * @param pathname
   */
  put(pathname: string): FluentRequest {
    return this.setMethodAndPath('PUT', pathname)
  }

  /**
   * Send a PATCH request.
   *
   * @param pathname
   */
  patch(pathname: string): FluentRequest {
    return this.setMethodAndPath('PATCH', pathname)
  }

  /**
   * Send a POST request.
   *
   * @param pathname
   */
  post(pathname: string): FluentRequest {
    return this.setMethodAndPath('POST', pathname)
  }

  /**
   * Send a DELETE request.
   *
   * @param pathname
   */
  delete(pathname: string): FluentRequest {
    return this.setMethodAndPath('DELETE', pathname)
  }

  /**
   * Send a DELETE request.
   * Alias of {@link FluentRequest#delete}.
   *
   * @param pathname
   */
  del(pathname: string): FluentRequest {
    return this.delete(pathname)
  }

  /**
   * Send a HEAD request.
   *
   * @param pathname
   */
  head(pathname: string): FluentRequest {
    return this.setMethodAndPath('HEAD', pathname)
  }

  /**
   * Send an OPTIONS request.
   *
   * @param pathname
   */
  options(pathname: string): FluentRequest {
    return this.setMethodAndPath('OPTIONS', pathname)
  }

  /**
   * Set request Headers.
   *
   * @param nameOrMap Either the header name or a name/value pairs map to set from.
   * @param value The value of the Header.
   */
  setHeader(nameOrMap: object | string, value?: string): FluentRequest {
    if (typeof nameOrMap === 'object') {
      for (const objKey of Object.keys(nameOrMap)) {
        this.headers.set(objKey, nameOrMap[objKey])
      }
    } else if (typeof nameOrMap === 'string') {
      if (value === undefined) {
        throw new TypeError('value must be defined.')
      }

      this.headers.set(nameOrMap, value)
    }
    return this
  }

  /**
   * Set the Content-Type header.
   *
   * @param type Either a specific type or a shorthand version.
   */
  setType(type: string): FluentRequest {
    return this.setHeader('Content-Type', shortHandTypes[type] || type)
  }

  /**
   * Set the Accept header.
   *
   * @param type Either a specific type or a shorthand version.
   */
  setAccept(type: string): FluentRequest {
    return this.setHeader('Accept', shortHandTypes[type] || type)
  }

  /**
   * Set query parameters.
   *
   * @param query
   */
  setQuery(query: string[][] | string | URLSearchParams | { [key: string]: any }): FluentRequest {
    const queryParams = new URLSearchParams(query)
    const { searchParams } = new URL(this.url)
    for (const [key, value] of queryParams.entries()) {
      searchParams.set(key, value)
    }
    return this.clone({
      url: assignUrl(this.url, { search: searchParams.toString() }),
    })
  }

  /**
   * Sort the query parameters.
   * Breaking change from the SuperAgent api.
   *
   * @param comparator The function to use in an {@link Array#sort} that accepts string tuples as items.
   */
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

  /**
   * Set the auth. Either specify a token to be used for Bearer auth
   * or a username and password to be used for Basic auth.
   *
   * @param usernameOrToken
   * @param password
   */
  setAuth(usernameOrToken: string, password?: string): FluentRequest {
    if (password === undefined) {
      // Passed just a token for Bearer auth
      return this.setHeader('Authorization', `Bearer ${usernameOrToken}`)
    }
    // Both a username and password for Basic auth
    return this.setHeader('Authorization', `Basic ${base64Encode(`${usernameOrToken}:${password}`)}`)
  }

  /**
   * Set the request mode.
   *
   * @param mode
   */
  setMode(mode: RequestMode): FluentRequest {
    return this.clone({
      mode,
    })
  }

  setCredentials(credentials: RequestCredentials) {
    return this.clone({
      credentials,
    })
  }

  /**
   * Configure the request to use the 'include' credentials mode.
   */
  withCredentials(): FluentRequest {
    return this.setCredentials('include')
  }

  /**
   * Set a function to determine if a request was successful. Runs directly after a response is received.
   *
   * @param checkFn
   */
  addOkCheck(checkFn: (res: Response) => boolean | Promise<Boolean>): FluentRequest {
    this.pipeResponse(async (res: Response) => {
      const isOk = await checkFn(res)
      if (!isOk) {
        throw new FluentResponseError(res)
      }
      return res
    })
    return this
  }

  /**
   * Set the response timeout in milliseconds.
   *
   * @param amount
   */
  setTimeout(amount: number): FluentRequest {
    return this.clone({
      timeoutMillis: amount,
    })
  }

  setIntegrity(integrity: string): FluentRequest {
    return this.clone({
      integrity,
    })
  }

  setCache(cache: RequestCache) {
    return this.clone({
      cache,
    })
  }

  setRedirect(redirect: RequestRedirect) {
    return this.clone({
      redirect,
    })
  }

  setReferrerPolicy(referrerPolicy: ReferrerPolicy) {
    return this.clone({
      referrerPolicy,
    })
  }

  setReferrer(referrer: string) {
    return this.clone({
      referrer,
    })
  }

  /**
   * Serialize the body with a custom function before sending the request.
   *
   * @param fn
   */
  addBodySerializer(fn: (body: any) => any | Promise<any>): FluentRequest {
    return this.pipeBody(fn)
  }

  /**
   * Set a field in a {@link FormData} body. If no body exists, a new instance will be created.
   *
   * @param nameOrMap Either the name of the field or a name/value pairs map to set.
   * @param val The value to set.
   */
  setField(nameOrMap: string | { [name: string]: FormField }, val?: FormField | FormField[]): FluentRequest {
    if (nameOrMap === undefined || nameOrMap === null) {
      throw new TypeError(`Must supply a field name or object, not ${nameOrMap}.`)
    }

    if (!(this.rawBody instanceof FormData)) {
      this.rawBody = new FormData()
    }

    if (typeof nameOrMap === 'object') {
      return Object.keys(nameOrMap)
        .reduce((acc: FluentRequest, key: string) => {
          return acc.setField(key, nameOrMap[key])
        }, this)
    }

    if (Array.isArray(val)) {
      return val.reduce((acc: FluentRequest, item: FormField) => {
        return acc.setField(nameOrMap, item)
      }, this)
    }

    if (val === undefined) {
      throw new TypeError(`Must supply a value to append for field ${nameOrMap}.`)
    }

    if (typeof val === 'boolean') {
      val = val.toString()
    }

    this.rawBody.append(nameOrMap, val)
    return this
  }

  /**
   * Attach some chunk or stream of data as the request body as {@link FormData}.
   *
   * @param name
   * @param data
   * @param options
   */
  addAttachment(
    name: string,
    data: Blob | Buffer | ReadStream,
    options: FormAttachOptions | string = {},
  ): FluentRequest {
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

  /**
   * Attach or merge data to the request's body.
   *
   * @param data
   */
  addData(data: string | object | FormData | URLSearchParams): FluentRequest {
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

  /**
   * Promise-compatible method that can be `await`-ed!
   *
   * @param resolve
   * @param reject
   */
  async then<TResult1 = Response, TResult2 = never>(
    resolve?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null)
    : Promise<TResult1 | TResult2> {
    let res
    try {
      res = await FluentRequest.invoke(this)
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
}
