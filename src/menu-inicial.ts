import { Actor, Scene, Sprite, vec } from "excalibur";
import { Resources } from "./resources";

export class MenuInicial extends Scene {
    override onInitialize(): void {

        const fundo = new Actor({
            pos: vec(400, 300),
            width: 800,
            height: 600
        });

        fundo.graphics.use(new Sprite({
            image: Resources.FundoMenu,
            destSize: {
                width: 800,
                height: 600
            }
        }));
        this.add(fundo);

        const logo = new Actor({
            pos: vec(400, 145),
            width: 620,
            height: 240
        });

        logo.graphics.use(new Sprite({
            image: Resources.LogoMenu,
            destSize: {
                width: 620,
                height: 240
            }
        }));
        this.add(logo);

        const botao = new Actor({
            pos: vec(400, 500),
            width: 280,
            height: 76
        });

        botao.graphics.use(new Sprite({
            image: Resources.BotaoMenu,
            destSize: {
                width: 320,
                height: 90
            }
        }));
        this.add(botao);

        botao.on("pointerenter", () => {
            botao.graphics.use(new Sprite({
                image: Resources.BotaoMenuAceso,
                destSize: {
                    width: 320,
                    height: 90
                }
            }));
        });

        botao.on("pointerleave", () => {
            botao.graphics.use(new Sprite({
                image: Resources.BotaoMenu,
                destSize: {
                    width: 320,
                    height: 90
                }
            }));
        });

        const botao2 = new Actor({
            pos: vec(400, 400),
            width: 280,
            height: 76
        });

        botao2.graphics.use(new Sprite({
            image: Resources.BotaoMenu,
            destSize: {
                width: 320,
                height: 90
            }
        }));

        this.add(botao2);
        const textoJogar = new Actor({
            pos: vec(400, 400),
            width: 150,
            height: 35
        });
        textoJogar.graphics.use(new Sprite({
            image: Resources.Jogar,
            destSize: {
                width: 150,
                height: 35
            }
        }));
        this.add(textoJogar);

        botao2.on("pointerup", () => {
            this.engine.goToScene("carregamento");
        });

        botao2.on("pointerenter", () => {

            botao2.graphics.use(new Sprite({
                image: Resources.BotaoMenuAceso,
                destSize: {
                    width: 320,
                    height: 90
                }
            }));
        });

        botao2.on("pointerleave", () => {
            botao2.graphics.use(new Sprite({
                image: Resources.BotaoMenu,
                destSize: {
                    width: 320,
                    height: 90
                }
            }));
        });
    }
}