import { IngredientProperty } from "../../types";

export type QualityType =
  | "light"
  | "sharp"
  | "cool"
  | "smooth"
  | "rough"
  | "dense"
  | "sticky"
  // | "oily"
  | "creamy"
  | "snappy"
  | "crunchy"
  | "airy"
  | "chewy"
  | "juicy"
  | "jelly-like"
  | "spongy"
  | "delicate"
  // | "viscous"
  | "tender"
  | "fibrous"
  | "plump"
  // | "liquid"
  // | "semi-solid"
  | "rich"
  | "lean";

export interface Quality extends IngredientProperty {
  id: QualityType;
}
