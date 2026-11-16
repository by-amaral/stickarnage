import { Actor, CollisionType, Color, Engine, Graphic, type ExcaliburGraphicsContext, Scene, vec } from "excalibur";
import { Resources } from "./resources";

const LIMITE_GOTAS = 720;
const LIMITE_MANCHAS = 100;
const cores = [Color.fromHex("#b70a18"), Color.fromHex("#590009")];

class DesenhoSangue extends Graphic {
    constructor(private desenhar: (ctx: ExcaliburGraphicsContext, x: number, y: number) => void) { super({ width: 800, height: 600 }); }
    protected override _drawImage(ctx: ExcaliburGraphicsContext, x: number, y: number): void { this.desenhar(ctx, x, y); }
    override clone(): Graphic { return new DesenhoSangue(this.desenhar); }
}

// Duas camadas por cena; nenhuma entidade, textura ou vetor é criado por gota.
class SangueAgrupado extends Actor {
    private gotas = Array.from({ length: LIMITE_GOTAS }, () => ({ x: 0, y: 0, vx: 0, vy: 0, tempo: 0, duracao: 1, tamanho: 1, cor: 0, mancha: false }));
    private manchas = Array.from({ length: LIMITE_MANCHAS }, () => ({ x: 0, y: 0, tamanho: 0, angulo: 0 }));
    private proximaGota = 0;
    private proximaMancha = 0;
    private ponto = vec(0, 0);
    readonly piso = new Actor({ name: "Sangue no piso", pos: vec(400, 300), collisionType: CollisionType.PreventCollision, z: .8 });

    constructor() {
        super({ name: "Partículas de sangue", pos: vec(400, 300), collisionType: CollisionType.PreventCollision, z: 4.2 });
        this.graphics.use(new DesenhoSangue((ctx, x, y) => {
            const opacidade = ctx.opacity;
            for (const gota of this.gotas) {
                if (gota.tempo <= 0) continue;
                ctx.opacity = opacidade * Math.min(1, gota.tempo / gota.duracao * 3);
                this.ponto.x = x + Math.round(gota.x); this.ponto.y = y + Math.round(gota.y);
                ctx.drawRectangle(this.ponto, gota.tamanho, Math.ceil(gota.tamanho * .7), cores[gota.cor]);
            }
            ctx.opacity = opacidade;
        }));
        this.piso.graphics.use(new DesenhoSangue((ctx, x, y) => {
            for (const mancha of this.manchas) {
                if (!mancha.tamanho) continue;
                ctx.save(); ctx.translate(x + mancha.x, y + mancha.y); ctx.rotate(mancha.angulo);
                ctx.drawImage(Resources.Mancha.image, -mancha.tamanho / 2, -mancha.tamanho / 2, mancha.tamanho, mancha.tamanho);
                ctx.restore();
            }
        }));
    }

    limpar(): void {
        for (const gota of this.gotas) gota.tempo = 0;
        for (const mancha of this.manchas) mancha.tamanho = 0;
        this.proximaGota = this.proximaMancha = 0;
    }

    private manchar(x: number, y: number, tamanho: number): void {
        const mancha = this.manchas[this.proximaMancha++ % LIMITE_MANCHAS];
        mancha.x = x; mancha.y = y; mancha.tamanho = tamanho; mancha.angulo = Math.random() * Math.PI * 2;
    }

    emitir(x: number, y: number, dx: number, dy: number, fatal: boolean): void {
        if (fatal) for (let i = 0; i < 5; i++) this.manchar(x + (Math.random() - .5) * 65, y + (Math.random() - .5) * 65, 65 + Math.random() * 45);
        for (let i = 0; i < (fatal ? 90 : 16); i++) {
            const gota = this.gotas[this.proximaGota++ % LIMITE_GOTAS];
            const angulo = Math.random() * Math.PI * 2;
            const velocidade = (fatal ? 220 : 80) + Math.random() * (fatal ? 480 : 180);
            gota.x = x; gota.y = y;
            gota.vx = Math.cos(angulo) * velocidade + dx * (fatal ? 170 : 100);
            gota.vy = Math.sin(angulo) * velocidade + dy * (fatal ? 170 : 100);
            gota.tempo = gota.duracao = 450 + Math.random() * 350;
            gota.tamanho = Math.ceil(1 + Math.random() * 2.5);
            gota.cor = Math.random() > .4 ? 0 : 1;
            gota.mancha = fatal && i % 6 === 0;
        }
    }

    override onPreUpdate(_engine: Engine, delta: number): void {
        const segundos = delta / 1000, atrito = Math.max(0, 1 - delta / 450);
        for (const gota of this.gotas) {
            if (gota.tempo <= 0) continue;
            gota.tempo -= delta;
            gota.x = Math.max(45, Math.min(755, gota.x + gota.vx * segundos));
            gota.y = Math.max(45, Math.min(555, gota.y + gota.vy * segundos));
            gota.vx *= atrito; gota.vy *= atrito;
            if (gota.tempo <= 0 && gota.mancha) this.manchar(gota.x, gota.y, 28 + Math.random() * 32);
        }
    }
}

const camadas = new WeakMap<Scene, SangueAgrupado>();
export function prepararSangue(scene: Scene): SangueAgrupado {
    let camada = camadas.get(scene);
    if (!camada) {
        camada = new SangueAgrupado(); camadas.set(scene, camada);
        scene.add(camada.piso); scene.add(camada);
    }
    return camada;
}
export function limparSangue(scene: Scene): void { camadas.get(scene)?.limpar(); }
