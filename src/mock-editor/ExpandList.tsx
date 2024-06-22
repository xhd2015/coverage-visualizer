import {
  CSSProperties,
  Key,
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DispatchUpdate,
  Item,
  ItemIndex,
  ItemPath,
  List,
  SubscribeUpdate,
} from './List';
import { useCurrent } from './react-hooks';
import { traverse } from './tree';
import { BsChevronDown, BsChevronRight } from "react-icons/bs"
import GoFile from "../support/assets/vscode-icons/file_type_go.svg"
import JSONFile from "../support/assets/vscode-icons/file_type_json.svg"
import MarkdownFile from "../support/assets/vscode-icons/file_type_markdown.svg"
import TextFile from "../support/assets/vscode-icons/file_type_text.svg"
import VsFolderOpen from "../support/assets/vscode-icons/default_folder_opened.svg"
import VsFolder from "../support/assets/vscode-icons/default_folder.svg"
import React from 'react';
import { useUpdatedEffect } from '../support/hook/useUpdatedEffect';
// problems developing a list:
//  1.List & List Item recursive
//  2.event emit and state management
//    state management is about navigation: how to emit event from an deep item to its parent?
// no, not in this case. deep data is not a proper case for React's auto dependency system.
// like form, we just use the ref to pass back the deep state change function, i.e. setItems()
//  3.need to provide the function:
//    3.1 expand self, data flow: self -> self
//    3.2 expand all, data flow: parent->children
//
// 4. input data and its internal state
//   4.1 in one case, input data is readonly, (i.e. loaded from server), the expand status is internal
//       state. what if the input data gets reloaded? will the expand status reset? we expect it to
//       remain
//    to maintain internal status, we should store internal status in another map, and associate them with the original data with key, so key is important.
//    a multi-level map is more proper than a flatten map with keys joined with "/"
//    use ["k1","k2", ...] to represent a unique path.
//  4.2 IMPORTANT: PROPAGATION when updating an item, should always update to its parent with children slice
//      because if the UI gets redraw, the parent would follow children to find the item, it will
//      get a  stale data if not updating parent when updating the item.

type InternalStateMap<T extends ExpandItem & { children?: T[] }> = {
  [key: string]: InternalState<T>;
};
type InternalState<T extends ExpandItem & { children?: T[] }> = {
  wrapper: ExpandItemWrapper<T>;
  children: InternalStateMap<T>;
};

export type ExpandItem = Omit<Item, 'children'> & {
  expanded?: boolean; // only meaningful with non-leaf
} & ExpandItemProps

export interface ExpandItemProps {
  key: string
  leaf?: boolean
  expandContainerClassName?: string
  expandContainerStyle?: CSSProperties
}

export type ExpandItemWrapper<T extends ExpandItem & { children?: T[] }> = {
  item?: T;
  parent?: ExpandItemWrapper<T>;
  parentIndex?: number;

  state?: InternalState<T>;

  setExpanded?: (expanded: boolean, all: boolean) => void;
  path?: ItemPath;
  index?: ItemIndex;
  children: ExpandItemWrapper<T>[];

  // when ever the dispatchVersion!==consumerVersion, updateHandlers will be called

  updateHandlers: { handler: (item: T) => void }[];

  subscribeUpdate: SubscribeUpdate<T>;
  dispatchUpdate: DispatchUpdate<T>;

  controller: ItemController<T>;
};

export interface ItemController<T extends ExpandItem & { children?: T[] }> {
  readonly item: T;
  readonly root?: T;
  readonly parent?: ItemController<T>;
  readonly path?: ItemPath;
  readonly index?: ItemIndex;
  readonly id?: number; // unique id in memory
  readonly subscribeUpdate: SubscribeUpdate<T>;
  readonly dispatchUpdate: DispatchUpdate<T>;
  // readonly children?: ItemController<T>[] // do we need this?
}

export interface ExpandListController<
  T extends ExpandItem & { children?: T[] },
> {
  getState: (path: ItemPath) => T | undefined;
  getController: (path: ItemPath) => ItemController<T>;
}
export function useExpandListController<
  T extends ExpandItem & { children?: T[] },
>(): MutableRefObject<ExpandListController<T>> {
  return useRef<ExpandListController<T>>();
}

// debug
function debugCheckDuplicate(items: any[], prefix: string) {
  // check item
  // debug
  traverse(items, (item) => {
    // DEBUG
    if ((item as any).record?.func === 'handleRuleMatch') {
      debugCheckDuplicateChildren(item.children, prefix);
    }
    return true;
  });
}

function debugCheckDuplicateChildren(items: any[], prefix: string) {
  const ids = {};
  items?.forEach?.((e) => {
    if (ids[e.key]) {
      console.log('found duplicate from source,prefix');
      debugger;
    }
    ids[e.key] = true;
  });
}

export interface ExpandListProps<T extends ExpandItem & { children?: T[] }> {
  items?: T[]; // single root or item list
  render?: (item: T, controller: ItemController<T>) => any;
  initialAllExpanded?: boolean; // default true
  toggleExpandRef?: React.MutableRefObject<(depth?: number) => void>;
  mergeStatus?: (item: T, prev: T, path: ItemPath) => T;
  onChange?: (item: T, path: ItemPath) => void;
  controllerRef?: MutableRefObject<ExpandListController<T>>;
  // call this method when new session all some bug found
  // but in practice you can just ignore it, I'll explain
  // why later.
  clearInternalStates?: React.MutableRefObject<() => void>;
  searchCallbackRef?: React.MutableRefObject<(content: string) => void>;
  currentClickNode?: string;

  listStyle?: CSSProperties
  itemStyle?: CSSProperties

  expandIconUseV1?: boolean
  clickStyleUseV1?: boolean

  expandOnClick?: boolean // default true

  showFileIcon?: boolean
}

// 哈哈 列表渲染
export default function ExpandList<T extends ExpandItem & { children?: T[] }>(
  props: ExpandListProps<T>,
) {
  const allExpandedRef = useRef(props.initialAllExpanded);
  const onChangeRef = useCurrent(props.onChange);
  const rootStatRef = useRef<InternalState<T>>();
  let idRef = useRef(1);
  const mergeStatusRef = useCurrent(props.mergeStatus);

  const getState = (path: ItemPath): InternalState<T> | undefined => {
    let state = rootStatRef.current;
    if (path) {
      for (let key of path) {
        state = state?.children?.[key];
        // console.log("get state:", key, state)
        if (!state) {
          return undefined;
        }
      }
    }
    return state;
  };

  if (props.controllerRef) {
    props.controllerRef.current = {
      getState(path) {
        return getState(path)?.wrapper?.item;
      },
      getController(path) {
        return getState(path)?.wrapper?.controller;
      },
    };
  }

  // checkDuplicate(props.items)

  useMemo(() => {
    // DEBUG clear the state
    // rootStatRef.current = undefined

    let root: ExpandItemWrapper<T> = rootStatRef.current?.wrapper;
    if (!root) {
      // init
      rootStatRef.current = { children: {} } as InternalState<T>;
      root = {
        path: [],
        index: [],
        state: rootStatRef.current,
        item: {
          key: 'root',
          children: [],
        },
        children: [],
      } as ExpandItemWrapper<T>;
      rootStatRef.current.wrapper = root;
    }
    root.item.children = [];

    // if ((window as any).debug) {
    //     debugger
    // }
    // build a map from key to
    traverse<T, ExpandItemWrapper<T>>(
      props.items,
      (item, parent, i) => {
        const p: ExpandItemWrapper<T> = parent;
        let state: InternalState<T> = p.state.children[item.key];

        const prevItem = state?.wrapper?.item;
        // the wrapper never change once created
        if (!state) {
          state = { children: {} } as InternalState<T>;
          p.state.children[item.key] = state;

          const wrapper: ExpandItemWrapper<T> = {
            parent: p,
            parentIndex: i,
            state: state,
            path: [...p.path, item.key],
            index: [...p.index, i],
            children: [], // fill later
            updateHandlers: [],
            subscribeUpdate(handler) {
              const entry = { handler };
              wrapper.updateHandlers.push(entry);
              // console.log("subscriber:", item.key, wrapper.updateHandlers.length)
              try {
                handler(wrapper.item);
              } catch (e) {
                // silent
              }

              // remove
              return () => {
                const idx = wrapper.updateHandlers.findIndex(
                  (e) => e === entry,
                );
                // console.log("remove subscriber:", item.key, idx, wrapper.updateHandlers.length)
                if (idx >= 0) {
                  wrapper.updateHandlers.splice(idx, 1);
                }
              };
            },
            dispatchUpdate: (getUpdate: (prev: T) => T) => {
              // update gets called on init, is that expected?
              let updatedItem = getUpdate(wrapper.item);
              if (updatedItem === wrapper.item) {
                // unchanged
                // force update
                updatedItem = { ...updatedItem };
                // return
              }

              // console.log("dispatch update:", item.key, updatedItem)
              wrapper.item = updatedItem; // to make the expand persistent.

              // NOTE: should also update all parent
              // to ensure when redrawing, parent following children will get
              // the updated item
              let i = wrapper.parentIndex;
              let v = wrapper;
              while (v.parent) {
                v.parent.item.children = [
                  ...v.parent.item.children.slice(0, i),
                  v.item,
                  ...v.parent.item.children.slice(i + 1),
                ];
                i = v.parent.parentIndex;
                v = v.parent;
              }

              const dispatchValue: T = updatedItem;
              wrapper.updateHandlers.forEach((e) => e.handler(dispatchValue));
              onChangeRef.current?.(dispatchValue, wrapper.path);

              Object.assign(state.wrapper.controller, { item: dispatchValue });
            },
            setExpanded: (expanded, all) => {
              if (wrapper.item.leaf) {
                return;
              }
              // debug
              // console.log("setExpanded:", wrapper.item.key, wrapper.item.expanded, expanded, all)
              wrapper.dispatchUpdate((item) => ({
                ...item,
                expanded: expanded,
                hideList: expanded === false,
              }));
              // x.updateRef.current?.({ ...x })
              if (all) {
                wrapper.children.forEach((e) => e.setExpanded(expanded, all));
              }
            },
            controller: {} as ItemController<T>,
          };
          Object.assign(wrapper.controller, {
            path: wrapper.path,
            index: wrapper.index,
            id: idRef.current++,
            dispatchUpdate: wrapper.dispatchUpdate,
            subscribeUpdate: wrapper.subscribeUpdate,
            root: root.item,
          } as ItemController<T>);
          state.wrapper = wrapper;
        } else {
          // update index
          state.wrapper.parentIndex = i;
          state.wrapper.index = [...p.index, i];
          Object.assign(state.wrapper.controller, {
            index: state.wrapper.index,
            root,
          });
        }

        // the calcItem is readonly
        const calcItem: T = {
          ...(mergeStatusRef.current
            ? mergeStatusRef.current(
              item,
              state.wrapper.item,
              state.wrapper.path,
            )
            : item),

          // always clear calc children because we will put calcItem into it
          children: [],

          expanded: prevItem ? prevItem.expanded : item.expanded,
          hideList: prevItem ? prevItem.hideList : item.expanded === false,

          // apply default css style on list
          listStyle: {
            listStyleType: 'none',
            paddingLeft: '1em',
            ...props?.listStyle,
            ...item?.listStyle,
          },
          itemStyle: {
            ...props?.itemStyle,
            ...item?.itemStyle,
          }
        };
        // update controller
        Object.assign(state.wrapper.controller, {
          item: calcItem,
          parent: p.controller,
        });
        // replace the item with calculated item
        state.wrapper.item = calcItem;
        // remove update handlers?
        // state.wrapper.updateHandlers = []

        // fill later
        state.wrapper.children = [];

        p.item.children.push(calcItem);
        p.children.push(state.wrapper);
        return [state.wrapper];
      },
      {
        root,
      },
    );

    // TODO: may delete those not in the state map
    // setRoot(root);
  }, [props.items, props.itemStyle]);

  if (props.toggleExpandRef) {
    props.toggleExpandRef.current = (depth?: number) => {
      const traverse = (list: typeof rootStatRef.current.wrapper.children) => {
        list.forEach((item) => {
          if (item.index.length <= depth) {
            item.setExpanded(true, true);
          } else {
            item.setExpanded(false, true);
          }
          traverse(item.children || []);
        });
      };
      traverse(rootStatRef.current.wrapper.children);
    };
  }

  if (props.searchCallbackRef) {
    props.searchCallbackRef.current = (content: string) => {
      console.log(content);

      const getFlag = (
        item: typeof rootStatRef.current.wrapper.children[0],
      ) => {
        const flag = (item as any).item.path.includes(content);
        if (item.children && item.children.length) {
          return item.children.some(getFlag);
        }
        return flag;
      };

      const traverse = (list: typeof rootStatRef.current.wrapper.children) => {
        list.forEach((item) => {
          console.log(item);
          item.setExpanded(getFlag(item), false);
          traverse(item.children || []);
        });
      };
      traverse(rootStatRef.current.wrapper.children);
    };
  }

  return (
    <List<T>
      items={rootStatRef.current.wrapper.item.children}
      style={{
        listStyleType: 'none',
        paddingLeft: props.expandIconUseV1 ? '10px' : '0px',
      }}
      getSubscribeUpdate={(item, path) => {
        return getState(path)?.wrapper?.subscribeUpdate;
      }}
      render={(item, path) => {
        const state = getState(path);
        return (
          <ExpandListItemRender
            item={item}
            currentClickNode={props.currentClickNode}
            itemRenderContent={props.render?.(item, state?.wrapper?.controller)}
            updateItem={state?.wrapper?.dispatchUpdate}
            subscribeUpdate={state?.wrapper?.subscribeUpdate}
            expandIconUseV1={props.expandIconUseV1}
            clickStyleUseV1={props.clickStyleUseV1}
            expandOnClick={props.expandOnClick}

            showFileIcon={props.showFileIcon}
          />
        );
      }}
    />
  );
}

export interface ExpandListItemRenderProps extends Omit<ExpandListItemRenderV2Props, "item"> {
  item?: ExpandItem;

  subscribeUpdate?: SubscribeUpdate<ExpandItem>;
  updateItem?: (getItem: (prevItem: ExpandItem) => ExpandItem) => void;
}

const iconStyle: CSSProperties = {
  minWidth: 'fit-content', // sometimes gets hide, this force the icon it be shown always.
};

// 节点渲染
export function ExpandListItemRender(props: ExpandListItemRenderProps) {
  const [item, setItem] = useState(props.item);
  const [expanded, setExpanded] = useState(item?.expanded !== false);

  useEffect(() => setItem(props.item), [props.item]);

  useEffect(() => {
    props.updateItem?.((item) => ({
      ...item,
      expanded,
      hideList: !expanded,
    }));
  }, [expanded]);

  useEffect(() => {
    return props.subscribeUpdate?.((item) => {
      setItem(item);
      setExpanded(item.expanded !== false);
    });
  }, []);

  return <ExpandListItemRenderV2 {...props}
    expanded={expanded}
    onClick={() => {
      if (!item?.leaf) {
        setExpanded(e => !e)
      }
    }}
    onClickToggle={expand => setExpanded(expand)}
  />
}

export interface ExpandListItemRenderV2Props {
  item?: ExpandItemProps
  expanded?: boolean

  onClick?: (e: any) => void
  onClickToggle?: (expand: boolean) => void

  itemRenderContent?: any;
  currentClickNode?: string;
  expandIconUseV1?: boolean
  clickStyleUseV1?: boolean

  expandOnClick?: boolean // default true
  showFileIcon?: boolean // based on suffix
}

export function ExpandListItemRenderV2(props: ExpandListItemRenderV2Props) {
  const item: ExpandItemProps = props.item
  const onClickToggle = props.onClickToggle

  const expandedComputed = props.expanded !== false

  // let leafNode = expanded !== false ? folderOpen : folder
  let leafNode
  if (true) {
    leafNode = expandedComputed ? folderOpen : folder
  } else {
    leafNode = (props) => React.createElement(expandedComputed ? VsFolderOpen : VsFolder, {
      width: 12,
      height: 12,
      ...props,
      style: {
        ...props?.style,
        cursor: "pointer",
        left: "-16px"
      }
    })
  }

  if (props.expandIconUseV1) {
    leafNode = expandedComputed ? (props: { className?: string, style?: CSSProperties }) => < BsChevronDown
      style={props?.style}
      className={props?.className}
      onClick={() => {
        onClickToggle?.(false)
      }}
    /> : (props: { className?: string, style?: CSSProperties }) => <BsChevronRight
      style={props?.style}
      className={props?.className}
      onClick={() => {
        onClickToggle?.(true)
      }}
    />
  }

  const noExpandOnClick = props.clickStyleUseV1 || props.expandOnClick === false

  const cls = [item?.expandContainerClassName || 'node-render'];
  const selectCls = []

  if (!props.clickStyleUseV1) {
    const itemPath = (item as any)?.path
    if (props.currentClickNode !== undefined && itemPath !== undefined && itemPath === props.currentClickNode) {
      const clickCls = 'current-click-node'
      selectCls.push(clickCls)
      cls.push(clickCls)
    }
  }
  const FileIcon = props.showFileIcon && item?.leaf && getFileIcon(item?.key)

  return (
    <div
      onClick={noExpandOnClick ? undefined : props.onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '0.6em',
        paddingRight: '0.6em',
        position: "relative",
        ...item?.expandContainerStyle,
      }}
      className={cls.join(' ')}
    >
      {!item?.leaf && leafNode({
        className: selectCls.join(' '),
        style: {
          position: "absolute",
          left: "-8px",
          ...iconStyle,
        }
      })}
      {FileIcon && <FileIcon
        width={22}
        height={22}
        style={{
          position: "absolute", left: "-16px", ...iconStyle,
        }}
        className={selectCls.join(' ')}
      />}
      {props.itemRenderContent}
    </div>
  );
}

const defaultFileIcon = (props) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}
  width={16}
  height={22}
  style={{
    ...props.style,
    left: "-8px"
  }}
><title>default_file</title><path d="M20.75,2H4.35V30h23.3V9Zm4.6,25.7H6.75V4.3h11.7v7h7V27.7Z" style={{ fill: "#c5c5c5" }} /></svg>

function getFileIcon(file: string): Function {
  if (!file) {
    return defaultFileIcon
  }
  if (file.endsWith(".go")) {
    return GoFile
  } else if (file.endsWith(".json")) {
    return JSONFile
  } else if (file.endsWith(".md")) {
    return MarkdownFile
  } else if (file.endsWith(".txt")) {
    return TextFile
  } else
    return defaultFileIcon
}

const folderOpen = (props: { className?: string, style?: CSSProperties }) => (
  <svg
    width={12}
    style={props?.style}
    fill="#888"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    id="folder-open"
    className={props?.className}
  >
    <path
      fill-rule="evenodd"
      d="M12.74 5.014A2 2 0 0 0 11 4H9L7.293 2.293A1 1 0 0 0 6.586 2H3a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h9.652a2 2 0 0 0 1.93-1.479l1.347-4.985a2 2 0 0 0-1.931-2.522H12.74zm-8.392 2L3.002 12h9.65l1.346-4.986h-9.65z"
    />
  </svg>
);

const folder = (props: { className?: string, style?: CSSProperties }) => (
  <svg
    width={12}
    style={props?.style}
    fill="#888"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    id="folder"
    className={props?.className}
  >
    <path
      fill-rule="evenodd"
      d="M1 12V4a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L9 4h4a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2zm12-6H3v2h10V6z"
    />
  </svg>
);

export interface ItemControllerExt<T extends ExpandItem & { children?: T[] }>
  extends ItemController<T> {
  removeAttachedListener: () => void;
}

export interface SelectProps<T extends ExpandItem & { children?: T[] }> {
  onSelectChange?: (item: T, root: T, index: ItemIndex) => void;
}
export interface SelectBundle<T extends ExpandItem & { children?: T[] }> {
  selectedController: ItemControllerExt<T>;
  setSelectedController: React.Dispatch<
    React.SetStateAction<ItemControllerExt<T>>
  >;

  getSelectAction: (
    item: T,
    controller: ItemController<T>,
  ) => () => Promise<void>;
  setSelect: (controller: ItemController<T>) => Promise<void>;
}

export const BG_SELECTED = "#cbd0eb"

export function useSelect<T extends ExpandItem & { children?: T[] }>(
  props: SelectProps<T>,
): SelectBundle<T> {
  const [selectedController, setSelectedController] =
    useState<ItemControllerExt<T>>();

  const selectedControllerRef = useCurrent(selectedController);
  const onSelectChangeRef = useCurrent(props.onSelectChange);

  const updateController = async (
    previous: ItemControllerExt<T>,
    controller: ItemController<T>,
  ) => {
    if (previous?.id === controller?.id) {
      return;
    }

    // clear prev
    if (previous) {
      previous.removeAttachedListener?.();
      previous.dispatchUpdate((item) => ({
        ...item,
        expandContainerStyle: { backgroundColor: undefined },
      }));
    }
    if (!controller) {
      setSelectedController(undefined);
      onSelectChangeRef.current?.(undefined, undefined, undefined);
      return;
    }

    const removeAttachedListener = controller.subscribeUpdate((item) => {
      onSelectChangeRef.current?.(item, controller.root, controller.index);
    });

    setSelectedController({
      ...controller,
      removeAttachedListener: removeAttachedListener,
    });
    controller?.dispatchUpdate?.((item) => ({
      ...item,
      expandContainerStyle: {
        backgroundColor: BG_SELECTED,
      },
    }));
    onSelectChangeRef.current?.(
      controller.item,
      controller.root,
      controller.index,
    );
  };

  const setSelect = async (controller: ItemController<T>) => {
    updateController(selectedControllerRef.current, controller);
  };

  const getSelectAction = useCallback(
    (item: T, controller: ItemController<T>) => {
      return async () =>
        updateController(selectedControllerRef.current, controller);
    },
    [],
  );

  return {
    selectedController,
    setSelectedController,
    getSelectAction,
    setSelect,
  };
}
