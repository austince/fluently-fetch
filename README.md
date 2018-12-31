# Fluently Fetch
[![Build Status](https://travis-ci.com/austince/fluently-fetch.svg?branch=master)](https://travis-ci.com/austince/fluently-fetch)
[![npm](https://img.shields.io/npm/v/fluently-fetch.svg)](https://www.npmjs.com/package/fluently-fetch)
[![node](https://img.shields.io/node/v/fluently-fetch.svg)](https://www.npmjs.com/package/fluently-fetch)
[![NpmLicense](https://img.shields.io/npm/l/fluently-fetch.svg)](https://choosealicense.com/licenses/mit/)
[![codecov](https://codecov.io/gh/austince/fluently-fetch/branch/master/graph/badge.svg)](https://codecov.io/gh/austince/fluently-fetch)

A Fluent library for all your Fetch needs.

Small library, very few dependencies! 

## Use in the browser
The lib is distributed using the `ES` module format. The main entrypoint is exposed through a `default` export.

## Caveats

Sending `FormData` on Node currently cannot merge multiple `FormData` objects (and will instead throw an error),
as the [`form-data`](https://npmjs.com/package/form-data) is not [nearly isomorphic](https://github.com/form-data/form-data/issues/124) enough to make the merging-of-bodies implementation clean.
