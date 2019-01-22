# Basic Request

The easiest entrypoint is through the default export, which
exposes methods for common HTTP requests and follows a similar API to `fetch`.

```typescript
import * as fluentlyFetch from 'fluently-fetch'

const res = await fluentlyFetch.get('http://example.com/someJson')
const data = await res.json()
// use the data!
```

The underlying `FluentRequest` is also accessible, making it easy to use
with existing `Request`s.

```typescript
import { FluentRequest } from 'fluently-fetch'
const req = new Request('https://www.mozilla.org/')
// Ok, but now we'd like to change some things, like add a header
const fluentReq = new FluentRequest(req)
                        .get('/someJson')
                        .setAccept('json')
const res = await fluentReq
const data = await res.json()
// ...
```

`FluentRequest`s are `PromiseLike` and can be `.then` / `await`-ed, which
triggers sending the actual request.
