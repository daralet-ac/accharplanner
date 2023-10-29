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
  itemsPaneVisible: (state: State) => {
    return state.ui.paneVisibility.items;
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
      cantripBonus(state.build.character.attributes.strength.cantrip) +
      (state.build.character.items.font_of_joji ? 2 : 0) // Power of the Dragon
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
      cantripBonus(state.build.character.attributes.coordination.cantrip) +
      (state.build.character.items.font_of_joji ? 2 : 0) // Grace of the Unicorn
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
      cantripBonus(state.build.character.attributes.focus.cantrip) +
      (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
      (state.build.character.items.font_of_joji ? 2 : 0) // Splendor of the Firebird
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
        cantripBonus(state.build.character.attributes.self.cantrip) +
        (state.build.character.items.focusing_stone ? -50 : 0), // Malediction
      0
    );
  },

  // Skills
  alchemyBase: (state: State, getters: any) => {
    if (state.build.character.skills.alchemy.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 3) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
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
      Math.round(getters.focusBase / 3) +
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
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
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
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          2
      )
    );
  },
  assess_creatureBase: (state: State) => {
    if (
      state.build.character.skills.assess_creature.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.assess_creature.training) +
      state.build.character.skills.assess_creature.invested
    );
  },
  assess_creatureBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.assess_creature.training !==
      Training.UNUSABLE
        ? getters.assess_creatureBase
        : 0) +
      buffBonus(state.build.character.skills.assess_creature.buff) +
      cantripBonus(state.build.character.skills.assess_creature.cantrip)
    );
  },
  assess_personBase: (state: State) => {
    if (
      state.build.character.skills.assess_person.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      trainingBonus(state.build.character.skills.assess_person.training) +
      state.build.character.skills.assess_person.invested
    );
  },
  assess_personBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.assess_person.training !== Training.UNUSABLE
        ? getters.assess_personBase
        : 0) +
      buffBonus(state.build.character.skills.assess_person.buff) +
      cantripBonus(state.build.character.skills.assess_person.cantrip)
    );
  },
  cookingBase: (state: State, getters: any) => {
    if (state.build.character.skills.cooking.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 3) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  creature_enchantmentBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.creature_enchantment.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
      trainingBonus(
        state.build.character.skills.creature_enchantment.training
      ) +
      state.build.character.skills.creature_enchantment.invested
    );
  },
  creature_enchantmentBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.creature_enchantment.training !==
      Training.UNUSABLE
        ? getters.creature_enchantmentBase
        : 0) +
      buffBonus(state.build.character.skills.creature_enchantment.buff) +
      cantripBonus(state.build.character.skills.creature_enchantment.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
      )
    );
  },
  deceptionBase: (state: State) => {
    if (state.build.character.skills.deception.training === Training.UNUSABLE) {
      return 0;
    }

    return (
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
      cantripBonus(state.build.character.skills.deception.cantrip)
    );
  },
  dirty_fightingBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.dirty_fighting.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.coordinationBase) / 3) +
      trainingBonus(state.build.character.skills.dirty_fighting.training) +
      state.build.character.skills.dirty_fighting.invested
    );
  },
  dirty_fightingBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.dirty_fighting.training !==
      Training.UNUSABLE
        ? getters.dirty_fightingBase
        : 0) +
      buffBonus(state.build.character.skills.dirty_fighting.buff) +
      cantripBonus(state.build.character.skills.dirty_fighting.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  dual_wieldBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.dual_wield.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.coordinationBase) / 3) +
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
        (2 * buffBonus(state.build.character.attributes.coordination.buff) +
          2 *
            cantripBonus(
              state.build.character.attributes.coordination.cantrip
            ) +
          2 * (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  finesse_weaponsBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.finesse_weapons.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.quicknessBase) / 3) +
      trainingBonus(state.build.character.skills.finesse_weapons.training) +
      state.build.character.skills.finesse_weapons.invested
    );
  },
  finesse_weaponsBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.finesse_weapons.training !==
      Training.UNUSABLE
        ? getters.finesse_weaponsBase
        : 0) +
      buffBonus(state.build.character.skills.finesse_weapons.buff) +
      cantripBonus(state.build.character.skills.finesse_weapons.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  fletchingBase: (state: State, getters: any) => {
    if (state.build.character.skills.fletching.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 3) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  heavy_weaponsBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.heavy_weapons.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.coordinationBase) / 3) +
      trainingBonus(state.build.character.skills.heavy_weapons.training) +
      state.build.character.skills.heavy_weapons.invested
    );
  },
  heavy_weaponsBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.heavy_weapons.training !== Training.UNUSABLE
        ? getters.heavy_weaponsBase
        : 0) +
      buffBonus(state.build.character.skills.heavy_weapons.buff) +
      cantripBonus(state.build.character.skills.heavy_weapons.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  item_enchantmentBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.item_enchantment.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
      trainingBonus(state.build.character.skills.item_enchantment.training) +
      state.build.character.skills.item_enchantment.invested
    );
  },
  item_enchantmentBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.item_enchantment.training !==
      Training.UNUSABLE
        ? getters.item_enchantmentBase
        : 0) +
      buffBonus(state.build.character.skills.item_enchantment.buff) +
      cantripBonus(state.build.character.skills.item_enchantment.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
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
      Math.round((getters.coordinationBase + getters.focusBase) / 2) +
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
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          2
      )
    );
  },
  jumpBase: (state: State, getters: any) => {
    if (state.build.character.skills.jump.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.coordinationBase) / 2) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          2
      )
    );
  },
  leadershipBase: (state: State) => {
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
      Math.round((getters.focusBase + getters.selfBase) / 4) +
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
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
      )
    );
  },
  light_weaponsBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.light_weapons.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.coordinationBase) / 3) +
      trainingBonus(state.build.character.skills.light_weapons.training) +
      state.build.character.skills.light_weapons.invested
    );
  },
  light_weaponsBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.light_weapons.training !== Training.UNUSABLE
        ? getters.light_weaponsBase
        : 0) +
      buffBonus(state.build.character.skills.light_weapons.buff) +
      cantripBonus(state.build.character.skills.light_weapons.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  lockpickBase: (state: State, getters: any) => {
    if (state.build.character.skills.lockpick.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.focusBase) / 3) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  loyaltyBase: (state: State) => {
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
      Math.round((getters.focusBase + getters.selfBase) / 7) +
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
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          7
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
      getters.focusBase +
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
      buffBonus(state.build.character.attributes.focus.buff) +
      cantripBonus(state.build.character.attributes.focus.cantrip) +
      (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
      (state.build.character.items.font_of_joji ? 2 : 0)
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
      Math.round((getters.focusBase + getters.selfBase) / 6) +
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
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          6
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
      Math.round((getters.coordinationBase + getters.quicknessBase) / 3) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          3
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
      Math.round((getters.coordinationBase + getters.quicknessBase) / 5) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          5
      )
    );
  },
  missile_weaponsBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.missile_weapons.training ===
      Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round(getters.coordinationBase / 2) +
      trainingBonus(state.build.character.skills.missile_weapons.training) +
      state.build.character.skills.missile_weapons.invested
    );
  },
  missile_weaponsBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.missile_weapons.training !==
      Training.UNUSABLE
        ? getters.missile_weaponsBase
        : 0) +
      buffBonus(state.build.character.skills.missile_weapons.buff) +
      cantripBonus(state.build.character.skills.missile_weapons.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          2
      )
    );
  },
  recklessnessBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.recklessness.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.strengthBase + getters.quicknessBase) / 3) +
      trainingBonus(state.build.character.skills.recklessness.training) +
      state.build.character.skills.recklessness.invested
    );
  },
  recklessnessBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.recklessness.training !== Training.UNUSABLE
        ? getters.recklessnessBase
        : 0) +
      buffBonus(state.build.character.skills.recklessness.buff) +
      cantripBonus(state.build.character.skills.recklessness.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.strength.buff) +
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          3
      )
    );
  },
  runBase: (state: State, getters: any) => {
    if (state.build.character.skills.run.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      getters.quicknessBase +
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
      buffBonus(state.build.character.attributes.quickness.buff) +
      cantripBonus(state.build.character.attributes.quickness.cantrip)
    );
  },
  salvagingBase: (state: State) => {
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
      Math.round((getters.strengthBase + getters.coordinationBase) / 2) +
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          2
      )
    );
  },
  sneak_attackBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.sneak_attack.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.coordinationBase + getters.quicknessBase) / 3) +
      trainingBonus(state.build.character.skills.sneak_attack.training) +
      state.build.character.skills.sneak_attack.invested
    );
  },
  sneak_attackBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.sneak_attack.training !== Training.UNUSABLE
        ? getters.sneak_attackBase
        : 0) +
      buffBonus(state.build.character.skills.sneak_attack.buff) +
      cantripBonus(state.build.character.skills.sneak_attack.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.quickness.buff) +
          cantripBonus(state.build.character.attributes.quickness.cantrip)) /
          3
      )
    );
  },
  summoningBase: (state: State, getters: any) => {
    if (state.build.character.skills.summoning.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.enduranceBase + getters.selfBase) / 3) +
      trainingBonus(state.build.character.skills.summoning.training) +
      state.build.character.skills.summoning.invested
    );
  },
  summoningBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.summoning.training !== Training.UNUSABLE
        ? getters.summoningBase
        : 0) +
      buffBonus(state.build.character.skills.summoning.buff) +
      cantripBonus(state.build.character.skills.summoning.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.endurance.buff) +
          cantripBonus(state.build.character.attributes.endurance.cantrip) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          3
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
      Math.round((getters.strengthBase + getters.coordinationBase) / 3) +
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
          cantripBonus(state.build.character.attributes.strength.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.coordination.buff) +
          cantripBonus(state.build.character.attributes.coordination.cantrip) +
          (state.build.character.items.font_of_joji ? 2 : 0)) /
          3
      )
    );
  },
  void_magicBase: (state: State, getters: any) => {
    if (
      state.build.character.skills.void_magic.training === Training.UNUSABLE
    ) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
      trainingBonus(state.build.character.skills.void_magic.training) +
      state.build.character.skills.void_magic.invested
    );
  },
  void_magicBuffed: (state: State, getters: any) => {
    return (
      (state.build.character.skills.void_magic.training !== Training.UNUSABLE
        ? getters.void_magicBase
        : 0) +
      buffBonus(state.build.character.skills.void_magic.buff) +
      cantripBonus(state.build.character.skills.void_magic.cantrip) +
      Math.round(
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
      )
    );
  },
  war_magicBase: (state: State, getters: any) => {
    if (state.build.character.skills.war_magic.training === Training.UNUSABLE) {
      return 0;
    }

    return (
      Math.round((getters.focusBase + getters.selfBase) / 4) +
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
        (buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.self.buff) +
          cantripBonus(state.build.character.attributes.self.cantrip)) /
          4
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
          (state.build.character.items.font_of_joji ? 2 : 0) +
          buffBonus(state.build.character.attributes.focus.buff) +
          cantripBonus(state.build.character.attributes.focus.cantrip) +
          (state.build.character.items.focusing_stone ? 50 : 0) + // Brilliance
          (state.build.character.items.font_of_joji ? 2 : 0)) /
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
