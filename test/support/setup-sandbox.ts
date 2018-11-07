import * as sinon from 'sinon'

export default () => {
  const sandbox = sinon.createSandbox()
  afterEach(() => sandbox.restore())
  return sandbox;
}
