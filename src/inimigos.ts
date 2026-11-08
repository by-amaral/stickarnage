import { Actor, CollisionType, Sprite, Animation, vec } from "excalibur";
import { Resources } from "./resources";
export class Inimigo extends Actor {
    private vida = 2;
    private prepararSprites(): Sprite[] {
        const sprites: Sprite[] = [];

        for (let i = 0; i < 4; i++) {
            sprites.push(new Sprite({
                image: Resources.Inimigos,
                sourceView: {
                    x: i * 64,
                    y: 128,
                    width: 64,
                    height: 64
                }
            }));
        }

        return sprites;
    }
    constructor(tipo: number, x: number, y: number) {
        super({
            name: "Inimigo",
            pos: vec(x, y),
            radius: 12,
            collisionType: CollisionType.Active,
            z: 2
        });
        const quadros = this.prepararSprites();
        const animacao = new Animation({
            frames: quadros.map(sprite => ({
                graphic: sprite,
                duration: 150
            }))
        });

        this.graphics.add("andar", animacao);
        this.graphics.use("andar");
        this.scale = vec(1.25, 1.25);
    }
    receberDano(): void {
        this.vida--;

        if (this.vida <= 0) {
            this.kill();
        }
    }
}