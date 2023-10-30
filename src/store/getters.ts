import {
  ATTRIBUTES,
  VITALS,
  COST_SKILL_SPECIALIZED,
  COST_SKILL_TRAINED,
  COST_VITAL,
  COST_ATTRIBUTE,
  COST_LEVEL,
  SKILL_POINTS_AT_LEVEL,
  SKILL_COST_AT_TRAINING,
  SPEC_COSTS_AUG,
  MAX_CREATION_ATTRIBUTE_TOTAL_POINTS,
  MAX_LEVEL,
} from "../constants";
import { trainingBonus, buffBonus, cantripBonus, clamp } from "../helpers";
import { State } from "../types";
import { Attribute, Skill, Training, Race } from "../types";

export default {
  // UI stuff
  attributesPaneVisible: (state: State) => {
    return state.ui.paneVisibility.attributes;
  },
  skillsPaneVisible: (state: State) => {
    return state.ui.paneVisibility.skills;
  },
  buildStagesPaneVisible: (state: State) => {
    return state.ui.paneVisibility.buildStages;
  },
  characterPaneVisible: (state: State) => {
    return state.ui.paneVisibility.character;
  },
  xpPaneVisible: (state: State) => {
    return state.ui.paneVisibility.xp;
  },
  knobsAndDialsPaneVisible: (state: State) => {
    return state.ui.paneVisibility.knobsAndDials;
  },
  // General
  shareStatus: (state: State) => {
    return state.ui.shareStatus;
  },
  sharedBuild: (state: State) => {
    return state.ui.sharedBuild;
  },
  exportedCharacter: (state: State) => {
    return JSON.stringify(state.build.character, null, 4);
  },

  totalXPEarned: (state: State) => {
    return COST_LEVEL[state.build.character.level];
  },

  totalXPInvested: (state: State, getters: any) => {
    let cost = 0;

    ATTRIBUTES.forEach(function (a: string) {
      cost += COST_ATTRIBUTE[state.build.character.attributes[a].invested];
    });

    VITALS.forEach((v) => {
      cost += COST_VITAL[state.build.character.vitals[v].invested];
    });

    getters.specializedSkills.forEach(function (s: string) {
      cost += COST_SKILL_SPECIALIZED[state.build.character.skills[s].invested];
    });

    getters.trainedSkills.forEach(function (s: string) {
      cost += COST_SKILL_TRAINED[state.build.character.skills[s].invested];
    });

    return cost;
  },

  totalXPInvestedError: (state: State, getters: any) => {
    if (isNaN(getters.totalXPInvested)) {
      return "Calculating total invested experience failed for an unknown reason. Please file a bug report.";
    } else {
      return false;
    }
  },

  unassignedXP: (state: State, getters: any) => {
    const diff = getters.totalXPEarned - getters.totalXPInvested;

    if (diff < 0) {
      return 0;
    }

    return diff;
  },

  unassignedXPError: (state: State, getters: any) => {
    if (isNaN(getters.totalXPInvested)) {
      return "Calculating unassigned experience failed for an unknown reason. Please file a bug report.";
    } else {
      return false;
    }
  },

  requiredLevel: (state: State, getters: any) => {
    let by_cost = 1;
    let by_skill_points = 1;

    for (let i: number = 1; i <= MAX_LEVEL; i++) {
      if (getters.totalXPInvested <= COST_LEVEL[i]) {
        by_cost = i;
        break;
      }
    }

    if (getters.skillPointsSpent > getters.skillPointsAvailable) {
      for (let j: number = 1; j <= MAX_LEVEL; j++) {
        if (SKILL_POINTS_AT_LEVEL[j] >= getters.skillPointsSpent) {
          by_skill_points = j;
          break;
        }
      }
    }

    if (by_cost < by_skill_points) {
      return by_skill_points;
    } else {
      return by_cost;
    }
  },

  skillPointsAvailable: (state: State) => {
    return SKILL_POINTS_AT_LEVEL[state.build.character.level];
  },

  skillPointsSpent: function (state: State): number {
    let cost: number = 0;

    Object.keys(Skill).forEach(function (skillName: string): void {
      let training: string = state.build.character.skills[skillName].training;

      if (training === Training.SPECIALIZED || training === Training.TRAINED) {
        cost += SKILL_COST_AT_TRAINING[skillName][training];
      }
    });

    return cost;
  },

  specializedSkillPointsSpent: (state: State, getters: any) => {
    let cost = 0;

    getters.specializedSkills.forEach((skill: string) => {
      if (SPEC_COSTS_AUG[skill]) {
        return;
      }

      cost += SKILL_COST_AT_TRAINING[skill][Training.SPECIALIZED];
    });

    return cost;
  },

  // Attributes
  attributePointsSpent: (state: State) => {
    let spent = 0;

    Object.keys(Attribute).forEach((attribute) => {
      spent += state.build.character.attributes[attribute].creation;
    });

    return spent;
  },
  attributePointsAvailable: (state: State) => {
    return MAX_CREATION_ATTRIBUTE_TOTAL_POINTS;
  },
  attributesAndVitalsErrors: (state: State, getters: any) => {
    if (getters.attributePointsSpent > getters.attributePointsAvailable) {
      return "You have overspent on attribute points!";
    }
  },
  strengthInnate: (state: State) => {
    const value = state.build.character.attributes.strength.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  strengthBase: (state: State, getters: any) => {
    return (
      getters.strengthInnate +
      state.build.character.attributes.strength.invested
    );
  },
  strengthBuffed: (state: State, getters: any) => {
    return (
      getters.strengthBase +
      buffBonus(state.build.character.attributes.strength.buff) +
      cantripBonus(state.build.character.attributes.strength.cantrip)
    );
  },
  enduranceInnate: (state: State) => {
    const value = state.build.character.attributes.endurance.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  enduranceBase: (state: State, getters: any) => {
    return (
      getters.enduranceInnate +
      state.build.character.attributes.endurance.invested
    );
  },
  enduranceBuffed: (state: State, getters: any) => {
    return (
      getters.enduranceBase +
      buffBonus(state.build.character.attributes.endurance.buff) +
      cantripBonus(state.build.character.attributes.endurance.cantrip)
    );
  },
  coordinationInnate: (state: State) => {
    const value = state.build.character.attributes.coordination.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  coordinationBase: (state: State, getters: any) => {
    return (
      getters.coordinationInnate +
      state.build.character.attributes.coordination.invested
    );
  },
  coordinationBuffed: (state: State, getters: any) => {
    return (
      getters.coordinationBase +
      buffBonus(state.build.character.attributes.coordination.buff) +
      cantripBonus(state.build.character.attributes.coordination.cantrip)
    );
  },
  quicknessInnate: (state: State) => {
    const value = state.build.character.attributes.quickness.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  quicknessBase: (state: State, getters: any) => {
    return (
      getters.quicknessInnate +
      state.build.character.attributes.quickness.invested
    );
  },
  quicknessBuffed: (state: State, getters: any) => {
    return (
      getters.quicknessBase +
      buffBonus(state.build.character.attributes.quickness.buff) +
      cantripBonus(state.build.character.attributes.quickness.cantrip)
    );
  },
  focusInnate: (state: State) => {
    const value = state.build.character.attributes.focus.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  focusBase: (state: State, getters: any) => {
    return (
      getters.focusInnate + state.build.character.attributes.focus.invested
    );
  },
  focusBuffed: (state: State, getters: any) => {
    return (
      getters.focusBase +
      buffBonus(state.build.character.attributes.focus.buff) +
      cantripBonus(state.build.character.attributes.focus.cantrip)
    );
  },
  selfInnate: (state: State) => {
    const value = state.build.character.attributes.self.creation;

    if (value > 100) {
      return 100;
    } else {
      return value;
    }
  },
  selfBase: (state: State, getters: any) => {
    return getters.selfInnate + state.build.character.attributes.self.invested;
  },
  selfBuffed: (state: State, getters: any) => {
    return (
      getters.selfBase +
      buffBonus(state.build.character.attributes.self.buff) +
      cantripBonus(state.build.character.attributes.self.cantrip)
    );
  },

  // Vitals
  healthBase: (state: State, getters: any) => {
    return (
      Math.round(getters.enduranceBase / 2) +
      state.build.character.vitals.health.invested
    );
  },
  healthBuffed: (state: State, getters: any) => {
    return (
      getters.healthBase +
      buffBonus(state.build.character.vitals.health.buff) +
      buffBonus(state.build.character.attributes.endurance.buff) / 2 +
      cantripBonus(state.build.character.vitals.health.cantrip) +
      cantripBonus(state.build.character.attributes.endurance.cantrip) / 2
    );
  },
  staminaCreation: (state: State) => {
    return state.build.character.attributes.endurance.creation;
  },
  staminaBase: (state: State, getters: any) => {
    return (
      getters.enduranceBase + state.build.character.vitals.stamina.invested
    );
  },
  staminaBuffed: (state: State, getters: any) => {
    return (
      getters.staminaBase +
      buffBonus(state.build.character.vitals.stamina.buff) +
      buffBonus(state.build.character.attributes.endurance.buff) +
      cantripBonus(state.build.character.vitals.stamina.cantrip) +
      cantripBonus(state.build.character.attributes.endurance.cantrip)
    );
  },
  manaCreation: (state: State) => {
    return state.build.character.attributes.self.creation;
  },
  manaBase: (state: State, getters: any) => {
    return getters.selfBase + state.build.character.vitals.mana.invested;
  },
  manaBuffed: (state: State, getters: any) => {
    return clamp(
      getters.manaBase +
        buffBonus(state.build.character.vitals.mana.buff) +
        buffBonus(state.build.character.attributes.self.buff) +
        cantripBonus(state.build.character.vitals.mana.cantrip) +
        cantripBonus(state.build.character.attributes.self.cantrip),
      0
    );
  },

  // Skills
  alchemyBase: (state: State, getters: any) => {
    if (state.build.character.skills.alchemy.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 4) +
      trainingBonus(state.build.character.skills.alchemy.training) +
      state.build.character.skills.alchemy.invested
    );
  },
  alchemyBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.alchemy.training !== Training.UNUSABLE
        ? getters.alchemyBase
        : 0) +
      buffBonus(state.build.character.skills.alchemy.buff) +
      cantripBonus(state.build.character.skills.alchemy.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          4
      )
    );
  },
  appraiseBase: (state: State, getters: any) => {
    if (state.build.character.skills.appraise.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 4) +
      trainingBonus(state.build.character.skills.appraise.training) +
      state.build.character.skills.appraise.invested
    );
  },
  appraiseBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.appraise.training !== Training.UNUSABLE
        ? getters.appraiseBase
        : 0) +
      buffBonus(state.build.character.skills.appraise.buff) +
      cantripBonus(state.build.character.skills.appraise.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          4
      )
    );
  },
  arcane_loreBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.arcane_lore.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 2) +
      trainingBonus(state.build.character.skills.arcane_lore.training) +
      state.build.character.skills.arcane_lore.invested
    );
  },
  arcane_loreBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.arcane_lore.training !== Training.UNUSABLE
        ? getters.arcane_loreBase
        : 0) +
      buffBonus(state.build.character.skills.arcane_lore.buff) +
      cantripBonus(state.build.character.skills.arcane_lore.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          2
      )
    );
  },
  armor_tinkeringBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.armor_tinkering.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.enduranceBase + getters.focusBase) / 2) +
      trainingBonus(state.build.character.skills.armor_tinkering.training) +
      state.build.character.skills.armor_tinkering.invested
    );
  },
  armor_tinkeringBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.armor_tinkering.training !==
      Training.UNUSABLE
        ? getters.armor_tinkeringBase
        : 0) +
      buffBonus(state.build.character.skills.armor_tinkering.buff) +
      cantripBonus(state.build.character.skills.armor_tinkering.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.endurance.buff) +
          cantripBonus(state.build.character.attributes.endurance.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          2
      )
    );
  },
  assessBase: (state: State, getters: any) => {
    if (state.build.character.skills.assess.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      getters.focusBase +
      trainingBonus(state.build.character.skills.assess.training) +
      state.build.character.skills.assess.invested
    );
  },
  assessBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.assess.training !== Training.UNUSABLE
        ? getters.assessBase
        : 0) +
      buffBonus(state.build.character.skills.assess.buff) +
      cantripBonus(state.build.character.skills.assess.cantrip) +
      buffBonus(state.build.character.attributes.focus.buff) +
      cantripBonus(state.build.character.attributes.focus.cantrip)
    );
  },
  awarenessBase: (state: State, getters: any) => {
    if (state.build.character.skills.awareness.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round(getters.focusBase / 2) +
      trainingBonus(state.build.character.skills.awareness.training) +
      state.build.character.skills.awareness.invested
    );
  },
  awarenessBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.awareness.training !== Training.UNUSABLE
        ? getters.awarenessBase
        : 0) +
      buffBonus(state.build.character.skills.awareness.buff) +
      cantripBonus(state.build.character.skills.awareness.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          2
      )
    );
  },
  axe_and_maceBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.axe_and_mace.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.strengthBase / 2) +
      trainingBonus(state.build.character.skills.axe_and_mace.training) +
      state.build.character.skills.axe_and_mace.invested
    );
  },
  axe_and_maceBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.axe_and_mace.training !== Training.UNUSABLE
        ? getters.axe_and_maceBase
        : 0) +
      buffBonus(state.build.character.skills.axe_and_mace.buff) +
      cantripBonus(state.build.character.skills.axe_and_mace.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip)) /
          2
      )
    );
  },
  bow_and_crossbowBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.bow_and_crossbow.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.coordinationBase / 2) +
      trainingBonus(state.build.character.skills.bow_and_crossbow.training) +
      state.build.character.skills.bow_and_crossbow.invested
    );
  },
  bow_and_crossbowBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.bow_and_crossbow.training !==
      Training.UNUSABLE
        ? getters.bow_and_crossbowBase
        : 0) +
      buffBonus(state.build.character.skills.bow_and_crossbow.buff) +
      cantripBonus(state.build.character.skills.bow_and_crossbow.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip)) /
          2
      )
    );
  },
  cookingBase: (state: State, getters: any) => {
    if (state.build.character.skills.cooking.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 4) +
      trainingBonus(state.build.character.skills.cooking.training) +
      state.build.character.skills.cooking.invested
    );
  },
  cookingBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.cooking.training !== Training.UNUSABLE
        ? getters.cookingBase
        : 0) +
      buffBonus(state.build.character.skills.cooking.buff) +
      cantripBonus(state.build.character.skills.cooking.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          4
      )
    );
  },
  daggerBase: (state: State, getters: any) => {
    if (state.build.character.skills.dagger.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round(getters.quicknessBase / 2) +
      trainingBonus(state.build.character.skills.dagger.training) +
      state.build.character.skills.dagger.invested
    );
  },
  daggerBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.dagger.training !== Training.UNUSABLE
        ? getters.daggerBase
        : 0) +
      buffBonus(state.build.character.skills.dagger.buff) +
      cantripBonus(state.build.character.skills.dagger.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          2
      )
    );
  },
  deceptionBase: (state: State, getters: any) => {
    if (state.build.character.skills.deception.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      getters.selfBase +
      trainingBonus(state.build.character.skills.deception.training) +
      state.build.character.skills.deception.invested
    );
  },
  deceptionBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.deception.training !== Training.UNUSABLE
        ? getters.deceptionBase
        : 0) +
      buffBonus(state.build.character.skills.deception.buff) +
      cantripBonus(state.build.character.skills.deception.cantrip) +
      buffBonus(state.build.character.attributes.self.buff) +
      cantripBonus(state.build.character.attributes.self.cantrip)
    );
  },
  dual_wieldBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.dual_wield.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.coordinationBase / 2) +
      trainingBonus(state.build.character.skills.dual_wield.training) +
      state.build.character.skills.dual_wield.invested
    );
  },
  dual_wieldBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.dual_wield.training !== Training.UNUSABLE
        ? getters.dual_wieldBase
        : 0) +
      buffBonus(state.build.character.skills.dual_wield.buff) +
      cantripBonus(state.build.character.skills.dual_wield.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip)) /
          2
      )
    );
  },
  fletchingBase: (state: State, getters: any) => {
    if (state.build.character.skills.fletching.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 4) +
      trainingBonus(state.build.character.skills.fletching.training) +
      state.build.character.skills.fletching.invested
    );
  },
  fletchingBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.fletching.training !== Training.UNUSABLE
        ? getters.fletchingBase
        : 0) +
      buffBonus(state.build.character.skills.fletching.buff) +
      cantripBonus(state.build.character.skills.fletching.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          4
      )
    );
  },
  healingBase: (state: State, getters: any) => {
    if (state.build.character.skills.healing.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 3) +
      trainingBonus(state.build.character.skills.healing.training) +
      state.build.character.skills.healing.invested
    );
  },
  healingBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.healing.training !== Training.UNUSABLE
        ? getters.healingBase
        : 0) +
      buffBonus(state.build.character.skills.healing.buff) +
      cantripBonus(state.build.character.skills.healing.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          3
      )
    );
  },
  item_tinkeringBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.item_tinkering.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      getters.focusBase +
      trainingBonus(state.build.character.skills.item_tinkering.training) +
      state.build.character.skills.item_tinkering.invested
    );
  },
  item_tinkeringBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.item_tinkering.training !==
      Training.UNUSABLE
        ? getters.item_tinkeringBase
        : 0) +
      buffBonus(state.build.character.skills.item_tinkering.buff) +
      cantripBonus(state.build.character.skills.item_tinkering.cantrip) +
      buffBonus(state.build.character.attributes.focus.buff) +
      cantripBonus(state.build.character.attributes.focus.cantrip)
    );
  },
  jumpBase: (state: State, getters: any) => {
    if (state.build.character.skills.jump.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.coordinationBase) / 4) +
      trainingBonus(state.build.character.skills.jump.training) +
      state.build.character.skills.jump.invested
    );
  },
  jumpBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.jump.training !== Training.UNUSABLE
        ? getters.jumpBase
        : 0) +
      buffBonus(state.build.character.skills.jump.buff) +
      cantripBonus(state.build.character.skills.jump.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip)) /
          4
      )
    );
  },
  leadershipBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.leadership.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.leadership.training) +
      state.build.character.skills.leadership.invested
    );
  },
  leadershipBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.leadership.training !== Training.UNUSABLE
        ? getters.leadershipBase
        : 0) +
      buffBonus(state.build.character.skills.leadership.buff) +
      cantripBonus(state.build.character.skills.leadership.cantrip)
    );
  },
  life_magicBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.life_magic.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.focusBase / 2) +
      trainingBonus(state.build.character.skills.life_magic.training) +
      state.build.character.skills.life_magic.invested
    );
  },
  life_magicBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.life_magic.training !== Training.UNUSABLE
        ? getters.life_magicBase
        : 0) +
      buffBonus(state.build.character.skills.life_magic.buff) +
      cantripBonus(state.build.character.skills.life_magic.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          2
      )
    );
  },
  lockpickBase: (state: State, getters: any) => {
    if (state.build.character.skills.lockpick.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 2) +
      trainingBonus(state.build.character.skills.lockpick.training) +
      state.build.character.skills.lockpick.invested
    );
  },
  lockpickBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.lockpick.training !== Training.UNUSABLE
        ? getters.lockpickBase
        : 0) +
      buffBonus(state.build.character.skills.lockpick.buff) +
      cantripBonus(state.build.character.skills.lockpick.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          2
      )
    );
  },
  loyaltyBase: (state: State, getters: any) => {
    if (state.build.character.skills.loyalty.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.loyalty.training) +
      state.build.character.skills.loyalty.invested
    );
  },
  loyaltyBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.loyalty.training !== Training.UNUSABLE
        ? getters.loyaltyBase
        : 0) +
      buffBonus(state.build.character.skills.loyalty.buff) +
      cantripBonus(state.build.character.skills.loyalty.cantrip)
    );
  },
  magic_defenseBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.magic_defense.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
      trainingBonus(state.build.character.skills.magic_defense.training) +
      state.build.character.skills.magic_defense.invested
    );
  },
  magic_defenseBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.magic_defense.training !== Training.UNUSABLE
        ? getters.magic_defenseBase
        : 0) +
      buffBonus(state.build.character.skills.magic_defense.buff) +
      cantripBonus(state.build.character.skills.magic_defense.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
      )
    );
  },
  magic_item_tinkeringBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.magic_item_tinkering.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 2) +
      trainingBonus(
        state.build.character.skills.magic_item_tinkering.training
      ) +
      state.build.character.skills.magic_item_tinkering.invested
    );
  },
  magic_item_tinkeringBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.magic_item_tinkering.training !==
      Training.UNUSABLE
        ? getters.magic_item_tinkeringBase
        : 0) +
      buffBonus(state.build.character.skills.magic_item_tinkering.buff) +
      cantripBonus(state.build.character.skills.magic_item_tinkering.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          2
      )
    );
  },
  mana_conversionBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.mana_conversion.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
      trainingBonus(state.build.character.skills.mana_conversion.training) +
      state.build.character.skills.mana_conversion.invested
    );
  },
  mana_conversionBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.mana_conversion.training !==
      Training.UNUSABLE
        ? getters.mana_conversionBase
        : 0) +
      buffBonus(state.build.character.skills.mana_conversion.buff) +
      cantripBonus(state.build.character.skills.mana_conversion.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
      )
    );
  },
  melee_defenseBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.melee_defense.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.quicknessBase) / 4) +
      trainingBonus(state.build.character.skills.melee_defense.training) +
      state.build.character.skills.melee_defense.invested
    );
  },
  melee_defenseBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.melee_defense.training !== Training.UNUSABLE
        ? getters.melee_defenseBase
        : 0) +
      buffBonus(state.build.character.skills.melee_defense.buff) +
      cantripBonus(state.build.character.skills.melee_defense.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          4
      )
    );
  },
  missile_defenseBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.missile_defense.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.quicknessBase) / 4) +
      trainingBonus(state.build.character.skills.missile_defense.training) +
      state.build.character.skills.missile_defense.invested
    );
  },
  missile_defenseBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.missile_defense.training !==
      Training.UNUSABLE
        ? getters.missile_defenseBase
        : 0) +
      buffBonus(state.build.character.skills.missile_defense.buff) +
      cantripBonus(state.build.character.skills.missile_defense.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          4
      )
    );
  },
  portal_magicBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.portal_magic.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.portal_magic.training) +
      state.build.character.skills.portal_magic.invested
    );
  },
  portal_magicBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.portal_magic.training !== Training.UNUSABLE
        ? getters.portal_magicBase
        : 0) +
      buffBonus(state.build.character.skills.portal_magic.buff) +
      cantripBonus(state.build.character.skills.portal_magic.cantrip)
    );
  },
  runBase: (state: State, getters: any) => {
    if (state.build.character.skills.run.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round(getters.quicknessBase / 2) +
      trainingBonus(state.build.character.skills.run.training) +
      state.build.character.skills.run.invested
    );
  },
  runBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.run.training !== Training.UNUSABLE
        ? getters.runBase
        : 0) +
      buffBonus(state.build.character.skills.run.buff) +
      cantripBonus(state.build.character.skills.run.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          2
      )
    );
  },
  salvagingBase: (state: State, getters: any) => {
    if (state.build.character.skills.salvaging.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.salvaging.training) +
      state.build.character.skills.salvaging.invested
    );
  },
  salvagingBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.salvaging.training !== Training.UNUSABLE
        ? getters.salvagingBase
        : 0) +
      buffBonus(state.build.character.skills.salvaging.buff) +
      cantripBonus(state.build.character.skills.salvaging.cantrip)
    );
  },
  shieldBase: (state: State, getters: any) => {
    if (state.build.character.skills.shield.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.enduranceBase) / 2) +
      trainingBonus(state.build.character.skills.shield.training) +
      state.build.character.skills.shield.invested
    );
  },
  shieldBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.shield.training !== Training.UNUSABLE
        ? getters.shieldBase
        : 0) +
      buffBonus(state.build.character.skills.shield.buff) +
      cantripBonus(state.build.character.skills.shield.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          buffBonus(state.build.character.attributes.endurance.buff) +
          cantripBonus(state.build.character.attributes.endurance.cantrip)) /
          2
      )
    );
  },
  spear_and_staffBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.spear_and_staff.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.coordinationBase / 2) +
      trainingBonus(state.build.character.skills.spear_and_staff.training) +
      state.build.character.skills.spear_and_staff.invested
    );
  },
  spear_and_staffBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.spear_and_staff.training !==
      Training.UNUSABLE
        ? getters.spear_and_staffBase
        : 0) +
      buffBonus(state.build.character.skills.spear_and_staff.buff) +
      cantripBonus(state.build.character.skills.spear_and_staff.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip)) /
          2
      )
    );
  },
  stealthBase: (state: State, getters: any) => {
    if (state.build.character.skills.stealth.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.quicknessBase + getters.focusBase) / 3) +
      trainingBonus(state.build.character.skills.stealth.training) +
      state.build.character.skills.stealth.invested
    );
  },
  stealthBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.stealth.training !== Training.UNUSABLE
        ? getters.stealthBase
        : 0) +
      buffBonus(state.build.character.skills.stealth.buff) +
      cantripBonus(state.build.character.skills.stealth.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          3
      )
    );
  },
  swordBase: (state: State, getters: any) => {
    if (state.build.character.skills.sword.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round(getters.strengthBase / 2) +
      trainingBonus(state.build.character.skills.sword.training) +
      state.build.character.skills.sword.invested
    );
  },
  swordBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.sword.training !== Training.UNUSABLE
        ? getters.swordBase
        : 0) +
      buffBonus(state.build.character.skills.sword.buff) +
      cantripBonus(state.build.character.skills.sword.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip)) /
          2
      )
    );
  },
  thrown_weaponsBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.thrown_weapons.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.strengthBase / 2) +
      trainingBonus(state.build.character.skills.thrown_weapons.training) +
      state.build.character.skills.thrown_weapons.invested
    );
  },
  thrown_weaponsBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.thrown_weapons.training !==
      Training.UNUSABLE
        ? getters.thrown_weaponsBase
        : 0) +
      buffBonus(state.build.character.skills.thrown_weapons.buff) +
      cantripBonus(state.build.character.skills.thrown_weapons.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip)) /
          2
      )
    );
  },
  two_handed_combatBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.two_handed_combat.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.strengthBase / 2) +
      trainingBonus(state.build.character.skills.two_handed_combat.training) +
      state.build.character.skills.two_handed_combat.invested
    );
  },
  two_handed_combatBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.two_handed_combat.training !==
      Training.UNUSABLE
        ? getters.two_handed_combatBase
        : 0) +
      buffBonus(state.build.character.skills.two_handed_combat.buff) +
      cantripBonus(state.build.character.skills.two_handed_combat.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip)) /
          2
      )
    );
  },
  unarmed_combatBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.unarmed_combat.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.coordinationBase / 2) +
      trainingBonus(state.build.character.skills.unarmed_combat.training) +
      state.build.character.skills.unarmed_combat.invested
    );
  },
  unarmed_combatBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.unarmed_combat.training !==
      Training.UNUSABLE
        ? getters.unarmed_combatBase
        : 0) +
      buffBonus(state.build.character.skills.unarmed_combat.buff) +
      cantripBonus(state.build.character.skills.unarmed_combat.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip)) /
          2
      )
    );
  },
  war_magicBase: (state: State, getters: any) => {
    if (state.build.character.skills.war_magic.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round(getters.selfBase / 2) +
      trainingBonus(state.build.character.skills.war_magic.training) +
      state.build.character.skills.war_magic.invested
    );
  },
  war_magicBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.war_magic.training !== Training.UNUSABLE
        ? getters.war_magicBase
        : 0) +
      buffBonus(state.build.character.skills.war_magic.buff) +
      cantripBonus(state.build.character.skills.war_magic.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          2
      )
    );
  },
  weapon_tinkeringBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.weapon_tinkering.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.focusBase) / 2) +
      trainingBonus(state.build.character.skills.weapon_tinkering.training) +
      state.build.character.skills.weapon_tinkering.invested
    );
  },
  weapon_tinkeringBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.weapon_tinkering.training !==
      Training.UNUSABLE
        ? getters.weapon_tinkeringBase
        : 0) +
      buffBonus(state.build.character.skills.weapon_tinkering.buff) +
      cantripBonus(state.build.character.skills.weapon_tinkering.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip)) /
          2
      )
    );
  },

  specializedSkills: (state: State) => {
    return Object.keys(state.build.character.skills).filter(
      (key) =>
        state.build.character.skills[key].training === Training.SPECIALIZED
    );
  },
  trainedSkills: (state: State) => {
    return Object.keys(state.build.character.skills).filter(
      (key) => state.build.character.skills[key].training === Training.TRAINED
    );
  },
  untrainedSkills: (state: State) => {
    return Object.keys(state.build.character.skills).filter(
      (key) => state.build.character.skills[key].training === Training.UNTRAINED
    );
  },
  unusableSkills: (state: State) => {
    return Object.keys(state.build.character.skills).filter(
      (key) => state.build.character.skills[key].training === Training.UNUSABLE
    );
  },

  // Modals
  shareModalVisible(state: State) {
    return state.ui.modalVisibility.share;
  },

  // Settings

  // Auth
  isLoggedIn: (state: State, getters: any) => {
    return state.auth.isLoggedIn;
  },
  isAdmin: (state: State, getters: any) => {
    return state.auth.isAdmin;
  },
};
