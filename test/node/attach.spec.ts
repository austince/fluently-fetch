import * as fs from 'fs'
import * as path from 'path'
import * as chai from 'chai'
import fluentlyFetch from '../../src'
import getBaseUri from '../util/get-base-uri'

const { expect } = chai

const TEST_FILE_DIR = path.join(__dirname, '..', 'util', 'node', 'public')
const TEST_JSON_FILE_PATH = path.join(TEST_FILE_DIR, 'test-file.json')

describe('fluently-fetch attach', function () {
  this.timeout(10000)

  let uri
  before(async () => {
    uri = await getBaseUri()
  })

  it('should upload a file', async () => {
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .attach('file', fs.createReadStream(TEST_JSON_FILE_PATH))
    const { size: fileSize } = fs.statSync(TEST_JSON_FILE_PATH)

    expect(res).to.be.ok
    const { files } = await res.json()
    expect(files).to.have.lengthOf(1)
    expect(files[0].field).to.have.equal('file')
    expect(files[0].size).to.equal(fileSize)
  })

  it('should upload multiple files', async () => {
    const testFiles = [
      ['file', TEST_JSON_FILE_PATH],
      ['anothaFile', TEST_JSON_FILE_PATH],
    ]

    const req = fluentlyFetch(uri)
      .post('/echo-form')

    testFiles.forEach(([fieldName, filepath]) => {
      req.attach(fieldName, fs.createReadStream(filepath))
    })

    const res = await req

    expect(res).to.be.ok
    const { files } = await res.json()
    expect(files).to.have.lengthOf(2)
    testFiles.forEach(([fieldName, filepath]) => {
      const uploadedFile = files.find(f => f.field === fieldName)
      expect(uploadedFile).to.exist
      const { size: fileSize } = fs.statSync(filepath)
      expect(uploadedFile.size).to.equal(fileSize)
    })
  })

  it('should allow specifying a filename', async () => {
    const filename = 'upload.json'
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .attach('file', fs.createReadStream(TEST_JSON_FILE_PATH), { filename })
    const { size: fileSize } = fs.statSync(TEST_JSON_FILE_PATH)

    expect(res).to.be.ok
    const { files } = await res.json()
    expect(files).to.have.lengthOf(1)
    expect(files[0].field).to.have.equal('file')
    expect(files[0].size).to.equal(fileSize)
    expect(files[0].name).to.equal(filename)
  })

  it('should allow passing the mime type', async () => {
    const testHtmlFilePath = path.join(TEST_FILE_DIR, 'test-file.html')
    const contentType = 'text/html'
    const res = await fluentlyFetch(uri)
      .post('/echo-form')
      .attach('file', fs.createReadStream(testHtmlFilePath), { contentType })
    const { size: fileSize } = fs.statSync(testHtmlFilePath)

    expect(res).to.be.ok
    const { files } = await res.json()
    expect(files).to.have.lengthOf(1)
    expect(files[0].field).to.have.equal('file')
    expect(files[0].size).to.equal(fileSize)
    expect(files[0].type).to.equal(contentType)
  })
})
