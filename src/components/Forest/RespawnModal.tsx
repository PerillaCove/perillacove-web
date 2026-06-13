import { useState, useCallback } from "react";
import clsx from "clsx";
import type { Ingredient } from "../IngredientsPage/types";
import type { RespawnConfig } from "./types";
import { formatIngredientIdForDisplay } from "../../util/functions";
import { getSuccessionProfile, inferSuccessionFromGrowth } from "./util";
import IngredientImg from "../IngredientsPage/Image";

interface RespawnModalProps {
  ingredients: Ingredient[];
  respawnConfig: RespawnConfig;
  onRespawnConfigChange: (config: RespawnConfig) => void;
  onClose: () => void;
  isDarkMode: boolean;
}

/**
 * Modal for configuring repeated lifecycles per species.
 * Every species uses the same deterministic repeat-cycle math.
 */
export default function RespawnModal({
  ingredients,
  respawnConfig,
  onRespawnConfigChange,
  onClose,
  isDarkMode,
}: RespawnModalProps) {
  // Local state for editing, committed on save
  const [localConfig, setLocalConfig] = useState<RespawnConfig>({
    ...respawnConfig,
  });

  const handleCountChange = useCallback(
    (ingredientId: string, count: number) => {
      setLocalConfig((prev) => {
        const newConfig = { ...prev };
        if (count <= 0) {
          delete newConfig[ingredientId];
        } else {
          newConfig[ingredientId] = Math.min(count, 20); // Cap at 20 cycles
        }
        return newConfig;
      });
    },
    [],
  );

  const handleSave = useCallback(() => {
    onRespawnConfigChange(localConfig);
    onClose();
  }, [localConfig, onRespawnConfigChange, onClose]);

  const handleClearAll = useCallback(() => {
    setLocalConfig({});
  }, []);

  // Get lifecycle info for each ingredient
  const getLifecycleInfo = (ingredient: Ingredient) => {
    let succession = getSuccessionProfile(ingredient);
    if (!succession && ingredient.properties.growth) {
      succession = inferSuccessionFromGrowth(ingredient.properties.growth);
    }
    if (!succession) return null;

    const plantYear = succession.recommendedPlantYearFromStart[0];
    const maturityYears = succession.yearsToFirstHarvest[0];
    const productiveYears = succession.productiveLifespanYears[0];
    const lifecycleDuration = maturityYears + productiveYears;

    return {
      plantYear,
      maturityYears,
      productiveYears,
      lifecycleDuration,
    };
  };

  // Check if any repeat cycles are configured
  const hasRespawns = Object.keys(localConfig).length > 0;
  const totalRespawns = Object.values(localConfig).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col h-full max-h-[70vh]">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                isDarkMode ? "bg-emerald-900/50" : "bg-emerald-100",
              )}
            >
              <i className="fa-solid fa-rotate text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Respawn Cycles
              </h2>
              <p className="text-base text-neutral-500 dark:text-neutral-400">
                Set how many times each species repeats
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
            <i className="fa-solid fa-rotate text-3xl mb-3 opacity-50" />
            <p>Add species to your forest to configure respawns</p>
          </div>
        ) : (
          ingredients.map((ingredient) => {
            const lifecycleInfo = getLifecycleInfo(ingredient);
            const currentCount = localConfig[ingredient.id] ?? 0;

            return (
              <div
                key={ingredient.id}
                className={clsx(
                  "flex items-center gap-4 p-3 rounded-lg border transition-colors",
                  currentCount > 0
                    ? isDarkMode
                      ? "bg-emerald-900/20 border-emerald-700/50"
                      : "bg-emerald-50 border-emerald-200"
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
                    {lifecycleInfo && (
                      <p className="text-base text-neutral-500 dark:text-neutral-400">
                        {lifecycleInfo.lifecycleDuration.toFixed(1)} year cycle
                        {currentCount > 0 && (
                          <span className="text-emerald-600 dark:text-emerald-400 ml-1">
                            (
                            {(
                              (currentCount + 1) *
                              lifecycleInfo.lifecycleDuration
                            ).toFixed(1)}{" "}
                            years total)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Respawn count controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleCountChange(ingredient.id, currentCount - 1)
                    }
                    disabled={currentCount <= 0}
                    className={clsx(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      currentCount <= 0
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
                      "w-12 h-8 rounded-lg flex items-center justify-center text-xl font-medium",
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
            {hasRespawns ? (
              <span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400 text-xl">
                  {totalRespawns}
                </span>{" "}
                respawn{totalRespawns !== 1 ? "s" : ""} configured
              </span>
            ) : (
              <span>No respawns configured</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasRespawns && (
              <button
                onClick={handleClearAll}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-base font-medium transition-colors",
                  isDarkMode
                    ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700"
                    : "text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100",
                )}
              >
                Clear All
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
                "bg-emerald-600 text-white hover:bg-emerald-700",
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
