import type { TipoArma } from "./armamento";

export const conquistas = [
    ["primeiro", "Primeiro estrago", "Eliminar o primeiro inimigo."],
    ["intacto", "Sem um arranhão", "Limpar uma sala sem sofrer dano."],
    ["fio", "Por um fio", "Limpar uma sala inteira com apenas uma vida."],
    ["cura", "De volta ao jogo", "Recuperar uma vida ao completar 16 eliminações."],
    ["frenesi", "Dedos no gatilho", "Atingir frenesi nível 3."],
    ["rapido", "Não pisca", "Limpar uma sala em até 3 segundos."],
    ["pistola", "Só preciso disso", "Chegar à sala 5 usando apenas a pistola."],
    ["arsenal", "Arsenal completo", "Usar todas as oito armas ao longo das partidas."],
    ["duplo", "Dois por um", "Eliminar dois inimigos com um disparo de escopeta."],
    ["plasma", "Dano colateral", "Eliminar três inimigos com um disparo de plasma."],
    ["minigun", "Chuva de chumbo", "Eliminar oito inimigos com minigun em uma partida."],
    ["sequencia", "Sem olhar para trás", "Limpar cinco salas consecutivas sem sofrer dano."],
    ["sala10", "Ainda está vivo?", "Chegar à sala 10."],
    ["sala25", "Morador do complexo", "Chegar à sala 25."],
    ["sala50", "Lenda do massacre", "Chegar à sala 50."]
] as const;
export type Disparo = { arma: TipoArma; mortes: number };
export type Recorde = { nome: string; sala: number; pontos: number };
type Dados = { desbloqueadas: Record<string, boolean>; armas: string[]; ranking: Recorde[]; nome: string };
export class Progresso {
    dados: Dados = { desbloqueadas: {}, armas: [], ranking: [], nome: "" };
    onConquista?: (id: string) => void;
    sala = 1;
    pontos = 0;
    private tempo = 0;
    private sofreuDano = false;
    private umaVida = false;
    private limpa = false;
    private sequencia = 0;
    private soPistola = true;
    private mortesMinigun = 0;
    private ativa = false;
    constructor(private armazenamento?: Pick<Storage, "getItem" | "setItem">) {
        try {
            const d = JSON.parse(armazenamento?.getItem("stickarnage-progresso-v1") ?? "null");
            if (d && typeof d === "object") {
                for (const [id] of conquistas) if (d.desbloqueadas?.[id] === true) this.dados.desbloqueadas[id] = true;
                this.dados.armas = Array.isArray(d.armas) ? d.armas.filter((a: unknown) => typeof a === "string") : [];
                this.dados.nome = typeof d.nome === "string" ? d.nome.slice(0, 16) : "";
                this.dados.ranking = Array.isArray(d.ranking) ? d.ranking.filter((r: Recorde) => r && typeof r.nome === "string" && Number.isInteger(r.sala) && r.sala > 0 && Number.isInteger(r.pontos) && r.pontos >= 0).slice(0, 20) : [];
            }
        } catch { /* Dados antigos ou armazenamento indisponível: começa vazio. */ }
    }
    private salvar(): void { try { this.armazenamento?.setItem("stickarnage-progresso-v1", JSON.stringify(this.dados)); } catch { /* Mantém a sessão em memória. */ } }
    iniciar(nome: string): void {
        this.dados.nome = nome.trim().replace(/\s+/g, " ").slice(0, 16);
        this.sala = 1; this.pontos = 0; this.sequencia = 0; this.soPistola = true; this.mortesMinigun = 0; this.ativa = true;
        this.salvar();
    }
    desbloquear(id: string): void {
        if (!this.ativa || this.dados.desbloqueadas[id]) return;
        this.dados.desbloqueadas[id] = true; this.salvar(); this.onConquista?.(id);
    }
    entrarSala(sala: number, vida: number): void {
        this.sala = sala; this.tempo = 0; this.sofreuDano = false; this.umaVida = vida === 1; this.limpa = false;
        if (sala >= 5 && this.soPistola) this.desbloquear("pistola");
        for (const alvo of [10, 25, 50]) if (sala >= alvo) this.desbloquear(`sala${alvo}`);
    }
    atualizar(delta: number, vida: number, frenesi: number): void {
        if (!this.ativa) return;
        if (!this.limpa) this.tempo += delta;
        if (vida !== 1) this.umaVida = false;
        if (frenesi >= 3) this.desbloquear("frenesi");
    }
    dano(): void { this.sofreuDano = true; this.umaVida = false; }
    curou(): void { this.umaVida = false; this.desbloquear("cura"); }
    usarArma(arma: TipoArma): void {
        if (arma !== "pistola") this.soPistola = false;
        if (!this.dados.armas.includes(arma)) { this.dados.armas.push(arma); this.salvar(); }
        if (this.dados.armas.length >= 8) this.desbloquear("arsenal");
    }
    eliminou(disparo: Disparo): void {
        if (!this.ativa) return;
        this.pontos += 100; disparo.mortes++;
        this.desbloquear("primeiro");
        if (disparo.arma.startsWith("escopeta") && disparo.mortes >= 2) this.desbloquear("duplo");
        if (disparo.arma === "canhao-plasma" && disparo.mortes >= 3) this.desbloquear("plasma");
        if (disparo.arma === "minigun" && ++this.mortesMinigun >= 8) this.desbloquear("minigun");
    }
    limparSala(): void {
        if (this.limpa) return;
        this.limpa = true;
        if (!this.sofreuDano) { this.desbloquear("intacto"); this.sequencia++; } else this.sequencia = 0;
        if (this.umaVida) this.desbloquear("fio");
        if (this.tempo <= 3000) this.desbloquear("rapido");
        if (this.sequencia >= 5) this.desbloquear("sequencia");
    }
    finalizar(): void {
        if (!this.ativa) return;
        this.ativa = false;
        const novo = { nome: this.dados.nome, sala: this.sala, pontos: this.pontos };
        const anterior = this.dados.ranking.find(r => r.nome.toLocaleLowerCase() === novo.nome.toLocaleLowerCase());
        if (!anterior || novo.sala > anterior.sala || novo.sala === anterior.sala && novo.pontos > anterior.pontos) {
            this.dados.ranking = this.dados.ranking.filter(r => r !== anterior);
            this.dados.ranking.push(novo);
            this.dados.ranking.sort((a, b) => b.sala - a.sala || b.pontos - a.pontos);
            this.dados.ranking = this.dados.ranking.slice(0, 20);
        }
        this.salvar();
    }
}
let armazenamento: Storage | undefined;
try { armazenamento = globalThis.localStorage; } catch { /* Sem armazenamento persistente. */ }
export const progresso = new Progresso(armazenamento);
