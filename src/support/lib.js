import TreeDemo from "./components/TreeDemo";
import TreeEditorDemo from "./components/TreeEditorDemo";
import FileMapTreeEditorDemo from "./components/FileMapTreeEditorDemo";
import CoverageVisualizer from "./components/CoverageVisualizer";
import CoverageVisualizerFilter from "./components/CoverageVisualizerFilter";
import CoverageVisualizerFilterPlayer from "./components/CoverageVisualizerFilterPlayer";
import * as file from "./support/file";
import * as coverage from "./support/coverage";

// bootstrap: The following line can be included in your src/index.js or App.js file
// import "bootstrap/dist/css/bootstrap.min.css";

import "./assets/custom.css";
import "./assets/main.css";
import "./assets/vscode-icons.css";

export * from "./monaco-tree";
export {
  TreeDemo,
  TreeEditorDemo,
  FileMapTreeEditorDemo,
  CoverageVisualizer,
  CoverageVisualizerFilter,
  CoverageVisualizerFilterPlayer,
  file,
  coverage,
};
