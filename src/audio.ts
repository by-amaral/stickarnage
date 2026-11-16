type Efeito = "menu" | "tiro" | "escopeta" | "dano" | "morte" | "eliminacao" | "dash" | "coleta" | "porta" | "pausa" | "frenesi";

import type { TipoArma } from "./armamento";

class AudioJogo {
    private contexto?: AudioContext;
    private ultimoTiro = 0;
    private silencio = localStorage.getItem("stickarnage-mudo") === "1";
    private musica?: GainNode;
    private ruido?: AudioBuffer;
    private sequenciador?: number;
    private proximaNota = 0;
    private passo = 0;
    private musicaAtiva = false;
    private volume = Math.max(0, Math.min(1, Number(localStorage.getItem("stickarnage-musica") ?? .22)));
    get volumeMusica(): number { return this.volume; }
    definirVolume(valor: number): void {
        this.volume = Math.max(0, Math.min(1, valor));
        localStorage.setItem("stickarnage-musica", String(this.volume));
        if (this.musica && this.contexto) this.musica.gain.setTargetAtTime(this.silencio || !this.musicaAtiva ? 0 : this.volume, this.contexto.currentTime, .03);
    }
    definirMusica(ativa: boolean): void {
        this.musicaAtiva = ativa;
        if (!ativa) {
            if (this.sequenciador) window.clearInterval(this.sequenciador);
            this.sequenciador = undefined;
            if (this.musica && this.contexto) this.musica.gain.setTargetAtTime(0, this.contexto.currentTime, .04);
            return;
        }
        this.iniciar();
        if (!this.contexto) return;
        this.musica ??= this.contexto.createGain();
        this.musica.disconnect();
        this.musica.connect(this.contexto.destination);
        this.definirVolume(this.volume);
        if (this.sequenciador) return;
        this.proximaNota = this.contexto.currentTime + .04;
        this.passo = 0;
        this.sequenciador = window.setInterval(() => {
            const ctx = this.contexto!;
            // Não acumula notas se o navegador suspender a aba.
            if (this.proximaNota < ctx.currentTime) this.proximaNota = ctx.currentTime;
            while (this.proximaNota < ctx.currentTime + .12) {
                this.batida(this.proximaNota, this.passo++);
                this.proximaNota += 60 / 160 / 4;
            }
        }, 25);
    }

    private nota(tempo: number, frequencia: number, duracao: number, volume: number, tipo: OscillatorType, final = frequencia): void {
        const ctx = this.contexto!;
        const oscilador = ctx.createOscillator();
        const ganho = ctx.createGain();
        oscilador.type = tipo;
        oscilador.frequency.setValueAtTime(frequencia, tempo);
        oscilador.frequency.exponentialRampToValueAtTime(final, tempo + duracao);
        ganho.gain.setValueAtTime(.001, tempo);
        ganho.gain.exponentialRampToValueAtTime(volume, tempo + .004);
        ganho.gain.exponentialRampToValueAtTime(.001, tempo + duracao);
        oscilador.connect(ganho).connect(this.musica!);
        oscilador.start(tempo); oscilador.stop(tempo + duracao + .01);
        oscilador.onended = () => { oscilador.disconnect(); ganho.disconnect(); };
    }
    private percussao(tempo: number, duracao: number, volume: number, frequencia: number): void {
        const ctx = this.contexto!;
        if (!this.ruido) {
            this.ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
            const dados = this.ruido.getChannelData(0);
            for (let i = 0; i < dados.length; i++) dados[i] = Math.random() * 2 - 1;
        }
        const fonte = ctx.createBufferSource(); fonte.buffer = this.ruido;
        const filtro = ctx.createBiquadFilter(); filtro.type = "highpass"; filtro.frequency.value = frequencia;
        const ganho = ctx.createGain(); ganho.gain.setValueAtTime(volume, tempo); ganho.gain.exponentialRampToValueAtTime(.001, tempo + duracao);
        fonte.connect(filtro).connect(ganho).connect(this.musica!);
        fonte.start(tempo); fonte.stop(tempo + duracao);
        fonte.onended = () => { fonte.disconnect(); filtro.disconnect(); ganho.disconnect(); };
    }
    private batida(tempo: number, passo: number): void {
        const pulso = passo % 16;
        const compasso = Math.floor(passo / 16) % 4;
        if ([0, 6, 8, 14].includes(pulso)) this.nota(tempo, 135, .17, .7, "sine", 38);
        if (pulso === 4 || pulso === 12) { this.percussao(tempo, .12, .3, 1100); this.nota(tempo, 180, .08, .18, "triangle", 95); }
        this.percussao(tempo, pulso % 2 ? .025 : .045, pulso % 2 ? .045 : .09, 7200);
        const base = [55, 55, 65.406, 49][compasso];
        const riff = [0, 0, 12, 0, 7, 0, 10, 0, 0, 12, 0, 7, 0, 10, 7, 12];
        this.nota(tempo, base * 2 ** (riff[pulso] / 12), .075, .14, "sawtooth");
        if (pulso % 4 === 2) this.nota(tempo, base * 4 * 2 ** (riff[pulso] / 12), .1, .035, "square");
    }

    get mudo(): boolean { return this.silencio; }

    alternarMudo(): boolean {
        this.silencio = !this.silencio;
        localStorage.setItem("stickarnage-mudo", this.silencio ? "1" : "0");
        if (!this.silencio) this.iniciar();
        this.definirVolume(this.volume);
        return this.silencio;
    }

    iniciar(): void {
        if (this.silencio) return;
        this.contexto ??= new AudioContext();
        if (this.contexto.state === "suspended") void this.contexto.resume();
    }

    recarregar(tipo: TipoArma, concluida: boolean): void {
        if (this.silencio) return;
        this.iniciar();
        const ctx = this.contexto;
        if (!ctx) return;
        // Assinaturas mecânicas: carregador, tambor, cartuchos e ferrolho.
        const perfis: Record<TipoArma, [number, number, number, OscillatorType]> = {
            pistola: [760, 2, .045, "square"],
            revolver: [1250, 4, .025, "triangle"],
            submetralhadora: [980, 3, .028, "square"],
            escopeta: [240, 2, .075, "sawtooth"],
            fuzil: [480, 3, .045, "sawtooth"],
            "escopeta-dupla": [180, 2, .09, "triangle"],
            minigun: [350, 4, .04, "square"],
            "canhao-plasma": [1500, 2, .07, "sine"]
        };
        const [frequencia, cliques, duracao, forma] = perfis[tipo];
        for (let i = 0; i < (concluida ? 1 : cliques); i++) {
            const tempo = ctx.currentTime + i * .055;
            const osc = ctx.createOscillator();
            const ganho = ctx.createGain();
            osc.type = forma;
            osc.frequency.setValueAtTime(frequencia * (concluida ? .65 : 1 + i * .17), tempo);
            osc.frequency.exponentialRampToValueAtTime(80 + frequencia * .13, tempo + duracao);
            ganho.gain.setValueAtTime(.001, tempo);
            ganho.gain.exponentialRampToValueAtTime(concluida ? .1 : .065, tempo + .003);
            ganho.gain.exponentialRampToValueAtTime(.001, tempo + duracao);
            osc.connect(ganho).connect(ctx.destination);
            osc.start(tempo); osc.stop(tempo + duracao + .01);
            osc.onended = () => { osc.disconnect(); ganho.disconnect(); };
        }
    }

    tocar(efeito: Efeito): void {
        if (this.silencio) return;
        this.iniciar();
        const contexto = this.contexto;
        if (!contexto) return;
        if (efeito === "tiro" && performance.now() - this.ultimoTiro < 65) return;
        if (efeito === "tiro") this.ultimoTiro = performance.now();
        const presets: Record<Efeito, [number, number, number, number, OscillatorType]> = {
            menu: [440, 660, 0.12, 0.08, "square"],
            tiro: [180, 65, 0.075, 0.10, "sawtooth"],
            escopeta: [115, 35, 0.2, 0.18, "sawtooth"],
            dano: [170, 60, 0.25, 0.16, "triangle"],
            morte: [220, 32, 0.8, 0.18, "sawtooth"],
            eliminacao: [210, 85, 0.13, 0.09, "triangle"],
            dash: [80, 360, 0.13, 0.09, "sawtooth"],
            coleta: [430, 880, 0.16, 0.08, "square"],
            porta: [110, 480, 0.32, 0.12, "triangle"],
            pausa: [380, 260, 0.1, 0.07, "square"],
            frenesi: [190, 780, 0.32, 0.12, "sawtooth"]
        };
        const [inicio, fim, duracao, volume, forma] = presets[efeito];
        const oscilador = contexto.createOscillator();
        const ganho = contexto.createGain();
        const agora = contexto.currentTime;
        oscilador.type = forma;
        oscilador.frequency.setValueAtTime(inicio, agora);
        oscilador.frequency.exponentialRampToValueAtTime(fim, agora + duracao);
        ganho.gain.setValueAtTime(0.001, agora);
        ganho.gain.exponentialRampToValueAtTime(volume, agora + 0.008);
        ganho.gain.exponentialRampToValueAtTime(0.001, agora + duracao);
        oscilador.connect(ganho).connect(contexto.destination);
        oscilador.start(agora);
        oscilador.stop(agora + duracao + 0.01);
    }
}

export const audioJogo = new AudioJogo();
