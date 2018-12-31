export default function base64Encode(str: string) {
  // @ts-ignore
  if (process.browser) {
    return btoa(str);
  } else { // tslint:disable-line:no-else-after-return
    return Buffer.from(str, 'binary').toString('base64');
  }
}
