import { IngredientProperty } from "../types";

export type TasteType =
  | "sweet"
  | "salty"
  | "bitter"
  | "astringent"
  | "sour"
  | "pungent"
  | "savory"
  | "earthy"
  | "nutty"
  | "tangy"
  | "zesty"
  | "floral"
  | "menthol"
  | "grassy"
  | "malty"
  | "milky"
  | "smoky"
  | "briny"
  | "anise"
  | "fruity"
  | "woody"
  | "peppery"
  | "gamey"
  | "beefy"
  | "citrusy";

export interface Taste extends IngredientProperty {
  id: TasteType;
  treemapBgColor?: string;
}
