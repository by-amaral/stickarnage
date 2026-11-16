import { test, expect } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";

let servidor: ViteDevServer;
let url: string;
test.beforeAll(async () => {
    servidor = await createServer({ server: { host: "127.0.0.1", port: 0, open: false } });
    await servidor.listen();
    url = servidor.resolvedUrls!.local[0];
});
test.afterAll(async () => { await servidor?.close(); });

test("eliminações em sequência reutilizam as camadas de sangue e expiram os impactos", async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", erro => erros.push(erro.message));
    await page.goto(`${url}tests/fixtures/efeitos.html`);
    await page.waitForFunction(() => typeof (window as any).medirSangue === "function");
    for (let rodada = 0; rodada < 3; rodada++) {
        const resultado = await page.evaluate(() => (window as any).medirSangue());
        // Duas camadas persistentes + quatro impactos temporários + corpos das rodadas.
        // Esse limite detecta a volta de uma entidade por gota sem depender da velocidade da máquina.
        expect(resultado.picoAtores).toBeLessThanOrEqual(10 + rodada * 4);
        expect(resultado.atualizacoes).toBeGreaterThan(0);
        expect(resultado.efeitosRestantes).toBe(0);
    }
    expect(erros).toEqual([]);
});

test("trocar de partida encerra o jogador anterior e tiros ignoram inimigos mortos", async ({ page }) => {
    const erros: string[] = [];
    page.on("pageerror", erro => erros.push(erro.message));
    page.on("console", mensagem => {
        if (mensagem.text().includes("Graphic undefined")) erros.push(mensagem.text());
    });
    await page.goto(`${url}tests/fixtures/efeitos.html`);
    await page.waitForFunction(() => typeof (window as any).verificarReinicio === "function");
    expect(await page.evaluate(() => (window as any).verificarReinicio())).toEqual(
        Array.from({ length: 3 }, () => ({ morto: true, encerramentos: 1 }))
    );
    expect(await page.evaluate(() => (window as any).verificarTiros())).toEqual({ alvoEliminado: true, tiroConsumido: true });
    expect(erros).toEqual([]);
});
