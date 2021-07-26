import {ThreeRacing} from "./three";

export const FPS__RACING = 240;// = 60;
export const TIME__RACING = 720; // s

import {Circuit} from "./models/circuit.model";
import {Car, MAX_SPEED__PER_FRAME__CAR_RACING} from "./models/car.model";
// @ts-ignore
import {Population, PopulationParams} from "../../../classes/population";


const ENTITY_COUNT = 150;
const CIRCUIT_WIDTH = 6;
const REFRESH_EVERY = 10;

const populationParams: PopulationParams = {
    entityCount: ENTITY_COUNT,
    inputCount: 9, // [speed, front, front far, left, left far, left front far, right, right far, right front far]
    outputCount: 4, // [accelerate, brake, left, right]
    nodeCounts: [11, 6],
    iteration: 0
};

export class Racing {
    population: Population;
    treeRacing = new ThreeRacing();
    circuit?: Circuit;
    cars: Car[] = [];
    currentBest: number = 0;

    constructor() {
        this.population = new Population(populationParams);
    }

    async run() {
        const entityCount = ENTITY_COUNT;
        const iterrations = 2000;
        const maxTestCount = TIME__RACING * 1000 / FPS__RACING;
        let testCount = maxTestCount;
        let startLoop: number;
        let better = false;
        console.log('Total iterations per loop', testCount);
        for (let k = 0; k < iterrations; k++) {
            this.circuit = new Circuit(CIRCUIT_WIDTH);
            this.cars = [];

            for (let i = 0; i < entityCount; i++) {
                this.cars.push(new Car({circuitPartCount: this.circuit.partCount}));
            }
            const runningCars = [
                ...this.cars.map((_, i) => i)
            ];

            this.treeRacing.init({
                getCar: (i) => this.cars[i],
                circuit: this.circuit as Circuit,
                iteration: k
            });

            for (let i = 0; i < testCount && runningCars.length > 0; i++) {
                startLoop = new Date().getTime();
                for (let j = runningCars.length - 1; j > -1; j--) {
                    const car = this.cars[runningCars[j]];
                    if (car.alive) {
                        const entity = this.population.getEntity(runningCars[j]);
                        const [accelerateValue, brakeValue, leftValue, rightValue] = entity.run([
                            car.speed / MAX_SPEED__PER_FRAME__CAR_RACING,
                            ...car.getCheckPoints(this.circuit, [
                                'front',
                                'front far',
                                'left',
                                'left far',
                                'left front far',
                                'right',
                                'right far',
                                'right front far',
                            ])
                        ]);
                        car.run({leftValue, rightValue, accelerateValue, brakeValue});
                        const cornersValues = car.getCheckPoints(this.circuit, [
                            'corner front left', 'corner front right', 'corner back left', 'corner back right'
                        ]);

                        car.checkRun(cornersValues);
                    } else {
                        runningCars.splice(j, 1);
                    }

                }
                if (better) {
                    await this.treeRacing.animate();
                    const remainingTimeForFPS = 1000 / FPS__RACING - (new Date().getTime() - startLoop);
                    if (remainingTimeForFPS) {
                        await new Promise(resolve => setTimeout(resolve, remainingTimeForFPS));
                    }
                }
            }


            for (let i = 0; i < entityCount; i++) {
                const entity = this.population.getEntity(i);
                const car = this.cars[i];
                entity.computeScore = () =>
                    car.partsDone + car.totalDistance / 10000
                    ;
            }
            this.population.finish(k);


            better = (this.population.best - this.currentBest) > 0.001 &&
                k > 2 &&
                this.population.best > 2;
            this.currentBest = this.population.best;

            if (better && runningCars.length > 0 && testCount <= maxTestCount) {
                testCount += 60  * 1000 / FPS__RACING;
                console.log('Total iterations per loop', testCount);
            }

            if (k + 1 < iterrations) {
                populationParams.dnas = this.population.evolve({
                    newCreaturePercent: 50,
                    keepTopPercent: 10,
                    topParentsPercent: 10,
                    mutationRate: 0.1,
                });

                populationParams.iteration = k + 1;
                this.population = new Population(populationParams);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
    }
}