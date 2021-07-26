import * as THREE from 'three';
import {HeatBall} from "./models/heat-ball.model";
import {HeatSource} from "./models/heat-source.model";

const CAR_MATERIALS: Record<string, number> = {
    'boring': 0x000000,
    'exploded': 0xff1111,
    'mud': 0xffaaff,
    'alive': 0x00ff00,
};

export class ThreeRHeat {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    sources: THREE.Object3D;
    balls: THREE.Mesh[] = [];

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.scene.add(this.camera);

        this.renderer = new THREE.WebGLRenderer({
            alpha: true
        });
        this.renderer.setSize(window.innerWidth - 10, window.innerHeight - 10);
        this.renderer.setClearColor(0x000000, 0);
        document.body.appendChild(this.renderer.domElement);

        this.sources = new THREE.Object3D();
        this.scene.add(this.sources);

        this.camera.position.z = 45;
    }

    init({getBall, sources, iteration}: { getBall: (i: number) => HeatBall | undefined, sources: HeatSource[], iteration: number }) {
        this.getBall = getBall;
        this.drawSources(sources);

        let ball: HeatBall | undefined;
        let i = 0;
        ball = this.getBall(i);
        while (!!ball) {
            if (iteration === 0) {
                const mesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.5),
                    new THREE.MeshBasicMaterial({color: 0x00ff00, side: THREE.DoubleSide})
                );

                this.scene.add(mesh);
                this.balls.push(mesh);
            } else {
                this.balls[i].position.set(0, 0, 0);
                this.balls[i].rotation.set(0, 0, 0);
            }
            i++;
            ball = this.getBall(i);
        }
    }

    async animate() {
        this.draw();
        this.renderer.render(this.scene, this.camera);
    };

    private draw() {
        let ball: HeatBall | undefined;
        let i = 0;
        ball = this.getBall(i);
        while (!!ball) {
            // if (ball.alive) {
            this.balls[i].position.set(ball.position.x, ball.position.y, 0.5);
            // this.balls[i].rotation.set(0, 0, ball.angle);
            // (this.balls[i].material as THREE.MeshBasicMaterial).color.setHex(CAR_MATERIALS[ball.status]);
            // if (!ball.alive) {
            //     ball.drawDead = false;
            // }
            // }
            i++;
            ball = this.getBall(i);
        }
    }

    private getBall = (i: number): HeatBall | undefined => undefined;

    private drawSources(sources: HeatSource[]) {
        this.scene.remove(this.sources);
        this.sources = new THREE.Object3D();
        for (let i = 0; i < sources.length; i++) {
            const source = sources[i];

            const geometry = new THREE.SphereGeometry(0.5);
            const material = new THREE.MeshBasicMaterial({
                color: source.coefficient > 0 ? 0xff0000 : 0x0000ff,
                side: THREE.DoubleSide
            });
            const sourceMesh = new THREE.Mesh(geometry, material);
            sourceMesh.position.set(source.position.x, source.position.y, 0.5);
            this.sources.add(sourceMesh);
        }
        this.sources.matrixAutoUpdate = false;
        this.scene.add(this.sources);
    }
}