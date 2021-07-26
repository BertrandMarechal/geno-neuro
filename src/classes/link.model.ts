import {Node} from "./node";

export class Link {
    from: Node;
    to: Node;
    threshold: number = 0;

    currentValue: number = 0;

    constructor(from: Node, to: Node, threshold: number) {
        this.from = from;
        this.to = to;
        this.threshold = threshold;
    }

    get active() {
        return this.from.currentValue >= this.threshold;
    }
}