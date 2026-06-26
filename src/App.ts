import { Page } from "./Page"


export class Canopy {
    private root: HTMLElement;
    private staticUrl: string;
    private MPA: boolean;

    private routes: { regex: RegExp, keys: string[], pageId: string, componentIds: string[] }[] = [];
    private pages: Record<string, Page> = {};

    private notFoundHandler = (): void => { alert(`No route ${window.location.pathname} registered.`); };
    private loadingHandler  = (): void => { this.root.innerHTML = "loading"; };


    /**
     * Create Gluon object ready to be set up.
     * @param root Gluon object takes ownership of this DOM element and builds 
     *             app around it
     * @param notFoundHandler optional function that is called when window path 
     *                        is changed to non-existant route 
     * @param loadingHandler  optional function that is called when anything is
     *                        being loaded/awaited
     */
    constructor(root: HTMLElement, staticUrl: string, MPA: boolean = false, notFoundHandler?: () => void, loadingHandler?: () => void) {
        this.root = root;
        this.staticUrl = staticUrl;
        this.MPA = MPA;

        if (notFoundHandler) this.notFoundHandler = notFoundHandler;
        if (loadingHandler)  this.loadingHandler  = loadingHandler;

        window.addEventListener("popstate", this.routeUpdate);
    }
 
    /**
     * Called whenever the page state changes or when navigation is performed.
     * Will loop through all registered pages and find a match for the current 
     * path. Matched pages will get all (if any) variables forwarded to an 
     * internal load function.
     * If no match is found a 404 is issued, this can set for custom behaviour
     */
    private async routeUpdate(): Promise<void> {
        const path = window.location.pathname;
        
        // First successfull match is executed, if associated page could not be
        // found an error is thrown.
        for (let { regex, keys, pageId, componentIds } of this.routes) {
            const match = path.match(regex);
            if (!match) continue;

            const variables = Object.fromEntries(keys.map(
                (varName, i) => [varName, match[i + 1]]
            ));

            // Call loading handler to give loading state and get the page in 
            // the meantime
            this.loadingHandler()
            const page = await this.getPage(pageId, componentIds);
            if (!page) throw Error(`Page with id ${pageId} does not exist.`);

            // Page is ready -> render it
            this.root.innerHTML = "";
            this.root.append(page.__render(variables));

            return;
        }

        this.notFoundHandler();
    }

    /**
     * Returns a Page object from cache, or imports a new one when it is 
     * currently unknown.
     * @param pageId identifier for page
     * @param componentIds list of identifiers for components
     * @returns ready Page object
     */
    private async getPage(pageId: string, componentIds: string[]): Promise<Page | null> {
        let page = this.pages[pageId];
        if (page) return page;

        // Import EVERYTHING (page + components) at once
        const [pageModule, ...componentModules] = await Promise.all([
            import(`${this.staticUrl}${pageId}.js`),
            ...componentIds.map(id => import(`${this.staticUrl}${id}.js`))
        ]);

        const PageClass = pageModule.default;
        page = new PageClass();
        
        this.pages[pageId] = page;

        return page;
    }

    /**
     * Map a path against a page with a pageId. PageIds are used to dyamically
     * import page objects only when necessary. Paths can contain variables 
     * which are passed to the Page when navigated to.
     * @param path URI/URL path. Can contain variables like /path/<var>
     * @param pageId importable page Id.
     */
    public registerRoute(path: string, pageId: string, componentIds: string[]) {
        const keys: string[] = [];
        const regex = new RegExp("^" + path.replace(/<([^>]+)>/g, (_, k) => (keys.push(k), "([^/]+)")) + "$");
        
        this.routes.push({ regex, keys, pageId, componentIds });
    }

    /**
     * Will update the page history (for history buttons) and render the new 
     * Page.
     * @param path New path to be loaded
     */
    public navigate(path: string): void {
        if (this.MPA) {
            window.location.href = path;
            return;
        }

        window.history.pushState(null, "", path);
        this.routeUpdate();
    }
}
