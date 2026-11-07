import { Actor, CollisionType, Color, Scene, Sprite, vec } from "excalibur";
import { Player } from "./player";
import { Projetil } from "./projetil";
import { ArmaChao } from "./arma-chao";
import { EfeitoDash } from "./efeito-dash";
import { gerarSalaAleatoria } from "./gerador";
import { Resources } from "./resources";
import { desenharParedes } from "./desenho-paredes";
import type { RetanguloParede } from "./desenho-paredes";
import { desenharAmbiente } from "./ambiente";

export class MyLevel extends Scene {
    private jogador = new Player();
    private paredesInternas: Actor[] = [];
    private numeroSala = 0;
    private ultimaFamilia = "";
    private marcadoresInimigos: Actor[] = [];
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
        this.add(this.jogador.indicador);
        this.gerarSala();
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
        // Os tiros ficam na sala anterior
        for (const ator of this.actors) {
            if (ator instanceof Projetil) ator.kill();
            if (ator instanceof ArmaChao) ator.kill();
            if (ator instanceof EfeitoDash) ator.kill();
        }

        for (const parede of this.paredesInternas) {
            parede.kill();
        }

        for (const marcador of this.marcadoresInimigos) {
            marcador.kill();
        }

        this.paredesInternas = [];
        this.marcadoresInimigos = [];

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

        for (const posicao of sala.inimigos) {
            const marcador = new Actor({
                pos: vec(posicao.x, posicao.y),
                radius: 12,
                color: Color.Orange,
                collisionType: CollisionType.PreventCollision,
                z: 2
            });

            this.add(marcador);
            this.marcadoresInimigos.push(marcador);
        }

        for (const posicao of sala.armas) {
            this.add(new ArmaChao(posicao.tipo, posicao.x, posicao.y));
        }

        this.jogador.pos = vec(78, 300);
        this.jogador.entrarNaSala();
        this.jogador.indicador.text = "PISTOLA  |  FRENESI 0/3  |  DASH PRONTO";

        this.numeroSala++;

        console.log(
            `Sala ${this.numeroSala}:`,
            `${sala.nome},`,
            `${sala.inimigos.length} posições de inimigos`
        );
    }

    override onPostUpdate(): void {
        const posicao = this.jogador.pos;

        const atravessouSaida =
            posicao.x >= 770 &&
            posicao.y > 250 &&
            posicao.y < 350;

        if (atravessouSaida) {
            this.gerarSala();
        }
    }
}
