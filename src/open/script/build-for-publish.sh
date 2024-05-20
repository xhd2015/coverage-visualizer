#!/usr/bin/env bash
set -eo pipefail

npx webpack --config src/open/webpack.config.web.js --progress --mode=production

rm -rf src/open/npm-publish

mkdir -p src/open/npm-publish

# NOTE: should update version
cp src/open/package-publish.json src/open/npm-publish/package.json

cp src/open/build/open-web.js src/open/npm-publish/index.js
# worker.js by monaco editor
# cp src/open/build/*.worker.js src/open/npm-publish/