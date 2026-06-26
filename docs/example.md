## Project setup
An entry html file
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Example</title>

    <script type="module" src="/static/gen/canopy.js"></script>
</head>
<body>
    <div id="root"></div>
</body>
</html>
```
A file compiled to the set path from earlier `/static/gen/canopy.js`
```ts
const app = new Gluon(document.getElementById("root")!, "/static/gen/");

app.registerRoute(
    "/test/<arg1>/<arg2>", 
    `testPage`, [`testComponent`]
);

app.navigate(window.location.pathname);
```

## testPage
```ts
import { Page, HTML } from "./Canopy";

import TestComponent from "./testComponent";


export default class TestPage extends Page {
    private button = new TestComponent();

    constructor() {
        super();

        this.html = html`
            <p>${"name"}</p><span>${"status"}</span>
            ${"button"}
        `;
        this.html.bindings.button(this.button);
        this.button.render("aaa");
    }
    
    public render(vars: Record<string, string>): DocumentFragment {
        this.html.bindings.name(vars.name);
        this.html.bindings.status(vars.status);
        console.log(this.html.bindings)

        return this.html.fragment
    }
}
```

## testComponent
```ts
import { html, Component } from "./Canopy";


export default class TestComponent extends Component {
    private counter = 0;

    constructor() {
        super(html`
            <button ref="button" class="custom-btn">${"label"}</button>
        `);
        this.refs.button.addEventListener("click", this.click.bind(this));
    }

    public click(): void {
        this.counter++;
        this.bindings.label(`Clicked (${this.counter})`);
    }

    public render(label: string): HTMLElement {
        this.bindings.label(`${label} (${this.counter})`);
        return this.html;
    }
}
```
 