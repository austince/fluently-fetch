let fetchPrimitive
if (typeof fetch === 'undefined') {
  fetchPrimitive = require('isomorphic-fetch')
} else {
  fetchPrimitive = fetch
}

export default fetchPrimitive
