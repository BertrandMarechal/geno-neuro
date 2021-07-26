import {Node} from "./node";
import {GENE_SEPARATOR} from "./genome.model";

export class Input extends Node {
    run(value?: number){
        this.currentValue = value || 0;
    }

    static generateNew(index: number, params?: any) {
        return `${index}`;
    }

    toString() {
        return `${this.id}`;
    }
}