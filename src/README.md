# Demos
Build demo.js:
```sh
bun src/build/build.ts src/demo.ts
bun src/build/build.ts --watch src/demo.ts
```

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