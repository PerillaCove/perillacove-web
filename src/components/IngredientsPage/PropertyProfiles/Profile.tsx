import IngredientCard from "../Cards/Single";
import { IngredientMap } from "../data";
import clsx from "clsx";
import { useCallback, useMemo } from "react";
import {
  Ingredient,
  IngredientProperty,
  IngredientPropertyAccessKey,
  PropertyProfilesFinalLabelMap,
  PropertyProfilesLabel,
} from "../types";
import { IngredientProfilesVisibleMetaAtom } from "../../../state";
import { useSetAtom } from "jotai";
import { useCircadianTheme } from "../../../util/hooks/general";

interface Props {
  ingredientProperty: IngredientProperty;
  showClose?: boolean;
  searchTerm?: string;
  showBorderAroundName?: boolean;
  ingredientsInPlay?: Ingredient[];
  propertyProfilesLabel: PropertyProfilesLabel;
  enforceDarkMode?: boolean;
}

export default function IngredientPropertyProfile({
  ingredientProperty,
  showClose,
  searchTerm,
  showBorderAroundName = true,
  ingredientsInPlay,
  propertyProfilesLabel,
  enforceDarkMode = false,
}: Props) {
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const setIngredientProfilesVisibleMeta = useSetAtom(
    IngredientProfilesVisibleMetaAtom,
  );
  const containerClasses = useCallback(() => {
    return clsx({
      "bg-light-gradient dark:bg-dark-gradient px-3 py-4 rounded-lg border-[1px] border-neutral-300 dark:border-neutral-500 text-neutral-900 dark:text-neutral-100": true,
      "h-full": true,
    });
  }, []);

  const highlightText = useCallback(
    (text: string) => {
      if (!searchTerm) return text;

      const parts = text.split(new RegExp(`(${searchTerm})`, "gi"));
      return parts.map((part, index) =>
        part.toLowerCase() === searchTerm?.toLowerCase() ? (
          <span
            key={index}
            className="bg-yellow-300 text-neutral-900 dark:bg-yellow-900 dark:text-neutral-100"
          >
            {part}
          </span>
        ) : (
          part
        ),
      );
    },
    [searchTerm],
  );

  const dynamicExamples = useMemo(() => {
    if (
      !["growth", "fungiGrowth", "algaeGrowth"].includes(propertyProfilesLabel)
    ) {
      const propertyLabel = PropertyProfilesFinalLabelMap[propertyProfilesLabel]
        .accessKey as IngredientPropertyAccessKey;
      const profileLabel =
        propertyLabel === "tastes"
          ? "tasteProfile"
          : propertyLabel === "qualities"
            ? "qualityProfile"
            : undefined;
      const token = ingredientProperty.id;
      const matchesProperty = (ingredient: Ingredient) => {
        const legacyMatch = ingredient.properties[propertyLabel]?.includes(
          token as never,
        );
        const profileMatch = profileLabel
          ? ingredient.properties[profileLabel]?.some(
              (signal) => signal.id === token,
            )
          : false;
        return Boolean(legacyMatch || profileMatch);
      };
      const signalIndex = (ingredient: Ingredient) => {
        const legacyIndex =
          ingredient.properties[propertyLabel]?.findIndex(
            (id) => id === token,
          ) ?? -1;
        const profileIndex = profileLabel
          ? (ingredient.properties[profileLabel]?.findIndex(
              (signal) => signal.id === token,
            ) ?? -1)
          : -1;
        const indexes = [legacyIndex, profileIndex].filter(
          (index) => index >= 0,
        );
        return indexes.length > 0
          ? Math.min(...indexes)
          : Number.POSITIVE_INFINITY;
      };
      return (
        ingredientsInPlay
          ?.filter((e) => matchesProperty(e))
          ?.sort((a, b) => {
            const aIndex = signalIndex(a);
            const bIndex = signalIndex(b);
            if (aIndex === 0 && bIndex !== 0) {
              return -1;
            }
            if (bIndex === 0 && aIndex !== 0) {
              return 1;
            }
            return 0;
          }) ?? []
      );
    }

    const token = ingredientProperty.id as unknown as string;
    if (propertyProfilesLabel === "growth") {
      const matchesPlant = (ing: Ingredient, t: string) => {
        const g = ing.properties.growth;
        return (
          !!g &&
          ((g.growthForms?.includes(t as never) ||
            g.lightPreferences?.includes(t as never) ||
            g.lifeCycles?.includes(t as never) ||
            g.heightClasses?.includes(t as never) ||
            g.frostTolerances?.includes(t as never) ||
            g.soilPreferences?.includes(t as never)) ??
            false)
        );
      };
      return ingredientsInPlay?.filter((e) => matchesPlant(e, token)) ?? [];
    }
    if (propertyProfilesLabel === "fungiGrowth") {
      const matchesFungi = (ing: Ingredient, t: string) => {
        const f = ing.properties.fungiGrowth;
        return (
          !!f &&
          ((f.substrateDepths?.includes(t as never) ||
            f.lightPreferences?.includes(t as never) ||
            f.lifeCycles?.includes(t as never) ||
            f.growthForms?.includes(t as never) ||
            f.temperatureTolerances?.includes(t as never) ||
            f.soilPreferences?.includes(t as never)) ??
            false)
        );
      };
      return ingredientsInPlay?.filter((e) => matchesFungi(e, token)) ?? [];
    }
    // algaeGrowth
    const matchesAlgae = (ing: Ingredient, t: string) => {
      const a = ing.properties.algaeGrowth;
      return (
        !!a &&
        ((a.habitats?.includes(t as never) ||
          a.lightPreferences?.includes(t as never) ||
          a.substrates?.includes(t as never) ||
          a.temperatureTolerances?.includes(t as never) ||
          a.soilPreferences?.includes(t as never) ||
          a.lifeCycles?.includes(t as never)) ??
          false)
      );
    };
    return ingredientsInPlay?.filter((e) => matchesAlgae(e, token)) ?? [];
  }, [ingredientsInPlay, ingredientProperty.id, propertyProfilesLabel]);

  const examples = useMemo(() => {
    const staticExamples = ingredientProperty.examples
      ?.map((e) => {
        const fullIngredient = IngredientMap[e];
        if (!fullIngredient) console.log("no full ingredient", e);
        return fullIngredient;
      })
      .filter((e) => !dynamicExamples.map((d) => d.id).includes(e.id));

    return [...(dynamicExamples ?? []), ...(staticExamples ?? [])];
  }, [ingredientProperty.examples, dynamicExamples]);

  const sectionClasses = useMemo(() => {
    return clsx({
      "flex flex-col p-2 gap-2 relative": true,
    });
  }, []);

  return (
    <div className={containerClasses()}>
      <div className="flex flex-col lg:gap-4 gap-3">
        <div className={sectionClasses}>
          <div className="flex items-center justify-between mb-2">
            <div
              className={`text-2xl px-2 py-0.5 ${showBorderAroundName ?? "border-[0.5px] border-neutral-300 dark:border-0"} rounded-lg ${ingredientProperty.bgThemeClasses} text-black font-semibold w-fit`}
            >
              {ingredientProperty.name}
            </div>

            {dynamicExamples.length > 0 && (
              <div className="flex items-center justify-start gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                <i
                  className={`fa-regular fa-circles-overlap text-2xl ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
                />
                <span>=</span>
                <span>Part of this Design</span>
              </div>
            )}

            {showClose && (
              <i
                onClick={() => {
                  setIngredientProfilesVisibleMeta(null);
                }}
                className="fa-solid fa-xmark text-2xl cursor-pointer relative top-[-10px] p-3 lg:right-[-10px] right-[-5px]"
              />
            )}
          </div>
          <p className={`whitespace-pre-line rounded-lg text-lg`}>
            {highlightText(ingredientProperty.description ?? "")}
          </p>
          {dynamicExamples.length > 0 && (
            <div className="absolute -top-7 -right-5 text-2xl">
              <i
                className={`fa-regular fa-circles-overlap ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
              />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between mt-3 overflow-x-auto pt-4 pr-4">
          {examples.map((e, index) => {
            return (
              <IngredientCard
                key={e.id}
                additionalClasses="mr-3 mb-3 flex-shrink-0"
                ingredient={e}
                enforceDarkMode={enforceDarkMode}
                customBgClasses={
                  index > dynamicExamples.length - 1
                    ? "bg-transparent"
                    : undefined
                }
                borderClasses={
                  index > dynamicExamples.length - 1 ? "border-0" : undefined
                }
                showPaired={index < dynamicExamples.length}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
