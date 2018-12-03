let URLSearchParamsConstructor // tslint:disable-line:variable-name
if (typeof URLSearchParams === 'undefined') {
  // Node
  ({ URLSearchParams: URLSearchParamsConstructor } = require('url'))
} else {
  URLSearchParamsConstructor = URLSearchParams
}

export default URLSearchParamsConstructor
