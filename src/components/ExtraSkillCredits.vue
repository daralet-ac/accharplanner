<template>
  <div id="extraskillcredits" class="header">
    <div>
      <div class="header-title" v-on:click="toggle">
        <h3>Extra Skill Credits</h3>
      </div>
      <div class="header-items alt-onecol" v-if="collapsed">
        <ExtraSkillCredit id="railrea" name="Aun Ralirea" />
        <ExtraSkillCredit id="oswald" name="Chasing Oswald" />
      </div>
    </div>
  </div>
</template>

<script>
import ExtraSkillCredit from "./ExtraSkillCredit.vue";

export default {
  name: "ExtraSkillCredits",
  components: {
    ExtraSkillCredit,
  },
  computed: {
    collapsed() {
      return this.$store.getters.extraSkillCreditsPaneVisible;
    },
  },
  methods: {
    toggle() {
      this.$store.commit("toggleExtraSkillCreditsPane");
    },
  },
};
</script>
