export default typeof btoa !== 'undefined' ? btoa : input => Buffer.from(input).toString('base64')
