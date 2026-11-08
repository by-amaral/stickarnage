import { ImageSource, Loader } from "excalibur";

export const Resources = {
    Jogador: new ImageSource("/assets/combate-v1/jogador.png"),
    Armas: new ImageSource("/assets/combate-v1/armas.png"),
    Disparos: new ImageSource("/assets/combate-v1/efeitos.png"),
    DetalhesPiso: new ImageSource("/assets/arena/detalhes-piso.png"),
    ConcretoParede: new ImageSource("/assets/arena/parede-concreto-v2.png"),
    Piso: new ImageSource("/assets/arena/piso.png"),
    ParedeHorizontal: new ImageSource("/assets/arena/parede-horizontal.png"),
    ParedeVertical: new ImageSource("/assets/arena/parede-vertical.png"),
    Pilar: new ImageSource("/assets/arena/pilar.png"),
    PortaEntrada: new ImageSource("/assets/arena/porta-entrada.png"),
    PortaSaida: new ImageSource("/assets/arena/porta-saida.png"),
    FundoMenu: new ImageSource("/images/sprite_fundo.png"),
    BotaoMenu: new ImageSource("/images/sprite_button.png"),
    BotaoMenuAceso: new ImageSource("/images/sprite_button1.png"),
    Jogar: new ImageSource("/images/Jogar.png"),
    LogoMenu: new ImageSource("/assets/menus-v1/logo-original.png"),
    FundoCarregamento: new ImageSource("/assets/menus-v1/carregamento.png"),
    BarraCarregamento: new ImageSource("/images/Barra.png"),
    Preenchimento: new ImageSource("/images/Preenchimento.png")
} as const;

export const loader = new Loader();

for (const recurso of Object.values(Resources)) {
    loader.addResource(recurso);
}
