#!/usr/bin/env bun

// bun shell doc: https://bun.sh/blog/the-bun-shell

// serve test html: 
//  bun install -g http-server
//  http-server -c-1 src/list/    # -c-1 disable cache
import * as fs from "fs/promises"
import * as path from "path"
import { output, run as runCmd } from "./shell"


// argv0: bun
// argv1: build-file.ts

const args = process.argv.slice(2)

async function patchJSX(file: string, watch: boolean, jsxPatch: boolean | undefined) {
    // console.log("file:", file)
    let matchSuffix = ""
    let needPatchJSX = false
    if (file.endsWith(".tsx")) {
        matchSuffix = ".tsx"
        needPatchJSX = true
    } else if (file.endsWith(".jsx")) {
        matchSuffix = ".jsx"
        needPatchJSX = true
    } else if (file.endsWith(".ts")) {
        matchSuffix = ".ts"
    }
    if (!matchSuffix) {
        return
    }

    if (jsxPatch != null) {
        needPatchJSX = jsxPatch
    }

    const nameNoSuffix = file.slice(0, file.length - matchSuffix.length)

    const targetFile = nameNoSuffix + ".js"

    // build for the first time
    await buildFile(file, targetFile, needPatchJSX)
    if (!watch) {
        return
    }

    const tmpDir = await fs.mkdtemp("/tmp/bun-watch")
    const tmpBuiltFile = path.join(tmpDir, "tmp-build.js")
    await fs.writeFile(tmpBuiltFile, "")

    runCmd("bun", getBuildCommand(file, true, tmpBuiltFile, needPatchJSX))

    // watch mode
    const watcher = fs.watch(tmpBuiltFile)
    for await (const event of watcher) {
        console.log(`rebuilding ${file}...`)
        let data = await fs.readFile(tmpBuiltFile, { encoding: 'utf-8' })
        if (needPatchJSX) {
            data = patch(targetFile, data)
        }
        await fs.writeFile(targetFile, data)
    }
}

async function buildFile(srcFile: string, targetFile: string, patchJSX: boolean) {
    let data = await output("bun", getBuildCommand(srcFile, false, "", patchJSX))
    // buggy
    // const buildCmd = await $`bun build --target browser --external react/jsx-dev-runtime ${file}`
    // console.log("fine?")
    // const data = buildCmd.text()

    // console.log("data:", data)
    if (patchJSX) {
        data = patch(targetFile, data)
    }
    await fs.writeFile(targetFile, data)
}

function getBuildCommand(file: string, watch: boolean, targetFile: string, patchJSX: boolean): string[] {
    const args = ["build", "--target", "browser"]
    if (watch) {
        args.push("--watch")
    }
    if (targetFile) {
        args.push("--outfile", targetFile)
    }
    if (patchJSX) {
        args.push("--external", "react/jsx-dev-runtime")
    }
    args.push(file)
    return args
}

function patch(targetFile: string, content: string): string {
    const jsxPath = path.join(__dirname, "jsx.js")
    let relPath = path.relative(path.dirname(targetFile), jsxPath)
    if (!relPath.startsWith(".")) {
        relPath = "./" + relPath
    }
    console.log("relPath:", relPath, jsxPath, targetFile)
    return content.replaceAll('from "react/jsx-dev-runtime"', `from "${relPath}"`)
}

async function run() {
    let watch = false
    let jsxPatch = false
    const n = args.length
    const remainArgs = []
    for (let i = 0; i < n; i++) {
        const arg = args[i]
        if (arg == "--watch") {
            watch = true
            continue
        }
        if (arg === "--jsx-patch") {
            jsxPatch = true
            continue
        }
        if (arg === "--no-jsx-patch") {
            jsxPatch = false
            continue
        }
        if (!arg.startsWith("-")) {
            remainArgs.push(arg)
            continue
        }
        throw new Error(`unrecognized flag: ${arg}`)
    }
    if (remainArgs.length === 0) {
        throw new Error("requires files")
    }
    // dedup
    const fileSet = new Set(remainArgs)
    const files = []
    fileSet.forEach(e => files.push(e))

    const actions: Promise<void>[] = []
    for (let file of files) {
        const action = patchJSX(file, watch, jsxPatch)
        actions.push(action)
    }
    await Promise.all(actions)
}

run().catch(e => {
    console.error(e.message)
    process.exit(1)
})
