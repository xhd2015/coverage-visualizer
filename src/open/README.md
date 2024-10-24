# Workflow
1. Development
 - command: `npm install --legacy-peer-deps`
 - command: `SERVE_PORT=8080 npm run dev-open`
 - serving files under src/open, so you can import js files via `http://localhost:8080/build/index.js`

2. Verify
 - make your index.html refer to `http://localhost:8080/build/index.js`
 - you can refer to [./demo-web.html](demo-web.html) for simple usage
 - for xgo, refer to [xgo/test-explorer/index.html](https://github.com/xhd2015/xgo/blob/master/cmd/xgo/test-explorer/index.html)

3. Build
 - Once development and verify complete, can proceed to next steps
 - Increment `version.js`
 - build: `npm run build-open`
 - this command will generate  `src/open/npm-publish` and other resources

4. Publish
 - run: `cd src/open/npm-publish && npm publish`
 - reference via: `https://cdn.jsdelivr.net/npm/xgo-explorer@0.0.13/index.js`

# Usage
Build
```sh
npx webpack --watch --config src/open/webpack.config.js --progress --mode=development
# this will 
```

Serve file:
```sh
npm install -g http-server
http-server -c-1 --port 8080 '--cors=*' ./
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

Npm: https://www.npmjs.com/package/xgo-explorer