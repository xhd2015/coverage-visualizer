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
import MonacoEditor, { monaco } from "react-monaco-editor";

const rootDirectoryName = "demo";

export default class Viewer extends React.Component {
  constructor(props) {
    super(props);
    this.rootDirectoryName = "demo";

    this.state = {
      rootNode: null,
      treeConfig: null,
      activeFile: "",
    };
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
          return new FileTemplate(container);
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
      rootNode: generateDirectoryTree(directoryListing, rootDirectoryName),
      treeConfig: treeConfig,
    });
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

  render() {
    const { activeFile } = this.state;
    return (
      <div style={{ display: "flex", height: "100%" }}>
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
          <div className="workspaceContainer">
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
        <MonacoEditor
          language="javascript"
          value={
            activeFile === "debug.js"
              ? "hello debug.js"
              : "console.log('hello')"
          }
          options={{}}
          // onChange={::this.onChange}
          // editorDidMount={::this.editorDidMount}
        />
      </div>
    );
  }
}
