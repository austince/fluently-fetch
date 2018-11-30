import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as bodyParser from 'body-parser'
import * as basicAuth from 'basic-auth'
import * as morgan from 'morgan'
import * as cors from 'cors'
import { HttpApp } from '../../../src/FluentRequest'

const app = express()
const router = express.Router()

router.all('/delay/:amount', (req, res) => {
  const amount = Number(req.params.amount)
  setTimeout(() => {
    res.sendStatus(HttpStatus.OK)
  }, amount)
})

router.all('/status/:statusCode', (req, res) => {
  res.sendStatus(Number(req.params.statusCode))
})

router.all('/error', (req, res) => {
  res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR)
})

router.all('/auth/:username/:password', (req, res) => {
  const creds = basicAuth(req)
  if (!creds) {
    res.sendStatus(HttpStatus.UNAUTHORIZED)
  } else if (creds.name !== req.params.username || creds.pass !== req.params.password) {
    res.sendStatus(HttpStatus.FORBIDDEN)
  } else {
    res.sendStatus(HttpStatus.OK)
  }
})

router.all('/echo',
  bodyParser.urlencoded({ extended: true }),
  bodyParser.json(),
  (req, res) => {
    res.json({
      headers: req.headers,
      body: req.body,
      method: req.method,
      url: req.originalUrl,
      query: req.query,
    })
  })

app.use(cors())
app.use(morgan('dev'))
app.use(router)

export default app as HttpApp
export { router }
