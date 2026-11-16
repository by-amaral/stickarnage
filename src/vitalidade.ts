export class Vitalidade {
    vida = 3;
    eliminacoes = 0;
    protecao = 0;

    entrarNaSala(): void { this.protecao = 800; }
    atualizar(delta: number): void { this.protecao = Math.max(0, this.protecao - delta); }

    receberDano(): boolean {
        if (this.protecao > 0 || this.vida <= 0) return false;
        this.vida--;
        this.protecao = 850;
        return true;
    }

    registrarEliminacao(): boolean {
        this.eliminacoes++;
        if (this.eliminacoes % 16 !== 0 || this.vida >= 3 || this.vida <= 0) return false;
        this.vida++;
        return true;
    }
}
