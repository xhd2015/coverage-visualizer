import React from "react";
import {
  MonacoTree,
  TreeDnD,
  FileTemplate,
} from "../monaco-tree";
import MonacoEditor from "react-monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { FileDetailGetter, FileTree, ITreeNode, PathDecoration } from "../support/file";
import { Button } from "./coverage-basic/Button"
import { Select } from "./coverage-basic/Select";
import { Input } from "./coverage-basic/Input";
import { Color } from "../support/decoration";
import { Checkbox } from "./coverage-basic/Checkbox"
import { renderCover, renderPathDecoration } from "../support/coverage";

interface IProps {
  fileList: FileTree
  fileDetailGetter: FileDetailGetter
}

interface IState {
  rootDir: ITreeNode,
  treeConfig: any,
  activeFile: string,
  label?: string
  labels: string[]
  rootDecoration?: PathDecoration

  showPlayer: boolean
}

interface FileModels {
  [key: string]: FileOptions
}
interface FileOptions {
  content?: string
  model: monaco.editor.ITextModel
  options: monaco.editor.IEditorOptions & monaco.editor.IGlobalEditorOptions
  decorations?: monaco.editor.IModelDeltaDecoration[]
  // memo

  decorationsRes?: monaco.editor.IEditorDecorationsCollection

  exists: boolean
}

export default class CoverageVisualizer extends React.Component<IProps, IState> {
  editorWrapper: MonacoEditor;
  lastClickedTime: number;
  lastClickedFile: any;

  fileModels: FileModels;

  constructor(props: IProps) {
    super(props);

    this.state = {
      rootDir: null,
      treeConfig: null,
      activeFile: "",
      label: "",
      labels: [],
      showPlayer: false,
    };
    this.editorWrapper = null;
    this.fileModels = {};
    (window as any).setLabel = (label) => {
      this.setState({ label })
    }
  }


  componentDidMount() {
    const _this: CoverageVisualizer = this
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
            // options
            async render(target, file) {

              const decoration = await _this.props.fileList.getPathDecorations(file.path)
              console.log("render file:", file, decoration)

              const { color, ratioText } = renderPathDecoration(decoration, 0.5)
              if (ratioText) {
                target.label.innerHTML = `<div>${file.name} <span style="color: ${color}"><small>${ratioText}</samll></span><div>`;
              } else {
                target.label.innerHTML = `<div>${file.name}<div>`;
              }
              target.monacoIconLabel.title = file.path;
            },
          });
        },
        renderElement: function (tree, element, templateId, templateData) {
          templateData.set(element);
        },
        disposeTemplate: function (tree, templateId, templateData) {
          console.log("dispose:", templateData)
          // FileTemplate.dispose();
        },
      },

      //tree config requires a controller property but we would defer its initialisation
      //to be done by the MonacoTree component
      //controller: createController(this, this.getActions.bind(this), true),
      dnd: new TreeDnD(),
    };

    this.setState({ treeConfig: treeConfig })
    this.reloadAndRefresh()
  }

  get editor(): monaco.editor.IStandaloneCodeEditor {
    return this.editorWrapper.editor;
  }

  async reloadAndRefresh() {
    await this.props.fileList.reload()
    await this.refresh()
  }

  async refresh() {
    await this.props.fileList.refresh(this.state.label)
    const root = await this.props.fileList.getRoot()
    console.log("get root:", root)
    this.setState({
      rootDir: root,
      labels: await this.props.fileList.getLabels(),
      rootDecoration: await this.props.fileList.getPathDecorations(""),
    })

  }
  async componentDidUpdate(prevProps, prevStates) {
    if (this.state.label !== prevStates.label) {
      await this.refresh()
    }

    // update content
    if (this.state.activeFile != prevStates.activeFile || this.state.label !== prevStates.label) {
      console.log("activeFile or label change")
      const activeFile = this.state.activeFile;
      let modelOpts = this.fileModels[activeFile];
      if (!modelOpts) {
        const fd = await this.props.fileDetailGetter.getDetail(activeFile)
        if (!fd) {
          modelOpts = {
            model: monaco.editor.createModel(
              `cannot show content for ${activeFile}`,
              "plaintext",
              monaco.Uri.file(activeFile)
            ),
            options: {
              readOnly: true,
            },
            exists: false
          };
        } else {
          console.log("creating model:", activeFile)
          modelOpts = {
            model: monaco.editor.createModel(
              fd.content,
              fd.language,
              monaco.Uri.file(activeFile)
            ),
            options: {
              readOnly: true,
            },
            exists: true,
          };
        }
        this.fileModels[activeFile] = modelOpts;
      }
      if (modelOpts.exists) {
        modelOpts.decorations = (this.props.fileList.getFileDecorations && await this.props.fileList.getFileDecorations(activeFile))
      }
      console.log("model:", modelOpts);
      this.editor.setModel(modelOpts.model);
      this.editor.updateOptions(modelOpts.options);
      modelOpts.decorationsRes?.clear?.()
      modelOpts.decorationsRes = this.editor.createDecorationsCollection(modelOpts.decorations);
    }
  }

  onClickFile(file) {
    if (file.isDirectory) {
      return;
    }

    const names = []
    let p = file
    while (p.parent) { // ignore root
      names.push(p.name)
      p = p.parent
    }
    this.setState({ activeFile: names.reverse().join("/") });

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
    const { color, ratioText } = renderPathDecoration(this.state.rootDecoration, 0.5)

    return <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div>
        <div
          style={{ color: "black", display: "flex", alignItems: "center" }}
        >
          <span>Label:</span>
          <Select options={this.state.labels} onChange={e => this.setState({ label: e })}></Select>

          <Checkbox label="Show Player" value={this.state.showPlayer} onChange={e => this.setState({ showPlayer: e })}></Checkbox>
          <Button label="Refresh Coverage" onClick={() => this.reloadAndRefresh()}></Button>
        </div>
        <div style={{ color: "black" }}>
          <span>Coverage:
            {
              ratioText ? <span style={{ color }}>{ratioText}</span> : <span>N/A</span>
            }
          </span>
        </div>

        <hr style={{ width: "100%", margin: "1px" }} />
        {
          <div style={{ color: "black", margin: "1px" }}>
            <span>
              Actions
            </span>
            <div>

              <div style={{ paddingLeft: "10px" }}>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <Button label="Request"></Button>
                  <textarea style={{ width: "100%" }} value='{"label":"rc","fn"}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                  <textarea style={{ width: "100%" }} value='{"label":"rc","fn"}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                </div>
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <Button label="Analyse"></Button>
                  <textarea style={{ width: "100%" }} value='{"keywords":"rc","funcs":[]}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                  <textarea style={{ width: "100%" }} value='{"label":"rc","fn"}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                </div>

                <div style={{ display: "flex", flexDirection: "row" }}>
                  <Button style={{ flexGrow: 2 }} label="Check Task"></Button>
                  <textarea style={{ flexGrow: 10 }} value='{"keywords":"rc","funcs":[]}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                  <textarea style={{ flexGrow: 4 }} value='{"label":"rc","fn"}' onChange={e => console.log("text change:", e.target.value)}></textarea>
                </div>
              </div>
              <hr style={{ width: "100%", margin: "1px" }} />
            </div>
          </div>
        }
      </div>
      <div
        style={{ display: "flex", flexGrow: "1" }}>
        <div
          className="show-file-icons show-folder-icons"
          style={{
            width: "300px",
            height: "100%",
          }}
        >
          <div className="workspaceContainer" >
            {!this.state.rootDir ? null : (
              <MonacoTree
                directory={this.state.rootDir}
                treeConfig={this.state.treeConfig}
                onClickFile={this.onClickFile.bind(this)}
              />
            )}
          </div>
        </div>
        < MonacoEditor
          ref={(e: MonacoEditor) => {
            this.editorWrapper = e;
          }}
          onChange={this.onChange.bind(this)}
        />
      </div >
    </div >
      ;
  }
}