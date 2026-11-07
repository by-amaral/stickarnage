// Sobe com eliminações e esfria depois de um intervalo
export class Frenesi {
    private carga = 0;
    private semEliminacao = 0;

    get nivel(): number {
        return Math.min(3, Math.ceil(this.carga / 34));
    }

    registrarEliminacao(): void {
        this.carga = Math.min(100, this.carga + 34);
        this.semEliminacao = 0;
    }

    atualizar(delta: number): void {
        if (this.nivel === 0) return;
        this.semEliminacao += delta;
        if (this.semEliminacao > 3000) {
            this.carga = Math.max(0, this.carga - delta * 0.012);
        }
    }
}
