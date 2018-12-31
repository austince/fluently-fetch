import 'isomorphic-fetch'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import * as sinonChai from 'sinon-chai'
import chaiHttp = require('chai-http')

chai.use(chaiHttp)
chai.use(chaiAsPromised)
chai.use(sinonChai)
