import { Actor, CollisionType, CollisionGroupManager, Sprite, Animation, Engine, Vector, vec } from "excalibur";
import { Resources } from "./resources";
import { Player } from "./player";
import { Celula } from "./gerador";
import { Projetil, temParede } from "./projetil";
import { flashTiro, sangue } from "./efeitos-visuais";
import { progresso, type Disparo } from "./progresso";
import { perfilInimigo } from "./dificuldade";

const GrupoColisaoInimigos = CollisionGroupManager.create("inimigos");

export class Inimigo extends Actor {
    private vida: number;
    private intervaloTiro = 0;
    private tempoCaminho = 0;
    private caminho: Vector[] = [];
    private arma = new Actor({
        pos: vec(11, -12),
        anchor: vec(0.41, 0.56),
        scale: vec(0.8, 0.8),
        collisionType: CollisionType.PreventCollision,
        z: 0.1
    });
    private spriteArma = new Sprite({
        image: Resources.Armas,
        sourceView: { x: 0, y: 0, width: 64, height: 64 }
    });

    private prepararSprites(): Sprite[] {
        const sprites: Sprite[] = [];

        for (let i = 0; i < 4; i++) {
            sprites.push(new Sprite({
                image: Resources.Inimigos,
                sourceView: {
                    x: i * 64,
                    y: this.perfil.linha,
                    width: 64,
                    height: 64
                }
            }));
        }

        return sprites;
    }

    constructor(tipo: number, x: number, y: number, vida: number, private grade: Celula[][], private perfil = perfilInimigo(1, 0)) {
        super({
            name: "Inimigo",
            pos: vec(x, y),
            radius: 12,
            collisionType: CollisionType.Active,
            collisionGroup: GrupoColisaoInimigos,
            z: 2
        });

        this.vida = vida;
        this.intervaloTiro = 700 + Math.random() * 650;
        this.spriteArma = new Sprite({ image: Resources.Armas, sourceView: { x: this.perfil.quadro % 4 * 64, y: Math.floor(this.perfil.quadro / 4) * 64, width: 64, height: 64 } });
        this.addChild(this.arma);
        this.arma.graphics.use(this.spriteArma);
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

    }
    private atirar(jogador: Player): void {
        if (!this.scene || this.intervaloTiro > 0) return;

        const origem = this.pos.add(vec(this.graphics.flipHorizontal ? -12 : 12, 3));
        const direcao = jogador.pos.sub(origem).normalize();
        const cano = origem.add(direcao.scale(22));

        if (temParede(this.scene, origem, jogador.pos) || temParede(this.scene, origem, cano)) return;

        for (let i = 0; i < this.perfil.projeteis; i++) {
            const desvio = (i - (this.perfil.projeteis - 1) / 2) * .14;
            this.scene.add(new Projetil(cano, direcao.rotate(desvio), 1, "inimigo"));
        }
        flashTiro(this.scene, cano, direcao.toAngle());

        this.intervaloTiro = this.perfil.intervalo;
    }
    receberDano(dano = 1, direcao = vec(1, 0), disparo?: Disparo): void {
        if (this.isKilled()) return;
        this.vida -= dano;
        if (this.scene) sangue(this.scene, this.pos, direcao, this.vida <= 0);

        if (this.vida <= 0 && this.scene) {
            if (disparo) progresso.eliminou(disparo);
            const jogador = this.scene.actors.find(actor => actor instanceof Player);
            if (jogador instanceof Player) jogador.registrarEliminacao();
            this.scene.camera.shake(5, 4, 150);
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
            return;
        }
        this.intervaloTiro = Math.max(0, this.intervaloTiro - delta);
        this.atirar(jogador);

        this.tempoCaminho -= delta;
        if (this.tempoCaminho <= 0) {
            this.caminho = this.encontrarCaminho(jogador.pos);
            this.tempoCaminho = 220 + Math.random() * 80;
        }
        while (this.caminho.length && this.pos.distance(this.caminho[0]) < 9) this.caminho.shift();
        const caminho = this.caminho;

        if (caminho.length === 0) {
            this.vel = vec(0, 0);
            return;
        }

        const proximoPonto = caminho[0];
        const direcao = proximoPonto.sub(this.pos).normalize();

        this.vel = direcao.scale(this.perfil.velocidade);

        if (direcao.x < 0) {
            this.graphics.flipHorizontal = true;
        } else if (direcao.x > 0) {
            this.graphics.flipHorizontal = false;
        }
        this.atualizarArma();
    }
}
