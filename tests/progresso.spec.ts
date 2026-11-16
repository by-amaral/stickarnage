import { test, expect } from "@playwright/test";
import { Progresso, type Disparo } from "../src/progresso";
import { perfilInimigo } from "../src/dificuldade";

test("tempo de três segundos é inclusivo e desconta pausa", () => {
    for (const [tempo, esperado] of [[3000, true], [3001, false]] as const) {
        const p = new Progresso(); p.iniciar("Teste"); p.entrarSala(1, 3);
        p.atualizar(0, 3, 0); p.atualizar(tempo, 3, 0); p.limparSala();
        expect(!!p.dados.desbloqueadas.rapido).toBe(esperado);
    }
});
test("conquistas de tiro compartilhado e notificações são únicas", () => {
    const p = new Progresso(); p.iniciar("Teste");
    const avisos: string[] = []; p.onConquista = id => avisos.push(id);
    const disparo: Disparo = { arma: "escopeta", mortes: 0 };
    p.eliminou(disparo); p.eliminou(disparo); p.eliminou(disparo);
    expect(avisos.filter(id => id === "primeiro")).toHaveLength(1);
    expect(avisos.filter(id => id === "duplo")).toHaveLength(1);
    const plasma: Disparo = { arma: "canhao-plasma", mortes: 0 };
    p.eliminou(plasma); p.eliminou(plasma); expect(p.dados.desbloqueadas.plasma).toBeUndefined();
    p.eliminou(plasma); expect(p.dados.desbloqueadas.plasma).toBe(true);
});
test("dano rompe sequência e cura invalida sala inteira com uma vida", () => {
    const p = new Progresso(); p.iniciar("Teste");
    for (let i = 1; i <= 4; i++) { p.entrarSala(i, 3); p.limparSala(); }
    p.entrarSala(5, 1); p.dano(); p.limparSala();
    expect(p.dados.desbloqueadas.sequencia).toBeUndefined();
    p.entrarSala(6, 1); p.curou(); p.limparSala();
    expect(p.dados.desbloqueadas.fio).toBeUndefined();
    p.entrarSala(7, 1); p.limparSala(); expect(p.dados.desbloqueadas.fio).toBe(true);
});
test("recordes persistem e priorizam sala, depois pontos, sem duplicar nomes", () => {
    const dados = new Map<string, string>();
    const storage = { getItem: (k: string) => dados.get(k) ?? null, setItem: (k: string, v: string) => { dados.set(k, v); } };
    const p = new Progresso(storage);
    p.iniciar("Ana"); p.sala = 5; p.pontos = 100; p.finalizar(); p.finalizar();
    p.iniciar("Bia"); p.sala = 4; p.pontos = 5000; p.finalizar();
    p.iniciar("ana"); p.sala = 3; p.finalizar();
    expect(p.dados.ranking.map(r => r.nome)).toEqual(["Ana", "Bia"]);
    p.iniciar("Bia"); p.sala = 5; p.pontos = 200; p.finalizar();
    expect(new Progresso(storage).dados.ranking[0].nome).toBe("Bia");
});
test("patamares 5, 10 e 15 mudam armas e velocidade sem acelerar todos", () => {
    expect(perfilInimigo(4, 0).quadro).toBe(0);
    expect(perfilInimigo(5, 0).projeteis).toBe(3);
    expect(perfilInimigo(10, 0).quadro).toBe(4);
    expect(perfilInimigo(15, 0).quadro).toBe(6);
    expect(perfilInimigo(10, 1).velocidade).toBeGreaterThan(perfilInimigo(5, 1).velocidade);
    expect(perfilInimigo(50, 2).velocidade).toBe(90);
    expect(perfilInimigo(100, 1).velocidade).toBeLessThan(240);
});
