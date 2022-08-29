# What's this?

Provide a greatly customizable coverage visualizer.

I ever admired that code-cov or gitlab, or sonarqube had a pretty nice UI to show file coverage, comparing to the default output by `go tool cover -html=cover.out`.

But after searching github I did not find they or other persons had made a ready to use tool. And I doubt that even one is there will it suite my needs?

So I decided to make an open source coverage visualizer with highly customization and multi-language support with modern javascript techniques.

# Features

- coverage statistics, shown hierarchically
- nice decorations
- label filtering
- more...

# Get started

```bash
# clone this repo
git clone https://github.com/xhd2015/coverage-visualizer
cd coverage-visualizer

# run npm intall, add --force if failed.
npm install
npm run build

# open another terminal, serve at http://localhost:8000
npx http-server --port 8000

# open dist/editor-basic-self-contained.html
open http://localhost:8000/dist/editor-basic-self-contained.html
```

Output:
![coverage](doc/img/coverage.jpg)

# What's bebind this?

Behind this repository are monaco-editor,and code directly imported from [monaco-tree](https://github.com/BlueMagnificent/monaco-tree).

Check [documentation](./doc/) for more details.

# Work in progress

Work still in progress, currently the default golang coverage visualizer is implemented.
