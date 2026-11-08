import { Actor, Scene, Sprite, vec, Engine } from "excalibur";
import { Resources } from "./resources";

export class TelaCarregamento extends Scene {
    private progresso = 0;
    private tempoDecorrido = 0;
    private preenchimento: Actor | undefined;
    private iniciouPartida = false;
    override onInitialize(): void {
         const fundo = new Actor({
            pos: vec(400, 300),
            width: 800,
            height: 600
        });

        fundo.graphics.use(new Sprite({
            image: Resources.FundoCarregamento,
            destSize: {
                width: 800,
                height: 600
            }
        }));

        this.add(fundo);

        this.preenchimento = new Actor({
            pos: vec(400, 270),
            width: 0,
            height: 35
        });

        this.preenchimento.graphics.use(new Sprite({
            image: Resources.Preenchimento,
            destSize: {
                width: 600,
                height: 35
            }
        }));
        this.add(this.preenchimento);

        const barra = new Actor({
            pos: vec(400, 270),
            width: 600,
            height: 80
        });

        barra.graphics.use(new Sprite({
            image: Resources.BarraCarregamento,
            destSize: {
                width: 600,
                height: 80
            }
        }));

        this.add(barra);
    }
    override onPostUpdate(engine: Engine, elapsed: number): void {
        this.tempoDecorrido += elapsed;
        this.progresso = Math.min(this.tempoDecorrido / 3000, 1);
        if (this.preenchimento) {
            this.preenchimento.graphics.current!.width = 600 * this.progresso;
            this.preenchimento.pos.x = 100 + (600 * this.progresso) / 2;
        }
        if (this.progresso >= 1 && !this.iniciouPartida) {
            this.iniciouPartida = true;
            this.engine.goToScene("start");
        }
    }
}