import { Actor, CollisionType, Color, Engine, Scene, Sprite, vec } from "excalibur";
import { Player } from "./player";
import { Projetil } from "./projetil";
import { ArmaChao } from "./arma-chao";
import { EfeitoDash } from "./efeito-dash";
import { gerarSalaAleatoria } from "./gerador";
import { Resources } from "./resources";
import { desenharParedes } from "./desenho-paredes";
import type { RetanguloParede } from "./desenho-paredes";
import { desenharAmbiente } from "./ambiente";
import { Inimigo } from "./inimigos";
import { audioJogo } from "./audio";
import { progresso } from "./progresso";
import { perfilInimigo } from "./dificuldade";
import { prepararSangue, limparSangue } from "./sangue";

export type EstadoJogo = { vida: number; sala: number; pontos: number; arma: string; armaDisponivel?: string; frenesi: number; dash: boolean; restantes: number; balas: number; capacidade: number; recarregando: boolean; progressoRecarga: number; especial: string };

export class MyLevel extends Scene {
    onEstado?: (estado: EstadoJogo) => void;
    onFim?: (estado: EstadoJogo) => void;
    private fimAvisado = false;
    private jogador = new Player();
    private paredesInternas: Actor[] = [];
    private numeroSala = 0;
    private ultimaFamilia = "";
    private inimigos: Inimigo[] = [];
    private ambiente = new Actor({
        pos: vec(400, 300), collisionType: CollisionType.PreventCollision, z: 1.5
    });
    private desenhoParedes: {
        ator: Actor;
        retangulo: RetanguloParede;
    }[] = [];

    private visualParedes = new Actor({
        pos: vec(400, 300),
        collisionType: CollisionType.PreventCollision,
        z: 1
    });

    override onInitialize(): void {
        // Piso
        this.add(new Actor({
            pos: vec(400, 300),
            width: 760,
            height: 560,
            color: Color.fromHex("#17191f"),
            collisionType: CollisionType.PreventCollision,
            z: -1
        }));

        // Placas do chão
        for (let linha = 0; linha < 6; linha++) {
            for (let coluna = 0; coluna < 8; coluna++) {
                const placa = new Actor({
                    pos: vec(
                        85 + coluna * 90,
                        75 + linha * 90
                    ),
                    collisionType: CollisionType.PreventCollision,
                    z: -0.5
                });

                placa.graphics.use(new Sprite({
                    image: Resources.Piso,
                    destSize: {
                        width: 90,
                        height: 90
                    }
                }));

                this.add(placa);
            }
        }

        // Contorno da arena
        this.criarParede(400, 30, 760, 20);
        this.criarParede(400, 570, 760, 20);
        this.criarParede(30, 300, 20, 520);

        // Porta de entrada fechada: a parede atrás continua bloqueando.
        const entrada = new Actor({
            pos: vec(30, 300),
            collisionType: CollisionType.PreventCollision,
            z: 3
        });

        entrada.graphics.use(new Sprite({
            image: Resources.PortaEntrada,
            destSize: {
                width: 44,
                height: 116
            }
        }));

        this.add(entrada);

        // Lado direito com abertura entre y = 250 e y = 350
        this.criarParede(770, 140, 20, 220);
        this.criarParede(770, 460, 20, 220);

        // Faixa luminosa da saída

        const saida = new Actor({
            pos: vec(770, 300),
            collisionType: CollisionType.PreventCollision,
            z: 3
        });

        saida.graphics.use(new Sprite({
            image: Resources.PortaSaida,
            destSize: {
                width: 46,
                height: 116
            }
        }));

        this.add(saida);
        
        this.add(this.visualParedes);
        this.add(this.ambiente);
        this.add(this.jogador);
        prepararSangue(this);
        this.gerarSala();
    }

    override onDeactivate(): void {
        // Cada partida usa uma cena nova. Encerrar o jogador também libera
        // os ouvintes de mouse e de janela quando a partida é abandonada.
        if (!this.jogador.isKilled()) this.jogador.kill();
    }

    private criarParede(
        x: number,
        y: number,
        largura: number,
        altura: number
    ): Actor {
        const parede = new Actor({
            pos: vec(x, y),
            width: largura,
            height: altura,
            collisionType: CollisionType.Fixed
        });

        this.desenhoParedes.push({
            ator: parede,
            retangulo: { x, y, largura, altura }
        });

        this.add(parede);
        return parede;
    }

    private gerarSala(): void {
        limparSangue(this);
        // Os tiros ficam na sala anterior
        for (const ator of this.actors) {
            if (ator instanceof Projetil) ator.kill();
            if (ator instanceof ArmaChao) ator.kill();
            if (ator instanceof EfeitoDash) ator.kill();
            if (ator.name === "Marca de sangue") ator.kill();
            if (ator.name === "Corpo") ator.kill();
            if (ator.name === "Efeito de combate") ator.kill();
        }

        for (const parede of this.paredesInternas) {
            parede.kill();
        }

        for (const inimigo of this.inimigos) {
            inimigo.kill();
        }

        this.paredesInternas = [];
        this.inimigos = [];

        const sala = gerarSalaAleatoria(this.ultimaFamilia);
        this.ultimaFamilia = sala.nome;
        this.ambiente.graphics.use(desenharAmbiente(sala.detalhes));

        for (const bloco of sala.paredes) {
            const parede = this.criarParede(
                bloco.x,
                bloco.y,
                bloco.largura,
                bloco.altura
            );

            this.paredesInternas.push(parede);
        }   

        // Descarta os registros das paredes removidas na troca de sala
        this.desenhoParedes = this.desenhoParedes.filter(
            registro => !registro.ator.isKilled()
        );

        this.visualParedes.graphics.use(
            desenharParedes(
                this.desenhoParedes.map(registro => registro.retangulo)
            )
        );

        for (const [indice, posicao] of sala.inimigos.entries()) {
            const vidaInimigo = 2 + Math.floor(this.numeroSala / 8);
            const inimigo = new Inimigo(0, posicao.x, posicao.y, vidaInimigo, sala.grade, perfilInimigo(this.numeroSala + 1, indice));
            this.add(inimigo);
            this.inimigos.push(inimigo);
        }

        for (const posicao of sala.armas) {
            this.add(new ArmaChao(posicao.tipo, posicao.x, posicao.y));
        }

        this.jogador.pos = vec(78, 300);
        this.jogador.entrarNaSala();
        this.numeroSala++;
        progresso.entrarSala(this.numeroSala, this.jogador.vidaAtual);
        if (this.numeroSala > 1) audioJogo.tocar("porta");
    }

    override onPostUpdate(_engine: Engine, delta: number): void {
        const estado = this.estadoAtual;
        progresso.atualizar(delta, estado.vida, estado.frenesi);
        if (estado.vida > 0 && estado.restantes === 0) progresso.limparSala();
        this.onEstado?.(estado);
        if (estado.vida <= 0 && !this.fimAvisado) {
            this.fimAvisado = true;
            this.onFim?.(estado);
            return;
        }
        const posicao = this.jogador.pos;

        const atravessouSaida =
            posicao.x >= 770 &&
            posicao.y > 250 &&
            posicao.y < 350;
        const existemInimigos = this.inimigos.some(
            inimigo => !inimigo.isKilled()
        );

        if (atravessouSaida) {
            if (existemInimigos) {
                this.jogador.pos.x = 750;
                this.jogador.vel.x = 0;
            } else {
                this.gerarSala();
            }
        }
    }

    get estadoAtual(): EstadoJogo {
        return {
            vida: this.jogador.vidaAtual,
            sala: this.numeroSala,
            pontos: this.jogador.pontos,
            arma: this.jogador.armaAtual,
            balas: this.jogador.balas,
            capacidade: this.jogador.capacidade,
            recarregando: this.jogador.recarregando,
            progressoRecarga: this.jogador.progressoRecarga,
            especial: this.jogador.especial,
            armaDisponivel: this.jogador.armaDisponivel,
            frenesi: this.jogador.nivelFrenesi,
            dash: this.jogador.dashPronto,
            restantes: this.inimigos.filter(inimigo => !inimigo.isKilled()).length
        };
    }
}
