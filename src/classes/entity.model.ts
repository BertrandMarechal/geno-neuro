import {Input} from "./input";
import {Output} from "./output.model";
import {Node} from "./node";
import {CATEGORY_SEPARATOR, Genome, GROUP_SEPARATOR, NODE_SEPARATOR, PROPERTY_SEPARATOR} from "./genome.model";
import {EntityIdentity} from "./entity-identity.model";

export interface EntityParams {
    id: number;
    inputCount?: number;
    outputCount?: number;
    nodeCounts?: number[];
    dna?: string;
    motherDna?: string;
    fatherDna?: string;
}

export class Entity {
    inputs: Input[] = [];
    outputs: Output[] = [];
    nodes: Node[][] = [];
    identity: EntityIdentity;

    age: number = 0;
    times: number[];

    computeScore() {
        return 0;
    };

    constructor(params: EntityParams) {
        this.times = [];
        const dna = params.dna || Genome.generateGenes(params);
        const {
            inputs, outputs, nodes, identity
        } = Genome.fromGenes(dna);
        this.inputs = inputs;
        this.outputs = outputs;
        this.nodes = nodes;
        this.identity = identity;
    }

    run(inputs: number[]): number[] {
        const start = new Date().getTime();
        for (let i = 0; i < this.inputs.length; i++) {
            this.inputs[i].run(inputs[i]);
        }
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = 0; j < this.nodes[i].length; j++) {
                this.nodes[i][j].run();
            }
        }
        for (let i = 0; i < this.outputs.length; i++) {
            this.outputs[i].run();
        }
        const data = this.outputs.map(({currentValue}) => currentValue);
        this.times.push(new Date().getTime() - start);
        return data;
    }

    finish() {
        this.identity.fitness = this.computeScore();
    }

    toString() {
        return [
            this.identity.toString(),
            [
                this.inputs.map(i => i.toString()).join(NODE_SEPARATOR),
                ...this.nodes.map(nodeGroup => nodeGroup.map(n => n.toString()).join(NODE_SEPARATOR))
                    .reduce((agg: string[], curr: string) => [...agg, curr], []),
                this.outputs.map(o => o.toString()).join(NODE_SEPARATOR),
            ].join(GROUP_SEPARATOR)
        ].join(CATEGORY_SEPARATOR);
    }
}