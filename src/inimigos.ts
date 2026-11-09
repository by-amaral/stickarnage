import { Actor, CollisionType, CollisionGroupManager, Sprite, Animation, Engine, Vector, vec } from "excalibur";
import { Resources } from "./resources";
import { Player } from "./player";
import { Celula } from "./gerador";
import { Projetil, temParede } from "./projetil";

const GrupoColisaoInimigos = CollisionGroupManager.create("inimigos");

export class Inimigo extends Actor {
    private vida: number;
    private intervaloTiro = 0;
    private readonly tempoEntreTiros = 2000;
    private arma = new Actor({
        pos: vec(11, -12),
        anchor: vec(0.41, 0.56),
        scale: vec(0.8, 0.8),
        collisionType: CollisionType.PreventCollision,
        z: 0.1
    });

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

    constructor(tipo: number, x: number, y: number, vida: number, private grade: Celula[][]) {
        super({
            name: "Inimigo",
            pos: vec(x, y),
            radius: 12,
            collisionType: CollisionType.Active,
            collisionGroup: GrupoColisaoInimigos,
            z: 2
        });

        this.vida = vida;
        this.addChild(this.arma);
        this.atualizarArma();

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
    private atualizarArma(): void {
        const esquerda = this.graphics.flipHorizontal;

        this.arma.pos = vec(esquerda ? -12 : 12, 3);
        this.arma.rotation = esquerda ? Math.PI : 0;
        this.arma.graphics.flipVertical = esquerda;

        this.arma.graphics.use(new Sprite({
            image: Resources.Armas,
            sourceView: {
                x: 0,
                y: 0,
                width: 64,
                height: 64
            }
        }));
    }
    private atirar(jogador: Player): void {
        if (!this.scene || this.intervaloTiro > 0) return;

        const origem = this.pos.add(vec(this.graphics.flipHorizontal ? -12 : 12, 3));
        const direcao = jogador.pos.sub(origem).normalize();
        const cano = origem.add(direcao.scale(22));

        if (temParede(this.scene, origem, cano)) return;

        this.scene.add(new Projetil(cano, direcao, 1, "inimigo"));

        this.intervaloTiro = this.tempoEntreTiros;
    }
    receberDano(): void {
        this.vida--;

        if (this.vida <= 0 && this.scene) {
            const mancha = new Actor({
                pos: this.pos.clone(),
                z: 1
            });

            mancha.graphics.use(new Sprite({
                image: Resources.Mancha,
                sourceView: {
                    x: 0,
                    y: 0,
                    width: 64,
                    height: 64
                }
        }));

    this.scene.add(mancha);
    this.kill();
}
    }
    private encontrarCaminho(destino: Vector): Vector[] {
        const inicio = {
            coluna: Math.round((this.pos.x - 60) / 40),
            linha: Math.round((this.pos.y - 60) / 40)
        };
        const fim = {
        coluna: Math.round((destino.x - 60) / 40),
        linha: Math.round((destino.y - 60) / 40)
        };
        const chave = (coluna: number, linha: number) =>
            `${coluna},${linha}`;

        const distancia = (a: typeof inicio, b: typeof inicio) =>
            Math.abs(a.coluna - b.coluna) + Math.abs(a.linha - b.linha);

        const abertos = [inicio];
        const anteriores = new Map<string, string>();
        const custos = new Map<string, number>();

        custos.set(chave(inicio.coluna, inicio.linha), 0);

        const direcoes = [
            [1, 0], [-1, 0], [0, 1], [0, -1]
        ];

        while (abertos.length > 0) {
            abertos.sort((a, b) =>
                (custos.get(chave(a.coluna, a.linha))! + distancia(a, fim)) -
                (custos.get(chave(b.coluna, b.linha))! + distancia(b, fim))
            );

            const atual = abertos.shift()!;

            if (atual.coluna === fim.coluna && atual.linha === fim.linha) {
                const caminho: Vector[] = [];
                let atualChave = chave(fim.coluna, fim.linha);

                while (anteriores.has(atualChave)) {
                    const [coluna, linha] = atualChave.split(",").map(Number);

                    caminho.unshift(vec(60 + coluna * 40, 60 + linha * 40));

                    atualChave = anteriores.get(atualChave)!;
                }

                return caminho;
            }

            for (const [dx, dy] of direcoes) {
                const coluna = atual.coluna + dx;
                const linha = atual.linha + dy;

                if (
                    coluna < 0 || coluna >= this.grade[0].length ||
                    linha < 0 || linha >= this.grade.length ||
                    this.grade[linha][coluna].parede
                ) {
                    continue;
                }

                const vizinho = chave(coluna, linha);
                const custo = custos.get(chave(atual.coluna, atual.linha))! + 1;

                if (custo < (custos.get(vizinho) ?? Infinity)) {
                    anteriores.set(vizinho, chave(atual.coluna, atual.linha));
                    custos.set(vizinho, custo);

                    if (!abertos.some(p => p.coluna === coluna && p.linha === linha)) {
                        abertos.push({ coluna, linha });
                    }
                }
            }
        }

        return [];
    }

    override onPreUpdate(engine: Engine, delta: number): void {
        if (!this.scene) return;

        const jogador = this.scene.actors.find(
            actor => actor instanceof Player
        );

        if (!jogador || jogador.isKilled()) {
            this.vel = vec(0, 0);
            this.graphics.use(this.prepararSprites()[0]);
            return;
        }
        this.intervaloTiro = Math.max(0, this.intervaloTiro - delta);
        this.atirar(jogador);

        const caminho = this.encontrarCaminho(jogador.pos);

        if (caminho.length === 0) {
            this.vel = vec(0, 0);
            return;
        }

        const proximoPonto = caminho[0];
        const direcao = proximoPonto.sub(this.pos).normalize();

        this.vel = direcao.scale(60);

        if (direcao.x < 0) {
            this.graphics.flipHorizontal = true;
        } else if (direcao.x > 0) {
            this.graphics.flipHorizontal = false;
        }
        this.atualizarArma();
    }
}
