import {Vector3} from 'three';

export class HeatSource {
    coefficient: number = 0;
    heatRadius: number = 0;
    position: Vector3 = new Vector3(0,0,0);

    constructor(coefficient: number, worldDimension: number) {
        this.coefficient = coefficient;
        this.heatRadius = worldDimension / 4.0;
        // this.heatRadius = Math.random() * worldDimension / 2.0 + worldDimension / 2.0;
        this.position = new Vector3(
            Math.random() * worldDimension * 2 - worldDimension,
            Math.random() * worldDimension * 2 - worldDimension
        );
    }

    getHeat(position: Vector3): number {
        const length = this.position.clone().sub(position).length();
        if (length < this.heatRadius) {
            return this.coefficient * (1 - length / this.heatRadius);
        }
        return 0;
    }
}