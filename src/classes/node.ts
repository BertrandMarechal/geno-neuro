import {Link} from "./link.model";
import {GENE_SEPARATOR, PROPERTY_SEPARATOR, SUB_GENE_SEPARATOR} from "./genome.model";
import {Evolvable} from "./evolvable.model";
import {Parser} from "./parser.model";

export class Node implements Parser, Evolvable {
    id: number;
    from: Link[];
    to: Link[];
    coefficient: number;

    currentValue: number = 0;

    constructor(genome: string) {
        this.id = -1;
        this.coefficient = -1;
        this.from = [];
        this.to = [];
        this.fromString(genome);
    }

    addFrom(link: Link) {
        this.from.push(link);
    }

    addTo(link: Link) {
        this.to.push(link);
    }

    run() {
        let value = 0;
        for (let i = 0; i < this.from.length; i++) {
            value += (this.from[i].active && 1) || 0;
        }
        this.currentValue = value / this.from.length * this.coefficient;
    }

    fromString(genome: string){
        const genomeSplit = genome.split(GENE_SEPARATOR);
        this.id = +genomeSplit[0];
        this.coefficient = +genomeSplit[1];
    }

    toString() {
        const fromAsString = this.from.map(f => `${f.from.id}${SUB_GENE_SEPARATOR}${f.threshold}`)
            .join(PROPERTY_SEPARATOR);
        return `${this.id}${GENE_SEPARATOR}${this.coefficient}${GENE_SEPARATOR}${fromAsString}`;
    }

    static generateNew(index: number, params: any) {
        let nodeStr = `${
            index
        }${GENE_SEPARATOR}${
            Math.random()
        }`;
        if (params.previousLayerNodeIds && params.previousLayerNodeIds.length) {
            nodeStr += `${GENE_SEPARATOR}${
                params.previousLayerNodeIds.map((n: {id: number}) =>
                    `${n.id}${SUB_GENE_SEPARATOR}${Math.random()}`).join(PROPERTY_SEPARATOR)
            }`;
        }
        return nodeStr;
    }

    static mergeAndMutate(motherNodes: Node[], fatherNodes: Node[], mutationRate: number): Node[] {
        let mutation: boolean;
        let fromMother: boolean;
        const nodes: Node[] = [];
        for (let i = 0; i < motherNodes.length; i++) {
            const node = new Node(`${motherNodes[i].id}`);
            mutation = Math.random() < mutationRate;
            if (mutation) {
                node.coefficient = Math.random();
            } else {
                fromMother = Math.random() > 0.5;
                if (fromMother) {
                    node.coefficient = motherNodes[i].coefficient;
                } else {
                    node.coefficient = fatherNodes[i].coefficient;
                }
            }
            if (motherNodes[i].from && motherNodes[i].from.length) {
                for (let j = 0; j < motherNodes[i].from.length; j++) {
                    const link = new Link(
                        motherNodes[i].from[j].from,
                        motherNodes[i].from[j].to,
                        motherNodes[i].from[j].threshold
                    );
                    mutation = Math.random() < mutationRate;
                    if (mutation) {
                        link.threshold = Math.random();
                    } else {
                        fromMother = Math.random() > 0.5;
                        if (fromMother) {
                            link.threshold = motherNodes[i].from[j].threshold;
                        } else {
                            link.threshold = fatherNodes[i].from[j].threshold;
                        }
                    }
                    node.addFrom(link);
                }
            }
            nodes.push(node);
        }
        return nodes;
    }
}