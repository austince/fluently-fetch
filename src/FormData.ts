interface FormDataConstructorType {
  prototype: FormData;
  new(form?: HTMLFormElement): FormData;
}

let FormDataConstructor: FormDataConstructorType // tslint:disable-line:variable-name
// @ts-ignore
if (process.browser) {
  FormDataConstructor = FormData
} else {
  // Node
  FormDataConstructor = require('form-data')
}

export default FormDataConstructor
