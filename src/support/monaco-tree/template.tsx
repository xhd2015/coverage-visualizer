import { getFileIconLabel } from "./file-utils";

export class Template {
  monacoIconLabel: HTMLDivElement
  label: HTMLAnchorElement
  description: HTMLSpanElement
  options: {
    render: (t: Template, f: File) => void
  }
  /**
   *Creates an instance of Template.
   * @param {HTMLElement} container
   * @memberof Template
   */
  constructor(container) {
    this.monacoIconLabel = document.createElement("div");
    this.monacoIconLabel.className = "monaco-icon-label";
    this.monacoIconLabel.style.display = "flex";
    container.appendChild(this.monacoIconLabel);

    const labelDescriptionContainer = document.createElement("div");
    labelDescriptionContainer.className =
      "monaco-icon-label-description-container";
    this.monacoIconLabel.appendChild(labelDescriptionContainer);

    this.label = document.createElement("a");
    this.label.className = "label-name";
    labelDescriptionContainer.appendChild(this.label);

    labelDescriptionContainer.style.overflow = "hidden";
    labelDescriptionContainer.style.textOverflow = "ellipsis";
    labelDescriptionContainer.style.whiteSpace = "nowrap";

    this.description = document.createElement("span");
    this.description.className = "label-description";
    labelDescriptionContainer.appendChild(this.description);
  }
}

export class FileTemplate extends Template {
  /**
   *Creates an instance of FileTemplate.
   * @param {HTMLElement} container
   * @memberof FileTemplate
   */
  constructor(container, options) {
    super(container);
    this.options = options;
  }

  dispose() {
    // TODO dispose resources?
  }

  /**
   *Set the file
   *
   * @param {TreeNode} file file node
   * @memberof FileTemplate
   */
  set(file) {
    //first reset the class name
    this.monacoIconLabel.className = "monaco-icon-label";
    this.monacoIconLabel.classList.remove("file-icon");

    const icon = getFileIconLabel(file.name, file.isDirectory);

    if (!file.isDirectory) {
      this.monacoIconLabel.classList.add("file-icon");
    }

    if (icon) {
      // console.log("file icon:", file, icon);
      this.monacoIconLabel.classList.add(icon);
    }
    if (this.options?.render) {
      this.options.render(this, file);
    } else {
      this.label.innerText = file.name;
      this.monacoIconLabel.title = file.path;
    }
  }
}
