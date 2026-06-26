import { Component } from "./Component";

const cache = new WeakMap<TemplateStringsArray, Template>();


interface Template {
    template: HTMLTemplateElement;
    keys: string[];
}

export type Bindings = Record<string, (val: any) => void>;

export interface ActiveTemplate {
    fragment: DocumentFragment;
    bindings: Bindings;
}


/**
 * Creates or gets a document fragment ready for parsing by replacing all 
 * String Variables with easily findible markers for the parser after.
 * @param strings unique identifier for cached Template
 * @param keys list of (dynamic/static) inserted data
 * @returns 
 */
function get(strings: TemplateStringsArray, keys: string[]): Template {
    let cached = cache.get(strings);
    if (cached) return cached;

    const template = document.createElement("template");
    // Strings consists of a Template Literals Array that is split around 
    // variables. We join these parts with this comment marker to easily find
    // the nodes in a later step and create their bindings.
    const htmlString = strings.reduce((acc, str, i) => {
        const keyMarker = keys[i]
            ? `<!--m:${keys[i]}-->`
            : "";

        return acc + str + keyMarker;
    }, "");
    
    template.innerHTML = htmlString;
    cached = { template, keys };
    
    cache.set(strings, cached);
    return cached;
}


/**
 * Returns a template with binding functions that allow you to dynamically 
 * update the contents of variable nodes in an efficient manner.
 * @param strings unique identifier for cached Template
 * @param keys list of (dynamic/static) inserted data
 * @returns Template and Bindings
 */
export function html(strings: TemplateStringsArray, ...keys: string[]): ActiveTemplate {
    const template = get(strings, keys);

    const fragment = template.template.content.cloneNode(true) as DocumentFragment;
    const bindings: Record<string, (val: any) => void> = {};

    const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
    const targets: { key: string; commentNode: Comment }[] = [];
    
    let currentNode = walker.nextNode();

    // Find all marked comment nodes and map them against their key
    while (currentNode) {
        const comment = currentNode.nodeValue || "";

        if (comment.startsWith("m:")) {
            targets.push({
                key: comment.split(":")[1],
                commentNode: currentNode as Comment
            });
        }
        
        currentNode = walker.nextNode();
    }

    // Loop over all pairs and create a bindings function
    for (const { key, commentNode } of targets) {
        let currentNode: Node = document.createTextNode("");
        commentNode.parentNode?.replaceChild(currentNode, commentNode);
        
        // Special case for handling components. Components can be bound to the 
        // html and they should replace the temporary node. From there on, the
        // component is responsible for updates.
        bindings[key] = (val: any) => {
            if (!(val instanceof Component)) {
                currentNode.textContent = val;
                return;
            }

            const node = val.render();
            currentNode.parentNode?.replaceChild(node, currentNode);
            currentNode = node;
        };
    }

    return { fragment, bindings };
}
