import * as path from 'path'
import * as fs from 'fs'
import * as express from 'express'
import * as HttpStatus from 'http-status-codes'
import * as bodyParser from 'body-parser'
import * as basicAuth from 'basic-auth'
import * as morgan from 'morgan'
import * as cors from 'cors'
import { Fields, Files, File, IncomingForm } from 'formidable'
import { HttpApp } from '../../../src/util/start-server'

const PUBLIC_DIR = path.join(__dirname, 'public')
const UPLOAD_DIR = path.join(__dirname, 'tmp')

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR)
}

const app = express()
const router = express.Router()

router.use('/static', express.static(PUBLIC_DIR))

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

router.all('/echo-form', (req, res) => {
  const form = new IncomingForm()
  form.uploadDir = UPLOAD_DIR
  form.keepExtensions = true
  form.multiples = true

  const parsedFields = {}
  // Parse name[] array type fields
  // https://github.com/felixge/node-formidable/issues/483
  form.on('field', (name, value) => {
    if (name in parsedFields) {
      if (Array.isArray(parsedFields[name])) {
        parsedFields[name].push(value);
      } else {
        parsedFields[name] = [parsedFields[name], value];
      }
    } else {
      parsedFields[name] = value;
    }
  })

  form.on('error', (err) => {
    console.error(err)
  })

  form.parse(req, (err: Error, fields: Fields, files: Files) => {
    if (err) {
      console.error(err)
      res.status(HttpStatus.INTERNAL_SERVER_ERROR)
      res.json({ error: err })
    } else {
      let fileDescriptions;
      if (Array.isArray(files)) {
        fileDescriptions = (files as File[]).map(file => file.toJSON())
      } else {
        fileDescriptions = Object.keys(files)
          .map(field => Object.assign({}, { field }, files[field].toJSON()))
      }

      // Remove all the files
      fileDescriptions.forEach(({ path }) => {
        fs.unlinkSync(path)
      })

      res.json({
        headers: req.headers,
        body: parsedFields,
        files: fileDescriptions,
        method: req.method,
        url: req.originalUrl,
        query: req.query,
      })
    }
  })
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
