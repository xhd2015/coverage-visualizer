
import {
    useCallback,
    useState
} from 'react';
import { ExpandItem, ItemController } from '../ExpandList';
import {
    ItemIndex
} from '../List';
import { useCurrent } from '../react-hooks';


export interface ExpandSelectController<T extends ExpandItem & { children?: T[] }> extends ItemController<T> {
    clear?: () => void
}

export interface UseExpandSelectProps<T extends ExpandItem & { children?: T[] }> {
    onSelectChange?: (item: T, root: T, index: ItemIndex) => void
}

export function useExpandSelect<T extends ExpandItem & { children?: T[] }>(props: UseExpandSelectProps<T>) {
    const [selectedController, setSelectedController] = useState<ExpandSelectController<T>>()
    const selectedContrlRef = useCurrent(selectedController)

    const propsRef = useCurrent(props)
    const updateSelected = useCallback((item: T, controller: ItemController<T>) => {
        const selectedController = selectedContrlRef.current
        if (selectedController?.id === controller.id) {
            return
        }
        // clear prev
        if (selectedController) {
            selectedController.clear?.()
            selectedController.dispatchUpdate(item => ({ ...item, expandContainerStyle: { backgroundColor: undefined } }))
        }

        const clear = controller.subscribeUpdate((item) => {
            propsRef.current?.onSelectChange?.(item, controller.root, controller.index)
        })

        setSelectedController({ ...controller, clear })
        controller?.dispatchUpdate?.(item => ({
            ...item, expandContainerStyle: {
                //  backgroundColor: "lightgreyeee"
                backgroundColor: "#eeeeee",
            }
        }))

        propsRef.current.onSelectChange?.(item, controller.root, controller.index)
    }, [])

    return { selectedController, setSelectedController, updateSelected }
}