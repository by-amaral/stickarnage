export function perfilInimigo(sala: number, indice: number) {
    const patamar = Math.floor(sala / 5);
    const rapido = patamar > 0 && indice % 4 === 1;
    const armado = patamar > 0 && indice % 4 === 0;
    return {
        velocidade: rapido ? Math.min(175, 112 + patamar * 8) : 90,
        quadro: armado ? (patamar >= 3 ? 6 : patamar >= 2 ? 4 : 3) : 0,
        projeteis: armado && patamar === 1 ? 3 : 1,
        intervalo: armado ? Math.max(450, 1400 - patamar * 180) : 2000,
        linha: rapido ? 192 : armado ? 64 : 128
    };
}
