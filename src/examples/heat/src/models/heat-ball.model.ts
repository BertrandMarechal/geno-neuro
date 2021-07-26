import * as THREE from 'three';
import {Vector3} from 'three';
import {HeatSource} from "./heat-source.model";

export type HeatBallCheckPosition =
| 'front'
| 'left'
| 'right'
| 'back';

export class HeatBall {
    radius: number = 1;
    currentHeat: number = 0;
    heatLoss: number = 0.005;
    maxHeat: number = 1.5;
    minHeat: number = 0.2;
    position: Vector3 = new Vector3(0, 0, 0);
    direction: Vector3 = new Vector3(0, 0, 0);
    angle: number = 0;
    speed: number = 0.05;
    minSpeed: number = 0.02;
    maxSpeed: number = 0.2;
    age: number = 0;
    alive: boolean = true;

    checkPoints: Record<string, number> = {
        ['front']: -1,
        ['left']: -1,
        ['right']: -1,
        ['back']: -1,
    };

    constructor(worldDimension: number) {
        this.currentHeat = 1;
        // this.position = new Vector3(Math.random() * worldDimension * 2 - worldDimension, Math.random() * worldDimension * 2 - worldDimension);
        this.position = new Vector3();
        this.direction = new Vector3(Math.random(), Math.random()).normalize();
        this.angle = Math.random();
    }

    run(
        {accelerateValue, brakeValue, leftValue, rightValue}:
            { accelerateValue: number, brakeValue: number, leftValue: number, rightValue: number },
        heatSources: HeatSource[]
    ) {
        this.speed += (accelerateValue - brakeValue) * (this.maxSpeed - this.minSpeed) / 60;
        this.speed = Math.max(this.minSpeed, this.speed);
        this.speed = Math.min(this.maxSpeed, this.speed);
        const heatForPosition: number = heatSources
            .reduce((agg, curr) => agg + curr.getHeat(this.position), 0);
        this.currentHeat += heatForPosition - this.heatLoss;
        if (this.currentHeat > this.maxHeat) {
            this.alive = false;
        } else if (this.currentHeat < this.minHeat) {
            this.alive = false;
        }
        if (this.alive) {
            this.age++;
            this.angle += (leftValue - rightValue);
            this.direction = new THREE.Vector3(1, 0, 0)
                .applyAxisAngle(new THREE.Vector3(0, 0, 1), this.angle);
            this.position.addScaledVector(this.direction, this.speed);
        }
    }

    getCheckPoints(heatSources: HeatSource[], pointsToCheck: string[]): number[] {
        for (let i = 0; i < pointsToCheck.length; i++) {
            const pointToCheck = pointsToCheck[i] as HeatBallCheckPosition;
            this.checkPoints[pointToCheck] = 0;
            for (let j = 0; j < heatSources.length; j++) {
                const heatSource = heatSources[j];
                this.checkPoints[pointToCheck] += heatSource.getHeat(this.getVector(pointToCheck));
            }
        }
        return  pointsToCheck.map((name) => this.checkPoints[name]);
    }

    getVector(type: HeatBallCheckPosition): THREE.Vector3 {
        let p = this.position.clone();
        let d = this.direction.clone();
        let n = new THREE.Vector3(-d.y, d.x);
        switch (type) {
            case "front":
                p.addScaledVector(this.direction, this.radius);
                break;
            case "back":
                p.addScaledVector(this.direction, -this.radius);
                break;
            case "left":
                n.multiplyScalar(this.radius);
                p.add(n);
                break;
            case "right":
                n.multiplyScalar(-this.radius);
                p.add(n);
                break;
        }
        return p;
    }
}