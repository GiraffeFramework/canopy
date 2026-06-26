import { Bindings, ActiveTemplate } from "./HTML";


export abstract class Component {
    protected html: HTMLElement;
    protected bindings: Bindings;
    protected refs: Record<string, HTMLElement> = {};

    /**
     * Wraps the generated fragment HTML into a div and populates Component.refs
     * which can be used to set EventListeners.
     * @param node generated template
     */
    constructor (node: ActiveTemplate) {
        const wrapper = document.createElement("div");
        wrapper.append(node.fragment);
 
        this.html = wrapper;
        this.bindings = node.bindings;

        this.html.querySelectorAll("[ref]").forEach(elm => {
            this.refs[elm.getAttribute("ref")!] = (elm as HTMLElement);
        });
    }

    /**
     * Abstract function called whenever a binded component .
     */
    public abstract render(...args: any[]): HTMLElement;
}
