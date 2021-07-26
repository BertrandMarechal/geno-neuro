import {HeatSource} from "./models/heat-source.model";
// @ts-ignore
import {Population, PopulationParams} from "../../../classes/population";
import {HeatBall} from "./models/heat-ball.model";
import {ThreeRHeat} from "./three";

export const FPS__HEAT = 240;// = 60;
export const TIME__HEAT = 360; // s


const ENTITY_COUNT = 100;
const REFRESH_EVERY = 10;
const WORLD_SIZE = 10;

const populationParams: PopulationParams = {
    entityCount: ENTITY_COUNT,
    inputCount: 8, // [speed, angle, front, back, left, right, level, heat loss]
    outputCount: 4, // [accelerate, brake, left, right]
    nodeCounts: [10, 5],
    iteration: 0
};

export class Heat {
    population: Population;
    threeHeat = new ThreeRHeat();
    heatSources: HeatSource[] = [];
    heatBalls: HeatBall[] = [];
    currentBest: number = 0;

    constructor() {
        this.population = new Population(populationParams);
    }

    async run() {
        const entityCount = ENTITY_COUNT;
        const iterrations = 2000;
        const maxTestCount = TIME__HEAT * 1000 / FPS__HEAT;
        let testCount = maxTestCount;
        let startLoop: number;
        let better = false;
        console.log('Total iterations per loop', testCount);
        for (let k = 0; k < iterrations; k++) {
            this.heatSources = [
                new HeatSource(0.5, WORLD_SIZE),
                new HeatSource(-0.5, WORLD_SIZE),
            ];
            this.heatBalls = [];

            for (let i = 0; i < entityCount; i++) {
                this.heatBalls.push(new HeatBall(WORLD_SIZE));
            }
            const runningBalls = [
                ...this.heatBalls.map((_, i) => i)
            ];

            this.threeHeat.init({
                getBall: (i) => this.heatBalls[i],
                sources: this.heatSources,
                iteration: k
            });

            for (let i = 0; i < testCount && runningBalls.length > 0; i++) {
                startLoop = new Date().getTime();
                for (let j = runningBalls.length - 1; j > -1; j--) {
                    const ball = this.heatBalls[runningBalls[j]];
                    if (ball.alive) {
                        const entity = this.population.getEntity(runningBalls[j]);
                        const [accelerateValue, brakeValue, leftValue, rightValue] = entity.run([
                            ball.speed,
                            ball.angle,
                            ...ball.getCheckPoints(this.heatSources, [
                                'front',
                                'back',
                                'left',
                                'right',
                            ]),
                            ball.currentHeat,
                            ball.heatLoss
                        ]);
                        ball.run({leftValue, rightValue, accelerateValue, brakeValue}, this.heatSources);
                    } else {
                        runningBalls.splice(j, 1);
                    }

                }
                // if (better) {
                    await this.threeHeat.animate();
                    const remainingTimeForFPS = 1000 / FPS__HEAT - (new Date().getTime() - startLoop);
                    if (remainingTimeForFPS) {
                        await new Promise(resolve => setTimeout(resolve, remainingTimeForFPS));
                    }
                // }
            }


            for (let i = 0; i < entityCount; i++) {
                const entity = this.population.getEntity(i);
                const ball = this.heatBalls[i];
                entity.computeScore = () => ball.age;
            }
            this.population.finish(k);

            better = (this.population.best - this.currentBest) > 0.001 &&
                k > 2 &&
                this.population.best > 2;
            this.currentBest = this.population.best;

            // if (better && runningBalls.length > 0 && testCount <= maxTestCount) {
            //     testCount += 60  * 1000 / FPS__HEAT;
            //     console.log('Total iterations per loop', testCount);
            // }

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