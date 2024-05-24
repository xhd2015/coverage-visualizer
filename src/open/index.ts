import * as React from 'react';
import { createRoot } from "react-dom/client";

import 'antd/dist/antd.min.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // with this, page looks better
import "./index.css";

import { UrlXgoTestingExplorer } from '../mock-editor/TestingExplorer/xgo';

export function renderReact(el: HTMLElement, component: (props) => JSX.Element, props?) {
    createRoot(el).render(React.createElement(component, props))
}

export function HelloWorld() {
    // <div>Hello World!</div>
    return React.createElement("div", { children: "Hello World!" })
}

export {
    React,
    createRoot,
    UrlXgoTestingExplorer,
}