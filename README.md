# Fluently Fetch
[![codecov](https://codecov.io/gh/austince/fluently-fetch/branch/master/graph/badge.svg)](https://codecov.io/gh/austince/fluently-fetch)
[![Build Status](https://travis-ci.com/austince/fluently-fetch.svg?branch=master)](https://travis-ci.com/austince/fluently-fetch)

A Fluent library for all your Fetch needs.


## Caveats 

Sending `FormData` on Node currently cannot merge multiple `FormData` objects (and will instead throw an error),
as the [`form-data`](https://npmjs.com/package/form-data) is not [nearly isomorphic](https://github.com/form-data/form-data/issues/124) enough to make the merging-of-bodies implementation clean.
