interface URLSearchParamsType {
  prototype: URLSearchParams;
  new(init?: string[][] | Record<string, string> | string | URLSearchParams): URLSearchParams;
}

let URLSearchParamsConstructor: URLSearchParamsType // tslint:disable-line:variable-name

// @ts-ignore
if (process.browser) {
  URLSearchParamsConstructor = URLSearchParams
} else {
  // Node
  ({ URLSearchParams: URLSearchParamsConstructor } = require('url'))
}

export default URLSearchParamsConstructor
