import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createController } from "./monaco-controller";
import { Tree } from "./monaco-utils";
import debounce from 'lodash.debounce';
import { MTreeNode } from "./tree-node"

export interface MonacoTreeControl {

}

export interface MonacoTreeProps {
  directory?: any
  onClickFile?: (file: MTreeNode) => void
  treeConfig?: any
  getActions?: any

  control?: MonacoTreeControl
}

export default function MonacoTree(props: MonacoTreeProps) {
  const containerRef = useRef<HTMLDivElement>()
  const treeRef = useRef<Tree>()
  const [dirVersion, setDirVersion] = useState(0)

  const openMap = useRef<{ [file: string]: boolean }>({})

  const clickFileRef = useRef<(file: any) => void>()
  clickFileRef.current = props.onClickFile

  const refreshNewTree = /*useCallback(*/() => {
    const container = containerRef.current
    if (container.lastChild) {
      container.removeChild(container.lastChild);
    }

    const { treeConfig, getActions } = props;
    treeConfig.controller = createController({ container: containerRef.current }, getActions, true);
    // console.log("new tree:", treeConfig)
    const newTree = new Tree(container, treeConfig);

    // console.log("newTree:", newTree.model.getInput())

    // expandTree(newTree, (e) => {
    //   console.log("element:", e)
    //   return true
    // })


    // newTree.expand("src")

    // install click handler for fresh tree
    newTree.model.onDidSelect((e) => {
      if (e.selection.length) {
        const file: MTreeNode = e.selection[0]
        // recording openMap
        if (file.isDirectory) {
          if (openMap.current[file.key]) {
            delete openMap.current[file.key]
          } else {
            openMap.current[file.key] = true
          }
        }
        clickFileRef.current?.(file);
      }
    });
    treeRef.current = newTree
    return newTree
  } //, [props.treeConfig, props.getActions])

  useEffect(() => {
    // console.log("on mount:", props.directory)
    // did mount
    const newTree = refreshNewTree();
    setDirVersion(dirVersion + 1)
  }, [])

  useEffect(() => {
    const newTree = refreshNewTree();
    setDirVersion(dirVersion + 1)
  }, [props.treeConfig])

  useEffect(() => {
    setDirVersion(dirVersion + 1)
  }, [props.directory])

  const updateDirDebounced = useMemo(() => debounce((dir) => {
    if (dir) {
      treeRef.current.model.setInput(dir)
      Promise.resolve(treeRef.current.model.refresh()).then(async () => {
        for (let key in openMap.current) {
          await treeRef.current.expand(key)
        }
      })
    }
  }, 600), [])

  useEffect(() => {
    // destroy
    return updateDirDebounced.cancel
  }, [])
  useEffect(() => {
    updateDirDebounced(props.directory)
  }, [dirVersion])

  return <div className="fill" ref={containerRef} />
}
export { MonacoTree }

function expandTree(tree: Tree, filter: (element: any) => boolean) {
  const model = tree.model;
  const elements = [];

  let item;
  const nav = model.getNavigator();

  console.log("nav:", nav)

  while ((item = nav.next())) {
    console.log("nav item:", item)
    if (filter && !filter(item)) {
      continue
    }
    elements.push(item);
  }

  for (let i = 0, len = elements.length; i < len; i++) {
    model.expand(elements[i]);
  }
}

class MonacoTree2 extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      directory: this.props.directory,
      onClickHandler: props.onClickFile,
    };
  }

  componentDidMount() {
    this.ensureTree();
    this.tree.model.setInput(this.props.directory);
    // TODO: may bind this.onLayout?
    // document.addEventListener("layout", this.onLayout);
  }

  componentWillUnmount() {
    // document.removeEventListener("layout", this.onLayout);
  }

  componentDidUpdate(prevProps) {
    // console.log("didUpdate:", this.props.directory);
    if (prevProps.treeConfig != this.props.treeConfig) {
      this.ensureTree();
    }
    if (
      prevProps.treeConfig != this.props.treeConfig ||
      this.props.directory != prevProps.directory
    ) {
      this.tree.model.setInput(this.props.directory);
    }
    if (
      prevProps.treeConfig != this.props.treeConfig ||
      this.props.directory != prevProps.directory ||
      this.props.onClickFile != prevProps.onClickFile
    ) {
      // update onClick
      this.setState({ ...this.state, onClickHandler: this.props.onClickFile });
    }
    this.tree.model.refresh();
    // this.tree.model.onDidSelect((e) => {
    //   if (e.selection.length) {
    //     this.props.onClickFile(e.selection[0]);
    //   }
    // });

    // if (this.state.directory !== prevProps.directory) {
    //   this.tree.model.setInput(prevProps.directory);
    //   this.setState({ directory: prevProps.directory });
    // } else {
    //   this.expandTree(this.tree);
    // }
  }

  setContainer(container) {
    if (container == null) {
      return;
    }
    this.container = container;
  }

  ensureTree() {
    if (this.container.lastChild) {
      this.container.removeChild(this.container.lastChild);
    }

    const { treeConfig, getActions } = this.props;
    treeConfig.controller = createController(this, getActions, true);
    this.tree = new Tree(this.container, treeConfig);
    // install click handler for fresh tree
    this.tree.model.onDidSelect((e) => {
      if (e.selection.length) {
        // this.props.onClickFile(e.selection[0]);
        this.state.onClickHandler?.(e.selection[0]);
      }
    });
  }

  expandTree(tree) {
    const model = tree.model;
    const elements = [];

    let item;
    const nav = model.getNavigator();

    while ((item = nav.next())) {
      elements.push(item);
    }

    for (let i = 0, len = elements.length; i < len; i++) {
      model.expand(elements[i]);
    }
  }

  onLayout() {
    this.tree.layout();
  }

  render() {
    return <div className="fill" ref={(ref) => this.setContainer(ref)
    }> </div>;
  }
}

// export { MonacoTree };
