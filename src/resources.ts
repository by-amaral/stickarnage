import { ImageSource, Loader } from "excalibur";

export const Resources = {
    DetalhesPiso: new ImageSource("/assets/arena/detalhes-piso.png"),
    ConcretoParede: new ImageSource("/assets/arena/parede-concreto-v2.png"),
    Piso: new ImageSource("/assets/arena/piso.png"),
    ParedeHorizontal: new ImageSource("/assets/arena/parede-horizontal.png"),
    ParedeVertical: new ImageSource("/assets/arena/parede-vertical.png"),
    Pilar: new ImageSource("/assets/arena/pilar.png"),
    PortaEntrada: new ImageSource("/assets/arena/porta-entrada.png"),
    PortaSaida: new ImageSource("/assets/arena/porta-saida.png")
} as const;

export const loader = new Loader();

for (const recurso of Object.values(Resources)) {
    loader.addResource(recurso);
}
