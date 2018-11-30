import * as http from 'http'
import server from './server'

const port: string = process.env.PORT || '5000'

http.createServer(server)
  .listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
