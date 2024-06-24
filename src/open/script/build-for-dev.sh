#!/usr/bin/env bash
set -eo pipefail

(
    npm run serve-open
) &
pid=$?

trap 'kill -9 $pid' EXIT

rm -rf src/open/build
npx webpack --config src/open/webpack.config.web.js --watch --progress --mode=development