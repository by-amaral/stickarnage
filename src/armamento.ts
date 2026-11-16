export const armas = {
    pistola: { quadro: 0, intervalo: 180, automatico: false, projeteis: 1, dispersao: 0, dano: 2, capacidade: 18, recarga: 1050, impacto: .7 },
    revolver: { quadro: 1, intervalo: 420, automatico: false, projeteis: 1, dispersao: 0, dano: 4, capacidade: 6, recarga: 1450, impacto: 2 },
    submetralhadora: { quadro: 2, intervalo: 95, automatico: true, projeteis: 1, dispersao: .04, dano: 1, capacidade: 30, recarga: 1350, impacto: .45 },
    escopeta: { quadro: 3, intervalo: 650, automatico: false, projeteis: 5, dispersao: .3, dano: 1, capacidade: 8, recarga: 1800, impacto: 3 },
    fuzil: { quadro: 4, intervalo: 155, automatico: true, projeteis: 1, dispersao: .025, dano: 2, capacidade: 24, recarga: 1600, impacto: 1.2 },
    "escopeta-dupla": { quadro: 5, intervalo: 850, automatico: false, projeteis: 9, dispersao: .42, dano: 1, capacidade: 2, recarga: 1600, impacto: 4.5 },
    minigun: { quadro: 6, intervalo: 55, automatico: true, projeteis: 1, dispersao: .1, dano: 2, capacidade: 60, recarga: 0, impacto: 1.7 },
    "canhao-plasma": { quadro: 7, intervalo: 600, automatico: false, projeteis: 1, dispersao: 0, dano: 8, capacidade: 6, recarga: 0, impacto: 5 }
} as const;
export type TipoArma = keyof typeof armas;
export const armasNormais: TipoArma[] = ["pistola", "revolver", "submetralhadora", "escopeta", "fuzil", "escopeta-dupla"];
export const nomeArma = (tipo: string): string => ({ submetralhadora: "SMG", "canhao-plasma": "PLASMA", "escopeta-dupla": "ESCOPETA DUPLA" }[tipo] ?? tipo.toUpperCase());

export class Armamento {
    onRecarga?: (tipo: TipoArma, concluida: boolean) => void;
    normal: TipoArma = "pistola";
    especial?: TipoArma;
    carga = 0;
    usos = 0;
    recarregando = 0;
    balas = Object.fromEntries(Object.entries(armas).map(([tipo, config]) => [tipo, config.capacidade])) as Record<TipoArma, number>;
    get tipo(): TipoArma { return this.especial ?? this.normal; }
    get quantidade(): number { return this.balas[this.tipo]; }
    trocar(tipo: TipoArma): void { this.normal = tipo; this.recarregando = 0; }
    recarregar(): void {
        if (!this.especial && !this.recarregando && this.quantidade < armas[this.tipo].capacidade) {
            this.recarregando = armas[this.tipo].recarga;
            this.onRecarga?.(this.tipo, false);
        }
    }
    atualizar(delta: number): void {
        if (!this.recarregando) return;
        this.recarregando = Math.max(0, this.recarregando - delta);
        if (!this.recarregando) {
            this.balas[this.normal] = armas[this.normal].capacidade;
            this.onRecarga?.(this.normal, true);
        }
    }
    consumir(): boolean {
        if (this.recarregando || this.quantidade <= 0) return false;
        this.balas[this.tipo]--;
        return true;
    }
    concluirDisparo(): void {
        if (this.quantidade > 0) return;
        if (this.especial) this.especial = undefined;
        else this.recarregar();
    }
    registrarEliminacao(): void { if (!this.especial) this.carga = Math.min(8, this.carga + 1); }
    ativarEspecial(): boolean {
        if (this.carga < 8 || this.especial) return false;
        this.especial = this.usos++ % 2 === 0 ? "minigun" : "canhao-plasma";
        this.balas[this.especial] = armas[this.especial].capacidade;
        this.carga = 0;
        this.recarregando = 0;
        return true;
    }
}
