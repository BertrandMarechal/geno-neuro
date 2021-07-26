import * as THREE from 'three';
import {FPS__RACING} from "../main";
import {Circuit} from "./circuit.model";

const MAX_SPEED__CAR_RACING = 140.0; // kph
const TIME_TO_100__CAR_RACING = 15.0; // s
export const MAX_SPEED__PER_FRAME__CAR_RACING = MAX_SPEED__CAR_RACING
    * 1000 // to meter
    / (3600 * 1000) // per millisecond
    * FPS__RACING; // meter per frame
const ACCELERATION__PER_FRAME__CAR_RACING = 100
    * 1000 // to meter
    / (3600 * 1000) // per millisecond
    / TIME_TO_100__CAR_RACING
    * FPS__RACING; // m/millisecond per frame
const MAX_ROTATION_ANGLE__CAR_RACING = Math.PI / 4.0; // rad
const TIME_TO_MAX_ROTATION_ANGLE__CAR_RACING = 1; // s
const MAX_ROTATION_ANGLE_SPEED__RAD__PER_FRAME__CAR_RACING = MAX_ROTATION_ANGLE__CAR_RACING
    / (
        TIME_TO_MAX_ROTATION_ANGLE__CAR_RACING * 1000 // ms
    )
    * FPS__RACING;
const NATURAL_DESCELERATION_PER_FRAME__CAR_RACING = ACCELERATION__PER_FRAME__CAR_RACING * 0.05;

export type CarCheckPosition =
    | 'front'
    | 'front far'
    | 'left'
    | 'left far'
    | 'left front far'
    | 'right'
    | 'right far'
    | 'right front far'
    | 'corner front left'
    | 'corner front right'
    | 'corner back left'
    | 'corner back right'
    ;

interface CarRunParams {
    brakeValue: number;
    accelerateValue: number;
    leftValue: number;
    rightValue: number;
}

export class Car {
    speed: number;
    rotationAngle: number;
    previousRotationAngle: number;
    position: THREE.Vector3;
    previousPosition: THREE.Vector3;
    direction: THREE.Vector3;
    alive: boolean;
    length: number = 3;
    width: number = 2;
    isInGround: boolean = false;

    age: number = 0;
    currentCircuitPart: number = 0;
    lapTimes: number[] = [];
    circuitPartCount: number = 0;
    partsDone: number = 0;
    totalDistance: number = 0;
    status: string = 'alive';
    drawDead: boolean = false;
    checkPoints: Record<string, number> = {
        ['front']: -1,
        ['front far']: -1,
        ['left']: -1,
        ['left far']: -1,
        ['left front far']: -1,
        ['right']: -1,
        ['right far']: -1,
        ['right front far']: -1,
        ['corner front left']: -1,
        ['corner front right']: -1,
        ['corner back left']: -1,
        ['corner back right']: -1,
    };

    static transformCheckPoint(value: number): number {
        if (value < 0) {
            return 1;
        }
        return 0.5;
    }

    constructor({circuitPartCount}: {circuitPartCount: number}) {
        this.alive = true;
        this.speed = 0;
        this.rotationAngle = 0;
        this.circuitPartCount = circuitPartCount;
        this.position = new THREE.Vector3(0.01, 0);
        this.direction = new THREE.Vector3(1, 0);
        this.previousRotationAngle = this.rotationAngle;
        this.previousPosition = this.position.clone();
    }

    run(params: CarRunParams) {
        this.previousRotationAngle = this.rotationAngle;
        this.previousPosition = this.position.clone();

        this.age++;
        if (this.age > 500 && (this.partsDone === 0 || this.speed === 0)) {
            this.alive = false;
            this.drawDead = true;
            this.status = 'boring';
        }
        this.speed += ((params.accelerateValue || 0) - (params.brakeValue || 0))
            * ACCELERATION__PER_FRAME__CAR_RACING
        ;
        if (this.speed > MAX_SPEED__PER_FRAME__CAR_RACING) {
            if (this.speed > MAX_SPEED__PER_FRAME__CAR_RACING) {
                this.speed = MAX_SPEED__PER_FRAME__CAR_RACING;
            } else {
                this.speed -= ACCELERATION__PER_FRAME__CAR_RACING * 3;
            }
        }
        if (this.isInGround) {
            this.speed -= ACCELERATION__PER_FRAME__CAR_RACING * 0.01;
        }

        if (this.speed < 0) {
            this.speed = 0;
        }

        if (this.speed > 0) {
            // we only turn if we are moving
            this.rotationAngle += (params.leftValue - params.rightValue)
                * MAX_ROTATION_ANGLE_SPEED__RAD__PER_FRAME__CAR_RACING;
            // if (this.rotationAngle > MAX_ROTATION_ANGLE__CAR_RACING) {
            //     this.rotationAngle = MAX_ROTATION_ANGLE__CAR_RACING;
            // } else if (this.rotationAngle < -MAX_ROTATION_ANGLE__CAR_RACING) {
            //     this.rotationAngle = -MAX_ROTATION_ANGLE__CAR_RACING;
            // }
        }
        this.totalDistance += this.speed;
        this.direction = new THREE.Vector3(1, 0, 0)
            .applyAxisAngle(new THREE.Vector3(0, 0, 1), this.rotationAngle);
        this.direction.normalize();
        this.position.addScaledVector(this.direction, this.speed);
    }

    getCheckPoints(circuit: Circuit, pointsToCheck: string[]): number[] {
        for (let i = 0; i < pointsToCheck.length; i++) {
            const pointToCheck = pointsToCheck[i] as CarCheckPosition;
            this.checkPoints[pointToCheck] = circuit.checkVector(this.getVector(pointToCheck));
            if (pointToCheck.indexOf('corner') !== 0) {
                this.checkPoints[pointToCheck] = Car.transformCheckPoint(this.checkPoints[pointToCheck]);
            }
        }
        return  pointsToCheck.map((name) => this.checkPoints[name]);
    }

    checkRun(cornersValues: number[]) {
        this.status = 'alive';
        const wheelsInMud = cornersValues.filter(x => x === -1).length;
        if (cornersValues.includes(-2) || wheelsInMud > 2) {
            this.status = 'exploded';
            this.alive = false;
            this.drawDead = true;
        } else if (wheelsInMud === 2) {
            this.status = 'mud';
            this.isInGround = true;
        }

        if (this.status !== 'exploded') {
            const max = cornersValues.reduce((a, c) => Math.max(a, c), -1);

            if (this.currentCircuitPart + 1 === max) {
                this.currentCircuitPart = max;
                this.partsDone++;
            } else if (max === 0  && this.currentCircuitPart === this.circuitPartCount - 1) {
                this.currentCircuitPart = 0;
                this.partsDone++;
                this.lapTimes.push(this.age);
            }
        }
    }

    getVector(type: CarCheckPosition): THREE.Vector3 {
        let p = this.position.clone();
        let d = this.direction.clone();
        let n = new THREE.Vector3(-d.y, d.x);
        switch (type) {
            case "front":
                p.addScaledVector(this.direction, this.length);
                break;
            case "front far":
                p.addScaledVector(this.direction, this.length * 3);
                break;
            case "left":
                n.multiplyScalar(this.width * 1.5);
                p.add(n);
                break;
            case "left far":
                n.multiplyScalar(this.width * 2);
                d.multiplyScalar(this.length * 2);
                p.add(d);
                p.add(n);
                break;
            case "left front far":
                n.multiplyScalar(this.width * 1.5);
                d.multiplyScalar(this.length * 3);
                p.add(d);
                p.add(n);
                break;
            case "right":
                n.multiplyScalar(-this.width * 1.5);
                p.add(n);
                break;
            case "right far":
                n.multiplyScalar(-this.width * 2);
                d.multiplyScalar(this.length * 2);
                p.add(d);
                p.add(n);
                break;
            case "right front far":
                n.multiplyScalar(-this.width * 1.5);
                d.multiplyScalar(this.length * 3);
                p.add(d);
                p.add(n);
                break;
            case 'corner front left':
                n.multiplyScalar(this.width * 0.5);
                d.multiplyScalar(this.length * 0.5);
                p.add(d);
                p.add(n);
                break;
            case 'corner front right':
                n.multiplyScalar(-this.width * 0.5);
                d.multiplyScalar(this.length * 0.5);
                p.add(d);
                p.add(n);
                break;
            case 'corner back left':
                n.multiplyScalar(this.width * 0.5);
                d.multiplyScalar(-this.length * 0.5);
                p.add(d);
                p.add(n);
                break;
            case 'corner back right':
                n.multiplyScalar(-this.width * 0.5);
                d.multiplyScalar(-this.length * 0.5);
                p.add(d);
                p.add(n);
                break;
        }
        return p;
    }
}