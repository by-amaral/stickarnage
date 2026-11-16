import { Actor, Scene, Sprite, vec } from "excalibur";
import { Resources } from "./resources";

export class TelaCarregamento extends Scene {
    override onInitialize(): void {
        const fundo = new Actor({ pos: vec(400, 300), width: 800, height: 600 });
        fundo.graphics.use(new Sprite({ image: Resources.FundoCarregamento, destSize: { width: 800, height: 600 } }));
        this.add(fundo);
    }
}
