import { useState, useCallback } from "react";
import clsx from "clsx";
import type { Ingredient } from "../IngredientsPage/types";
import type { SpeciesCountConfig } from "./types";
import { formatIngredientIdForDisplay } from "../../util/functions";
import IngredientImg from "../IngredientsPage/Image";

interface SpeciesCountModalProps {
  ingredients: Ingredient[];
  speciesCountConfig: SpeciesCountConfig;
  onSpeciesCountConfigChange: (config: SpeciesCountConfig) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

/**
 * Modal for configuring species instance counts.
 * Allows users to specify how many of each species to include
 * (e.g., 5 mango trees, 3 cows).
 */
export default function SpeciesCountModal({
  ingredients,
  speciesCountConfig,
  onSpeciesCountConfigChange,
  onClose,
  isDarkMode,
}: SpeciesCountModalProps) {
  // Local state for editing, committed on save
  const [localConfig, setLocalConfig] = useState<SpeciesCountConfig>({
    ...speciesCountConfig,
  });

  const handleCountChange = useCallback(
    (ingredientId: string, count: number) => {
      setLocalConfig((prev) => {
        const newConfig = { ...prev };
        if (count <= 1) {
          // 1 is the default, so remove from config
          delete newConfig[ingredientId];
        } else {
          newConfig[ingredientId] = Math.min(count, 20); // Cap at 20 instances
        }
        return newConfig;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    onSpeciesCountConfigChange(localConfig);
    onClose();
  }, [localConfig, onSpeciesCountConfigChange, onClose]);

  const handleResetAll = useCallback(() => {
    setLocalConfig({});
  }, []);

  // Check if any counts are configured (> 1)
  const hasCustomCounts = Object.keys(localConfig).length > 0;

  // Calculate total living species instances
  const totalInstances = ingredients.reduce((sum, ingredient) => {
    return sum + (localConfig[ingredient.id] ?? 1);
  }, 0);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isDarkMode ? "bg-blue-900/50" : "bg-blue-100",
              )}
            >
              <i className="fa-solid fa-hashtag text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Species Count
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-400">
                Set how many of each species to include
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
          >
            <i className="fa-solid fa-xmark text-neutral-500" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ingredients.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <i className="fa-solid fa-seedling text-3xl mb-3 opacity-50" />
            <p>Add species to your forest to configure counts</p>
          </div>
        ) : (
          ingredients.map((ingredient) => {
            const currentCount = localConfig[ingredient.id] ?? 1;

            return (
              <div
                key={ingredient.id}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                  currentCount > 1
                    ? isDarkMode
                      ? "bg-blue-900/20 border-blue-700/50"
                      : "bg-blue-50 border-blue-200"
                    : isDarkMode
                      ? "bg-neutral-800/50 border-neutral-700"
                      : "bg-white border-neutral-200",
                )}
              >
                {/* Ingredient info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <IngredientImg
                    ingredient={ingredient}
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate text-lg">
                      {formatIngredientIdForDisplay(ingredient.id)}
                    </p>
                    {currentCount > 1 && (
                      <p className="text-base text-blue-600 dark:text-blue-400">
                        {currentCount} instances in your forest
                      </p>
                    )}
                  </div>
                </div>

                {/* Count controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleCountChange(ingredient.id, currentCount - 1)
                    }
                    disabled={currentCount <= 1}
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      currentCount <= 1
                        ? "opacity-30 cursor-not-allowed"
                        : isDarkMode
                          ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                          : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700",
                    )}
                  >
                    <i className="fa-solid fa-minus text-base" />
                  </button>

                  <div
                    className={clsx(
                      "w-12 h-8 rounded-lg flex items-center justify-center text-base font-medium text-xl",
                      isDarkMode ? "bg-neutral-700" : "bg-neutral-100",
                    )}
                  >
                    {currentCount}
                  </div>

                  <button
                    onClick={() =>
                      handleCountChange(ingredient.id, currentCount + 1)
                    }
                    disabled={currentCount >= 20}
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      currentCount >= 20
                        ? "opacity-30 cursor-not-allowed"
                        : isDarkMode
                          ? "bg-neutral-700 hover:bg-neutral-600 text-neutral-300"
                          : "bg-neutral-200 hover:bg-neutral-300 text-neutral-700",
                    )}
                  >
                    <i className="fa-solid fa-plus text-base" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="text-lg text-neutral-500 dark:text-neutral-400">
            <span className="font-medium text-blue-600 dark:text-blue-400 text-xl">
              {totalInstances}
            </span>{" "}
            total instance{totalInstances !== 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            {hasCustomCounts && (
              <button
                onClick={handleResetAll}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-base font-medium transition-colors",
                  isDarkMode
                    ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    : "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100",
                )}
              >
                Reset All
              </button>
            )}
            <button
              onClick={onClose}
              className={clsx(
                "px-4 py-2 rounded-lg text-base font-medium border transition-colors",
                isDarkMode
                  ? "border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                  : "border-neutral-300 text-neutral-700 hover:bg-neutral-100",
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className={clsx(
                "px-4 py-2 rounded-lg text-base font-medium transition-colors",
                "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
