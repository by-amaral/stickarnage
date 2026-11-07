import { Canvas } from "excalibur";
import { Resources } from "./resources";

export type RetanguloParede = {
    x: number;
    y: number;
    largura: number;
    altura: number;
};

// Todas as camadas usam as coordenadas da arena
function criarCamada() {
    const imagem = document.createElement("canvas");
    imagem.width = 800;
    imagem.height = 600;
    const ctx = imagem.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;
    return { imagem, ctx };
}

export function desenharParedes(paredes: RetanguloParede[]): Canvas {
    const mascara = criarCamada();
    mascara.ctx.fillStyle = "#101216";
    for (const parede of paredes) {
        mascara.ctx.fillRect(
            parede.x - parede.largura / 2,
            parede.y - parede.altura / 2,
            parede.largura,
            parede.altura
        );
    }

    const textura = document.createElement("canvas");
    textura.width = 128;
    textura.height = 128;
    const t = textura.getContext("2d")!;
    t.imageSmoothingEnabled = false;
    t.drawImage(Resources.ConcretoParede.image, 0, 0, 128, 128);

    const topo = criarCamada();
    topo.ctx.fillStyle = topo.ctx.createPattern(textura, "repeat")!;
    topo.ctx.fillRect(0, 0, 800, 600);

    topo.ctx.fillStyle = "rgba(30, 32, 36, 0.24)";
    for (let x = 40; x < 800; x += 40) topo.ctx.fillRect(x, 0, 1, 600);
    for (let y = 40; y < 600; y += 40) topo.ctx.fillRect(0, y, 800, 1);
    topo.ctx.globalCompositeOperation = "destination-in";
    topo.ctx.drawImage(mascara.imagem, 0, 0);

    const volume = criarCamada();
    for (let y = 0; y <= 8; y++) volume.ctx.drawImage(mascara.imagem, 0, y);

    const face = criarCamada();
    face.ctx.drawImage(volume.imagem, 0, 0);
    face.ctx.globalCompositeOperation = "source-in";
    face.ctx.fillStyle = face.ctx.createPattern(textura, "repeat")!;
    face.ctx.fillRect(0, 0, 800, 600);
    face.ctx.globalCompositeOperation = "source-atop";
    face.ctx.fillStyle = "rgba(13, 17, 23, 0.72)";
    face.ctx.fillRect(0, 0, 800, 600);

    const borda = (dx: number, dy: number, cor: string) => {
        const camada = criarCamada();
        camada.ctx.drawImage(mascara.imagem, 0, 0);
        camada.ctx.globalCompositeOperation = "destination-out";
        camada.ctx.drawImage(mascara.imagem, dx, dy);
        camada.ctx.globalCompositeOperation = "source-in";
        camada.ctx.fillStyle = cor;
        camada.ctx.fillRect(0, 0, 800, 600);
        return camada.imagem;
    };
    const luz = borda(2, 2, "#d9dad6");
    const chanfro = borda(-2, -2, "#565b63");

    return new Canvas({
        width: 800,
        height: 600,
        cache: true,
        draw: ctx => {
            ctx.imageSmoothingEnabled = false;
            // Sombra projetada e de contato
            ctx.globalAlpha = 0.18;
            ctx.drawImage(volume.imagem, 4, 7);
            ctx.globalAlpha = 0.32;
            ctx.drawImage(volume.imagem, 2, 3);
            ctx.globalAlpha = 1;
            for (const [x, y] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                ctx.drawImage(volume.imagem, x, y);
            }
            ctx.drawImage(face.imagem, 0, 0);
            ctx.drawImage(topo.imagem, 0, 0);
            ctx.globalAlpha = 0.7;
            ctx.drawImage(luz, 0, 0);
            ctx.globalAlpha = 1;
            ctx.drawImage(chanfro, 0, 0);
        }
    });
}
