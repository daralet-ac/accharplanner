import DefaultCharacter from "./DefaultCharacter";
import { State } from "../types";

let state: State = {
  ui: {
    notifications: [],
    savedBuilds: [],
    shareStatus: null,
    sharedBuild: null,
    currentStage: null,
    paneVisibility: {
      attributes: true,
      skills: true,
      items: true,
      buildStages: true,
      character: true,
      xp: true,
      knobsAndDials: true,
    },
    modalVisibility: {
      share: false,
    },
    darkMode: null,
  },
  build: {
    character: DefaultCharacter(),
    stages: [],
  },
  settings: {},
  auth: {
    isLoggedIn: false,
    isAdmin: false,
  },
};

export default state;
