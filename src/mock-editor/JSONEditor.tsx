
import TextEditor, { TextEditorProps } from "./TextEditor"

export interface JSONEditorProps extends TextEditorProps {
}

export default function (props: JSONEditorProps) {
    return <TextEditor
        {...props}
        language={props.language || "json"}
        onEditorCreated={editor => {
            props.onEditorCreated?.(editor)

            // not needed for JSON Schema
            // monaco.languages.registerCompletionItemProvider("json", {
            //     provideCompletionItems(model, position, context, cancelToken) {

            //     }
            // })
        }}
    />

}

// not needed for JSON Schema
function buildCompletion(obj: { triggerCharacters: any, JSON: any, provideCompletionItems: any }) {
    if (!obj) {
        return null;
    }
    let provideCompletionItems = obj.provideCompletionItems;
    if (obj.JSON) {
        provideCompletionItems = this.buildCompletionProviderJSON(obj.JSON);
    }
    return {
        triggerCharacters: obj.triggerCharacters,
        provideCompletionItems,
    };
}

// export default function(){
//     let _this = this;
//     if (this.registerCompletion && this.registerCompletion.provideCompletionItems) {
//       monaco.languages.registerCompletionItemProvider(this.language, {
//         ...this.registerCompletion,
//         provideCompletionItems(model, position, context, cancelToken) {
//           if (model.id !== _this.editor.getModel().id) {
//             return;
//           }
//           return _this.registerCompletion.provideCompletionItems(
//             model,
//             position,
//             context,
//             cancelToken
//           );
//         },
//       });
//     }
// }
