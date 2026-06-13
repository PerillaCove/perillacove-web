import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { IngredientPropertyProfilesMeta } from "./components/IngredientsPage/PropertyProfiles";

import { Ingredient } from "./components/IngredientsPage/types";

import type { ElementalGroupContext } from "./components/Forest/types";
import type { IntegrationProfileDisplayContext } from "./components/Forest/substrate/profiles/display";
import { createEmptyDimensionGrouping } from "./components/Forest/types";
import {
  QUIZ_STORAGE_KEY,
  createEmptyQuizSession,
  normalizeQuizSession,
  type QuizSession,
} from "./components/IntegrationQuiz/storage";

// Global state for the IngredientQualities modal
export interface FocusedIngredientState {
  ingredient: Ingredient;
  showComboButton?: boolean;
  ingredientsInPlay?: Ingredient[];
  storyText?: string;
  storyLabel?: string;
  integrationProfileContext?: IntegrationProfileDisplayContext;
}
export const FocusedIngredientAtom = atom<FocusedIngredientState | null>(null);

export const DarkModeAtom = atomWithStorage<boolean | null>(
  "DarkModeAtom",
  true,
);

export const HelpModalVisibleAtom = atom(false);
export const ModalVisibleAtom = atom(false);
export const IsMenuOpenAtom = atomWithStorage("IsMenuOpenAtom", false);
export const IngredientProfilesVisibleMetaAtom =
  atom<IngredientPropertyProfilesMeta | null>(null);
export const IsSacredScrollOpenAtom = atom<boolean>(false);

// =============================================================================
// FOREST / FOOD FOREST STATE
// =============================================================================

/**
 * Persisted elemental grouping context for the food forest.
 * Stores soil groups (and future: light pockets, humidity zones, etc.)
 * so users don't lose their grouping configuration on refresh.
 */
export const ElementalGroupingAtom = atomWithStorage<ElementalGroupContext>(
  "ElementalGroupingAtom",
  {
    soil: createEmptyDimensionGrouping(),
  },
);

const integrationQuizStorage = {
  getItem: (key: string, initialValue: QuizSession): QuizSession => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const serialized = window.localStorage.getItem(key);
      if (!serialized) {
        return initialValue;
      }

      return normalizeQuizSession(JSON.parse(serialized));
    } catch {
      return initialValue;
    }
  },
  setItem: (key: string, value: QuizSession): void => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(key);
  },
};

export const IntegrationQuizSessionAtom = atomWithStorage<QuizSession>(
  QUIZ_STORAGE_KEY,
  createEmptyQuizSession(),
  integrationQuizStorage,
  { getOnInit: true },
);
