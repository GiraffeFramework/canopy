import { ActiveTemplate } from "./HTML";


export abstract class Page {
    protected html!: ActiveTemplate;

    /**
     * This is the actual render function called by the application which 
     * performs a little extra check.
     * @param vars url variables passed down to actual render function
     * @returns DocumentFragment to placed in the root
     */
    public __render(vars?: Record<string, string>): DocumentFragment {
        if (!this.html) throw new Error("HTML not set");
        return this.render(vars);
    }

    /**
     * Called on the associated page whenever the url changes 
     * @param vars url variables passed to render function
     * @returns DocumentFragment to placed in the root
     */
    public abstract render(vars?: Record<string, string>): DocumentFragment;
};
