

// provide basic shell capabilities
import * as child_process from "child_process"

export async function output(cmd: string, args: string[], options?: child_process.SpawnOptionsWithoutStdio): Promise<string> {
    let c = child_process.spawn(cmd, args, options)

    const bufs: Buffer[] = []
    const errBuf: Buffer[] = []

    c.stdout.on('data', (chunk: Buffer) => {
        bufs.push(chunk)
    })
    c.stderr.on('data', (chunk: Buffer) => {
        errBuf.push(chunk)
    })

    return await new Promise(function (resolve, reject) {
        c.on("exit", (code) => {
            if (code === 0) {
                resolve(Buffer.concat(bufs).toString());
                return;
            }
            const errMsg = Buffer.concat(errBuf).toString()
            reject(new Error(`exit: ${code}\n${errMsg}`));
        });
    })
}

export async function run(cmd: string, args: string[], options?: child_process.SpawnOptionsWithoutStdio) {
    let c = child_process.spawn(cmd, args, options)

    c.stdout.pipe(process.stdout)
    c.stderr.pipe(process.stderr)

    return await new Promise(function (resolve, reject) {
        c.on("exit", (code) => {
            if (code === 0) {
                resolve(undefined);
                return;
            }
            reject(new Error(`exit: ${code}`));
        });
    })
}