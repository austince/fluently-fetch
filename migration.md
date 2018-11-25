# Migrations from the SuperAgent API


## `#timeout`
`node-fetch` uses the `timeout` property.
* `.timeout(n)` becomes `.setTimeout(n)`
* Only response timeouts are supported.

## `auth`
Version of `node-fetch` that `isomorphic-fetch` uses populates the `Request.auth` property.
* `.auth(...)` becomes `.setAuth(...)`

