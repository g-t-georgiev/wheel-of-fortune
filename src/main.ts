import GameApi from "./GameApi";

window.addEventListener("load", load);

function load() {
  const gameApi = new GameApi();

  document.body.append(gameApi.container);
}
