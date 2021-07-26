
import * as THREE from 'three';
import {Circuit} from "./models/circuit.model";
import {Car} from "./models/car.model";

const CAR_INDICATOR_GEOMETRY = new THREE.SphereGeometry(0.25);
const CAR_GEOMETRY = new THREE.BoxGeometry(3, 2, 1.2);
const CAR_MATERIALS: Record<string, number> = {
    'boring': 0x000000,
    'exploded': 0xff1111,
    'mud': 0xffaaff,
    'alive': 0x00ff00,
};

export class ThreeRacing {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    circuit: THREE.Object3D;
    cars: THREE.Mesh[] = [];

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        // const width = 80;
        // const height = 40;
        // const camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000 );
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            alpha : true
        });
        this.renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);

        this.circuit = new THREE.Object3D();
        this.scene.add(this.circuit);

        this.camera.position.z = 100;
        this.camera.position.y = 60;
    }

    init({getCar, circuit, iteration}: { getCar: (i: number) => Car | undefined, circuit: Circuit, iteration: number }) {
        this.getCar = getCar;
        this.drawCircuit(circuit);

        let car: Car | undefined;
        let i = 0;
        car = this.getCar(i);
        while (!!car) {
            if (iteration === 0) {
                const mesh = new THREE.Mesh(CAR_GEOMETRY, new THREE.MeshBasicMaterial( { color: 0x0000ff } ) );
                if (car) {
                    const carPositions = [
                        car.getVector('corner front left'),
                        car.getVector('corner front right'),
                        car.getVector('corner back left'),
                        car.getVector('corner back right'),

                        car.getVector('front'),
                        car.getVector('front far'),
                        car.getVector('left'),
                        car.getVector('left far'),
                        car.getVector('left front far'),
                        car.getVector('right'),
                        car.getVector('right far'),
                        car.getVector('right front far'),
                    ];
                    carPositions.forEach((position, i) => {
                        const carIndicatorMaterial = new THREE.MeshBasicMaterial({color: i < 4 ? 0x00ffff : 0xff0000});
                        const indicatorMesh = new THREE.Mesh(CAR_INDICATOR_GEOMETRY, carIndicatorMaterial);
                        indicatorMesh.translateX(position.x);
                        indicatorMesh.translateY(position.y);
                        mesh.add(indicatorMesh);
                    });
                }

                this.scene.add(mesh);
                this.cars.push(mesh);
            } else {
                this.cars[i].position.set(0, 0, 0);
                this.cars[i].rotation.set(0, 0, 0);
            }
            i++;
            car = this.getCar(i);
        }

    }

    async animate() {
        this.draw();
        this.renderer.render(this.scene, this.camera);
    };

    private draw() {
        let car: Car | undefined;
        let i = 0;
        car = this.getCar(i);
        while (!!car) {
            if (car.alive || car.drawDead) {
                this.cars[i].position.set(car.position.x, car.position.y, car.position.z);
                this.cars[i].rotation.set(0, 0, car.rotationAngle);
                (this.cars[i].material as THREE.MeshBasicMaterial).color.setHex(CAR_MATERIALS[car.status]);
                if (!car.alive) {
                    car.drawDead = false;
                }
            }
            i++;
            car = this.getCar(i);
        }
    }

    private getCar = (i: number): Car | undefined => undefined;

    private drawCircuit(circuit: Circuit) {
        this.scene.remove(this.circuit);
        this.circuit = new THREE.Object3D();
        for (let i = 0; i < circuit.parts.length; i++) {
            const part = circuit.parts[i];
            if (part.straight) {
                const v = new THREE.Vector3().add(part.end).sub(part.start);
                const length = v.length();
                const d = v.normalize();
                const geometry = new THREE.PlaneGeometry(length, part.width, 4);
                const material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
                const planeObject = new THREE.Object3D();
                const plane = new THREE.Mesh(geometry, material);
                planeObject.add(plane);

                const planeStart = new THREE.Vector3(part.start.x, part.start.y);
                const angle = -d.angleTo(new THREE.Vector3(1, 0, 0));

                plane.translateOnAxis(new THREE.Vector3(
                    1, 0, 0
                ), length / 2);
                planeObject.translateX(planeStart.x);
                planeObject.translateY(planeStart.y);
                planeObject.rotateZ(angle);

                // planeObject.name = `circuit_part_${i}`;
                // plane.name = `circuit_part_${i}`;

                this.circuit.add(planeObject);
            } else {
                const geometry = new THREE.RingGeometry(
                    part.radius - part.width / 2.0,
                    part.radius + part.width / 2.0,
                    32,
                    32,
                    part.startAngle,
                    Math.abs(part.endAngle - part.startAngle)
                );
                const material = new THREE.MeshBasicMaterial({color: 0xffff00, side: THREE.DoubleSide});
                const mesh = new THREE.Mesh(geometry, material);
                mesh.translateX(part.center.x);
                mesh.translateY(part.center.y);
                // mesh.name = `circuit_part_${i}`;
                this.circuit.add(mesh);
            }
        }
        this.circuit.matrixAutoUpdate = false;
        this.scene.add(this.circuit);
    }
}