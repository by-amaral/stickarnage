import { test, expect } from "@playwright/test";
import { Vitalidade } from "../src/vitalidade";

test("proteção dura 800ms e renova em cada sala", () => {
    const estado = new Vitalidade();
    estado.entrarNaSala();
    expect(estado.receberDano()).toBe(false);
    estado.atualizar(799);
    expect(estado.receberDano()).toBe(false);
    estado.atualizar(1);
    expect(estado.receberDano()).toBe(true);
    expect(estado.vida).toBe(2);
    estado.entrarNaSala();
    estado.atualizar(799);
    expect(estado.receberDano()).toBe(false);
    expect(estado.vida).toBe(2);
});

test("a 16ª e a 32ª eliminação curam uma vida, sem ultrapassar três", () => {
    const estado = new Vitalidade();
    estado.receberDano();
    for (let i = 0; i < 15; i++) expect(estado.registrarEliminacao()).toBe(false);
    expect(estado.vida).toBe(2);
    expect(estado.registrarEliminacao()).toBe(true);
    expect(estado.vida).toBe(3);
    estado.atualizar(850);
    estado.receberDano();
    for (let i = 0; i < 16; i++) estado.registrarEliminacao();
    expect(estado.vida).toBe(3);
    for (let i = 0; i < 16; i++) estado.registrarEliminacao();
    expect(estado.vida).toBe(3);
});

test("eliminações pendentes não ressuscitam o jogador", () => {
    const estado = new Vitalidade();
    for (let i = 0; i < 3; i++) { estado.atualizar(850); estado.receberDano(); }
    for (let i = 0; i < 16; i++) estado.registrarEliminacao();
    expect(estado.vida).toBe(0);
});
