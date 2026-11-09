import { ImageSource, Loader } from "excalibur";

export const Resources = {
    Jogador: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/jogador.png"),
    Armas: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/armas.png"),
    Disparos: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/efeitos.png"),
    DetalhesPiso: new ImageSource(import.meta.env.BASE_URL + "assets/arena/detalhes-piso.png"),
    ConcretoParede: new ImageSource(import.meta.env.BASE_URL + "assets/arena/parede-concreto-v2.png"),
    Piso: new ImageSource(import.meta.env.BASE_URL + "assets/arena/piso.png"),
    ParedeHorizontal: new ImageSource(import.meta.env.BASE_URL + "assets/arena/parede-horizontal.png"),
    ParedeVertical: new ImageSource(import.meta.env.BASE_URL + "assets/arena/parede-vertical.png"),    
    Pilar: new ImageSource(import.meta.env.BASE_URL + "assets/arena/pilar.png"),
    PortaEntrada: new ImageSource(import.meta.env.BASE_URL + "assets/arena/porta-entrada.png"),
    PortaSaida: new ImageSource(import.meta.env.BASE_URL + "assets/arena/porta-saida.png"),
    FundoMenu: new ImageSource(import.meta.env.BASE_URL + "images/sprite_fundo.png"),
    BotaoMenu: new ImageSource(import.meta.env.BASE_URL + "images/sprite_button.png"),
    BotaoMenuAceso: new ImageSource(import.meta.env.BASE_URL + "images/sprite_button1.png"),
    Jogar: new ImageSource(import.meta.env.BASE_URL + "images/Jogar.png"),
    LogoMenu: new ImageSource(import.meta.env.BASE_URL + "assets/menus-v1/logo-original.png"),
    FundoCarregamento: new ImageSource(import.meta.env.BASE_URL + "assets/menus-v1/carregamento.png"),
    BarraCarregamento: new ImageSource(import.meta.env.BASE_URL + "images/Barra.png"),
    Preenchimento: new ImageSource(import.meta.env.BASE_URL + "images/Preenchimento.png"),
    Inimigos: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/inimigos.png"),
    PistolaInimigo: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/armas/pistola.png"),
    Mancha: new ImageSource(import.meta.env.BASE_URL + "assets/combate-v1/sprites/sangue-itens/mancha-4.png"),
} as const;

export const loader = new Loader();

for (const recurso of Object.values(Resources)) {
    loader.addResource(recurso);
}
