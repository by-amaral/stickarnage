import type { EstadoJogo } from "./level";

export class Mira {
    private ativa = false;
    private dentro = false;
    private x = 0;
    private y = 0;
    private arma = "";
    private balas = -1;
    private animacao?: Animation;
    private readonly desenho: SVGSVGElement;
    private readonly contador: HTMLElement;

    constructor(private readonly palco: HTMLElement, private readonly raiz: HTMLElement) {
        this.desenho = raiz.querySelector("svg")!;
        this.contador = raiz.querySelector("#ammo")!;
        palco.addEventListener("pointermove", evento => {
            this.x = evento.clientX; this.y = evento.clientY;
            this.dentro = !(evento.target as HTMLElement).closest("button, input, label");
            this.posicionar();
        });
        palco.addEventListener("pointerleave", () => { this.dentro = false; this.raiz.hidden = true; });
        window.addEventListener("blur", () => { this.dentro = false; this.raiz.hidden = true; });
        window.addEventListener("resize", () => this.posicionar());
    }

    definirAtiva(ativa: boolean): void {
        this.ativa = ativa;
        this.posicionar();
    }

    private posicionar(): void {
        const area = this.palco.getBoundingClientRect();
        const x = this.x - area.left;
        const y = this.y - area.top;
        this.raiz.hidden = !this.ativa || !this.dentro || x < 0 || y < 0 || x > area.width || y > area.height;
        this.raiz.style.left = `${x}px`;
        this.raiz.style.top = `${y}px`;
        this.raiz.classList.toggle("invertida", x > area.width - 130);
        this.raiz.classList.toggle("borda-inferior", y > area.height - 42);
    }

    atualizar(estado: EstadoJogo): void {
        if (this.ativa && estado.arma === this.arma && estado.balas < this.balas) {
            this.animacao?.cancel();
            this.animacao = this.desenho.animate([{ transform: "scale(1.45)" }, { transform: "scale(1)" }], { duration: 150, easing: "ease-out" });
        }
        this.arma = estado.arma;
        this.balas = estado.balas;
        const texto = estado.recarregando ? "RECARGA" : `${estado.balas}/${estado.capacidade}`;
        if (this.contador.textContent !== texto) this.contador.textContent = texto;
        this.raiz.classList.toggle("recarregando", estado.recarregando);
        this.raiz.classList.toggle("pouca-municao", !estado.recarregando && estado.balas <= Math.ceil(estado.capacidade * .25));
        this.raiz.style.setProperty("--carga", String(estado.recarregando ? estado.progressoRecarga : estado.balas / estado.capacidade));
    }
}
