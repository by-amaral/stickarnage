import {
    Actor, CollisionType, Color, Engine, Font, Keys,
    Label, PointerButton, Sprite, TextAlign, Vector, vec
} from "excalibur";
import { ArmaChao, TipoArma } from "./arma-chao";
import { Frenesi } from "./frenesi";
import { Resources } from "./resources";
import { Projetil, temParede } from "./projetil";
import { distanciaLivre } from "./projetil";
import { EfeitoDash } from "./efeito-dash";

type ConfiguracaoArma = {
    quadro: number;
    intervalo: number;
    automatico: boolean;
    projeteis: number;
    dispersao: number;
    dano: number;
};

const armas: Record<TipoArma, ConfiguracaoArma> = {
    pistola: { quadro: 0, intervalo: 180, automatico: false, projeteis: 1, dispersao: 0, dano: 2 },
    submetralhadora: { quadro: 2, intervalo: 95, automatico: true, projeteis: 1, dispersao: 0.04, dano: 1 },
    escopeta: { quadro: 3, intervalo: 650, automatico: false, projeteis: 5, dispersao: 0.3, dano: 1 }
};

export class Player extends Actor {
    private vida = 30;
    private readonly velocidade = 240;
    private readonly frenesi = new Frenesi();
    private armaEquipada: TipoArma = "pistola";
    private intervaloTiro = 0;
    private direcaoMira = vec(1, 0);
    private segurandoTiro = false;
    private dashRestante = 0;
    private dashRecarga = 0;
    private tempoAnimacao = 0;
    private quadroAnimacao = -1;
    private correndo = false;
    private sprites = new Map<string, Sprite>();
    private arma = new Actor({
        pos: vec(11, -14),
        // Pivota no cabo da pistola
        anchor: vec(0.41, 0.56),
        scale: vec(0.8, 0.8),
        collisionType: CollisionType.PreventCollision,
        z: 0.1
    });
    private sombra = new Actor({
        name: "Sombra do jogador",
        pos: vec(0, 9),
        radius: 12,
        scale: vec(1.6, 0.42),
        opacity: 0.55,
        color: Color.Black,
        collisionType: CollisionType.PreventCollision,
        z: 1.9
    });
    readonly indicador = new Label({
        pos: vec(400, 15),
        color: Color.White,
        font: new Font({ size: 13, family: "monospace", bold: true, textAlign: TextAlign.Center }),
        z: 8
    });

    constructor() {
        super({
            name: "Player",
            pos: vec(100, 300),
            radius: 12,
            scale: vec(1.25, 1.25),
            collisionType: CollisionType.Active,
            z: 2
        });
    }

    override onInitialize(engine: Engine): void {
        this.prepararSprites();
        this.graphics.offset = vec(0, -14);
        this.atualizarAnimacao(true);
        this.sombra.pos = this.pos.add(vec(0, 9));
        this.scene?.add(this.sombra);
        this.addChild(this.arma);
        this.atualizarArma();
        engine.canvas.style.cursor = "crosshair";

        const pointers = engine.input.pointers.primary;
        const down = pointers.on("down", evento => {
            if (evento.button !== PointerButton.Left || engine.currentScene !== this.scene) return;
            this.segurandoTiro = true;
            this.mirar(evento.worldPos);
            this.atirar();
        });
        const up = pointers.on("up", () => this.segurandoTiro = false);
        const blur = () => this.segurandoTiro = false;
        window.addEventListener("blur", blur);
        this.on("kill", () => {
            down.close();
            up.close();
            window.removeEventListener("blur", blur);
            this.sombra.kill();
        });
    }

    override onPreUpdate(engine: Engine, delta: number): void {
        this.intervaloTiro = Math.max(0, this.intervaloTiro - delta);
        this.dashRecarga = Math.max(0, this.dashRecarga - delta);
        this.frenesi.atualizar(delta);

        const mouse = engine.input.pointers.primary.lastWorldPos;
        if (mouse) this.mirar(mouse);

        const teclado = engine.input.keyboard;
        let x = 0;
        let y = 0;
        if (teclado.isHeld(Keys.W) || teclado.isHeld(Keys.Up)) y -= 1;
        if (teclado.isHeld(Keys.S) || teclado.isHeld(Keys.Down)) y += 1;
        if (teclado.isHeld(Keys.A) || teclado.isHeld(Keys.Left)) x -= 1;
        if (teclado.isHeld(Keys.D) || teclado.isHeld(Keys.Right)) x += 1;

        // Vira com o movimento e usa a mira quando está parado
        this.graphics.flipHorizontal = x !== 0 ? x < 0 : this.direcaoMira.x < 0;

        const movimento = x || y ? vec(x, y).normalize() : vec(0, 0);
        if (teclado.wasPressed(Keys.Space)) this.iniciarDash(movimento);

        this.dashRestante = Math.max(0, this.dashRestante - delta);
        this.vel = movimento.scale(this.velocidade);

        const coletavel = this.maisPerto();
        if (coletavel && teclado.wasPressed(Keys.E)) this.trocarArma(coletavel);

        const config = armas[this.armaEquipada];
        if (config.automatico && this.segurandoTiro && this.intervaloTiro === 0) this.atirar();

        this.correndo = movimento.magnitude > 0 && this.dashRestante === 0;
        this.tempoAnimacao += delta;
        this.atualizarAnimacao(false);
        this.atualizarArma();
        this.sombra.pos = this.pos.add(vec(0, 9));

        const nivel = this.frenesi.nivel;
        const texto = `${this.armaEquipada.toUpperCase()}  |  FRENESI ${nivel}/3  |  DASH ${this.dashRecarga === 0 ? "PRONTO" : "..."}${this.invulneravel ? "  INVULNERÁVEL" : ""}${coletavel ? `  |  E: PEGAR ${coletavel.tipo.toUpperCase()}` : ""}`;
        if (this.indicador.text !== texto) this.indicador.text = texto;

        // F8 simula uma eliminação durante o desenvolvimento
        if (import.meta.env.DEV && teclado.wasPressed(Keys.F8)) this.registrarEliminacao();
    }

    private prepararSprites(): void {
        for (let i = 0; i < 4; i++) {
            this.sprites.set(`parado-${i}`, new Sprite({
                image: Resources.Jogador,
                sourceView: { x: i * 64, y: 0, width: 64, height: 64 }
            }));
            this.sprites.set(`corrida-${i}`, new Sprite({
                image: Resources.Jogador,
                sourceView: { x: i * 64, y: 64, width: 64, height: 64 }
            }));
            this.sprites.set(`dash-${i}`, new Sprite({
                image: Resources.Jogador,
                sourceView: { x: i * 64, y: 128, width: 64, height: 64 }
            }));
        }
        this.sprites.set("parado", this.sprites.get("parado-0")!);
    }

    private atualizarAnimacao(forcar: boolean): void {
        const estado = this.dashRestante > 0 ? "dash" : this.correndo ? "corrida" : "parado";
        const quadro = estado === "parado" ? 0 : Math.floor(this.tempoAnimacao / (estado === "dash" ? 45 : 100)) % 4;
        if (forcar || quadro !== this.quadroAnimacao || estado !== this.estadoAnimacao) {
            this.graphics.use(this.sprites.get(estado === "parado" ? estado : `${estado}-${quadro}`)!);
            this.estadoAnimacao = estado;
            this.quadroAnimacao = quadro;
        }
    }
    private estadoAnimacao = "";

    private iniciarDash(movimento: Vector): void {
        if (this.dashRecarga > 0 || !this.scene) return;
        const direcao = movimento.magnitude > 0 ? movimento : this.direcaoMira;
        const distancia = distanciaLivre(this.scene, this.pos, direcao, 120);
        if (distancia < 8) return;

        const origem = this.pos.clone();
        const destino = origem.add(direcao.scale(distancia));
        this.scene.add(new EfeitoDash(origem, direcao, distancia, true));
        this.scene.add(new EfeitoDash(origem.add(destino).scale(0.5), direcao, distancia));
        this.pos = destino;
        this.sombra.pos = this.pos.add(vec(0, 9));
        this.dashRestante = Math.max(75, 180 - this.frenesi.nivel * 35);
        this.dashRecarga = Math.max(350, 800 - this.frenesi.nivel * 120);
        this.tempoAnimacao = 0;
    }

    get invulneravel(): boolean {
        return this.dashRestante > 0;
    }

    private mirar(alvo: Vector): void {
        const origem = this.pos.add(vec(this.graphics.flipHorizontal ? -11 : 11, -12));
        const direcao = alvo.sub(origem);
        if (direcao.magnitude < 1) return;
        this.direcaoMira = direcao.normalize();
    }

    private atualizarArma(): void {
        const esquerda = this.graphics.flipHorizontal;
        const deslocamento = vec(esquerda ? -11 : 11, -12);
        this.arma.pos = deslocamento;
        this.arma.rotation = this.direcaoMira.toAngle();
        this.arma.graphics.flipVertical = esquerda;

        const config = armas[this.armaEquipada];
        const frenesiAtivo = this.frenesi.nivel > 0;
        const indice = config.quadro + (frenesiAtivo ? 8 : 0);
        if (this.quadroArma !== indice) {
            this.arma.graphics.use(new Sprite({
                image: Resources.Armas,
                sourceView: { x: (indice % 4) * 64, y: Math.floor(indice / 4) * 64, width: 64, height: 64 }
            }));
            this.quadroArma = indice;
        }
    }
    private quadroArma = -1;

    private maisPerto(): ArmaChao | undefined {
        if (!this.scene) return undefined;
        return this.scene.actors
            .filter((ator): ator is ArmaChao => ator instanceof ArmaChao && !ator.isKilled())
            .filter(arma => arma.pos.distance(this.pos) <= 48)
            .sort((a, b) => a.pos.distance(this.pos) - b.pos.distance(this.pos))[0];
    }

    private trocarArma(coletada: ArmaChao): void {
        if (!this.scene) return;
        coletada.kill();
        if (this.armaEquipada !== coletada.tipo) {
            this.scene.add(new ArmaChao(this.armaEquipada, coletada.pos.x, coletada.pos.y));
        }
        this.armaEquipada = coletada.tipo;
        this.intervaloTiro = 0;
        this.atualizarArma();
    }

    private atirar(): void {
        if (!this.scene || this.intervaloTiro > 0) return;
        const config = armas[this.armaEquipada];
        const nivel = this.frenesi.nivel;
        this.intervaloTiro = config.intervalo / (1 + nivel * 0.2);
        const origem = this.pos.add(vec(this.graphics.flipHorizontal ? -11 : 11, -12));
        const cano = origem.add(this.direcaoMira.scale(this.armaEquipada === "pistola" ? 18 : 22));

        if (temParede(this.scene, this.pos, origem) || temParede(this.scene, origem, cano)) return;

        for (let i = 0; i < config.projeteis; i++) {
            const espalhamento = config.projeteis === 1
                ? (Math.random() - 0.5) * config.dispersao
                : -config.dispersao / 2 + i * config.dispersao / (config.projeteis - 1);
            const direcao = this.direcaoMira.rotate(espalhamento);
            this.scene.add(new Projetil(cano, direcao, config.dano * (1 + nivel * 0.15), "jogador"));
        }
    }

    // Chame quando um inimigo for eliminado
    registrarEliminacao(): void {
        this.frenesi.registrarEliminacao();
        this.atualizarArma();
    }

    entrarNaSala(): void {
        this.dashRestante = 0;
        this.dashRecarga = 0;
        this.segurandoTiro = false;
        this.vel = vec(0, 0);
        this.correndo = false;
        this.tempoAnimacao = 0;
        this.atualizarAnimacao(true);
        this.sombra.pos = this.pos.add(vec(0, 9));
    }
    receberDano(): void {
        this.vida--;
            if (this.vida <= 0) {
                this.kill();
            }
    }
}
