import { CSSProperties, ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import ExpandList, { ExpandItem, useSelect } from '../mock-editor/ExpandList';
import { useCurrent } from '../mock-editor/react-hooks';
import LayoutLeftRight, {
    LayoutLeftRightProps,
} from '../mock-editor/support/LayoutLeftRight';
import ToolBar from '../mock-editor/support/ToolBar';
import VirtualList, {
    VirtualListController,
} from '../mock-editor/support/VirtualList';
import { traverse } from '../mock-editor/tree';
import { FileCoverage } from '../support/components/CoverageVisualizer';
import ColResizeBar, {
    ColResizeBarProps,
} from '../support/components/v2/ColResizeBar';

export interface File extends ExpandItem {
    key: string;

    path?: string;
    children?: File[];

    parent?: File;
    coverage?: FileCoverage;
    beforeCoverage?: FileCoverage;
}

export interface CodeViewerListProps {
    style?: CSSProperties;
    className?: string;
    files?: File[];

    listStyle?: CSSProperties;
    listClassName?: string;

    codeContainerStyle?: CSSProperties;
    codeContainerClassName?: string;

    renderFileCode?: (file: string) => any;

    layoutProps?: LayoutLeftRightProps;
    resizeBarProps?: ColResizeBarProps;
    getResizeParent?: (e: HTMLElement) => HTMLElement;

    showEmptyIndicator?: boolean
    emptyListIndicator?: ReactElement
}

export function CodeViewerList(props: CodeViewerListProps) {
    const files = props.files;
    const controlRef = useRef<VirtualListController>();

    const { fileList, keyMap, isEmpty } = useMemo(() => {
        const fileList = [];
        const keyMap = {};
        traverse(files, (e, ctx, idx, path) => {
            if (e.leaf) {
                fileList.push(path.join('/'));
            }
        });
        fileList.forEach((file, i) => (keyMap[file] = i));
        // console.log(fileList)
        return { fileList, keyMap, isEmpty: fileList.length === 0 };
    }, [files]);

    const selectPath = useRef<string>();
    const ref = useCurrent({ keyMap });


    const { selectedController, setSelectedController, getSelectAction } =
        useSelect<File>({
            onSelectChange: (item, root, index) => {
                // NOTE: this maybe called more than once for single select
                // so do what ever you can to prevent duplicate
                const newPath = item.path;
                if (!newPath || newPath === selectPath.current) {
                    return;
                }
                selectPath.current = newPath;
                const idx = ref.current.keyMap[newPath];
                if (!(idx >= 0)) {
                    // maybe a dir
                    return;
                }
                // console.log("found idx:", newPath, idx)
                controlRef.current?.scrollTo?.(idx);
            },
        });

    // 节点折叠
    const toggleExpandRef = useRef<(depth: number) => void>();

    // 节点搜索
    const [searchContent, setSearchContent] = useState('');
    const searchCallbackRef = useRef<(content: string) => void>();
    const searchFile = (content: string) => {
        setSearchContent(content);
        searchCallbackRef.current?.(content);
    }

    const [currentClickNode, setCurrentClickNode] = useState('');

    return (
        <LayoutLeftRight
            {...props.layoutProps}
            rootStyle={props.style}
            leftStyle={{
                position: 'relative',
                userSelect: 'none',
                ...props.listStyle,
                ...props.layoutProps?.leftStyle,
            }}
            leftClassName={props.listClassName}
            leftChild={
                <div style={{ position: 'relative', height: '100%' }}>
                    <div style={{ height: '100%', paddingRight: 16 }}>
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <ToolBar
                                searchFile={searchFile}
                                onToggleExpand={(depth: number) => {
                                    toggleExpandRef.current?.(depth)
                                }}
                            />
                            {
                                props.showEmptyIndicator && isEmpty && (props.emptyListIndicator ?? <div>Empty</div>)
                            }
                            {
                                !(props.showEmptyIndicator && isEmpty) &&
                                <div style={{
                                    flex: 1,
                                    paddingLeft: "8px", // allow root folder abs positioning
                                    overflowY: 'auto',
                                    overflowX: "hidden"
                                }}>
                                    <ExpandList<File>
                                        currentClickNode={currentClickNode}
                                        toggleExpandRef={toggleExpandRef}
                                        searchCallbackRef={searchCallbackRef}
                                        initialAllExpanded={true}
                                        items={files}
                                        itemStyle={{ "position": "relative" }}
                                        showFileIcon
                                        render={(item, controller) => {
                                            return item.leaf ? (
                                                <FileRender
                                                    currentNode={currentClickNode}
                                                    searchContent={searchContent}
                                                    file={item}
                                                    onClick={() => {
                                                        const action = getSelectAction(item, controller);
                                                        action?.();
                                                        setCurrentClickNode(item.path);
                                                    }}
                                                />
                                            ) : (
                                                <FileRender
                                                    currentNode={currentClickNode}
                                                    searchContent={searchContent}
                                                    file={item}
                                                />
                                            )
                                        }}
                                    />
                                </div>
                            }
                        </div>
                        <ColResizeBar
                            getTargetElement={(e) => {
                                return props.getResizeParent
                                    ? props.getResizeParent(e)
                                    : (e.parentElement.parentElement
                                        .parentElement as HTMLElement);
                            }}
                            {...props.resizeBarProps}
                        />
                    </div>
                </div>
            }
            rightStyle={{
                // flexGrow: undefined
                ...props.layoutProps?.rightStyle,
            }}
            rightChild={
                <div
                    style={{
                        height: '100%',
                        overflowY: 'scroll',
                        // fontSize: '90%',
                        lineHeight: '20px',
                    }}
                >
                    <CodeList
                        files={fileList}
                        controlRef={controlRef}
                        style={{
                            width: '100%',
                        }}
                        renderFileCode={props.renderFileCode}
                    />
                </div>
            }
        />
    );
}
export interface CodeListProps {
    files?: string[];

    style?: CSSProperties;
    controlRef?: React.MutableRefObject<VirtualListController>;
    renderFileCode?: (file: string) => any;
}
export function CodeList(props: CodeListProps) {
    const files = props.files;
    const items = useMemo(() => files.map((e) => ({ key: e })), [files]);

    return (
        <VirtualList
            controllerRef={props.controlRef}
            style={props.style}
            items={items}
            renderItem={(item, i) => props.renderFileCode?.(item.key)}
            maxRendering={5}
        />
    );
}

function FileRender(props: { file: File; onClick?: any, searchContent?: string; currentNode: string }) {
    const beforeCoverage = props.file?.beforeCoverage
    // const beforeCoverage = { percent: "20%" }
    const coverage = props.file?.coverage;
    return (
        <div
            title={coverage ? coverage.percent : ''}
            className='file-row-render'
            style={{
                display: 'flex',
                cursor: 'pointer',
                alignItems: 'center',
                flexGrow: '1',
            }}
            onClick={props.onClick}
        >
            {
                props.searchContent ? (
                    <span dangerouslySetInnerHTML={{ __html: (props.file?.key || '').replace(props.searchContent, `<span style="color: blue; font-weight: 600">${props.searchContent}</span>`) }}></span>
                ) : (
                    props.file?.key
                )
            }
            <span
                style={{
                    marginLeft: '4px',
                    whiteSpace: 'nowrap',
                    right: "0",
                    position: "absolute",
                    backgroundColor: "white",
                    display: "inline-flex",
                    alignItems: "baseline",
                    justifyContent: "center",
                    // fontWeight: '600'
                }}
            >
                <RenderBeforeAfterCoverage coverage={coverage} beforeCoverage={beforeCoverage} />
            </span>
        </div>
    );
}

export function RenderBeforeAfterCoverage(props: { coverage: FileCoverage, beforeCoverage?: FileCoverage }) {
    const { coverage, beforeCoverage } = props
    return <>{
        beforeCoverage && <><RenderFileCoverage coverage={beforeCoverage} /> <DirectionIcon /></>
    }
        <RenderFileCoverage coverage={coverage} />
    </>
}

export function DirectionIcon(props) {
    // const ref = useRef<HTMLSpanElement>()
    // useEffect(() => {
    //   if (ref.current) {
    //     const svgElemnent = ref.current.firstElementChild as HTMLElement
    //     svgElemnent.style.width = "0.7em"
    //     svgElemnent.style.height = "0.8em"
    //   }
    // }, [])

    // ArrowRightOutlined
    return <svg
        viewBox="64 64 896 896"
        focusable="false"
        data-icon="arrow-right"
        width="0.5em"
        height="0.5em"
        fill="currentColor"
        aria-hidden="true"
        style={{
            marginLeft: "1px",
            marginRight: "1px",
        }}
    >
        <path
            d="M869 487.8L491.2 159.9c-2.9-2.5-6.6-3.9-10.5-3.9h-88.5c-7.4 0-10.8 9.2-5.2 14l350.2 304H152c-4.4 0-8 3.6-8 8v60c0 4.4 3.6 8 8 8h585.1L386.9 854c-5.6 4.9-2.2 14 5.2 14h91.5c1.9 0 3.8-.7 5.2-2L869 536.2a32.07 32.07 0 000-48.4z"
        ></path>
    </svg>
    // return <ArrowRightOutlined className='child-svg-small' />
}

export function RenderFileCoverage(props: { coverage?: FileCoverage }) {
    const cov = props.coverage;
    return cov ? (
        <span
            className='coverage-value'
            style={{
                color: cov.good ? 'green' : 'red',
                // marginLeft: '4px',
                // whiteSpace: 'nowrap',
                // fontWeight: '600'
            }}
        >
            <small>{cov.percent}</small>
        </span>
    ) : null
}
