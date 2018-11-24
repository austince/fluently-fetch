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

app.all('/echo', bodyParser.urlencoded({ extended: true }), bodyParser.json(), (req, res) => {
  res.json({
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.originalUrl,
  })
})

app.all('/status/:statusCode', (req, res) => {
  res.sendStatus(Number(req.params.statusCode))
})

app.all('/error', (req, res) => {
  res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR)
})

export default app
