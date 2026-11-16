import { conquistas, progresso } from "./progresso";
import { audioJogo } from "./audio";

export function montarConquistas(): void {
    const lista = document.getElementById("achievement-list")!;
    lista.replaceChildren();
    const total = conquistas.filter(([id]) => progresso.dados.desbloqueadas[id]).length;
    document.getElementById("achievement-count")!.textContent = `${total}/${conquistas.length} · Neste navegador`;
    for (const [indice, [id, titulo, descricao]] of conquistas.entries()) {
        const pronta = progresso.dados.desbloqueadas[id];
        const card = document.createElement("article"); card.className = `achievement-card ${pronta ? "unlocked" : ""}`;
        const badge = document.createElement("b"); badge.textContent = pronta ? "★" : String(indice + 1).padStart(2, "0");
        const info = document.createElement("div");
        const nome = document.createElement("strong"); nome.textContent = titulo;
        const texto = document.createElement("p"); texto.textContent = descricao;
        const estado = document.createElement("small"); estado.textContent = pronta ? "DESBLOQUEADA" : id === "arsenal" ? `${progresso.dados.armas.length}/8 ARMAS` : "BLOQUEADA";
        info.append(nome, texto, estado); card.append(badge, info); lista.append(card);
    }
}

export function montarRanking(): void {
    const lista = document.getElementById("ranking-list")!;
    lista.replaceChildren();
    document.getElementById("ranking-empty")!.hidden = progresso.dados.ranking.length > 0;
    progresso.dados.ranking.forEach((recorde, indice) => {
        const linha = document.createElement("tr");
        for (const valor of [indice + 1, recorde.nome, recorde.sala, recorde.pontos]) {
            const celula = document.createElement("td"); celula.textContent = String(valor); linha.append(celula);
        }
        lista.append(linha);
    });
}

const fila: string[] = [];
let exibindo = false;
function proximo(): void {
    if (exibindo || !fila.length) return;
    const proxima = fila.shift();
    const conquista = conquistas.find(([id]) => id === proxima);
    if (!conquista) return;
    exibindo = true;
    const toast = document.getElementById("achievement-toast")!;
    document.getElementById("toast-title")!.textContent = conquista[1];
    document.getElementById("toast-description")!.textContent = conquista[2];
    toast.hidden = false;
    toast.classList.remove("earned"); void toast.offsetWidth; toast.classList.add("earned");
    audioJogo.tocar("coleta");
    window.setTimeout(() => { toast.hidden = true; exibindo = false; proximo(); }, 3400);
}
progresso.onConquista = id => { fila.push(id); proximo(); };
