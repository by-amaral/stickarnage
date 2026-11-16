import { Color, DisplayMode, Engine } from "excalibur";
import { loader } from "./resources";
import { MyLevel, type EstadoJogo } from "./level";
import { MenuInicial } from "./menu-inicial";
import { TelaCarregamento } from "./carregamento";
import { audioJogo } from "./audio";
import { nomeArma } from "./armamento";
import { Mira } from "./mira";
import { progresso } from "./progresso";
import { montarConquistas, montarRanking } from "./telas-progresso";

const game = new Engine({
  width: 800,
  height: 600,
  canvasElementId: "game-canvas",
  displayMode: DisplayMode.FitContainer,
  backgroundColor: Color.fromHex("#090a0d"),
  pixelArt: true,
  fixedUpdateFps: 60,
  suppressPlayButton: true,
  scenes: { menu: MenuInicial, carregamento: TelaCarregamento, start: MyLevel }
});

const el = (id: string): HTMLElement => document.getElementById(id)!;
const menu = el("menu");
const loading = el("loading");
const hud = el("hud");
const shade = el("shade");
const panels = ["pause-panel", "controls-panel", "gameover-panel", "name-panel", "achievements-panel", "ranking-panel"].map(el);
const mira = new Mira(el("stage"), el("aim"));
el("ui").style.setProperty("--gameover-image", `url("${import.meta.env.BASE_URL}assets/menus-v1/game-over.png")`);
let modo: "menu" | "loading" | "playing" | "pause" | "controls" | "gameover" | "name" | "achievements" | "ranking" = "menu";
let origemControles: "menu" | "pause" = "menu";
let carregando = false;
let ultimoEstado = "";
let ultimaVida = 3;
let ultimosPontos = 0;
let ultimoFrenesi = 0;
let alertaFrenesi: number | undefined;

function mostrarFrenesi(nivel: number): void {
  const aviso = el("frenzy-alert");
  aviso.textContent = `FRENESI ${nivel}X`;
  aviso.hidden = false;
  aviso.classList.remove("active");
  void aviso.offsetWidth;
  aviso.classList.add("active");
  if (alertaFrenesi) window.clearTimeout(alertaFrenesi);
  alertaFrenesi = window.setTimeout(() => { aviso.hidden = true; }, 850);
  audioJogo.tocar("frenesi");
}

function flash(tipo: "hit" | "kill" | "heal"): void {
  const camada = el("impact-flash");
  camada.className = "";
  void camada.offsetWidth;
  camada.className = tipo;
}

function mostrar(m: typeof modo): void {
  modo = m;
  mira.definirAtiva(m === "playing");
  audioJogo.definirMusica(m === "playing");
  for (const classe of Array.from(el("ui").classList)) if (classe.startsWith("mode-")) el("ui").classList.remove(classe);
  el("ui").classList.add(`mode-${m}`);
  menu.hidden = m !== "menu";
  loading.hidden = m !== "loading";
  hud.hidden = !["playing", "pause", "gameover"].includes(m) && !(m === "controls" && origemControles === "pause");
  shade.hidden = ["menu", "loading", "playing"].includes(m);
  panels.forEach(panel => panel.hidden = panel.id !== `${m}-panel`);
  game.timescale = ["menu", "loading", "playing"].includes(m) ? 1 : 0;
  game.canvas.style.cursor = m === "playing" ? "none" : "default";
}

function atualizar(estado: EstadoJogo): void {
  mira.atualizar(estado);
  const chave = [estado.vida, estado.sala, estado.pontos, estado.arma, estado.armaDisponivel, estado.frenesi, estado.dash, estado.restantes, estado.balas, estado.recarregando, estado.especial].join("|");
  if (chave === ultimoEstado) return;
  ultimoEstado = chave;
  if (estado.vida < ultimaVida) flash("hit");
  else if (estado.vida > ultimaVida) flash("heal");
  else if (estado.pontos > ultimosPontos) flash("kill");
  if (estado.frenesi > ultimoFrenesi) mostrarFrenesi(estado.frenesi);
  ultimaVida = estado.vida;
  ultimosPontos = estado.pontos;
  ultimoFrenesi = estado.frenesi;
  const ui = el("ui");
  ui.classList.remove("frenzy-1", "frenzy-2", "frenzy-3");
  if (estado.frenesi) ui.classList.add(`frenzy-${estado.frenesi}`);
  el("health").innerHTML = Array.from({ length: 3 }, (_, i) => `<i class="life ${i < estado.vida ? "on" : ""}"></i>`).join("");
  el("health").setAttribute("aria-label", `Vida: ${estado.vida} de 3`);
  el("room").textContent = String(estado.sala).padStart(2, "0");
  el("score").textContent = String(estado.pontos).padStart(4, "0");
  el("weapon").textContent = nomeArma(estado.arma);
  el("special").textContent = estado.especial;
  el("frenzy").textContent = `FRENESI ${estado.frenesi}/3`;
  el("dash").textContent = estado.dash ? "DASH PRONTO" : "DASH RECARREGANDO";
  el("room-hint").hidden = estado.restantes > 0;
  const coleta = el("pickup-hint");
  coleta.hidden = !estado.armaDisponivel;
  if (estado.armaDisponivel) coleta.textContent = `E · PEGAR ${nomeArma(estado.armaDisponivel)}`;
}

function fim(estado: EstadoJogo): void {
  progresso.finalizar();
  atualizar(estado);
  el("final-room").textContent = String(estado.sala).padStart(2, "0");
  el("final-score").textContent = String(estado.pontos).padStart(4, "0");
  mostrar("gameover");
}

async function iniciarPartida(): Promise<void> {
  if (carregando) return;
  carregando = true;
  progresso.iniciar((el("player-name") as HTMLInputElement).value);
  audioJogo.tocar("menu");
  game.timescale = 1;
  await game.goToScene("menu");
  game.removeScene("start");
  const nivel = new MyLevel();
  ultimoEstado = "";
  ultimaVida = 3;
  ultimosPontos = 0;
  ultimoFrenesi = 0;
  el("frenzy-alert").hidden = true;
  el("ui").classList.remove("frenzy-1", "frenzy-2", "frenzy-3");
  nivel.onEstado = atualizar;
  nivel.onFim = fim;
  game.addScene("start", nivel);
  mostrar("loading");
  await game.goToScene("carregamento");
  await new Promise(resolve => setTimeout(resolve, 800));
  await game.goToScene("start");
  mostrar("playing");
  carregando = false;
}

function pausar(): void {
  if (modo === "playing") { origemControles = "pause"; audioJogo.tocar("pausa"); mostrar("pause"); }
  else if (modo === "pause") mostrar("playing");
}

function abrirControles(origem: "menu" | "pause"): void {
  origemControles = origem;
  audioJogo.tocar("menu");
  mostrar("controls");
}

function voltarControles(): void { mostrar(origemControles); }

async function voltarMenu(): Promise<void> {
  progresso.finalizar();
  game.timescale = 1;
  await game.goToScene("menu");
  mostrar("menu");
}

function atualizarSom(): void {
  audioJogo.definirMusica(modo === "playing");
  const mudo = audioJogo.mudo;
  el("sound-button").textContent = mudo ? "♪̸" : "♫";
  el("sound-button").setAttribute("aria-label", mudo ? "Ativar som" : "Desativar som");
}

function pedirNome(): void {
  mostrar("name");
  el("name-error").hidden = true;
  const campo = el("player-name") as HTMLInputElement;
  campo.value = progresso.dados.nome;
  campo.focus(); campo.select();
}
el("play").addEventListener("click", pedirNome);
el("retry").addEventListener("click", pedirNome);
el("name-panel").addEventListener("submit", evento => {
  evento.preventDefault();
  const campo = el("player-name") as HTMLInputElement;
  if (!campo.value.trim()) { el("name-error").hidden = false; campo.focus(); return; }
  void iniciarPartida();
});
el("player-name").addEventListener("input", () => { el("name-error").hidden = true; });
el("name-back").addEventListener("click", () => void voltarMenu());
el("menu-achievements").addEventListener("click", () => { montarConquistas(); mostrar("achievements"); });
el("menu-ranking").addEventListener("click", () => { montarRanking(); mostrar("ranking"); });
el("achievements-back").addEventListener("click", () => mostrar("menu"));
el("ranking-back").addEventListener("click", () => mostrar("menu"));
el("menu-controls").addEventListener("click", () => abrirControles("menu"));
el("pause-controls").addEventListener("click", () => abrirControles("pause"));
el("controls-back").addEventListener("click", voltarControles);
el("pause-button").addEventListener("click", pausar);
el("resume").addEventListener("click", pausar);
el("pause-menu").addEventListener("click", () => void voltarMenu());
el("gameover-menu").addEventListener("click", () => void voltarMenu());
el("sound-button").addEventListener("click", () => { audioJogo.alternarMudo(); atualizarSom(); });
document.addEventListener("keydown", event => {
  if (event.target instanceof HTMLInputElement) return;
  if (event.code === "Escape") {
    if (modo === "controls") voltarControles();
    else if (["achievements", "ranking", "name"].includes(modo)) void voltarMenu();
    else pausar();
  }
  if (event.code === "KeyM" && modo !== "loading") { audioJogo.alternarMudo(); atualizarSom(); }
  if (event.code === "Enter" && modo === "menu") { event.preventDefault(); pedirNome(); }
});
atualizarSom();
const volumeMusica = el("music-volume") as HTMLInputElement;
volumeMusica.value = String(Math.round(audioJogo.volumeMusica * 100));
volumeMusica.addEventListener("input", () => audioJogo.definirVolume(Number(volumeMusica.value) / 100));

void game.start("menu", { loader }).then(() => {
  el("ui").hidden = false;
  mostrar("menu");
});
