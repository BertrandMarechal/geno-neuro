import * as THREE from 'three';

const STRAIGHT_LENGTH__CIRCUIT_RACING = 40;

export class CircuitPart {
    straight: boolean;
    startIsStart: boolean;
    start: THREE.Vector3;
    end: THREE.Vector3;
    center: THREE.Vector3;

    radius: number;
    width: number;
    startAngle: number = 0;
    endAngle: number = 0;
    clockwise: boolean = false;

    isInPart(point: THREE.Vector3): boolean { return false; };

    constructor({
                    width,
                    start,
                    end,
                    center,
                    startAngle,
                    endAngle,
                    startIsStart,
                    radius,
                }: {
        width: number;
        start?: THREE.Vector3;
        end?: THREE.Vector3;
        center?: THREE.Vector3;
        startAngle?: number;
        endAngle?: number;
        startIsStart?: boolean;
        radius?: number;
    }) {
        this.width = width;
        this.start = start || new THREE.Vector3(0, 0);
        this.end = end || new THREE.Vector3(0, 0);
        this.center = center || new THREE.Vector3(0, 0);
        this.straight = !radius;
        this.startAngle = (startAngle || 0);
        this.endAngle = (endAngle || 0);
        this.startIsStart = startIsStart || false;
        this.radius = radius || 0;
        this.clockwise = false;

        if (this.straight) {
            const ab = this.end.clone().sub(this.start);
            const dab = ab.length();
            const xab = ab.x;
            const yab = ab.y;
            const rest = this.end.x * this.start.y - this.end.y * this.start.x;

            this.isInPart = (point: THREE.Vector3) => {
                const ac = point.clone().sub(this.start);
                const bc = point.clone().sub(this.end);
                if (ab.dot(ac) * ab.dot(bc) <= 0) {
                    return Math.abs(
                        yab * point.x - xab * point.y + rest
                    ) / dab < this.width / 2;
                }
                return false;
            }
        } else {
            this.clockwise = this.startAngle > this.endAngle;

            const min = this.radius - this.width / 2;
            const max = this.radius + this.width / 2;

            let [minAngle, maxAngle] = [this.startAngle, this.endAngle];

            if (this.clockwise) {
                [minAngle, maxAngle] = [this.endAngle, this.startAngle]
            }
            this.isInPart = (point: THREE.Vector3) => {
                const oc = point.clone().sub(this.center);
                const doc = oc.length();
                if (doc <= max && doc >= min) {
                    const dot = oc.x;
                    const det = oc.y;
                    let angle: number;
                    if (oc.y === 0) {
                        angle = oc.x < 0 ? Math.PI : 0;
                    } else if (oc.x === 0) {
                        angle = oc.y < 0 ? 3 * Math.PI / 2.0 : Math.PI / 2.0;
                    } else {
                        angle = Math.atan2(det, dot);
                    }
                    if (angle < 0) {
                        angle += 2 * Math.PI;
                    }
                    return angle >= minAngle && angle <= maxAngle;
                }
                return false;
            }
        }
    }

    checkVector(point: THREE.Vector3): boolean {
        return this.isInPart(point);
    }
}

export class Circuit {
    width: number;
    parts: CircuitPart[];

    constructor(width: number) {
        this.width = width || 5;
        const farLeft = -STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0 * 1.2;
        const farRight = -farLeft;
        this.parts = [
            new CircuitPart({
                startIsStart: true,
                width: this.width,
                start: new THREE.Vector3(0, 0),
                end: new THREE.Vector3(farRight, 0),
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farRight, STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 3 * Math.PI / 2.0,
                endAngle: 2 * Math.PI,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farRight, STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 0,
                endAngle: Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farRight, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI,
                endAngle: 3 * Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farRight, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI / 2.0,
                endAngle: Math.PI,
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farRight, 5 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 3 * Math.PI / 2.0,
                endAngle: 2 * Math.PI,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farRight, 5 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 0,
                endAngle: Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width,
                start: new THREE.Vector3(farRight, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING),
                end: new THREE.Vector3(farLeft, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING),
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farLeft, 5 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI / 2.0,
                endAngle: Math.PI,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farLeft, 5 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI,
                endAngle: 3 * Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farLeft, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 0,
                endAngle: Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farLeft, 3 * STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: 3 * Math.PI / 2.0,
                endAngle: 2 * Math.PI,
            }),

            new CircuitPart({
                width: this.width,
                center: new THREE.Vector3(farLeft, STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI / 2.0,
                endAngle: Math.PI,
            }),

            new CircuitPart({
                width: this.width * 0.9,
                center: new THREE.Vector3(farLeft, STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0),
                radius: STRAIGHT_LENGTH__CIRCUIT_RACING / 2.0,
                startAngle: Math.PI,
                endAngle: 3 * Math.PI / 2.0,
            }),

            new CircuitPart({
                width: this.width,
                start: new THREE.Vector3(farLeft, 0),
                end: new THREE.Vector3(0, 0),
            }),
        ];
    }

    get partCount() {
        return this.parts.length;
    }

    checkVector(point: THREE.Vector3): number {
        const p = point.clone();
        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            if (part.checkVector(p)) {
                return i;
            }
        }
        return -1;
    }
}