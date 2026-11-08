export const TAMANHO_CELULA = 40;
export const COLUNAS = 18;
export const LINHAS = 13;

export type Celula = {
    parede: boolean;
    reservada: boolean;
};

export function criarGrade(): Celula[][] {
    const grade: Celula[][] = [];

    for (let linha = 0; linha < LINHAS; linha++) {
        grade[linha] = [];

        for (let coluna = 0; coluna < COLUNAS; coluna++) {
            const pertoDaPorta =
                (coluna < 3 || coluna >= COLUNAS - 3) &&
                linha >= 4 && linha <= 8;

            grade[linha][coluna] = {
                parede: false,
                reservada: pertoDaPorta
            };
        }
    }

    return grade;
}

type Ponto = {
    coluna: number;
    linha: number;
};

type Parede = {
    x: number;
    y: number;
    largura: number;
    altura: number;
};

function sortear(limite: number): number {
    return Math.floor(Math.random() * limite);
}

function buscarChao(grade: Celula[][]): Ponto[] {
    const fila: Ponto[] = [{ coluna: 0, linha: 6 }];
    const visitadas = new Set<number>([6 * COLUNAS]);
    const direcoes = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (let indice = 0; indice < fila.length; indice++) {
        const atual = fila[indice];

        for (const [dx, dy] of direcoes) {
            const coluna = atual.coluna + dx;
            const linha = atual.linha + dy;

            if (
                coluna < 0 || coluna >= COLUNAS ||
                linha < 0 || linha >= LINHAS
            ) {
                continue;
            }

            const chave = linha * COLUNAS + coluna;

            if (grade[linha][coluna].parede || visitadas.has(chave)) {
                continue;
            }

            visitadas.add(chave);
            fila.push({ coluna, linha });
        }
    }

    return fila;
}

function todoChaoConectado(grade: Celula[][]): boolean {
    const totalLivre = grade
        .flat()
        .filter(celula => !celula.parede)
        .length;

    return buscarChao(grade).length === totalLivre;
}

// Conecta centros de 24 unidades mantendo o espaçamento da grade
function montarParedes(grade: Celula[][]): Parede[] {
    const paredes: Parede[] = [];
    const espessura = 24;
    const ponte = TAMANHO_CELULA - espessura;

    for (let linha = 0; linha < LINHAS; linha++) {
        for (let coluna = 0; coluna < COLUNAS; coluna++) {
            if (!grade[linha][coluna].parede) continue;

            const x = 40 + (coluna + 0.5) * TAMANHO_CELULA;
            const y = 40 + (linha + 0.5) * TAMANHO_CELULA;

            // Centro da célula
            paredes.push({
                x,
                y,
                largura: espessura,
                altura: espessura
            });

            // Nas bordas, estende a peça até o contorno existente da arena
            const margem = ponte / 2;
            if (coluna === 0 || coluna === COLUNAS - 1) {
                paredes.push({
                    x: coluna === 0 ? 40 + margem / 2 : 760 - margem / 2,
                    y, largura: margem, altura: espessura
                });
            }
            if (linha === 0 || linha === LINHAS - 1) {
                paredes.push({
                    x, y: linha === 0 ? 40 + margem / 2 : 560 - margem / 2,
                    largura: espessura, altura: margem
                });
            }

            // Liga à célula da direita
            if (grade[linha][coluna + 1]?.parede) {
                paredes.push({
                    x: x + TAMANHO_CELULA / 2,
                    y,
                    largura: ponte,
                    altura: espessura
                });
            }

            // Liga à célula de baixo
            if (grade[linha + 1]?.[coluna]?.parede) {
                paredes.push({
                    x,
                    y: y + TAMANHO_CELULA / 2,
                    largura: espessura,
                    altura: ponte
                });
            }
        }
    }

    return paredes;
}

// Plantas simples
export function gerarSalaAleatoria(anterior = "") {
    const familias = ["Escritório", "Mista", "Quatro Ls"];
    const escolhas = familias.filter(nome => nome !== anterior);
    let nome = escolhas[sortear(escolhas.length)];
    let grade = criarGrade();

    // Dois quartinhos ligados ao corredor por aberturas de duas células
    const quartos = (linha: number) => {
        for (let coluna = 0; coluna < COLUNAS; coluna++) {
            grade[linha][coluna].parede = true;
        }
        const inicio = linha === 3 ? 0 : linha + 1;
        const fim = linha === 3 ? linha : LINHAS;
        for (let y = inicio; y < fim; y++) grade[y][8].parede = true;
        for (const porta of [3 + sortear(3), 11 + sortear(3)]) {
            grade[linha][porta].parede = false;
            grade[linha][porta + 1].parede = false;
        }
    };

    // Duas divisórias em L voltadas para o centro, com braços curtos ou longos
    const baias = (linha: number) => {
        for (const esquerda of [true, false]) {
            const coluna = esquerda ? 4 + sortear(2) : 12 + sortear(2);
            for (let y = linha; y < linha + 3; y++) grade[y][coluna].parede = true;
            const braco = linha === 2 ? linha + 2 : linha;
            const comprimento = 2 + sortear(2);
            for (let i = 1; i < comprimento; i++) {
                grade[braco][coluna + (esquerda ? i : -i)].parede = true;
            }
        }
    };

    if (nome === "Escritório") {
        quartos(3);
        quartos(9);
    } else if (nome === "Mista") {
        quartos(3);
        baias(8);
    } else {
        baias(2);
        baias(8);
    }

    if (sortear(2)) grade = grade.map(linha => [...linha].reverse());
    if (sortear(2)) grade.reverse();

    // Mantém uma proteção caso uma planta seja alterada futuramente
    if (!todoChaoConectado(grade) || grade.some(linha =>
        linha.some(celula => celula.parede && celula.reservada)
    )) {
        grade = criarGrade();
        baias(2);
        baias(8);
        nome = "Quatro Ls";
    }

    let candidatas = buscarChao(grade).filter(p =>
        !grade[p.linha][p.coluna].reservada &&
        p.coluna >= 4 && p.coluna < COLUNAS - 1 &&
        p.linha >= 1 && p.linha < LINHAS - 1
    );
    const inimigos: { x: number; y: number }[] = [];

    // Um nascimento por região
    for (const [lado, faixa] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const regiao = candidatas.filter(p =>
            Number(p.coluna >= COLUNAS / 2) === lado &&
            Number(p.linha >= LINHAS / 2) === faixa
        );
        const quartosLivres = nome !== "Quatro Ls"
            ? regiao.filter(p => p.linha < 3 || p.linha > 9)
            : [];
        const opcoes = quartosLivres.length ? quartosLivres : regiao;
        if (!opcoes.length) continue;
        const escolhida = opcoes[sortear(opcoes.length)];
        inimigos.push({
            x: 40 + (escolhida.coluna + 0.5) * TAMANHO_CELULA,
            y: 40 + (escolhida.linha + 0.5) * TAMANHO_CELULA
        });
        candidatas = candidatas.filter(p =>
            (p.coluna - escolhida.coluna) ** 2 +
            (p.linha - escolhida.linha) ** 2 >= 4
        );
    }

    // Detalhes longe das paredes e dos personagens
    let locais = buscarChao(grade).filter(p =>
        !grade[p.linha][p.coluna].reservada &&
        [-1, 0, 1].every(dy => [-1, 0, 1].every(dx => {
            const celula = grade[p.linha + dy]?.[p.coluna + dx];
            return celula && !celula.parede && !celula.reservada;
        })) &&
        inimigos.every(i => Math.hypot(
            i.x - (60 + p.coluna * 40), i.y - (60 + p.linha * 40)
        ) > 60)
    );
    const detalhes: { x: number; y: number; tipo: number }[] = [];
    for (let i = 0; i < 4 && locais.length; i++) {
        const p = locais[sortear(locais.length)];
        detalhes.push({
            x: 60 + p.coluna * 40,
            y: 60 + p.linha * 40,
            tipo: 3
        });
        locais = locais.filter(outro => Math.hypot(
            outro.coluna - p.coluna, outro.linha - p.linha
        ) >= 3);
    }
    const tampas: { x: number; y: number; tipo: number }[] = [];
    for (let i = 0; i < 3 && locais.length; i++) {
        const p = locais[sortear(locais.length)];
        tampas.push({
            x: 60 + p.coluna * 40,
            y: 60 + p.linha * 40,
            tipo: sortear(2)
    });
    locais = locais.filter(outro => Math.hypot(
        outro.coluna - p.coluna, outro.linha - p.linha
    ) >= 3);
}
    const livres = buscarChao(grade).filter(p =>
        !grade[p.linha][p.coluna].reservada &&
        p.coluna >= 4 && p.coluna < COLUNAS - 2 &&
        p.linha >= 1 && p.linha < LINHAS - 1 &&
        inimigos.every(i => Math.hypot(
            i.x - (60 + p.coluna * 40), i.y - (60 + p.linha * 40)
        ) > 80)
    );
    const armas = [] as { x: number; y: number; tipo: "submetralhadora" | "escopeta" }[];

    for (const tipo of ["submetralhadora", "escopeta"] as const) {
        const opcoes = livres.filter(p => p.linha < 6);
        if (!opcoes.length) break;
        const p = opcoes[sortear(opcoes.length)];
        armas.push({ x: 60 + p.coluna * 40, y: 60 + p.linha * 40, tipo });
        for (let i = livres.length - 1; i >= 0; i--) {
            if (Math.hypot(livres[i].coluna - p.coluna, livres[i].linha - p.linha) < 3) {
                livres.splice(i, 1);
            }
        }
    }

    return { nome, paredes: montarParedes(grade), inimigos, detalhes:[...detalhes, ...tampas], armas };
}
