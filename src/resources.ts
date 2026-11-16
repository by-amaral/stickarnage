import { ImageSource, Loader } from "excalibur";

export const Resources = {
    Jogador: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/jogador.png"),
    Armas: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/armas.png"),
    Disparos: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/efeitos.png"),
    DetalhesPiso: new ImageSource(import.meta.env.BASE_URL + "assets/arena/detalhes-piso.png"),
    ConcretoParede: new ImageSource(import.meta.env.BASE_URL + "assets/arena/parede-concreto-v2.png"),
    Piso: new ImageSource(import.meta.env.BASE_URL + "assets/arena/piso.png"),
    PortaEntrada: new ImageSource(import.meta.env.BASE_URL + "assets/arena/porta-entrada.png"),
    PortaSaida: new ImageSource(import.meta.env.BASE_URL + "assets/arena/porta-saida.png"),
    FundoMenu: new ImageSource(import.meta.env.BASE_URL + "assets/menus-v1/inicio.png"),
    FundoCarregamento: new ImageSource(import.meta.env.BASE_URL + "assets/menus-v1/carregamento.png"),
    Inimigos: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/inimigos.png"),
    Mancha: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/sangue-itens/mancha-4.png"),
    SangueImpacto: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/sangue-itens/sangue-impacto-4.png"),
    Corpo: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/sangue-itens/corpo-4.png"),
    FlashTiro: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/efeitos/disparo-1.png"),
    Impacto: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/efeitos/impacto-1.png"),
    Plasma: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/efeitos/plasma.png"),
} as const;

class CarregadorIndustrial extends Loader {
    override onDraw(ctx: CanvasRenderingContext2D): void {
        const w = ctx.canvas.width, h = ctx.canvas.height;
        ctx.fillStyle = "#0a0d10"; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#171b20";
        for (let y = 0; y < h; y += 5) ctx.fillRect(0, y, w, 1);
        ctx.fillStyle = "#ede7dc"; ctx.textAlign = "center";
        ctx.font = `bold ${w * .035}px monospace`;
        ctx.fillText("STICKARNAGE", w / 2, h * .43);
        ctx.strokeStyle = "#605d59"; ctx.lineWidth = 2;
        ctx.strokeRect(w * .24, h * .53, w * .52, h * .055);
        for (let i = 0; i < 24; i++) {
            ctx.fillStyle = i / 24 < this.progress ? "#df172b" : "#29151b";
            ctx.fillRect(w * .247 + i * w * .021, h * .54, w * .016, h * .035);
        }
        ctx.font = `${w * .014}px monospace`;
        ctx.fillStyle = "#d2c6bb";
        ctx.fillText(`CARREGANDO ${Math.round(this.progress * 100)}%`, w / 2, h * .64);
    }
}
export const loader = new CarregadorIndustrial();

for (const recurso of Object.values(Resources)) {
    loader.addResource(recurso);
}
