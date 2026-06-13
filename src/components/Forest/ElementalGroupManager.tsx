import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import type {
  ElementalDimension,
  DimensionGrouping,
  ElementalGroup,
} from "./types";
import { SHARED_GROUP_ID } from "./types";
import { formatIngredientIdForDisplay } from "../../util/functions";

/**
 * ELEMENTAL GROUP MANAGER
 *
 * A component for managing elemental groups within a single dimension (e.g., soil).
 * Allows users to create named groups, assign ingredients to groups, and configure
 * which ingredients share environmental contexts.
 *
 * KEY CONCEPTS:
 * - Groups represent distinct environmental groups (beds, containers, etc.)
 * - Ingredients in the SAME group interact normally (compete/cooperate)
 * - Ingredients in DIFFERENT groups have no interaction (score = 1.0)
 * - Unassigned ingredients share an implicit "default" group
 *
 * USAGE:
 * This component is typically rendered inside a modal, opened from the StructuresPanel
 * when the user wants to configure soil groups (or future: light pockets, etc.).
 */

interface AvailableIngredient {
  id: string;
  label: string;
}

interface ElementalGroupManagerProps {
  /** Which elemental dimension this manager controls */
  dimension: ElementalDimension;
  /** Human-readable label for the dimension (e.g., "Soil Groups") */
  dimensionLabel: string;
  /** FontAwesome icon class for the dimension (e.g., "fa-mountain") */
  dimensionIcon: string;
  /** Current grouping configuration */
  grouping: DimensionGrouping;
  /** Callback when grouping changes */
  onGroupingChange: (grouping: DimensionGrouping) => void;
  /** List of all ingredients available to assign to groups */
  availableIngredients: AvailableIngredient[];
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Callback to close the manager */
  onClose?: () => void;
}

/**
 * Generates a unique ID for a new group.
 */
function generateGroupId(): string {
  return `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}

export default function ElementalGroupManager({
  dimension,
  dimensionLabel,
  dimensionIcon,
  grouping,
  onGroupingChange,
  availableIngredients,
  isDarkMode,
  onClose,
}: ElementalGroupManagerProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >(null);

  // Get the shared group (exists when grouping is enabled)
  const sharedGroup = useMemo(() => {
    return grouping.groups.find((g) => g.id === SHARED_GROUP_ID);
  }, [grouping.groups]);

  // Get custom groups (all non-shared groups)
  const customGroups = useMemo(() => {
    return grouping.groups.filter((g) => g.id !== SHARED_GROUP_ID);
  }, [grouping.groups]);

  // Get all groups an ingredient belongs to
  const getIngredientGroupIds = useCallback(
    (ingredientId: string): string[] => {
      return grouping.groups
        .filter((g) => g.ingredientIds.includes(ingredientId))
        .map((g) => g.id);
    },
    [grouping.groups],
  );

  // Check if ingredient is in a specific group
  const isIngredientInGroup = useCallback(
    (ingredientId: string, groupId: string): boolean => {
      const group = grouping.groups.find((g) => g.id === groupId);
      return group?.ingredientIds.includes(ingredientId) ?? false;
    },
    [grouping.groups],
  );

  // Toggle grouping enabled/disabled
  // When enabling, create the Shared Ground group with all ingredients
  const handleToggleEnabled = useCallback(() => {
    if (!grouping.enabled) {
      // Enabling: create Shared Ground with all ingredients
      const sharedGroup: ElementalGroup = {
        id: SHARED_GROUP_ID,
        label: "Default Group",
        ingredientIds: availableIngredients.map((ing) => ing.id),
      };
      onGroupingChange({
        ...grouping,
        enabled: true,
        groups: [
          sharedGroup,
          ...grouping.groups.filter((g) => g.id !== SHARED_GROUP_ID),
        ],
      });
    } else {
      // Disabling: keep configuration but turn off
      // Explicitly construct the new object to avoid any closure issues
      const disabledGrouping: DimensionGrouping = {
        enabled: false,
        groups: grouping.groups,
        defaultGroupId: grouping.defaultGroupId,
      };
      onGroupingChange(disabledGrouping);
    }
  }, [grouping, onGroupingChange, availableIngredients]);

  // Create a new group
  const handleCreateGroup = useCallback(() => {
    if (!newGroupName.trim()) return;

    const newGroup: ElementalGroup = {
      id: generateGroupId(),
      label: newGroupName.trim(),
      ingredientIds: [],
    };

    onGroupingChange({
      ...grouping,
      enabled: true, // Auto-enable when creating first group
      groups: [...grouping.groups, newGroup],
    });

    setNewGroupName("");
    setIsCreatingGroup(false);
  }, [newGroupName, grouping, onGroupingChange]);

  // Delete a group (only custom groups can be deleted, not Shared Ground)
  const handleDeleteGroup = useCallback(
    (groupId: string) => {
      if (groupId === SHARED_GROUP_ID) return; // Can't delete shared group
      onGroupingChange({
        ...grouping,
        groups: grouping.groups.filter((g) => g.id !== groupId),
      });
    },
    [grouping, onGroupingChange],
  );

  // Toggle an ingredient's membership in a group (add if not in, remove if in)
  // This supports multi-group assignment - ingredients can belong to multiple groups
  const handleToggleIngredientInGroup = useCallback(
    (ingredientId: string, targetGroupId: string) => {
      // Find the target group
      const targetGroup = grouping.groups.find((g) => g.id === targetGroupId);
      if (!targetGroup) return;

      const isCurrentlyInGroup =
        targetGroup.ingredientIds.includes(ingredientId);

      const updatedGroups = grouping.groups.map((group) => {
        if (group.id !== targetGroupId) return group;

        if (isCurrentlyInGroup) {
          // Remove from this group
          return {
            ...group,
            ingredientIds: group.ingredientIds.filter(
              (id) => id !== ingredientId,
            ),
          };
        } else {
          // Add to this group
          return {
            ...group,
            ingredientIds: [...group.ingredientIds, ingredientId],
          };
        }
      });

      onGroupingChange({
        ...grouping,
        groups: updatedGroups,
      });

      setSelectedIngredientId(null);
    },
    [grouping, onGroupingChange],
  );

  // Render an ingredient chip that can be clicked to select for assignment
  const renderIngredientChip = (
    ingredient: AvailableIngredient,
    currentGroupId: string,
  ) => {
    const isSelected = selectedIngredientId === ingredient.id;
    const memberGroups = getIngredientGroupIds(ingredient.id);
    const isInMultipleGroups = memberGroups.length > 1;
    const isInThisGroup = memberGroups.includes(currentGroupId);

    // Get other groups this ingredient is in (for tooltip)
    const otherGroups = memberGroups
      .filter((g) => g !== currentGroupId)
      .map((gId) => grouping.groups.find((gr) => gr.id === gId)?.label)
      .filter(Boolean);

    return (
      <button
        key={ingredient.id}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedIngredientId(isSelected ? null : ingredient.id);
        }}
        className={clsx(
          "px-2 py-1 text-base rounded-md transition-all",
          "border flex items-center gap-1.5",
          isSelected
            ? "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400/50"
            : isDarkMode
              ? "bg-neutral-700 border-neutral-600 text-neutral-200 hover:bg-neutral-600"
              : "bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50",
        )}
      >
        {ingredient.label}
        {/* Show indicator if ingredient is in multiple groups */}
        {isInMultipleGroups && isInThisGroup && (
          <span
            className={clsx(
              "text-[9px] px-1 rounded",
              isDarkMode
                ? "bg-amber-900/50 text-amber-300"
                : "bg-amber-100 text-amber-700",
            )}
            title={`Also in: ${otherGroups.join(", ")}`}
          >
            +{memberGroups.length - 1}
          </span>
        )}
      </button>
    );
  };

  // Render a group card (works for both Shared Ground and custom groups)
  const renderGroupCard = (group: ElementalGroup) => {
    const groupId = group.id;
    const isShared = groupId === SHARED_GROUP_ID;
    const ingredients = availableIngredients.filter((ing) =>
      group.ingredientIds.includes(ing.id),
    );

    // Determine if the selected ingredient can be added/removed from this group
    const selectedIsInThisGroup = selectedIngredientId
      ? isIngredientInGroup(selectedIngredientId, groupId)
      : false;
    const canToggle = selectedIngredientId !== null;
    const actionLabel = selectedIsInThisGroup
      ? "Remove from group"
      : "Add to group";

    return (
      <div
        key={groupId}
        className={clsx(
          "rounded-lg border p-3 transition-all",
          canToggle
            ? selectedIsInThisGroup
              ? "border-red-400 dark:border-red-600 bg-red-50/50 dark:bg-red-900/20 cursor-pointer"
              : "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 cursor-pointer"
            : isDarkMode
              ? "border-neutral-700 bg-neutral-800/50"
              : "border-neutral-200 bg-white",
          isShared && "border-l-4 border-l-blue-400 dark:border-l-blue-500",
        )}
        onClick={() => {
          if (canToggle && selectedIngredientId) {
            handleToggleIngredientInGroup(selectedIngredientId, groupId);
          }
        }}
      >
        {/* Group header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <i
              className={clsx(
                "fa-solid text-base",
                isShared
                  ? "fa-globe text-blue-500"
                  : `${dimensionIcon} text-amber-500`,
              )}
            />
            <span
              className={clsx(
                "text-lg font-medium",
                isDarkMode ? "text-neutral-200" : "text-neutral-700",
              )}
            >
              {group.label}
            </span>
          </div>
          {/* Only custom groups can be deleted */}
          {!isShared && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
              className="text-neutral-400 hover:text-red-500 transition-colors"
              title="Delete group"
            >
              <i className="fa-solid fa-trash-can text-base" />
            </button>
          )}
        </div>

        {/* Ingredients in this group */}
        <div className="flex flex-wrap gap-1.5 min-h-[28px]">
          {ingredients.length > 0 ? (
            ingredients.map((ing) => renderIngredientChip(ing, groupId))
          ) : (
            <span
              className={clsx(
                "text-base italic",
                isDarkMode ? "text-neutral-500" : "text-neutral-400",
              )}
            >
              {canToggle
                ? `Click to ${actionLabel.toLowerCase()}`
                : isShared
                  ? "Remove plants from here to exclude from main soil"
                  : "No ingredients"}
            </span>
          )}
        </div>

        {/* Action hint when selecting */}
        {canToggle && (
          <div
            className={clsx(
              "mt-2 text-base flex items-center gap-1",
              selectedIsInThisGroup
                ? "text-red-600 dark:text-red-400"
                : "text-emerald-600 dark:text-emerald-400",
            )}
          >
            <i
              className={clsx(
                "fa-solid",
                selectedIsInThisGroup ? "fa-minus" : "fa-plus",
              )}
            />
            <span>Click to {actionLabel.toLowerCase()}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className={clsx(
          "flex items-center justify-between px-4 py-3 border-b",
          isDarkMode ? "border-neutral-700" : "border-neutral-200",
        )}
      >
        <div className="flex items-center gap-3">
          <i
            className={clsx(
              "fa-solid",
              dimensionIcon,
              "text-xl text-amber-500",
            )}
          />
          <div>
            <h2
              className={clsx(
                "font-semibold text-xl",
                isDarkMode ? "text-neutral-100" : "text-neutral-800",
              )}
            >
              {dimensionLabel}
            </h2>
            <p
              className={clsx(
                "text-base",
                isDarkMode ? "text-neutral-400" : "text-neutral-500",
              )}
            >
              Species in different groups generally do not compete.
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className={clsx(
              "p-1.5 rounded-md transition-colors",
              isDarkMode
                ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                : "text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100",
            )}
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        )}
      </div>

      {/* Enable toggle */}
      <div
        className={clsx(
          "px-4 py-3 border-b flex items-center justify-between",
          isDarkMode ? "border-neutral-700" : "border-neutral-200",
        )}
      >
        <div>
          <span
            className={clsx(
              "text-lg font-medium",
              isDarkMode ? "text-neutral-200" : "text-neutral-700",
            )}
          >
            {grouping.enabled ? "Disable" : "Enable"} {dimension} grouping
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleEnabled();
          }}
          className={clsx(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            grouping.enabled
              ? "bg-emerald-500"
              : isDarkMode
                ? "bg-neutral-600"
                : "bg-neutral-300",
          )}
        >
          <span
            className={clsx(
              "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
              grouping.enabled ? "translate-x-6" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {/* Content - only show when enabled */}
      <AnimatePresence>
        {grouping.enabled && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-hidden"
          >
            <div className="p-4 space-y-3 overflow-y-auto max-h-[400px]">
              {/* Instructions */}
              {selectedIngredientId && (
                <div
                  className={clsx(
                    "text-base p-2 rounded-md flex items-center gap-2",
                    isDarkMode
                      ? "bg-amber-900/30 text-amber-300"
                      : "bg-amber-50 text-amber-700",
                  )}
                >
                  <i className="fa-solid fa-hand-pointer" />
                  <span>
                    Click groups to add/remove{" "}
                    <strong>
                      {formatIngredientIdForDisplay(selectedIngredientId)}
                    </strong>{" "}
                    (can be in multiple groups)
                  </span>
                  <button
                    onClick={() => setSelectedIngredientId(null)}
                    className="ml-auto text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    Done
                  </button>
                </div>
              )}

              {/* Shared Ground group (always first when it exists) */}
              {sharedGroup && renderGroupCard(sharedGroup)}

              {/* Custom groups */}
              {customGroups.map((group) => renderGroupCard(group))}

              {/* Create new group */}
              {isCreatingGroup ? (
                <div
                  className={clsx(
                    "rounded-lg border p-3",
                    isDarkMode
                      ? "border-neutral-700 bg-neutral-800/50"
                      : "border-neutral-200 bg-white",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Group name (e.g., Raised Bed 1)"
                      className={clsx(
                        "flex-1 px-2 py-1.5 text-lg rounded-md border",
                        isDarkMode
                          ? "bg-neutral-700 border-neutral-600 text-neutral-100 placeholder:text-neutral-500"
                          : "bg-white border-neutral-300 text-neutral-800 placeholder:text-neutral-400",
                      )}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateGroup();
                        if (e.key === "Escape") {
                          setIsCreatingGroup(false);
                          setNewGroupName("");
                        }
                      }}
                    />
                    <button
                      onClick={handleCreateGroup}
                      disabled={!newGroupName.trim()}
                      className={clsx(
                        "px-3 py-1.5 text-lg rounded-md transition-colors",
                        newGroupName.trim()
                          ? "bg-emerald-500 text-white hover:bg-emerald-600"
                          : isDarkMode
                            ? "bg-neutral-700 text-neutral-500"
                            : "bg-neutral-200 text-neutral-400",
                      )}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingGroup(false);
                        setNewGroupName("");
                      }}
                      className={clsx(
                        "px-2 py-1.5 text-lg rounded-md transition-colors",
                        isDarkMode
                          ? "text-neutral-400 hover:text-neutral-200"
                          : "text-neutral-500 hover:text-neutral-700",
                      )}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsCreatingGroup(true)}
                  className={clsx(
                    "w-full py-2 px-3 rounded-lg border-2 border-dashed transition-colors",
                    "flex items-center justify-center gap-2 text-lg",
                    isDarkMode
                      ? "border-neutral-700 text-neutral-400 hover:border-emerald-600 hover:text-emerald-400"
                      : "border-neutral-300 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600",
                  )}
                >
                  <i className="fa-solid fa-plus" />
                  <span>Add Group</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <div
        className={clsx(
          "px-4 py-3 border-t text-base",
          isDarkMode
            ? "border-neutral-700 text-neutral-500"
            : "border-neutral-200 text-neutral-400",
        )}
      >
        <i className="fa-solid fa-circle-info mr-1.5" />
        Plants can compete if they share <em>any</em> group.
      </div>
    </div>
  );
}
