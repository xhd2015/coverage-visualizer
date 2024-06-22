import { Select } from "antd"
import { CSSProperties } from "react"
import { TestingItemV2, TestingListItem, TestingListV2 } from "."
import { ItemPath } from "../../List"
import ToolBar from "../../support/ToolBar"

export enum StatusFilter {
    All = "all",
    Fail = "fail",
    Skip = "skip",
}

export interface TestingListWithToolbarProps<T extends TestingItemV2> {
    style?: CSSProperties
    className?: string
    data?: T
    buildListItem?: (item: TestingListItem) => TestingListItem

    statusFilter?: StatusFilter
    onChangeStatusFilter?: (filter: StatusFilter) => void

    onSearch?: (search: string) => void
    onToggleExpand?: (depth: number) => void

    onClickExpand?: (item: TestingListItem, path: ItemPath, expand: boolean) => void
    onClickItem?: (item: TestingListItem, path: ItemPath) => void
    onClickRun?: (item: TestingListItem, path: ItemPath) => void
    onRefreshRoot?: () => void
}

export function TestingListWithToolbar<T extends TestingItemV2>(props: TestingListWithToolbarProps<T>) {
    return <div style={{ overflow: "auto", ...props.style }}>
        <ToolBar
            searchFile={props.onSearch}
            onToggleExpand={props.onToggleExpand}
            extra={<>
                <Select<StatusFilter> dropdownMatchSelectWidth={false}
                    value={props.statusFilter || StatusFilter.All}
                    onChange={e => props.onChangeStatusFilter?.(e)}
                    options={[{ value: "all", label: "All" }, { value: "fail", label: "Fail" }, { value: "skip", label: "Skip" }]}
                >
                </Select>
            </>}
        />

        <TestingListV2
            data={props.data}
            buildListItem={props.buildListItem}
            onClickExpand={props.onClickExpand}
            onClickItem={props.onClickItem}
            onClickRun={props.onClickRun}
            onRefreshRoot={props.onRefreshRoot}
            showEditActions={false}
        />
    </div>
}
