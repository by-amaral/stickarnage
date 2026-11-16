import { test, expect } from "@playwright/test";
import { Armamento, armas } from "../src/armamento";

test("recarga emite som só no início e no fim e não conclui após troca", () => {
    const arma = new Armamento();
    const eventos: string[] = [];
    arma.onRecarga = (tipo, concluida) => eventos.push(`${tipo}:${concluida}`);
    arma.recarregar();
    expect(eventos).toEqual([]);
    arma.consumir(); arma.recarregar(); arma.recarregar();
    expect(eventos).toEqual(["pistola:false"]);
    arma.atualizar(1050);
    expect(eventos).toEqual(["pistola:false", "pistola:true"]);
    arma.consumir(); arma.recarregar(); arma.trocar("fuzil"); arma.atualizar(2000);
    expect(eventos).toEqual(["pistola:false", "pistola:true", "pistola:false"]);
});

for (const [tipo, capacidade] of [["pistola", 18], ["submetralhadora", 30], ["escopeta", 8]] as const) {
    test(`${tipo}: esvaziar, bloquear tiros e completar a recarga`, () => {
        const arma = new Armamento();
        arma.trocar(tipo);
        expect(arma.quantidade).toBe(capacidade);
        for (let i = 0; i < capacidade; i++) { expect(arma.consumir()).toBe(true); arma.concluirDisparo(); }
        expect(arma.quantidade).toBe(0);
        expect(arma.consumir()).toBe(false);
        arma.atualizar(armas[tipo].recarga - 1);
        expect(arma.consumir()).toBe(false);
        arma.atualizar(1);
        expect(arma.quantidade).toBe(capacidade);
    });
}

test("trocar armas não repõe munição e especiais devolvem a arma anterior", () => {
    const arma = new Armamento();
    arma.consumir();
    arma.trocar("fuzil"); arma.trocar("pistola");
    expect(arma.quantidade).toBe(17);
    expect(arma.ativarEspecial()).toBe(false);
    for (let i = 0; i < 8; i++) arma.registrarEliminacao();
    expect(arma.ativarEspecial()).toBe(true);
    expect(arma.tipo).toBe("minigun");
    arma.recarregar();
    expect(arma.recarregando).toBe(0);
    for (let i = 0; i < 60; i++) { arma.consumir(); arma.concluirDisparo(); }
    expect(arma.tipo).toBe("pistola");
    expect(arma.quantidade).toBe(17);
    for (let i = 0; i < 8; i++) arma.registrarEliminacao();
    arma.ativarEspecial();
    expect(arma.tipo).toBe("canhao-plasma");
    expect(arma.quantidade).toBe(6);
});
