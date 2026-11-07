import { Actor, CollisionType, Color, Engine, Keys, vec } from "excalibur";

export class Player extends Actor {
    constructor() {
        super({
            name: "Player",
            pos: vec(100, 300),
            width: 32,
            height: 32,
            color: Color.fromHex("#ff4040"),
            collisionType: CollisionType.Active,
            z: 2
        });
    }

    override onPreUpdate(engine: Engine): void {
        const teclado = engine.input.keyboard;

        let x = 0;
        let y = 0;

        if (teclado.isHeld(Keys.W)) y -= 1;
        if (teclado.isHeld(Keys.S)) y += 1;
        if (teclado.isHeld(Keys.A)) x -= 1;
        if (teclado.isHeld(Keys.D)) x += 1;

        const velocidade = 240;

        if (x !== 0 || y !== 0) {
            this.vel = vec(x, y).normalize().scale(velocidade);
        } else {
            this.vel = vec(0, 0);
        }
    }
}