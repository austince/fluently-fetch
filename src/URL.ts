let URLConstructor // tslint:disable-line:variable-name
if (typeof URL === 'undefined') {
  // Node
  ({ URL: URLConstructor } = require('url'))
} else {
  URLConstructor = URL
}

export default URLConstructor;
