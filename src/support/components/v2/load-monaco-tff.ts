
// run exactly once
function loadMonacoTff() {
    let pubPath = process.env.MONACO_PUBLIC_PATH || ''
    if (pubPath.endsWith("/")) {
        pubPath = pubPath.slice(0, pubPath.length - 1)
    }
    // runtime import
    const dynStyle = document.createElement("style")
    dynStyle.textContent = `@font-face {
            font-family: "codicon";
            src: url("${pubPath}/monaco-code-icons.tff");
          }`
    document.body.appendChild(dynStyle)
}
loadMonacoTff()