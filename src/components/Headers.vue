<template>
  <div class="headers">
    <div class="header">
      <div>
        <div class="header-title" v-on:click="toggleCharacterPane">
          <div>
            <h3>Character</h3>
          </div>
        </div>
        <div v-if="characterPaneVisible" class="header-items">
          <div>Name</div>
          <div>
            <input class="w100" id="charname" type="text" v-model="name" />
          </div>
          <div>Race</div>
          <div>
            <select v-model="race">
              <option v-for="race in races" v-bind:key="race">
                {{ race }}
              </option>
            </select>
          </div>
          <div>Gender</div>
          <div>
            <input type="radio" id="female" value="Female" v-model="gender" />
            <label for="female">Female</label>
            <input type="radio" id="male" value="Male" v-model="gender" />
            <label for="male">Male</label>
          </div>
          <div>
            Level
          </div>
          <div class="flex-row">
            <div class="w70">
              <input
                class="w100"
                type="range"
                min="1"
                :max="maxLevel"
                v-model="level"
              />
            </div>
            <div class="w30 right">
              <input
                class="number w100"
                type="text"
                v-bind:value="level"
                v-on:change="updateLevel"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="header">
      <div>
        <div class="header-title" v-on:click="toggleXPPane">
          <div>
            <h3>XP</h3>
          </div>
          <div class="right">
            <span
              class="tip"
              v-tooltip="
                'These numbers are a bit of a work in progress. Total and Required Level tend to match pretty well but Unassigned and Spent seem to get way off sometimes.'
              "
              >!</span
            >
          </div>
        </div>
        <div v-if="xpPaneVisible" class="header-items">
          <div>Unassigned</div>
          <div class="right">
            <span
              v-if="unassignedXPError"
              class="tip"
              v-tooltip="unassignedXPError"
              >!</span
            >
            <span v-if="!unassignedXPError">{{ unassignedXP }}</span>
          </div>
          <div>Spent</div>
          <div class="right">
            <span
              v-if="totalXPInvestedError"
              class="tip"
              v-tooltip="
                totalXPInvestedError
              "
              >!</span
            >
            <span v-if="!totalXPInvestedError">{{ totalXPInvested }}</span>
          </div>
          <div>Total</div>
          <div class="right">{{ totalXPEarned }}</div>
          <div>Required Level</div>
          <div class="right" v-bind:class="isOverspent ? 'red' : 'gray'">
            {{ requiredLevel }}
          </div>
        </div>
      </div>
    </div>
    <div class="header">
      <div>
        <div class="header-title" v-on:click="toggleKnobsAndDialsPane">
          <div>
            <h3>Knobs &amp; Dials</h3>
          </div>
        </div>
        <div v-if="knobsAndDialsPaneVisible" class="header-items">
          <div>Invested</div>
          <div>
            <input
              class="w100"
              type="range"
              min="0"
              :max="maxSkillInvestedSpecialized"
              value="0"
              v-on:change="changeAllInvestments"
            />
          </div>
          <div>Buffs</div>
          <div>
            <select v-on:change="changeAllBuffs">
              <option value="0"></option>
              <option value="1">I</option>
              <option value="2">II</option>
              <option value="3">III</option>
              <option value="4">IV</option>
              <option value="5">V</option>
              <option value="6">VI</option>
              <option value="7">VII</option>
              <option value="8">VIII</option>
            </select>
          </div>
          <div>Cantrips</div>
          <div>
            <select v-on:change="changeAllCantrips">
              <option value="0"></option>
              <option value="1">Minor</option>
              <option value="2">Major</option>
              <option value="3">Epic</option>
              <option value="4">Legen.</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  MIN_LEVEL,
  MAX_LEVEL,
  MAX_SKILL_INVESTED_SPECIALIZED,
} from "../constants";
import { Race } from "../types";

export default {
  name: "Headers",
  components: {
  },
  data() {
    return {
      maxLevel: MAX_LEVEL,
      maxSkillInvestedSpecialized: MAX_SKILL_INVESTED_SPECIALIZED,
    }
  },
  computed: {
    characterPaneVisible() {
      return this.$store.getters.characterPaneVisible;
    },
    xpPaneVisible() {
      return this.$store.getters.xpPaneVisible;
    },
    knobsAndDialsPaneVisible() {
      return this.$store.getters.knobsAndDialsPaneVisible;
    },
    totalXPEarned() {
      return Number(this.$store.getters.totalXPEarned).toLocaleString();
    },
    totalXPInvested() {
      return Number(this.$store.getters.totalXPInvested).toLocaleString();
    },
    totalXPInvestedError() {
      return this.$store.getters.totalXPInvestedError;
    },
    unassignedXP() {
      return Number(this.$store.getters.unassignedXP).toLocaleString();
    },
    unassignedXPError() {
      return this.$store.getters.unassignedXPError;
    },
    isOverspent() {
      return (
        Number(this.$store.getters.totalXPInvested) >
          Number(this.$store.getters.totalXPEarned) ||
        this.$store.getters.skillPointsSpent >
          this.$store.getters.skillPointsAvailable
      );
    },
    skillPointsSpent() {
      return this.$store.getters.skillPointsSpent;
    },
    skillPointsAvailable() {
      return this.$store.getters.skillPointsAvailable;
    },
    requiredLevel() {
      return this.$store.getters.requiredLevel;
    },
    name: {
      get() {
        return this.$store.state.build.character.name;
      },
      set(value) {
        this.$store.commit("updateName", value);
      },
    },
    level: {
      get() {
        return this.$store.state.build.character.level;
      },
      set(value) {
        this.$store.commit("updateLevel", value);
      },
    },
    races() {
      return Object.keys(Race);
    },
    race: {
      get() {
        return this.$store.state.build.character.race;
      },
      set(value) {
        this.$store.commit("updateRace", value);
      },
    },
    gender: {
      get() {
        return this.$store.state.build.character.gender;
      },
      set(value) {
        this.$store.commit("updateGender", value);
      },
    },
    exportedCharacter() {
      return this.$store.getters.exportedCharacter;
    },
  },
  methods: {
    toggleCharacterPane() {
      this.$store.commit("toggleCharacterPane");
    },
    toggleXPPane() {
      this.$store.commit("toggleXPPane");
    },
    toggleKnobsAndDialsPane() {
      this.$store.commit("toggleKnobsAndDialsPane");
    },
    updateLevel(e) {
      let actual = Math.round(Number(e.target.value));

      if (isNaN(actual) || actual < MIN_LEVEL) {
        actual = MIN_LEVEL;
      } else if (actual > MAX_LEVEL) {
        actual = MAX_LEVEL;
      }

      this.$store.commit("updateLevel", actual);
    },
    changeAllInvestments(e) {
      this.$store.dispatch("changeAllInvestment", e.target.value);
    },
    changeAllBuffs(e) {
      this.$store.dispatch("changeAllBuffs", e.target.value);
    },
    changeAllCantrips(e) {
      this.$store.dispatch("changeAllCantrips", e.target.value);
    },
  },
};
</script>
