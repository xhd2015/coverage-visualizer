import { BaseTestingSourceExplorer, type BaseSourceExplorerProps } from "./BaseSourceExplorer"


export interface TestingSourceExplorerProps extends BaseSourceExplorerProps {

}

export function TestingSourceExplorer(props: TestingSourceExplorerProps) {
    return <BaseTestingSourceExplorer {...props} />
}

