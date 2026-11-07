import { Actor, CollisionType, Engine, Keys, Sprite, vec } from "excalibur";
import { Resources } from "./resources";

export class Player extends Actor {
    private readonly velocidade = 240;

    constructor() {
        super({
            name: "Player",
            pos: vec(100, 300),
            // Colisão nos pés para contornar as paredes
            radius: 12,
            collisionType: CollisionType.Active,
            z: 2
        });
    }

    override onInitialize(): void {
        this.graphics.use(new Sprite({
            image: Resources.Jogador,
            sourceView: { x: 0, y: 0, width: 64, height: 64 }
        }));

        // Alinha os pés com a colisão
        this.graphics.offset = vec(0, -14);
    }

    override onPreUpdate(engine: Engine): void {
        const teclado = engine.input.keyboard;

        let x = 0;
        let y = 0;

        if (teclado.isHeld(Keys.W) || teclado.isHeld(Keys.Up)) y -= 1;
        if (teclado.isHeld(Keys.S) || teclado.isHeld(Keys.Down)) y += 1;
        if (teclado.isHeld(Keys.A) || teclado.isHeld(Keys.Left)) x -= 1;
        if (teclado.isHeld(Keys.D) || teclado.isHeld(Keys.Right)) x += 1;

        if (x !== 0) this.graphics.flipHorizontal = x < 0;

        if (x !== 0 || y !== 0) {
            // Mantém a velocidade nas diagonais
            this.vel = vec(x, y).normalize().scale(this.velocidade);
        } else {
            this.vel = vec(0, 0);
        }
    }
}
