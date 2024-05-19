# Usage
Build
```sh
npx webpack --watch --config src/open/webpack.config.js --progress --mode=development
```

Serve file:
```sh
npm install -g http-server
http-server -c-1 ./
```

Open file:
```sh
open http://localhost:8080/demo.html
```

# Why built size has 7MB?
All css and resource are bundled together.

# Publish
```
./src/open/script/build-for-publish.sh

# update version in src/open/npm-publish/package.json
(
    cd src/open/npm-publish
    npm publish
)
```