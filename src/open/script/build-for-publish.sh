#!/usr/bin/env bash
set -eo pipefail

rm -rf src/open/build
npx webpack --config src/open/webpack.config.web.js --progress --mode=production

rm -rf src/open/npm-publish

mkdir -p src/open/npm-publish

# NOTE: should update version
rm -rf src/open/npm-publish
mv src/open/build src/open/npm-publish
rm src/open/npm-publish/*.LICENSE.txt

node -e 'require("./src/open/mk-webpack.config.js").makePackageJSON("src/open/npm-publish/package.json")'