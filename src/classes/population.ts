import {Entity} from "./entity.model";
import {ENTITY_SEPARATOR, EvolutionParams, Genome} from "./genome.model";

export interface PopulationParams {
    dnas?: string;
    entityCount: number;
    inputCount?: number;
    outputCount?: number;
    nodeCounts?: number[];
    iteration: number;
}

export class Population {
    entities: Entity[] = [];
    params: PopulationParams;
    best: number = 0;

    constructor(params: PopulationParams) {
        this.params = params;
        this.entities = [];
        if (params.dnas) {
            const dnas = params.dnas.split(ENTITY_SEPARATOR);
            for (let i = 0; i < dnas.length; i++) {
                this.entities.push(new Entity({
                    ...params,
                    id: i,
                    dna: dnas[i]
                }));
            }
        } else {
            for (let i = 0; i < params.entityCount; i++) {
                this.entities.push(new Entity({
                    ...params,
                    id: i
                }));
            }
        }
    }

    finish(iteration: number) {
        for (let i = 0; i < this.entities.length; i++) {
            this.entities[i].finish();
        }
        this.entities.sort((a, b) => b.identity.fitness - a.identity.fitness);
        this.best = this.entities[0].identity.fitness;

        console.log(`Iteration: ${iteration}, Best : ${this.entities[0].identity.fitness}`);
    }

    evolve(params: EvolutionParams): string {
        const keepTopCount = Math.floor((params.keepTopPercent || 0)  / 100.0 * this.entities.length);
        const newCreaturesCount = Math.floor((params.newCreaturePercent || 0) / 100.0 * this.entities.length);
        const parentsForChildrenCount = Math.ceil((params.topParentsPercent || 0) / 100.0 * this.entities.length);

        // console.log(`Total: ${this.entities.length}, To Keep: ${keepTopCount}, Children: ${this.entities.length - keepTopCount - newCreaturesCount}, New: ${newCreaturesCount}`);
        const newEntitiesString: string[] = [];
        let creaturesLeftToCreate = this.entities.length;
        let index = 0;
        for (let i = 0; i < keepTopCount; i++) {
            const entityString = this.entities[i].toString();
            newEntitiesString.push(
                entityString.replace(
                    new RegExp(`^${this.entities[i].identity.id};`),
                    `${index};`
                )
            );
            index++;
            creaturesLeftToCreate--;
        }

        // we get the top 20%, and create children
        const slicedEntities = this.entities.slice(0, parentsForChildrenCount);
        while(creaturesLeftToCreate > newCreaturesCount) {
            let mother = slicedEntities[Math.floor(slicedEntities.length * Math.random())];
            let father = slicedEntities[Math.floor(slicedEntities.length * Math.random())];
            newEntitiesString.push(
                Genome.generateChild(index, mother, father, params)
            );
            index++;
            creaturesLeftToCreate--;
        }

        while(creaturesLeftToCreate > 0) {
            newEntitiesString.push(
                new Entity({
                    ...this.params,
                    id: index
                }).toString()
            );
            index++;
            creaturesLeftToCreate--;
        }

        return newEntitiesString.join(ENTITY_SEPARATOR);
    }

    getEntity(i: number): Entity {
        return this.entities[i];
    }

    toString() {
        return this.entities.map(e => e.toString()).join(ENTITY_SEPARATOR);
    }
}