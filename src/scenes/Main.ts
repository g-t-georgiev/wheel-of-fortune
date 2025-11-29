import Scene from '../core/Scene';

enum MainSceneStates {
  INTRO,
  IDLE,
  SPIN_START,
  RECEIVED_DATA,
  SPIN_STOPPING,
  SPIN_STOP,
  SHOW_WINS,
  FREESPINS_RETRIGGER,
  FREESPINS_START,
  FREESPINS_END,
  ROUND_FINISH
}

export default class Main extends Scene {
  name = "Main";

  constructor() {
    super();

    console.log(`Hello, from ${this.name}!`);
    this.initStates();
  }

  protected initStates() {
    this.stateMachine.setStates([
      [MainSceneStates.INTRO, async () => { }],
      [MainSceneStates.IDLE, async () => { }],
      [MainSceneStates.SPIN_START, async () => { }],
      [MainSceneStates.RECEIVED_DATA, async () => { }],
      [MainSceneStates.SPIN_STOPPING, async () => { }],
      [MainSceneStates.SPIN_STOP, async () => { }],
      [MainSceneStates.SHOW_WINS, async () => { }],
      [MainSceneStates.FREESPINS_RETRIGGER, async () => { }],
      [MainSceneStates.FREESPINS_START, async () => { }],
      [MainSceneStates.FREESPINS_END, async () => { }],
      [MainSceneStates.ROUND_FINISH, async () => { }],
    ]);
  }
}
