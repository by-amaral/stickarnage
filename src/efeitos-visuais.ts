import { Actor, Canvas, CollisionType, Color, Engine, ImageSource, Scene, Sprite, Vector, vec } from "excalibur";
import { Resources } from "./resources";
import { prepararSangue } from "./sangue";

class EfeitoCurto extends Actor {
    private tempo = 0;
    constructor(posicao: Vector, imagem: ImageSource, private duracao: number, tamanho = 64, rotacao = 0) {
        super({ name: "Efeito de combate", pos: posicao.clone(), rotation: rotacao, collisionType: CollisionType.PreventCollision, z: 4 });
        this.graphics.use(new Sprite({ image: imagem, destSize: { width: tamanho, height: tamanho } }));
    }
    override onPreUpdate(_engine: Engine, delta: number): void {
        this.tempo += delta;
        this.graphics.opacity = Math.max(0, 1 - this.tempo / this.duracao);
        if (this.tempo >= this.duracao) this.kill();
    }
}

export class RastroMovimento extends Actor {
    private tempo = 0;
    private alfa: number;
    constructor(posicao: Vector, esquerda: boolean, frenesi: number) {
        super({ pos: posicao.clone(), scale: vec(1.25, 1.25), collisionType: CollisionType.PreventCollision, z: 1.7 });
        this.graphics.use(new Sprite({
            image: Resources.Jogador,
            sourceView: { x: 128, y: 64, width: 64, height: 64 },
            tint: Color.fromHex(frenesi > 0 ? "#ff3d46" : "#d7d8dd")
        }));
        this.graphics.offset = vec(0, -14);
        this.graphics.flipHorizontal = esquerda;
        this.alfa = frenesi > 0 ? .42 : .16;
        this.graphics.opacity = this.alfa;
    }
    override onPreUpdate(_engine: Engine, delta: number): void {
        this.tempo += delta;
        this.graphics.opacity = Math.max(0, (1 - this.tempo / 260) * this.alfa);
        if (this.tempo >= 260) this.kill();
    }
}

const brilhoDisparo = new Canvas({ width: 128, height: 128, cache: true, draw: ctx => {
    const luz = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    luz.addColorStop(0, "rgba(255,250,215,.8)");
    luz.addColorStop(.18, "rgba(255,194,80,.35)");
    luz.addColorStop(1, "rgba(255,126,20,0)");
    ctx.fillStyle = luz; ctx.fillRect(0, 0, 128, 128);
} });
class LuzDisparo extends Actor {
    private restante = 85;
    constructor(posicao: Vector, forca: number) {
        super({ name: "Efeito de combate", pos: posicao.clone(), scale: vec(.5 + forca * .14, .5 + forca * .14), collisionType: CollisionType.PreventCollision, z: 3.8 });
        this.graphics.use(brilhoDisparo);
    }
    override onPreUpdate(_engine: Engine, delta: number): void {
        this.restante -= delta;
        this.graphics.opacity = Math.max(0, this.restante / 85);
        if (this.restante <= 0) this.kill();
    }
}
export function flashTiro(scene: Scene, posicao: Vector, angulo: number, forca = 1): void {
    scene.add(new LuzDisparo(posicao, forca));
    scene.add(new EfeitoCurto(posicao, Resources.FlashTiro, 85, 64 + forca * 9, angulo));
}

export function impactoParede(scene: Scene, posicao: Vector): void {
    scene.add(new EfeitoCurto(posicao, Resources.Impacto, 140, 64));
}

export function sangue(scene: Scene, posicao: Vector, direcao: Vector, fatal = false, deixarCorpo = fatal): void {
    scene.add(new EfeitoCurto(posicao, Resources.SangueImpacto, fatal ? 650 : 300, fatal ? 180 : 85, Math.random() * Math.PI * 2));
    prepararSangue(scene).emitir(posicao.x, posicao.y, direcao.x, direcao.y, fatal);
    if (deixarCorpo) {
        const corpo = new Actor({ name: "Corpo", pos: posicao.clone(), rotation: Math.random() * Math.PI * 2, collisionType: CollisionType.PreventCollision, z: 1.15 });
        corpo.graphics.use(new Sprite({ image: Resources.Corpo, destSize: { width: 70, height: 70 } }));
        scene.add(corpo);
    }
}
