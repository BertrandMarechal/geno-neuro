import {Input} from "./input";
import {Output} from "./output.model";
import {Node} from "./node";
import {Link} from "./link.model";
import {Entity, EntityParams} from "./entity.model";
import {EntityIdentity} from "./entity-identity.model";

export const LINK_THRESHOLD_TO_IGNORE = 0.01;
export const ENTITY_SEPARATOR = '#';
export const CATEGORY_SEPARATOR = '|';
export const GENE_SEPARATOR = ';';
export const SUB_GENE_SEPARATOR = ',';
export const GROUP_SEPARATOR = '@';
export const NODE_SEPARATOR = '&';
export const PROPERTY_SEPARATOR = '-';
export type GenerateGenesParams = Pick<EntityParams, 'id' | 'inputCount' | 'outputCount' | 'nodeCounts' | 'motherDna' | 'fatherDna'>;

export interface EvolutionParams {
    mutationRate: number;
    newCreaturePercent: number;
    keepTopPercent?: number;
    topParentsPercent: number;
}

export class Genome {
    // identity|nodes

    // identity: id;motherId;matherId;score;age;averageSpeed
    // nodes: id;coefficient;from1-from2@id;coefficient;from1-from2
    // with from/to = id,threshold
    private _genes: string = '';

    constructor(genes: string) {
        this._genes = genes;
    }

    static fromGenes(genes: string): {
        inputs: Input[];
        outputs: Output[];
        nodes: Node[][];
        identity: EntityIdentity;
    } {
        const inputs: Input[] = [];
        const outputs: Output[] = [];
        const nodes: Node[][] = [];

        const nodesMapped: Record<number, Node> = {};
        const [identityToSplit, nodesToSplit] = genes
            .split(CATEGORY_SEPARATOR);

        const identity = new EntityIdentity(identityToSplit);
        const linksToCreate: number[][] = [];
        const nodesSplit = nodesToSplit
            .split(GROUP_SEPARATOR)
            .map((s, i) => s
                .split(NODE_SEPARATOR)
            );
        for (let i = 0; i < nodesSplit.length; i++) {
            const nodesInGroup = nodesSplit[i];
            if (i > 0 && i < nodesSplit.length - 1) {
                nodes.push([]);
            }
            for (let j = 0; j < nodesInGroup.length; j++) {
                let newNode: Node = new Node(nodesInGroup[j]);
                if (i === 0) {
                    newNode = new Input(nodesInGroup[j]);
                    inputs.push(newNode as Input);
                } else if (i === nodesSplit.length - 1) {
                    newNode = new Output(nodesInGroup[j]);
                    outputs.push(newNode);
                    const newLinks = nodesInGroup[j]
                        .split(GENE_SEPARATOR)[2]
                        .split(PROPERTY_SEPARATOR)
                        .map(f => [newNode.id, ...f.split(SUB_GENE_SEPARATOR).map(x => +x)]);
                    for (let k = 0; k < newLinks.length; k++) {
                        linksToCreate.push(newLinks[k]);
                    }
                } else {
                    nodes[nodes.length - 1].push(newNode);
                    const newLinks = nodesInGroup[j]
                        .split(GENE_SEPARATOR)[2]
                        .split(PROPERTY_SEPARATOR)
                        .map(f => [newNode.id, ...f.split(SUB_GENE_SEPARATOR).map(x => +x)]);
                    for (let k = 0; k < newLinks.length; k++) {
                        linksToCreate.push(newLinks[k]);
                    }
                }
                nodesMapped[newNode.id] = newNode;
            }
        }

        for (let i = 0; i < linksToCreate.length; i++) {
            // console.log(linksToCreate);
            const newLink = new Link(
                nodesMapped[linksToCreate[i][1]],
                nodesMapped[linksToCreate[i][0]],
                linksToCreate[i][2]
            );
            // if (newLink.threshold > LINK_THRESHOLD_TO_IGNORE) {
            // console.log(nodesMapped, linksToCreate[i]);
            try {
                nodesMapped[linksToCreate[i][1]].addTo(newLink);
            } catch (e) {
                console.log(genes);
                throw e;
            }
            nodesMapped[linksToCreate[i][0]].addFrom(newLink);
            // }
        }

        return {inputs, outputs, nodes, identity};
    }

    static generateGenes(params: GenerateGenesParams) {
        const nodes = this.generateNodes(params);
        return [
            EntityIdentity.generateNew(params.id, params),
            nodes
        ].join(CATEGORY_SEPARATOR);
    }

    private static generateNodes(params: GenerateGenesParams): string {
        const nodes: string[] = [];
        if (params.nodeCounts && params.inputCount && params.outputCount) {
            let tempNodes: string[] = [];
            const nodeParams: {
                previousLayerNodeIds: { id: number }[],
                currentLayerNodeIds: { id: number }[],
            } = {
                previousLayerNodeIds: [],
                currentLayerNodeIds: [],
            };
            let id = 0;
            for (let i = 0; i < params.inputCount; i++) {
                tempNodes.push(Input.generateNew(id));
                nodeParams.currentLayerNodeIds.push({id});
                id++;
            }
            nodes.push(tempNodes.join(NODE_SEPARATOR));
            tempNodes = [];
            for (let i = 0; i < params.nodeCounts.length; i++) {
                nodeParams.previousLayerNodeIds = [...nodeParams.currentLayerNodeIds];
                nodeParams.currentLayerNodeIds = [];
                for (let j = 0; j < params.nodeCounts[i]; j++) {
                    tempNodes.push(Node.generateNew(id, nodeParams));
                    nodeParams.currentLayerNodeIds.push({id});
                    id++;
                }
                nodes.push(tempNodes.join(NODE_SEPARATOR));
                tempNodes = [];
            }

            nodeParams.previousLayerNodeIds = [...nodeParams.currentLayerNodeIds];
            nodeParams.currentLayerNodeIds = [];

            for (let i = 0; i < params.outputCount; i++) {
                tempNodes.push(Output.generateNew(id, nodeParams));
                id++;
            }

            nodes.push(tempNodes.join(NODE_SEPARATOR));
        }
        return nodes.join(GROUP_SEPARATOR);
    }


    static generateChild(index: number, mother: Entity, father: Entity, params: {
        mutationRate: number
    }): string {
        const childEntityIdentity = EntityIdentity.generateChild(index, mother.identity, father.identity);
        const childNodes = [
            Node.mergeAndMutate(mother.inputs, father.inputs, params.mutationRate),
            ...mother.nodes.map((ns, i) =>
                Node.mergeAndMutate(ns, father.nodes[i], params.mutationRate)),
            Node.mergeAndMutate(mother.outputs, father.outputs, params.mutationRate),
        ];

        return [
            childEntityIdentity.toString(),
            childNodes.map((nodeGroup) =>
                nodeGroup
                    .map(node => node.toString())
                    .join(NODE_SEPARATOR)
            ).join(GROUP_SEPARATOR)
        ].join(CATEGORY_SEPARATOR);
    }
}