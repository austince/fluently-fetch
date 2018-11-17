import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as bodyParser from 'body-parser'

const app = express()
app.all('/delay/:amount', (req, res) => {
  const amount = Number(req.params.amount)
  setTimeout(() => {
    res.sendStatus(HttpStatus.OK)
  }, amount)
})

app.all('/echo', bodyParser.json(), (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.originalUrl,
  })
})

app.all('/error', (req, res) => {
  throw new Error('Error requested')
})

export default app
