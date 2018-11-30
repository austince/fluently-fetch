export default typeof btoa !== 'undefined' ? string => btoa(string) : input => Buffer.from(input).toString('base64')
