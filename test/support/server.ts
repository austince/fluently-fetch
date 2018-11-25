import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as bodyParser from 'body-parser'
import * as basicAuth from 'basic-auth'

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
    query: req.query,
  })
})

app.all('/status/:statusCode', (req, res) => {
  res.sendStatus(Number(req.params.statusCode))
})

app.all('/error', (req, res) => {
  res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR)
})

app.all('/auth/:username/:password', (req, res) => {
  const creds = basicAuth(req)
  if (!creds) {
    res.sendStatus(HttpStatus.UNAUTHORIZED)
  } else if (creds.name !== req.params.username || creds.pass !== req.params.password) {
    res.sendStatus(HttpStatus.FORBIDDEN)
  } else {
    res.sendStatus(HttpStatus.OK)
  }
})

export default app
