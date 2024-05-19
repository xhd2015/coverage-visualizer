import { CSSProperties, useMemo, useState } from "react"
import { LocalGitTestingSourceExplorer } from "./LocalGitTestingSourceExplorer"
import axios from "axios";
import { buildFileTree } from "./util";

export interface LocalGitTestingSourceExplorerDemoProps {
    style?: CSSProperties
    className?: string
}

export function LocalGitTestingSourceExplorerDemo(props: LocalGitTestingSourceExplorerDemoProps) {
    return <LocalGitTestingSourceExplorer />
}