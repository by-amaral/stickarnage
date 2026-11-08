import { Actor, CollisionType, Engine, Ray, Scene, Sprite, Vector } from "excalibur";
import { Resources } from "./resources";
import { Inimigo } from "./inimigos";

// Verifica o caminho inteiro até o próximo ponto
export function temParede(scene: Scene, inicio: Vector, fim: Vector): boolean {
    const trecho = fim.sub(inicio);
    const distancia = trecho.magnitude;
    if (distancia === 0) return false;

    return scene.physics.rayCast(new Ray(inicio, trecho.normalize()), {
        maxDistance: distancia,
        filter: hit => hit.body.collisionType === CollisionType.Fixed
    }).length > 0;
}

// Calcula a distância segura para um dash
export function distanciaLivre(scene: Scene, inicio: Vector, direcao: Vector, limite: number): number {
    const acertos = scene.physics.rayCast(new Ray(inicio, direcao), {
        maxDistance: limite,
        filter: hit => hit.body.collisionType === CollisionType.Fixed
    });
    return acertos.length ? Math.max(0, acertos[0].distance - 14) : limite;
}

export class Projetil extends Actor {
    private tempo = 0;

    constructor(
        posicao: Vector,
        private readonly direcao: Vector,
        public readonly dano = 1,
        public readonly origem: "jogador" | "inimigo" = "jogador"
    ) {
        super({
            name: "Projetil",
            pos: posicao.clone(),
            rotation: direcao.toAngle(),
            collisionType: CollisionType.PreventCollision,
            z: 3
        });
    }

    override onInitialize(): void {
        this.graphics.use(new Sprite({
            image: Resources.Disparos,
            sourceView: { x: 20, y: 93, width: 23, height: 5 },
            destSize: { width: 12, height: 3 }
        }));
    }

    override onPreUpdate(_engine: Engine, delta: number): void {
        if (!this.scene) return;

        this.tempo += delta;
        const proximaPosicao = this.pos.add(this.direcao.scale(650 * delta / 1000));
        if (this.origem === "jogador") {
            const inimigos = this.scene.actors.filter(
                actor => actor instanceof Inimigo
            );

            for (const inimigo of inimigos) {
                if (proximaPosicao.distance(inimigo.pos) < 25) {
                    inimigo.receberDano();
                    this.kill();
                    return;
                }
            }
        }
        if (this.origem === "jogador") {
            const inimigo = this.scene.actors.find(actor => actor instanceof Inimigo);

            if (inimigo && proximaPosicao.distance(inimigo.pos) < 15) {
                inimigo.receberDano();
                this.kill();
                return;
            }
        }
        if (temParede(this.scene, this.pos, proximaPosicao) ||
            this.tempo >= 1500 ||
            proximaPosicao.x < 0 || proximaPosicao.x > 800 ||
            proximaPosicao.y < 0 || proximaPosicao.y > 600) {
            this.kill();
            return;
        }

        this.pos = proximaPosicao;
    }
}
