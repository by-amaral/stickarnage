import { Actor, Canvas, CollisionType, Color, Engine, Sprite, vec } from "excalibur";
import { Resources } from "./resources";

export type TipoArma = "pistola" | "submetralhadora" | "escopeta";

const quadros: Record<TipoArma, { x: number; y: number; largura: number; altura: number; destino: number }> = {
    pistola: { x: 21, y: 23, largura: 22, altura: 18, destino: 25 },
    submetralhadora: { x: 145, y: 22, largura: 30, altura: 20, destino: 32 },
    escopeta: { x: 204, y: 23, largura: 40, altura: 18, destino: 40 }
};

export class ArmaChao extends Actor {
    private brilho!: Actor;
    private tempo = Math.random() * Math.PI * 2;

    constructor(public readonly tipo: TipoArma, x: number, y: number) {
        super({
            name: `Arma: ${tipo}`,
            pos: vec(x, y),
            radius: 12,
            collisionType: CollisionType.PreventCollision,
            z: 2
        });
    }

    override onInitialize(): void {
        this.brilho = new Actor({
            scale: vec(1, 1),
            opacity: 0.8,
            collisionType: CollisionType.PreventCollision,
            z: -0.1
        });
        this.brilho.graphics.use(new Canvas({
            width: 96,
            height: 48,
            cache: true,
            smoothing: true,
            draw: ctx => {
                const gradiente = ctx.createRadialGradient(48, 24, 1, 48, 24, 47);
                gradiente.addColorStop(0, "rgba(255, 239, 164, 0.72)");
                gradiente.addColorStop(0.28, "rgba(255, 151, 40, 0.4)");
                gradiente.addColorStop(1, "rgba(255, 48, 20, 0)");
                ctx.fillStyle = gradiente;
                ctx.fillRect(0, 0, 96, 48);
            }
        }));
        this.brilho.scale = vec(0.85, 0.7);
        this.addChild(this.brilho);

        const quadro = quadros[this.tipo];
        this.graphics.use(new Sprite({
            image: Resources.Armas,
            sourceView: { x: quadro.x, y: quadro.y, width: quadro.largura, height: quadro.altura },
            destSize: {
                width: quadro.destino,
                height: quadro.destino * quadro.altura / quadro.largura
            },
            tint: Color.fromHex("#96908a")
        }));
    }

    override onPreUpdate(_engine: Engine, delta: number): void {
        this.tempo += delta;
        this.brilho.graphics.opacity = 0.68 + Math.sin(this.tempo / 260) * 0.16;
    }
}
