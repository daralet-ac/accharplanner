import {
  UNTRAINED_STATE,
  MAX_CREATION_ATTRIBUTE_TOTAL_POINTS,
  MAX_SKILL_INVESTED_TRAINED,
  MAX_VITAL_INVESTED,
  MAX_ATTRIBUTE_INVESTED,
  MAX_SKILL_INVESTED_SPECIALIZED,
  MAX_LEVEL,
} from "../constants";
import { maxSkillInvested } from "../helpers";
import {
  State,
  Race,
  Gender,
  Attribute,
  Vital,
  Skill,
  Training,
} from "../types";
import DefaultCharacter from "./DefaultCharacter";

export default {
  // UI toggles
  toggleDarkMode(state: State, preference: boolean) {
    if (state.ui.darkMode === null) {
      state.ui.darkMode = !preference;
    } else {
      state.ui.darkMode = !state.ui.darkMode;
    }
  },
  toggleAttributesPane(state: State) {
    state.ui.paneVisibility.attributes = !state.ui.paneVisibility.attributes;
  },
  toggleSkillsPane(state: State) {
    state.ui.paneVisibility.skills = !state.ui.paneVisibility.skills;
  },
  toggleBuildStagesPane(state: State) {
    state.ui.paneVisibility.buildStages = !state.ui.paneVisibility.buildStages;
  },
  toggleCharacterPane(state: State) {
    state.ui.paneVisibility.character = !state.ui.paneVisibility.character;
  },
  toggleXPPane(state: State) {
    state.ui.paneVisibility.xp = !state.ui.paneVisibility.xp;
  },
  toggleKnobsAndDialsPane(state: State) {
    state.ui.paneVisibility.knobsAndDials =
      !state.ui.paneVisibility.knobsAndDials;
  },
  changeStage(state: State, index: number) {
    state.ui.currentStage = index;
    state.build.character = JSON.parse(
      JSON.stringify(state.build.stages[index])
    );
  },
  saveStage(state: State) {
    state.build.stages.push(JSON.parse(JSON.stringify(state.build.character)));
  },
  deleteStage(state: State, index: number) {
    // Stop if out of bounds
    if (index > state.build.stages.length) {
      return;
    }

    state.ui.currentStage = null;
    state.build.stages.splice(index, 1);
  },
  reorderStages(state: State, newOrder: any) {
    let newStages: any[] = [];

    newOrder.forEach((el: any) => {
      newStages.push(state.build.stages[el.index]);
    });

    state.build.stages = newStages;
  },
  saveBuild(state: State) {
    // Store locally
    state.ui.savedBuilds.push({
      key: new Date().toISOString(),
      build: JSON.stringify(state.build),
    });
  },
  deleteBuild(state: State, key: string) {
    for (let i = 0; i < state.ui.savedBuilds.length; i++) {
      if (state.ui.savedBuilds[i].key === key) {
        state.ui.savedBuilds.splice(i, 1);
      }
    }
  },
  deleteAllBuilds(state: State) {
    state.ui.savedBuilds = [];
  },
  reset(state: State) {
    state.build.character = DefaultCharacter();
    state.build.stages = [];
  },
  updateName(state: State, value: string) {
    state.build.character.name = value;
  },
  updateLevel(state: State, value: number) {
    state.build.character.level = Number(value);
  },
  updateRace(state: State, value: Race) {
    state.build.character.race = value;
  },
  updateGender(state: State, value: Gender) {
    state.build.character.gender = value;
  },

  updateAttributeCreation(state: State, payload: any) {
    let newVal = Number(payload.value);

    // Clamp to be from 10-100
    if (newVal > 100) {
      newVal = 100;
    } else if (newVal < 10) {
      newVal = 10;
    }

    // Ensure we haven't spent more than we can and adjust other
    // attributes if needed
    let newSpent = Object.keys(Attribute)
      .map((a) => {
        // Don't count old value for the attribute we're changing, use the new
        // value
        if (a === payload.name) {
          return newVal;
        } else {
          return state.build.character.attributes[a].creation;
        }
      })
      .reduce((a, v) => {
        return a + v;
      });

    // Use this to iterate over the other attributes we're lowering by name
    let names = Object.keys(Attribute).filter((v) => v !== payload.name);

    let maxAttributePoints = MAX_CREATION_ATTRIBUTE_TOTAL_POINTS;
    if (newSpent > maxAttributePoints) {
      let extra = newSpent - maxAttributePoints;

      for (var i = 0; i < extra; i++) {
        // Don't reduce attributes below 10. Adding 1 to `extra` ensures
        // we iterate long enough to lower everything as much as is needed
        if (state.build.character.attributes[names[i % 4]].creation <= 10) {
          extra += 1;
          continue;
        }

        state.build.character.attributes[names[i % 4]].creation -= 1;
      }
    }

    state.build.character.attributes[payload.name].creation = newVal;
  },

  updateAttributeInvested(state: State, payload: any) {
    state.build.character.attributes[payload.name].invested = Math.min(
      Number(payload.value),
      MAX_ATTRIBUTE_INVESTED
    );
  },

  updateAttributeBuff(state: State, payload: any) {
    state.build.character.attributes[payload.name].buff = Number(payload.value);
  },

  updateAttributeCantrip(state: State, payload: any) {
    state.build.character.attributes[payload.name].cantrip = Number(
      payload.value
    );
  },

  updateVitalInvested(state: State, payload: any) {
    state.build.character.vitals[payload.name].invested = Math.min(
      Number(payload.value),
      MAX_VITAL_INVESTED
    );
  },

  updateSkillInvested(state: State, payload: { name: string; value: number }) {
    let skill = state.build.character.skills[payload.name];

    const max = maxSkillInvested(skill.training);
    skill.invested = Math.min(Number(payload.value), max);
  },

  updateSkillBuff(state: State, payload: any) {
    state.build.character.skills[payload.name].buff = Number(payload.value);
  },

  updateSkillCantrip(state: State, payload: any) {
    state.build.character.skills[payload.name].cantrip = Number(payload.value);
  },

  increaseTraining(state: State, skill: Skill) {
    const currentTraining = state.build.character.skills[skill].training;
    var newTraining = null;

    switch (currentTraining) {
      case Training.UNUSABLE:
        newTraining = Training.TRAINED;
        break;
      case Training.UNTRAINED:
        newTraining = Training.TRAINED;
        break;
      case Training.TRAINED:
        newTraining = Training.SPECIALIZED;
        break;
      default:
        return;
    }

    state.build.character.skills[skill].training = newTraining;
  },

  decreaseTraining(state: State, skill: Skill) {
    const currentTraining = state.build.character.skills[skill].training;
    var newTraining = null;

    switch (currentTraining) {
      case Training.SPECIALIZED:
        newTraining = Training.TRAINED;

        // Reduce max skill invested to 208 (max for trained) if over
        if (
          state.build.character.skills[skill].invested >
          MAX_SKILL_INVESTED_TRAINED
        ) {
          state.build.character.skills[skill].invested =
            MAX_SKILL_INVESTED_TRAINED;
        }

        break;
      case Training.TRAINED:
        newTraining = UNTRAINED_STATE[skill];
        state.build.character.skills[skill].invested = 0;

        break;
      default:
        return;
    }

    state.build.character.skills[skill].training = newTraining;
  },

  changeAllInvestment(state: State, invested: string) {
    Object.keys(Attribute).forEach((a) => {
      let newval = Number(invested);
      newval = newval > 190 ? 190 : newval;

      state.build.character.attributes[a].invested = newval;
    });

    Object.keys(Vital).forEach((a) => {
      let newval = Number(invested);
      newval = newval > 196 ? 196 : newval;

      state.build.character.vitals[a].invested = newval;
    });

    Object.keys(Skill).forEach((skill) => {
      let newval = Number(invested);

      if (
        state.build.character.skills[skill].training == Training.SPECIALIZED
      ) {
        state.build.character.skills[skill].invested =
          newval > MAX_SKILL_INVESTED_SPECIALIZED
            ? MAX_SKILL_INVESTED_SPECIALIZED
            : newval;
      } else if (
        state.build.character.skills[skill].training == Training.TRAINED
      ) {
        state.build.character.skills[skill].invested =
          newval > MAX_SKILL_INVESTED_TRAINED
            ? MAX_SKILL_INVESTED_TRAINED
            : newval;
      }
    });
  },

  changeAllAttributeInvestment(state: State, invested: string) {
    Object.keys(Attribute).forEach((a) => {
      let newval = Number(invested);

      state.build.character.attributes[a].invested = newval;
    });
  },

  changeAllVitalInvestment(state: State, invested: string) {
    Object.keys(Vital).forEach((a) => {
      let newval = Number(invested);

      state.build.character.vitals[a].invested = newval;
    });
  },

  changeAllSkillInvestment(state: State, invested: string) {
    Object.keys(Skill).forEach((skill) => {
      let newval = Number(invested);

      if (
        state.build.character.skills[skill].training === Training.SPECIALIZED
      ) {
        newval =
          newval > MAX_SKILL_INVESTED_SPECIALIZED
            ? MAX_SKILL_INVESTED_SPECIALIZED
            : newval;
      } else if (
        state.build.character.skills[skill].training === Training.TRAINED
      ) {
        newval =
          newval > MAX_SKILL_INVESTED_TRAINED
            ? MAX_SKILL_INVESTED_TRAINED
            : newval;
      } else {
        newval = 0;
      }

      state.build.character.skills[skill].invested = newval;
    });
  },

  changeAllBuffs(state: State, buff: string) {
    Object.keys(Attribute).forEach((attribute) => {
      state.build.character.attributes[attribute].buff = Number(buff);
    });

    Object.keys(Skill).forEach((skill) => {
      state.build.character.skills[skill].buff = Number(buff);
    });
  },

  changeAllAttributeBuffs(state: State, buff: string) {
    Object.keys(Attribute).forEach((attribute) => {
      state.build.character.attributes[attribute].buff = Number(buff);
    });
  },

  changeAllSkillBuffs(state: State, buff: string) {
    Object.keys(Skill).forEach((skill) => {
      state.build.character.skills[skill].buff = Number(buff);
    });
  },

  // Cantrips
  changeAllCantrips(state: State, cantrip: string) {
    Object.keys(Attribute).forEach((attribute) => {
      state.build.character.attributes[attribute].cantrip = Number(cantrip);
    });

    Object.keys(Skill).forEach((skill) => {
      state.build.character.skills[skill].cantrip = Number(cantrip);
    });
  },

  changeAllAttributeCantrips(state: State, cantrip: string) {
    Object.keys(Attribute).forEach((attribute) => {
      state.build.character.attributes[attribute].cantrip = Number(cantrip);
    });
  },

  changeAllSkillCantrips(state: State, cantrip: string) {
    Object.keys(Skill).forEach((skill) => {
      state.build.character.skills[skill].cantrip = Number(cantrip);
    });
  },

  // Notifications
  clearAllNotifications(state: State) {
    state.ui.notifications = [];
  },

  addNotification(state: State, payload: any) {
    let notification_id = Date.now();

    state.ui.notifications.push({
      id: notification_id,
      type: payload.type,
      message: payload.message,
    });

    if (payload.pinned) {
      return;
    }

    setTimeout(() => {
      for (let i = 0; i < state.ui.notifications.length; i++) {
        if (state.ui.notifications[i].id === notification_id) {
          state.ui.notifications.splice(i, 1);
        }
      }
    }, 3000);
  },

  removeNotification(state: State, id: number) {
    for (let i = 0; i < state.ui.notifications.length; i++) {
      if (state.ui.notifications[i].id === id) {
        state.ui.notifications.splice(i, 1);
      }
    }
  },

  // Modals
  setShareModalVisibility(state: State, value: boolean) {
    state.ui.modalVisibility.share = value;
  },

  // Settings

  // Auth
  updateIsLoggedIn(state: State, value: boolean) {
    state.auth.isLoggedIn = value;
  },
  updateIsAdmin(state: State, value: boolean) {
    state.auth.isAdmin = value;
  },
};
