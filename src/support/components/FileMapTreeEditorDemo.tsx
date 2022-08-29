import React from "react";
import {
  MonacoTree,
  TreeDnD,
  generateDirectoryTree,
  FileTemplate,
  directoryListing,
  Action,
  Separator,
} from "../monaco-tree";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

const rootDirectoryName = "demo";

// create classes dynamically
function createClass(name: string, rules: any) {
  var style = document.createElement("style");
  document.getElementsByTagName("head")[0].appendChild(style);
  if (style.sheet?.insertRule) {
    style.sheet.insertRule(name + "{" + rules + "}", 0);
  } else if (style.sheet?.addRule) {
    style.sheet.addRule(name, rules);
  } else {
    throw `cannot create class:${name}`
  }
}


function createDecoration(startLine, endLine, color: Color) {
  const colorName = Object.keys(Color).filter(k => Color[k] === color)[0]
  return {
    range: new monaco.Range(startLine, 1, endLine, Number.MAX_SAFE_INTEGER),
    options: {
      className: colorName,
      zIndex: 3,
      overviewRuler: {
        color: color,
        position: 1,
      },
      minimap: { color: color, position: 1 },
    },
  };
}


enum Color {
  MISSING = "#ffccc7",
  CHANGED = "#ffe7ba",
  EXCLUDED = "#d9f7be",
  CALLEE_COLOR = "#bae7ff",
  C_COLOR = "#fff566",
  UNCOVER_CHANGED = "#ff85c0",
  KEY = "#f0f0f0",
}

console.log("colors:", Object.keys(Color), Color)

const extraFiles = ["main.go"];
const fileInfoMap = {
  "debug.js": {
    content: `console.log("hello world")`,
  },
  "main.go": {
    content: `package main

func main(){
  
}`,
    decorations: [createDecoration(1, 2, Color.CHANGED)],
  },
  "license.txt": {
    content: "ahah, ok",
  },
  "package.json": {
    content: `{
    "hello":"world"
}`,
    // language: "json"
  }
};
const editModelOptsMap: { [key: string]: any } = {};
let initDone = false
function init() {
  initDone = true
  Object.keys(Color).forEach((k) => {
    createClass("." + k, `background-color: ${Color[k]};`);
  });
  Object.keys(fileInfoMap).forEach((k) => {
    editModelOptsMap[k] = {
      ...fileInfoMap[k],
      model: monaco.editor.createModel(
        fileInfoMap[k].content,
        fileInfoMap[k].language,
        monaco.Uri.file(k)
      ),
      options: {
        readOnly: false,
        ...fileInfoMap[k].options,
      },
    };
  });
}

interface IProps {
}

interface IState {
  rootNode: any,
  treeConfig: any,
  activeFile: string,
}


export default class Viewer extends React.Component<IProps, IState> {
  rootDirectoryName: string;
  editorWrapper: any;
  lastClickedTime: number;
  lastClickedFile: any;

  constructor(props: any) {
    super(props);
    this.rootDirectoryName = "demo";

    init()

    this.state = {
      rootNode: null,
      treeConfig: null,
      activeFile: "",
    };
    this.editorWrapper = null;
  }

  componentDidMount() {
    const treeConfig = {
      dataSource: {
        /**
         * Returns the unique identifier of the given element.
         * No more than one element may use a given identifier.
         */
        getId: function (tree, element) {
          return element.key;
        },

        /**
         * Returns a boolean value indicating whether the element has children.
         */
        hasChildren: function (tree, element) {
          return element.isDirectory;
        },

        /**
         * Returns the element's children as an array in a promise.
         */
        getChildren: function (tree, element) {
          return Promise.resolve(element.children);
        },

        /**
         * Returns the element's parent in a promise.
         */
        getParent: function (tree, element) {
          return Promise.resolve(element.parent);
        },
      },
      renderer: {
        getHeight: function (tree, element) {
          return 24;
        },
        renderTemplate: function (tree, templateId, container) {
          return new FileTemplate(container, {
            render: (target, file) => {
              target.label.innerHTML = `<div>${file.name} <span style="color: green"><small>${file.path.length}%</samll></span><div>`;
              target.monacoIconLabel.title = file.path;
            },
          });
        },
        renderElement: function (tree, element, templateId, templateData) {
          templateData.set(element);
        },
        disposeTemplate: function (tree, templateId, templateData) {
          FileTemplate.dispose();
        },
      },

      //tree config requires a controller property but we would defer its initialisation
      //to be done by the MonacoTree component
      //controller: createController(this, this.getActions.bind(this), true),
      dnd: new TreeDnD(),
    };

    this.setState({
      rootNode: generateDirectoryTree(
        [...directoryListing, ...extraFiles],
        rootDirectoryName
      ),
      treeConfig: treeConfig,
    });
  }

  get editor() {
    return this.editorWrapper.editor;
  }
  componentDidUpdate(prevProps, prevStates) {
    if (this.state.activeFile != prevStates.activeFile) {
      const activeFile = this.state.activeFile;
      let modelOpts = editModelOptsMap[activeFile];
      if (modelOpts) {
        console.log("model:", modelOpts);
        this.editor.setModel(modelOpts.model);
        this.editor.updateOptions(modelOpts.options);
        this.editor.createDecorationsCollection(modelOpts.decorations);
      } else {
        modelOpts = {
          model: (modelOpts = monaco.editor.createModel(
            `cannot show content for ${activeFile}`,
            "plaintext",
            monaco.Uri.file(activeFile)
          )),
          options: {
            readOnly: true,
          },
        };
        editModelOptsMap[activeFile] = modelOpts;

        this.editor.setModel(modelOpts.model);
        this.editor.updateOptions(modelOpts.options);
      }
    }
  }

  /**
   * Get Action
   */
  getActions(file, event) {
    const actions = [];

    // Directory options
    if (file.isDirectory) {
      actions.push(
        new Action("1", "New File", "", true, () => {
          console.log("action New File on " + file.name);
        })
      );

      //menu separator
      actions.push(new Separator());

      actions.push(
        new Action("2", "New Directory", "", true, () => {
          console.log("action New Directory on " + file.name);
        })
      );

      actions.push(
        new Action("3", "Upload Files", "", true, () => {
          console.log("action Upload Files on " + file.name);
        })
      );
    }

    actions.push(
      new Action("4", "Download", "", true, () => {
        console.log("action Download on " + file.name);
      })
    );

    actions.push(
      new Action("5", "Delete", "", true, () => {
        console.log("action Delete on " + file.name);
      })
    );

    return actions;
  }

  onClickFile(file) {
    if (file.isDirectory) {
      return;
    }

    this.setState({ activeFile: file.name });

    if (
      Date.now() - this.lastClickedTime < 500 &&
      this.lastClickedFile === file
    ) {
      this.onDoubleClickFile(file);
    } else {
      console.log(file.name + " clicked");
    }

    this.lastClickedTime = Date.now();
    this.lastClickedFile = file;
  }

  onDoubleClickFile(file) {
    console.log(file.name + " double clicked");
  }
  onChange(e) {
    const { activeFile } = this.state;
    console.log("change:", activeFile);
  }

  render() {
    const { activeFile } = this.state;
    return <div
      style={{ display: "flex", height: "100%" }}>
      <div
        //   className2="vs-dark show-file-icons show-folder-icons"
        className="show-file-icons show-folder-icons"
        style={{
          width: "300px",
          height: "100%",
          // height: "max-height",
          // position: "relative",
          // margin: "0px auto",
        }}
      >
        <div className="workspaceContainer" >
          {!this.state.rootNode ? null : (
            <MonacoTree
              directory={this.state.rootNode}
              treeConfig={this.state.treeConfig}
              getActions={this.getActions.bind(this)}
              onClickFile={this.onClickFile.bind(this)}
            />
          )}
        </div>
      </div>
      < MonacoEditor
        ref={(e) => {
          this.editorWrapper = e;
        }}
        // editorWillMount={() => {
        //   const model = contentMap[activeFile];
        //   console.log("content model:", model);
        //   if (model === null || model === undefined) {
        //   }
        //   return {
        //     readOnly: model === null || model === undefined,
        //     model,
        //   };
        // }}
        // value={
        //   model === null || model === undefined
        //     ? `No content for ${activeFile}`
        //     : model
        // }
        onChange={this.onChange.bind(this)}
      // onChange={::this.onChange}
      // editorDidMount={::this.editorDidMount}
      />
    </div >;
  }
}
