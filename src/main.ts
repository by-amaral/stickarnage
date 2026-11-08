import { Color, DisplayMode, Engine, FadeInOut } from "excalibur";
import { loader } from "./resources";
import { MyLevel } from "./level";
import { MenuInicial } from "./menu-inicial";
import { TelaCarregamento } from "./carregamento";

const game = new Engine({
  width: 800, 
  height: 600,
  displayMode: DisplayMode.FitScreen,
  backgroundColor: Color.fromHex("#17191f"),
  pixelArt: true,

  // Mantém passos curtos para o movimento e as colisões
  fixedUpdateFps: 60,
  scenes: {
    menu: MenuInicial, carregamento: TelaCarregamento, start: MyLevel
  
  },

  
  // physics: {
  //   solver: SolverStrategy.Realistic,
  //   substep: 5 // Sub step the physics simulation for more robust simulations
  // },
  // fixedUpdateTimestep: 16 // Turn on fixed update timestep when consistent physic simulation is important
});

game.start('menu', { // name of the start scene 'start'
  loader, // Optional loader (but needed for loading images/sounds)
  inTransition: new FadeInOut({ // Optional in transition
    duration: 1000,
    direction: 'in',
    color: Color.fromHex("#17191f"),
  })
}).then(() => {
  // Do something after the game starts
});
