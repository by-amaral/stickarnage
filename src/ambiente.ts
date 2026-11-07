import { Canvas } from "excalibur";
import { Resources } from "./resources";

export function desenharAmbiente(detalhes: { x: number; y: number; tipo: number }[]) {
    return new Canvas({
        width: 800, height: 600, cache: true,
        draw: ctx => {
            // Tom escuro
            ctx.fillStyle = "rgba(6, 12, 20, 0.22)";
            ctx.fillRect(20, 20, 760, 560);

            // Detalhes do piso
            const imagem = Resources.DetalhesPiso.image;
            const largura = imagem.width / 2;
            const altura = imagem.height / 2;
            ctx.imageSmoothingEnabled = false;
            for (const p of detalhes) {
                const tamanho = p.tipo < 2 ? 80 : 100;
                ctx.globalAlpha = p.tipo < 2 ? 1 : 0.65;
                ctx.drawImage(imagem,
                    (p.tipo % 2) * largura, Math.floor(p.tipo / 2) * altura,
                    largura, altura,
                    p.x - tamanho / 2, p.y - tamanho / 2, tamanho, tamanho);
            }
            ctx.globalAlpha = 1;

            // Bordas escuras
            const sombra = ctx.createRadialGradient(400, 300, 170, 400, 300, 490);
            sombra.addColorStop(0, "rgba(0, 0, 0, 0)");
            sombra.addColorStop(1, "rgba(0, 0, 0, 0.65)");
            ctx.fillStyle = sombra;
            ctx.fillRect(20, 20, 760, 560);

            // Luzes nas portas e nas paredes
            const brilho = (x: number, y: number, cor: string) => {
                const luz = ctx.createRadialGradient(x, y, 0, x, y, 90);
                luz.addColorStop(0, cor);
                luz.addColorStop(1, "rgba(0, 0, 0, 0)");
                ctx.fillStyle = luz;
                ctx.fillRect(x - 90, y - 90, 180, 180);
            };
            ctx.save();
            ctx.beginPath();
            ctx.rect(20, 20, 760, 560);
            ctx.clip();
            brilho(40, 300, "rgba(190, 20, 30, 0.20)");
            brilho(760, 300, "rgba(0, 205, 195, 0.20)");
            for (const x of [220, 580]) {
                for (const y of [34, 566]) {
                    brilho(x, y, "rgba(195, 215, 220, 0.12)");
                    ctx.fillStyle = "#14181c";
                    ctx.fillRect(x - 18, y - 4, 36, 8);
                    ctx.fillStyle = "#d3ddd8";
                    ctx.fillRect(x - 14, y - 2, 28, 3);
                }
            }
            ctx.restore();
        }
    });
}
