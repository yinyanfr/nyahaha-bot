interface CardInfo {
  id: number;
  chara_id: number;
  attribute: number;
  has_spread: boolean;
  pose: number;
  title: any;
  name_only: string;
  hp_min: number;
  hp_max: number;
  vocal_min: number;
  vocal_max: number;
  visual_min: number;
  visual_max: number;
  dance_min: number;
  dance_max: number;
  bonus_hp: number;
  bonus_dance: number;
  bonus_vocal: number;
  bonus_visual: number;
  evolution_id: number;
  rarity_dep: RarityDep;
  conventional: string;
  chara: Chara;
  ref: string;
}

interface RarityDep {
  rarity: number;
  base_max_level: number;
  add_max_level: number;
  max_love: number;
  base_give_money: number;
  base_give_exp: number;
  add_param: number;
  max_star_rank: number;
}

interface Chara {
  ref: string;
}

interface CardDetail {
  id: number;
  name: string;
  chara_id: number;
  rarity: Rarity;
  attribute: string;
  title_flag: number;
  evolution_id: number;
  series_id: number;
  pose: number;
  place: number;
  evolution_type: number;
  album_id: number;
  open_story_id: number;
  open_dress_id: number;
  skill_id: number;
  leader_skill_id: number;
  grow_type: number;
  hp_min: number;
  vocal_min: number;
  dance_min: number;
  visual_min: number;
  hp_max: number;
  vocal_max: number;
  dance_max: number;
  visual_max: number;
  bonus_hp: number;
  bonus_vocal: number;
  bonus_dance: number;
  bonus_visual: number;
  solo_live: number;
  star_lesson_type: number;
  disp_order: number;
  voice_flag: number;
  chara: Chara;
  has_spread: boolean;
  has_sign: boolean;
  name_only: string;
  title: string;
  skill: Skill;
  lead_skill: LeadSkill;
  overall_min: number;
  overall_max: number;
  overall_bonus: number;
  valist: any[];
  best_stat: number;
  sign_image_ref: string;
  spread_image_ref: string;
  card_image_ref: string;
  sprite_image_ref: string;
  icon_image_ref: string;
}

interface Rarity {
  rarity: number;
  base_max_level: number;
  add_max_level: number;
  max_love: number;
  base_give_money: number;
  base_give_exp: number;
  add_param: number;
  max_star_rank: number;
}

interface Chara {
  chara_id: number;
  name: string;
  name_kana: string;
  age: number;
  home_town: number;
  height: number;
  weight: number;
  body_size_1: number;
  body_size_2: number;
  body_size_3: number;
  birth_month: number;
  birth_day: number;
  constellation: number;
  blood_type: number;
  hand: number;
  favorite: string;
  voice: string;
  model_height_id: number;
  model_weight_id: number;
  model_bust_id: number;
  model_skin_id: number;
  spine_size: number;
  personality: number;
  type: string;
  base_card_id: number;
  bus_vo_value: number;
  bus_da_value: number;
  bus_vi_value: number;
  special_type: number;
  kanji_spaced: string;
  kana_spaced: string;
  conventional: string;
  valist: any[];
  icon_image_ref: string;
}

interface Skill {
  id: number;
  skill_name: string;
  explain: string;
  skill_type: string;
  judge_type: number;
  skill_trigger_type: number;
  skill_trigger_value: number;
  cutin_type: number;
  condition: number;
  value: number;
  value_2: number;
  value_3: number;
  max_chance: number;
  max_duration: number;
  explain_en: string;
  skill_type_id: number;
  effect_length: number[];
  proc_chance: number[];
}

interface LeadSkill {
  id: number;
  name: string;
  explain: string;
  type: number;
  need_cute: number;
  need_cool: number;
  need_passion: number;
  target_attribute: string;
  target_param: string;
  up_type: number;
  up_value: number;
  special_id: number;
  need_chara: string;
  target_attribute_2: string;
  target_param_2: string;
  up_type_2: number;
  up_value_2: number;
  need_skill_variation: number;
  param_limit: number;
  or_more_need_cute: number;
  or_more_need_cool: number;
  or_more_need_passion: number;
  explain_en: string;
}
