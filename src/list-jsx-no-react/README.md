# List

Using jsx without React.

It seems that React's cache is key to performance.

We will use react component instead.

# Usage
```js
import {createList} from "./list.js"

const list = createList(document.getElementById("root"),{})
list.add({el:""})

```

```html
<script src="./list-test.js" type="module"></script>
<div id="root"></div>
```

