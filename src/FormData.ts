let FormDataConstructor // tslint:disable-line:variable-name
if (typeof FormData === 'undefined') {
  // Node
  FormDataConstructor = require('form-data')
} else {
  FormDataConstructor = FormData
}

export default FormDataConstructor
