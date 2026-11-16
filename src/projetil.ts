import { Actor, CollisionType, Engine, Ray, Scene, Sprite, Vector } from "excalibur";
import { Resources } from "./resources";
import { Inimigo } from "./inimigos";
import { Player } from "./player";
import { impactoParede } from "./efeitos-visuais";
import type { Disparo } from "./progresso";

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
        public readonly origem: "jogador" | "inimigo" = "jogador",
        private readonly plasma = false,
        private readonly disparo?: Disparo
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
        if (this.plasma) {
            this.graphics.use(new Sprite({ image: Resources.Plasma, destSize: { width: 55, height: 55 } }));
            return;
        }
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
        if (temParede(this.scene, this.pos, proximaPosicao)) {
            impactoParede(this.scene, proximaPosicao);
            this.kill();
            return;
        }
        if (this.tempo >= 1500 ||
            proximaPosicao.x < 0 || proximaPosicao.x > 800 ||
            proximaPosicao.y < 0 || proximaPosicao.y > 600) {
            this.kill();
            return;
        }
        if (this.origem === "jogador") {
            const inimigos = this.scene.actors.filter(
                (actor): actor is Inimigo => actor instanceof Inimigo && !actor.isKilled()
            );

            for (const inimigo of inimigos) {
                if (proximaPosicao.distance(inimigo.pos) < 25) {
                    inimigo.receberDano(this.dano, this.direcao, this.disparo);
                    if (this.plasma) {
                        impactoParede(this.scene, inimigo.pos);
                        for (const outro of inimigos) {
                            if (outro !== inimigo && !outro.isKilled() && outro.pos.distance(inimigo.pos) < 75 && !temParede(this.scene, inimigo.pos, outro.pos)) outro.receberDano(this.dano * .6, this.direcao, this.disparo);
                        }
                    }
                    this.kill();
                    return;
                }
            }
        }
        if (this.origem === "inimigo") {
            const jogador = this.scene.actors.find(
                actor => actor instanceof Player
            );

            if (jogador instanceof Player && !jogador.invulneravel &&
                proximaPosicao.distance(jogador.pos) < 25) {
                jogador.receberDano();
                this.kill();
                return;
            }
        }
        this.pos = proximaPosicao;
    }
}
