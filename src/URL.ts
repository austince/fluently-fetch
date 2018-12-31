interface URLConstructorType {
  prototype: URL;
  new(url: string, base?: string | URL): URL;
  createObjectURL(object: any): string;
  revokeObjectURL(url: string): void;
}

let URLConstructor: URLConstructorType // tslint:disable-line:variable-name
// @ts-ignore
if (process.browser) {
  URLConstructor = URL
} else {
  // Node
  ({ URL: URLConstructor } = require('url'))
}

export default URLConstructor
