import {
    Actor, CollisionType, Color, Engine, Keys,
    PointerButton, Sprite, Vector, vec
} from "excalibur";
import { ArmaChao, TipoArma } from "./arma-chao";
import { Frenesi } from "./frenesi";
import { Resources } from "./resources";
import { Projetil, temParede } from "./projetil";
import { distanciaLivre } from "./projetil";
import { EfeitoDash } from "./efeito-dash";
import { audioJogo } from "./audio";
import { Vitalidade } from "./vitalidade";
import { Armamento, armas } from "./armamento";
import { progresso, type Disparo } from "./progresso";
import { flashTiro, RastroMovimento, sangue } from "./efeitos-visuais";

export class Player extends Actor {
    private readonly vitalidade = new Vitalidade();
    private get vida(): number { return this.vitalidade.vida; }
    private get invulnerabilidadeDano(): number { return this.vitalidade.protecao; }
    private armaProxima: TipoArma | undefined;
    private readonly velocidade = 240;
    private readonly frenesi = new Frenesi();
    private readonly armamento = new Armamento();
    private get armaEquipada(): TipoArma { return this.armamento.tipo; }
    private intervaloTiro = 0;
    private direcaoMira = vec(1, 0);
    private segurandoTiro = false;
    private dashRestante = 0;
    private dashRecarga = 0;
    private tempoAnimacao = 0;
    private tempoRastro = 0;
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
    constructor() {
        super({
            name: "Player",
            pos: vec(100, 300),
            radius: 12,
            scale: vec(1.25, 1.25),
            collisionType: CollisionType.Active,
            z: 2
        });
        this.armamento.onRecarga = (tipo, concluida) => audioJogo.recarregar(tipo, concluida);
    }

    override onInitialize(engine: Engine): void {
        this.prepararSprites();
        this.graphics.offset = vec(0, -14);
        this.atualizarAnimacao(true);
        this.sombra.pos = this.pos.add(vec(0, 9));
        this.scene?.add(this.sombra);
        this.addChild(this.arma);
        this.atualizarArma();
        engine.canvas.style.cursor = "none";

        const pointers = engine.input.pointers.primary;
        const down = pointers.on("down", evento => {
            if (evento.button !== PointerButton.Left || engine.currentScene !== this.scene || engine.timescale === 0) return;
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
        this.vitalidade.atualizar(delta);
        this.frenesi.atualizar(delta);
        this.armamento.atualizar(delta);

        const mouse = engine.input.pointers.primary.lastWorldPos;
        if (mouse) this.mirar(mouse);

        const teclado = engine.input.keyboard;
        if (teclado.wasPressed(Keys.R)) this.armamento.recarregar();
        if (teclado.wasPressed(Keys.Q) && this.armamento.ativarEspecial()) audioJogo.tocar("frenesi");
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
        this.vel = movimento.scale(this.velocidade * (1 + this.frenesi.nivel * 0.07));

        const coletavel = this.maisPerto();
        this.armaProxima = coletavel?.tipo;
        if (coletavel && teclado.wasPressed(Keys.E)) this.trocarArma(coletavel);

        const config = armas[this.armaEquipada];
        if (config.automatico && this.segurandoTiro && this.intervaloTiro === 0) this.atirar();

        this.correndo = movimento.magnitude > 0 && this.dashRestante === 0;
        this.tempoAnimacao += delta;
        this.tempoRastro -= delta;
        if (movimento.magnitude > 0 && this.tempoRastro <= 0 && this.scene) {
            this.scene.add(new RastroMovimento(this.pos, this.graphics.flipHorizontal, this.frenesi.nivel));
            this.tempoRastro = this.frenesi.nivel > 0 ? 55 : 130;
        }
        this.atualizarAnimacao(false);
        this.atualizarArma();
        this.sombra.pos = this.pos.add(vec(0, 9));
        this.graphics.opacity = this.invulnerabilidadeDano > 0 && Math.floor(this.invulnerabilidadeDano / 90) % 2 ? 0.45 : 1;

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
        if (!this.sprites.size) return;
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
        for (let i = 0; i < 4; i++) this.scene.add(new EfeitoDash(origem.add(direcao.scale(distancia * i / 4)), direcao, distancia, true));
        this.scene.add(new EfeitoDash(origem.add(destino).scale(0.5), direcao, distancia));
        this.pos = destino;
        this.sombra.pos = this.pos.add(vec(0, 9));
        this.dashRestante = Math.max(75, 180 - this.frenesi.nivel * 35);
        this.dashRecarga = Math.max(350, 800 - this.frenesi.nivel * 120);
        this.tempoAnimacao = 0;
        audioJogo.tocar("dash");
        this.scene.camera.shake(3, 3, 120);
    }

    get invulneravel(): boolean {
        return this.dashRestante > 0 || this.invulnerabilidadeDano > 0;
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
        if (!this.scene || this.armamento.especial) return;
        coletada.kill();
        if (this.armaEquipada !== coletada.tipo) {
            this.scene.add(new ArmaChao(this.armaEquipada, coletada.pos.x, coletada.pos.y));
        }
        this.armamento.trocar(coletada.tipo);
        this.intervaloTiro = 0;
        this.atualizarArma();
        audioJogo.tocar("coleta");
    }

    private atirar(): void {
        if (!this.scene || this.intervaloTiro > 0 || this.armamento.recarregando) return;
        if (!this.armamento.quantidade) { this.armamento.recarregar(); return; }
        const config = armas[this.armaEquipada];
        const nivel = this.frenesi.nivel;
        this.intervaloTiro = config.intervalo / (1 + nivel * 0.2);
        const origem = this.pos.add(vec(this.graphics.flipHorizontal ? -11 : 11, -12));
        const cano = origem.add(this.direcaoMira.scale(this.armaEquipada === "pistola" ? 18 : 22));

        if (temParede(this.scene, this.pos, origem) || temParede(this.scene, origem, cano)) return;
        if (!this.armamento.consumir()) return;
        progresso.usarArma(this.armaEquipada);
        const disparo: Disparo = { arma: this.armaEquipada, mortes: 0 };
        audioJogo.tocar(config.impacto >= 3 ? "escopeta" : "tiro");
        flashTiro(this.scene, cano, this.direcaoMira.toAngle(), config.impacto);
        this.scene.camera.shake(config.impacto, config.impacto * .65, 55 + config.impacto * 12);

        for (let i = 0; i < config.projeteis; i++) {
            const espalhamento = config.projeteis === 1
                ? (Math.random() - 0.5) * config.dispersao
                : -config.dispersao / 2 + i * config.dispersao / (config.projeteis - 1);
            const direcao = this.direcaoMira.rotate(espalhamento);
            this.scene.add(new Projetil(cano, direcao, config.dano * (1 + nivel * 0.15), "jogador", this.armaEquipada === "canhao-plasma", disparo));
        }
        this.armamento.concluirDisparo();
    }

    // Chame quando um inimigo for eliminado
    registrarEliminacao(): void {
        this.armamento.registrarEliminacao();
        if (this.vitalidade.registrarEliminacao()) {
            progresso.curou();
            audioJogo.tocar("coleta");
        }
        this.frenesi.registrarEliminacao();
        this.atualizarArma();
        audioJogo.tocar("eliminacao");
    }

    entrarNaSala(): void {
        this.vitalidade.entrarNaSala();
        this.dashRestante = 0;
        this.dashRecarga = 0;
        this.segurandoTiro = false;
        this.vel = vec(0, 0);
        this.correndo = false;
        this.tempoAnimacao = 0;
        this.atualizarAnimacao(true);
        this.sombra.pos = this.pos.add(vec(0, 9));
    }
    get vidaAtual(): number { return this.vida; }
    get pontos(): number { return this.vitalidade.eliminacoes * 100; }
    get armaAtual(): TipoArma { return this.armaEquipada; }
    get balas(): number { return this.armamento.quantidade; }
    get capacidade(): number { return armas[this.armaEquipada].capacidade; }
    get recarregando(): boolean { return this.armamento.recarregando > 0; }
    get progressoRecarga(): number { return this.recarregando ? 1 - this.armamento.recarregando / armas[this.armaEquipada].recarga : 1; }
    get especial(): string { return this.armamento.especial ? "ESPECIAL ATIVO" : this.armamento.carga === 8 ? "Q · ESPECIAL PRONTO" : `ESPECIAL ${this.armamento.carga}/8`; }
    get armaDisponivel(): TipoArma | undefined { return this.armaProxima; }
    get nivelFrenesi(): number { return this.frenesi.nivel; }
    get dashPronto(): boolean { return this.dashRecarga === 0; }

    receberDano(): void {
        if (this.invulneravel || this.isKilled()) return;
        if (!this.vitalidade.receberDano()) return;
        progresso.dano();
        if (this.scene) {
            sangue(this.scene, this.pos, this.direcaoMira.scale(-1), this.vida <= 0, false);
            this.scene.camera.shake(this.vida <= 0 ? 12 : 8, this.vida <= 0 ? 10 : 7, this.vida <= 0 ? 300 : 190);
        }
        audioJogo.tocar(this.vida <= 0 ? "morte" : "dano");
        if (this.vida <= 0) this.kill();
    }
}
