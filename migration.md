# Migrations from the SuperAgent API


## `timeout`
`node-fetch` uses the `timeout` property.
* `.timeout(n)` becomes `.setTimeout(n)`
* Only response timeouts are supported.

## `auth`
Version of `node-fetch` that `isomorphic-fetch` uses populates the `Request.auth` property.
* `.auth(...)` becomes `.setAuth(...)`
* `auto` mode is not supported by `fetch` ([see this issue](https://github.com/whatwg/fetch/issues/26))

## `options`
* only supported on node, browsers don't handle it well
