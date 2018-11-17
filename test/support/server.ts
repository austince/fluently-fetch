import * as express from 'express'
import * as HttpStatus from 'http-status-codes'

const app = express()
app.get('/delay/:amount', (req, res) => {
  const amount = Number(req.params.amount)
  setTimeout(() => {
    res.sendStatus(HttpStatus.OK)
  }, amount)
})

app.all('/echo', (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body,
    query: req.query,
    method: req.method,
    url: req.url,
  })
})

app.all('/error', (req, res) => {
  throw new Error('Error requested')
})

export default app
