# Stickarnage

Jogo de arena em pixel art feito com Excalibur e TypeScript. Elimine os inimigos, colete armas e atravesse a porta quando a sala estiver limpa.

## Executar

```sh
npm install
npm run dev
```

O Vite usa o caminho `/stickarnage/` tanto no desenvolvimento quanto no GitHub Pages.

## Controles

| Ação | Controle |
| --- | --- |
| Mover | WASD ou setas |
| Mirar e atirar | Mouse e clique esquerdo |
| Dash | Espaço |
| Pegar arma | E |
| Recarregar | R (também recarrega ao esvaziar) |
| Usar especial | Q, após 8 eliminações |
| Pausar | Esc |
| Ligar ou desligar som | M ou botão no HUD |

## Observações:

Ao nascer ou entrar em uma sala, o jogador fica invulnerável por 0,8 segundo e pisca durante a proteção. A cada 16 eliminações na partida, recupera uma vida, até o máximo de 3. As manchas de sangue permanecem até a troca de sala.

Carregadores: pistola 18, SMG 30, escopeta 8, revólver 6, fuzil 24 e escopeta dupla 2. A reserva das armas normais é ilimitada; a recarga leva tempo. Minigun (60 tiros) e plasma (6 disparos com dano em área) alternam como especiais, sem recarga, e devolvem a arma anterior ao esvaziar. Armas normais aparecem aleatoriamente no chão.

A trilha eletrônica procedural toca a 160 BPM durante o combate e pausa junto com a partida. O volume independente fica em Controles e é salvo no navegador.

Antes de cada partida, informe um nome de até 16 caracteres. Recordes guarda a melhor partida de cada nome neste navegador, ordenada por sala alcançada e depois pontos; partidas encerradas pelo menu também são registradas. Conquistas são compartilhadas neste navegador, persistem entre partidas e mostram uma notificação animada a cada desbloqueio. São 15 conquistas, incluindo limpar uma sala em até 3 segundos de jogo ativo.

Nas salas 5, 10, 15 e seguintes, parte dos inimigos recebe armas melhores (escopeta, fuzil e minigun); outros ficam progressivamente mais rápidos, com velocidade limitada. Os demais mantêm o comportamento normal.
