# Demos
Build demo.js:
```sh
bun src/build/build.ts --gen-html src/demo.ts
bun src/build/build.ts --gen-html --watch src/demo.ts
```

Open demo.html
```sh
open src/demo.html
```

# Serve via http server
Serve demo.html
```sh
bun install -g http-server

# flags:
#    -c-1   no cache
http-server -c-1 src/
```

Open page:
```sh
open http://127.0.0.1:8080/demo.html
```