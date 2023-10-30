import { Store } from "vuex";
import { State } from "./types";
import DefaultCharacter from "./store/DefaultCharacter";
import { Training } from "./types";
import {
  MAX_SKILL_INVESTED_TRAINED,
  MAX_SKILL_INVESTED_SPECIALIZED,
} from "./constants";

export const importCharacter = function (store: Store<State>, json: any) {
  // Re-set to blank state prior to import
  store.state.build.character = JSON.parse(JSON.stringify(DefaultCharacter()));
  store.state.build.stages = [];

  store.state.build.character.name = json.name;
  store.state.build.character.level = json.level;
  store.state.build.character.race = json.race;
  store.state.build.character.gender = json.gender;

  // Attributes
  Object.keys(json.attribs).forEach((a) => {
    store.state.build.character.attributes[a].creation =
      json.attribs[a].creation;
    store.state.build.character.attributes[a].invested =
      json.attribs[a].base - json.attribs[a].creation;
  });

  // Vitals
  Object.keys(json.vitals).forEach((a) => {
    store.state.build.character.vitals[a].invested = 0;
    store.state.build.character.vitals[a].invested =
      json.vitals[a].base - store.getters[a + "Base"];
  });

  // Skills
  Object.keys(json.skills).forEach((s) => {
    store.state.build.character.skills[s].training =
      json.skills[s].training.toLowerCase();

    if (
      store.state.build.character.skills[s].training === Training.SPECIALIZED ||
      store.state.build.character.skills[s].training === Training.TRAINED
    ) {
      store.state.build.character.skills[s].invested = 0;
      store.state.build.character.skills[s].invested =
        json.skills[s].base - store.getters[s + "Base"];

      // Cap invested at the appropriate value
      if (
        store.state.build.character.skills[s].training ===
          Training.SPECIALIZED &&
        store.state.build.character.skills[s].invested >
          MAX_SKILL_INVESTED_SPECIALIZED
      ) {
        store.state.build.character.skills[s].invested =
          MAX_SKILL_INVESTED_SPECIALIZED;
      } else if (
        store.state.build.character.skills[s].training === Training.TRAINED &&
        store.state.build.character.skills[s].invested >
          MAX_SKILL_INVESTED_TRAINED
      ) {
        store.state.build.character.skills[s].invested =
          MAX_SKILL_INVESTED_TRAINED;
      }
    }
  });
};
