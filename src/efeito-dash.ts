import { Actor, CollisionType, Color, Engine, Sprite, Vector } from "excalibur";
import { Resources } from "./resources";

export class EfeitoDash extends Actor {
    private idade = 0;

    constructor(pos: Vector, direcao: Vector, distancia: number, fantasma = false) {
        super({
            name: fantasma ? "Rastro do jogador" : "Vento do dash",
            pos: pos.clone(),
            rotation: fantasma ? 0 : direcao.toAngle(),
            collisionType: CollisionType.PreventCollision,
            z: fantasma ? 1.8 : 2.1
        });

        if (fantasma) {
            this.graphics.use(new Sprite({
                image: Resources.Jogador,
                sourceView: { x: 128, y: 128, width: 64, height: 64 },
                opacity: 0.32,
                tint: Color.fromHex("#d96b75")
            }));
        } else {
            this.graphics.use(new Sprite({
                image: Resources.Disparos,
                sourceView: { x: 73, y: 217, width: 54, height: 39 },
                destSize: { width: Math.max(64, distancia + 35), height: 28 },
                opacity: 0.8
            }));
        }
    }

    override onPreUpdate(_engine: Engine, delta: number): void {
        this.idade += delta;
        this.graphics.opacity = Math.max(0, 1 - this.idade / 160);
        if (this.idade >= 160) this.kill();
    }
}
