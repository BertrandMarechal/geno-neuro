import {Parser} from "./parser.model";
import {Evolvable} from "./evolvable.model";
import {PROPERTY_SEPARATOR} from "./genome.model";

export class EntityIdentity implements Parser, Evolvable{
    id: number;
    generation?: number;
    originGeneration?: number;
    fatherId?: number;
    motherId?: number;

    fitness: number;
    age: number;
    averageSpeed: number;

    constructor(genome: string) {
        this.id = 0;
        this.fitness = 0;
        this.age = 0;
        this.averageSpeed = 0;
        this.fromString(genome);
    }

    fromString(genome: string): void {
        const [id, generation, originGeneration, motherId, fatherId] = genome.split(PROPERTY_SEPARATOR);
        this.id = +id;
        this.generation = +generation;
        this.originGeneration = +originGeneration;
        this.motherId = +motherId;
        this.fatherId = +fatherId;
    }

    toString(): string {
        return [
            this.id,
            this.generation,
            this.originGeneration,
            this.motherId,
            this.fatherId,
            this.fitness,
            this.age,
            this.averageSpeed,
        ].join(PROPERTY_SEPARATOR);
    }

    static generateNew(index: number, params: any): any {
        return [index,0,0,'','','','',''].join(PROPERTY_SEPARATOR);
    }

    static generateChild(index: number, mother: EntityIdentity, father: EntityIdentity): any {
        return new EntityIdentity([
            index,
            mother.generation,
            Math.min(father.originGeneration as number, mother.originGeneration as number),
            mother.id,
            father.id
        ].join(PROPERTY_SEPARATOR));
    }
}