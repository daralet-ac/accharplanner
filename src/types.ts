export interface StringIndexedDict<V> {
  [key: string]: V;
}

export interface NumberIndexedDict<V> {
  [key: number]: V;
}

export interface Character {
  name: string;
  race: string;
  gender: string;
  level: number;
  attributes: any;
  vitals: any;
  skills: any;
}

enum NotificationType {
  Success,
  Error,
  Info,
}

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

export interface SavedBuild {
  key: string;
  build: string;
}

export interface PaneVisibility {
  attributes: boolean;
  skills: boolean;
  buildStages: boolean;
  character: boolean;
  xp: boolean;
  knobsAndDials: boolean;
}

export interface ModalVisibility {
  share: boolean;
}

export interface UIState {
  notifications: Notification[];
  savedBuilds: SavedBuild[];
  shareStatus: string | null;
  sharedBuild: string | null;
  currentStage: number | null;
  paneVisibility: PaneVisibility;
  modalVisibility: ModalVisibility;
  darkMode: boolean | null;
}

export interface Build {
  character: Character;
  stages: Character[];
}

interface Settings {}

interface AuthState {
  isLoggedIn: boolean;
  isAdmin: boolean;
}

export interface State {
  ui: UIState;
  build: Build;
  settings: Settings;
  auth: AuthState;
}

export enum Race {
  Aluvian = "Aluvian",
  "Gharu'ndim" = "Gharu'ndim",
  Sho = "Sho",
  Viamontian = "Viamontian",
  Empyrean = "Empyrean",
  Umbraen = "Umbraen",
  Penumbraen = "Penumbraen",
  Lugian = "Lugian",
  Tumerok = "Tumerok",
}

export enum Gender {
  Female = "Female",
  Male = "Male",
}

export enum Attribute {
  strength = "strength",
  endurance = "endurance",
  coordination = "coordination",
  quickness = "quickness",
  focus = "focus",
  self = "self",
}

export enum Vital {
  health = "health",
  stamina = "stamina",
  mana = "mana",
}

export enum Skill {
  "alchemy" = "alchemy",
  "arcane_lore" = "arcane_lore",
  "armor_tinkering" = "armor_tinkering",
  "assess_creature" = "assess_creature",
  "assess_person" = "assess_person",
  "cooking" = "cooking",
  "creature_enchantment" = "creature_enchantment",
  "deception" = "deception",
  "dual_wield" = "dual_wield",
  "dirty_fighting" = "dirty_fighting",
  "finesse_weapons" = "finesse_weapons",
  "fletching" = "fletching",
  "healing" = "healing",
  "heavy_weapons" = "heavy_weapons",
  "item_enchantment" = "item_enchantment",
  "item_tinkering" = "item_tinkering",
  "jump" = "jump",
  "leadership" = "leadership",
  "life_magic" = "life_magic",
  "light_weapons" = "light_weapons",
  "lockpick" = "lockpick",
  "loyalty" = "loyalty",
  "magic_defense" = "magic_defense",
  "magic_item_tinkering" = "magic_item_tinkering",
  "mana_conversion" = "mana_conversion",
  "melee_defense" = "melee_defense",
  "missile_defense" = "missile_defense",
  "missile_weapons" = "missile_weapons",
  "recklessness" = "recklessness",
  "run" = "run",
  "salvaging" = "salvaging",
  "shield" = "shield",
  "sneak_attack" = "sneak_attack",
  "summoning" = "summoning",
  "two_handed_combat" = "two_handed_combat",
  "void_magic" = "void_magic",
  "war_magic" = "war_magic",
  "weapon_tinkering" = "weapon_tinkering",
}

export enum Training {
  UNUSABLE = "unusable",
  UNTRAINED = "untrained",
  TRAINED = "trained",
  SPECIALIZED = "specialized",
}

export enum THEME {
  LIGHT = "light",
  DARK = "dark",
}
