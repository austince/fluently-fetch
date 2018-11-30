import { HttpApp } from '../../src/FluentRequest'

export default async (): Promise<string|HttpApp> => {
  if (typeof window !== 'undefined') {
    return 'http://localhost:5000'
  }
  const { default: app } = await import('./node/server')
  return app
}
