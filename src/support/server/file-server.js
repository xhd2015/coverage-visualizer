const express = require("express");
const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 8000;

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// options
app.options("/", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
});
app.get("/ping", function (req, res, next) {
  res.json({ data: "pong" });
});

function createMatcherExcluder(match, exclude) {
  let excludeRegex;
  let matchRegex;
  if (exclude) {
    excludeRegex = new RegExp(exclude);
  }
  if (match) {
    matchRegex = new RegExp(match);
  }
  return function (s) {
    if (excludeRegex && excludeRegex.exec(s)) {
      return false;
    }
    if (matchRegex && !matchRegex.exec(s)) {
      return false;
    }
    return true;
  };
}

async function listAllFile(root, opts) {
  let {
    maxDepth,
    match,
    exclude,
    matchDir,
    excludeDir,
    matchFileName,
    excludeFileName,
  } = opts || {};
  const dirMatch = createMatcherExcluder(matchDir, excludeDir);
  const pathMatch = createMatcherExcluder(match, exclude);
  const fileNameMatch = createMatcherExcluder(matchFileName, excludeFileName);
  if (maxDepth === null || maxDepth === undefined) {
    maxDepth = 3;
  }

  let task = 0;
  async function doList(res, dir, depth) {
    try {
      task++;

      if (!dirMatch(dir)) {
        return;
      }
      if (maxDepth > 0 && depth > maxDepth) {
        // console.log("depth>maxDepth:", depth, maxDepth);
        return;
      }
      const files = await fs.readdir(dir);
      const actions = files.map(async (file) => {
        let filePath = path.join(dir, file);
        const stat = await fs.stat(filePath).catch((e) => {
          /*ignore*/
        });
        if (!stat) {
          return;
        }
        if (stat.isFile()) {
          if (filePath.startsWith(root)) {
            filePath = filePath.slice(root.length);
          }
          if (filePath.startsWith("/")) {
            filePath = filePath.slice(1);
          }
          if (!pathMatch(filePath) || !fileNameMatch(file)) {
            return;
          }
          res.push(filePath);
          return;
        }
        if (stat.isDirectory()) {
          await doList(res, filePath, depth + 1);
        }
      });
      await Promise.all(actions);
    } finally {
      task--;
    }
  }
  root = path.resolve(root);
  const res = [];
  await doList(res, root, 1);
  return res;
}

app.get("/api/listAllFile", function (req, res, next) {
  console.log("listAllFile:", req.query);
  const {
    dir,
    maxDepth,
    match,
    exclude,
    matchDir,
    excludeDir,
    matchFileName,
    excludeFileName,
  } = req.query;
  if (!dir) {
    throw "requires dir";
  }

  listAllFile(dir, {
    maxDepth,
    match,
    exclude,
    matchDir,
    excludeDir,
    matchFileName,
    excludeFileName,
  })
    .then((data) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.json({ data });
    })
    .catch(next);
});

async function getFileDetail(dir, file) {
  const fullFile = path.join(dir, file);
  return await fs.readFile(fullFile, { encoding: "utf-8" });
}
app.get("/api/getFileDetail", function (req, res, next) {
  console.log("getFileDetail:", req.query);
  const { dir, file } = req.query;
  if (!dir) {
    throw "requires dir";
  }
  if (!file) {
    throw "requires file";
  }
  getFileDetail(dir, file)
    .then((data) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "*");
      res.json({ data });
    })
    .catch(next);
});

// cros
app.use(function (err, req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
});
// err handler
app.use(function (err, req, res, next) {
  console.error("request err:", req.url, err.stack);
  res.status(500);
  res.setHeader("Content-Type", "text/plain");
  res.send(err.message);
});
server.listen(port, () => {
  console.log(`app listening at http://localhost:${port}`);
});
