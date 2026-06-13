import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  lazy,
  Suspense,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import Input from "../Input";
import {
  GrowableIngredients,
  IngredientMap,
} from "../IngredientsPage/data/species";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { Ingredient } from "../IngredientsPage/types";
import { SearchResult } from "../Input/types";
import {
  buildLifetimeSegments,
  applySpeciesCountToSegments,
  inferSuccessionFromGrowth,
  buildLayerPlacements,
  computeLayerDominanceByPhase,
  generateSuccessionNarrative,
  computeTimelineDuration,
  computeDurationOptions,
  getActiveSegmentsAtYear,
  type PhaseNarrative,
  type DurationOption,
} from "./util";
import type {
  RespawnConfig,
  SpeciesCountConfig,
  PositionOverrides,
} from "./types";
import type { DimensionGrouping, ElementalGroup } from "./types";
import { createEmptyDimensionGrouping, SHARED_GROUP_ID } from "./types";
import ElementalGroupManager from "./ElementalGroupManager";
import { NarrativeSection } from "./NarrativeSection";
import clsx from "clsx";
import IngredientImg from "../IngredientsPage/Image";
import { useCircadianTheme, useIsWidescreen } from "../../util/hooks/general";
import { createPortal } from "react-dom";
import Modal from "../Modal";
import {
  formatIngredientIdForDisplay,
  ingredientMatchesSearchTerm,
} from "../../util/functions";
import IngredientChip from "../IngredientChip";
import { useSetAtom, useAtom } from "jotai";
import { FocusedIngredientAtom, ElementalGroupingAtom } from "../../state";
import type { FocusedIngredientState } from "../../state";
import LayerMap from "./Charts/LayerMap";
import DominanceChart from "./Charts/DominanceChart";
import SampleDesignCard, {
  SAMPLE_FOREST_IDS,
  SAMPLE_FOREST_COUNTS,
  SAMPLE_DESIGNS,
} from "./SampleDesignCard";
import {
  getIntegrationStoryForTourIngredient,
  type IntegrationStoryPayload,
} from "./integrationStories";
import { TimelineGantt } from "./Charts/TimelineGantt";
import { SuccessionWavesChart } from "./Charts/SuccessionWavesChart";
import TimeCursor from "./TimeCursor";

const IngredientsPage = lazy(() => import("../IngredientsPage"));
const Forest3D = lazy(() => import("./Forest3D"));
const IntegrationCockpit = lazy(() => import("./Forest3D/IntegrationCockpit"));
const RespawnModal = lazy(() => import("./RespawnModal"));
const SpeciesCountModal = lazy(() => import("./SpeciesCountModal"));

import successionOverviewHTML from "./succession_overview.html?raw";

// Parse succession overview HTML - image goes after first paragraph
const parseSuccessionOverview = (html: string) => {
  const paragraphs = html
    .split("</p>")
    .filter((p) => p.trim())
    .map((p) => p.replace("<p>", "").trim());
  // First paragraph ends with "comes next." - image goes after this
  const beforeImage = paragraphs[0];
  // Remaining paragraphs come after the image
  const afterImage = paragraphs.slice(1);

  return { beforeImage, afterImage };
};

const successionImg =
  "https://infoimages.perillacove.com/ecological_succession.webp";

const PHASE_COLORS = [
  "#22c55e", // green - pioneers
  "#84cc16", // lime - early
  "#eab308", // yellow - mid
  "#f97316", // orange - late
  "#8b5cf6", // purple - legacy
];

const PHASE_LABELS = ["Primary", "Secondary", "Mid", "Late", "Legacy"];
const SHOW_FOREST_VIEW_TABS = false;

const ROLE_TO_INDEX: Record<string, number> = {
  pioneer: 0,
  early: 1,
  mid: 2,
  late: 3,
  legacy: 4,
};

// Shared styles for shiny gradient buttons
const getShinyButtonClasses = (isDarkMode: boolean, customBgClasses?: string) =>
  clsx(
    "relative overflow-hidden px-4 py-2 rounded-lg font-medium text-center",
    "flex items-center justify-center gap-2",
    "border shadow-lg hover:shadow-xl",
    "hover:scale-105 transition-all duration-300",
    customBgClasses,
    {
      "bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white":
        isDarkMode && !customBgClasses,
      "bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400 text-white":
        !isDarkMode && !customBgClasses,
    },
  );

const ShineEffect = () => (
  <motion.div
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full"
    animate={{
      translateX: ["100%", "100%", "-100%", "-100%"],
    }}
    transition={{
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.4, 0.6, 1],
    }}
  />
);

interface SelectedIngredientChipProps {
  ingredient: Ingredient;
  onRemove?: (id: string) => void;
  onClick: (ingredient: Ingredient) => void;
  phaseIndex: number;
  isDarkMode: boolean;
  /** Optional soil group labels to display as badges (can be multiple) */
  soilGroupLabels?: string[];
  /** Whether the species is visible in the 3D scene at the current year */
  isVisible?: boolean;
  /** When true, hide removal affordances */
  readOnly?: boolean;
  /** Tighten the chip for compact embedded/mobile forest surfaces. */
  compactMode?: boolean;
}

// Get primary role icon for process species
function getProcessRoleIcon(
  ingredient: Ingredient,
): { icon: string; color: string; tooltip: string } | null {
  const process = ingredient.properties.ecologicalProcess;
  if (!process || ingredient.type !== "process") return null;

  // Map roles to icons
  const roleIcons: Record<string, { icon: string; color: string }> = {
    fertility_nitrogen_fixer: { icon: "fa-atom", color: "#3b82f6" },
    fertility_nutrient_pump: { icon: "fa-arrows-up-down", color: "#8b5cf6" },
    biomass_engine: { icon: "fa-leaf", color: "#10b981" },
    microclimate_builder: { icon: "fa-cloud-sun", color: "#06b6d4" },
    succession_pioneer: { icon: "fa-seedling", color: "#22c55e" },
    succession_scaffold: { icon: "fa-sitemap", color: "#84cc16" },
  };

  // Build tooltip from roles
  const roleLabels: string[] = [];
  if (process.fertility.nitrogenFixation !== "none") {
    roleLabels.push("N-Fixer");
  }
  if (process.functions.includes("biomass_engine")) {
    roleLabels.push("Biomass");
  }
  if (process.functions.includes("microclimate_builder")) {
    roleLabels.push("Microclimate");
  }
  if (process.functions.includes("succession_pioneer")) {
    roleLabels.push("Pioneer");
  }

  const tooltip =
    roleLabels.length > 0 ? roleLabels.join(" | ") : "Support Species";

  // Return primary role icon
  for (const role of process.functions) {
    if (roleIcons[role]) {
      return { ...roleIcons[role], tooltip };
    }
  }

  // Default for process species
  return { icon: "fa-seedling", color: "#22c55e", tooltip };
}

function SelectedIngredientChip({
  ingredient,
  onRemove,
  onClick,
  phaseIndex,
  isDarkMode,
  isVisible = false,
  readOnly = false,
  compactMode = false,
}: SelectedIngredientChipProps) {
  const phaseColor =
    PHASE_COLORS[Math.min(phaseIndex, PHASE_COLORS.length - 1)];
  const processRole = getProcessRoleIcon(ingredient);
  const isProcessSpecies = ingredient.type === "process";

  const containerClasses = clsx(
    "overflow-hidden hover:scale-[102%] transition-all duration-300 rounded-lg cursor-pointer",
    "flex items-center flex-shrink-0",
    "border",
    compactMode ? "px-2 py-1.5" : "p-2",
    {
      "bg-gradient-to-r from-neutral-700 to-neutral-900 text-white": isDarkMode,
      "bg-gradient-to-t from-white from-60% to-zinc-100 to-100% text-neutral-900":
        !isDarkMode,
      "border-2 border-amber-500": isVisible,
      "border-emerald-400 dark:border-emerald-600":
        !isVisible && isProcessSpecies,
      "border-neutral-300 dark:border-neutral-500":
        !isVisible && !isProcessSpecies,
    },
  );

  return (
    <IngredientChip
      className={containerClasses}
      label={formatIngredientIdForDisplay(ingredient.id)}
      labelClassName={clsx("capitalize", compactMode ? "text-sm" : "text-base")}
      onClick={() => onClick(ingredient)}
      leading={
        processRole ? (
          <i
            className={`fa-solid ${processRole.icon} text-xs`}
            style={{ color: processRole.color }}
            title={processRole.tooltip}
          />
        ) : null
      }
      trailing={
        <>
          <IngredientImg
            ingredient={ingredient}
            width={compactMode ? 18 : 20}
            height={compactMode ? 18 : 20}
          />

          {/* Phase color indicator */}
          <div
            className={clsx(
              "rounded-full flex-shrink-0",
              compactMode ? "h-2.5 w-2.5" : "h-3 w-3",
            )}
            style={{ backgroundColor: phaseColor }}
            title={PHASE_LABELS[phaseIndex]}
          />

          <i
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(ingredient.id);
            }}
            className={clsx(
              "fa-solid fa-circle-xmark text-neutral-400 dark:text-neutral-400 cursor-pointer",
              (readOnly || !onRemove) && "hidden",
            )}
          />
        </>
      }
    />
  );
}

type ForestViewMode =
  | "succession"
  | "layers"
  | "timeline"
  | "dominance"
  | "spatial";

interface ForestProps {
  /** Lock editing interactions for immersive map sessions */
  readOnly?: boolean;
  /** Force dark theme for this forest instance without changing global app theme */
  forceDarkMode?: boolean;
  /** Render fullscreen 3D mode inside the forest container instead of viewport */
  embeddedFullscreen?: boolean;
  /** Optional initial year for preconfigured immersive sessions */
  initialYear?: number;
  /** Whether time simulation should auto-play when the view loads */
  autoStartSimulation?: boolean;
  /** Optional initial per-ingredient instance counts for preconfigured tours */
  initialSpeciesCountConfig?: SpeciesCountConfig;
  /** Optional ingredient IDs used when URL query has no ingredients */
  initialIngredientIds?: string[];
  /** Optional initial respawn cycles for preconfigured tours */
  initialRespawnConfig?: RespawnConfig;
  /** Use initialIngredientIds even when the current URL has ingredient params */
  preferInitialIngredientIds?: boolean;
  /** Optional initial timeline duration zoom; null means full timeline */
  initialDurationOverride?: number | null;
  /** Toggle ambient floor decoration in the 3D scene. */
  showGroundDressing?: boolean;
  /** Override only the 3D scene theme, leaving surrounding Forest UI unchanged. */
  sceneForceDarkMode?: boolean;
  /** Multiplier for the initial 3D camera distance. Lower values start closer. */
  forest3DCameraDistanceScale?: number;
  /** Controls legend collapsed/expanded initial state. */
  forest3DControlsDefaultExpanded?: boolean;
  /** Open the integration cockpit immediately on first render. */
  initialIntegrationCockpitOpen?: boolean;
  /** Controls whether integration entry buttons are visible. */
  showIntegrationEntry?: boolean;
  /** Allow drag reposition interactions even when readOnly is true. */
  allowReposition?: boolean;
  /** Compact embedded mode hides timeline/overlay chrome for narrow previews. */
  compactPreviewMode?: boolean;
  /** Force the integration summary card into its mobile behavior. */
  forceIntegrationPanelMobile?: boolean;
  /** Tour-specific integration text keyed by ingredient id. */
  integrationStoriesByIngredient?: Record<string, IntegrationStoryPayload>;
  /** Optional action for clicking the collapsed integration summary. */
  onCollapsedIntegrationPanelClick?: () => void;
  /** Optional local inspection target for embedded surfaces with their own panel. */
  onIngredientInspect?: (inspection: FocusedIngredientState) => void;
}

export default function Succession({
  readOnly = false,
  forceDarkMode,
  embeddedFullscreen = false,
  initialYear,
  autoStartSimulation = false,
  initialSpeciesCountConfig,
  initialIngredientIds,
  initialRespawnConfig,
  preferInitialIngredientIds = false,
  initialDurationOverride,
  showGroundDressing = true,
  forest3DCameraDistanceScale,
  forest3DControlsDefaultExpanded,
  initialIntegrationCockpitOpen,
  showIntegrationEntry = false,
  allowReposition = false,
  compactPreviewMode = false,
  forceIntegrationPanelMobile = false,
  integrationStoriesByIngredient,
  onCollapsedIntegrationPanelClick,
  onIngredientInspect,
}: ForestProps) {
  const { isDarkMode: appIsDarkMode } = useCircadianTheme();
  const isDarkMode = forceDarkMode ?? appIsDarkMode;
  // Temporarily force the forest scene into night styling across all app themes.
  // Dynamic scene theme plumbing remains in place and can be re-enabled later.
  const forest3DIsDarkMode = true;
  const isWidescreen = useIsWidescreen();
  const navigate = useNavigate();
  const { forestDesignName } = useParams<{ forestDesignName?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const isEarthImmersiveSession =
    searchParams.get("ffBrand")?.toLowerCase() === "forest";
  const immersiveTourId = searchParams.get("ffTour");
  const brandLabel = isEarthImmersiveSession ? "Forest" : "Cove";
  const [searchTerm, setSearchTerm] = useState("");
  const setFocusedIngredientState = useSetAtom(FocusedIngredientAtom);
  const [isPantryVisible, setIsPantryVisible] = useState(false);
  const [restrictedIngredientIds, setRestrictedIngredientIds] = useState<
    string[] | undefined
  >();
  const [isSuccessionModalOpen, setIsSuccessionModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(0);
  const [activeYear, setActiveYear] = useState(initialYear ?? 0); // Global time cursor for 3D view

  // ─────────────────────────────────────────────────────────────────────────
  // TIME SIMULATION STATE
  // These control whether fruit particles animate (fall) or stay static (hang)
  // Fruits fall when EITHER isSimulating OR isDraggingTime is true
  // ─────────────────────────────────────────────────────────────────────────
  const [isSimulating, setIsSimulating] = useState(false); // Auto-play button active
  const [isDraggingTime, setIsDraggingTime] = useState(false); // User dragging slider

  const [viewMode, setViewMode] = useState<ForestViewMode>("spatial");
  // Earth immersive sessions should open directly in 3D fullscreen.
  const [isFullscreen3D, setIsFullscreen3D] = useState(embeddedFullscreen);
  const shouldOpenIntegrationByDefault =
    initialIntegrationCockpitOpen ?? !compactPreviewMode;
  const [isIntegrationCockpitOpen, setIsIntegrationCockpitOpen] = useState(
    shouldOpenIntegrationByDefault,
  );
  const [isSoilGroupingModalOpen, setIsSoilGroupingModalOpen] = useState(false);
  const [isRespawnModalOpen, setIsRespawnModalOpen] = useState(false);
  const [isSpeciesCountModalOpen, setIsSpeciesCountModalOpen] = useState(false);
  const [respawnConfig, setRespawnConfig] = useState<RespawnConfig>(
    initialRespawnConfig ?? {},
  );
  const [speciesCountConfig, setSpeciesCountConfig] =
    useState<SpeciesCountConfig>(initialSpeciesCountConfig ?? {});
  const [positionOverrides, setPositionOverrides] = useState<PositionOverrides>(
    {},
  );
  const canRepositionPlants = !readOnly || allowReposition;

  useEffect(() => {
    if (!compactPreviewMode) return;
    if (viewMode !== "spatial") {
      setViewMode("spatial");
    }
  }, [compactPreviewMode, viewMode]);

  useEffect(() => {
    if (!readOnly) return;
    setIsPantryVisible(false);
    setRestrictedIngredientIds(undefined);
    setIsSoilGroupingModalOpen(false);
    setIsRespawnModalOpen(false);
    setIsSpeciesCountModalOpen(false);
  }, [readOnly]);

  useEffect(() => {
    if (!initialSpeciesCountConfig) return;
    setSpeciesCountConfig(initialSpeciesCountConfig);
  }, [initialSpeciesCountConfig]);

  useEffect(() => {
    if (!initialRespawnConfig) return;
    setRespawnConfig(initialRespawnConfig);
  }, [initialRespawnConfig]);

  useEffect(() => {
    if (initialYear === undefined) return;
    setActiveYear(initialYear);
  }, [initialYear]);

  useEffect(() => {
    if (initialIntegrationCockpitOpen === undefined) return;
    setIsIntegrationCockpitOpen(initialIntegrationCockpitOpen);
    if (initialIntegrationCockpitOpen) {
      setViewMode("spatial");
    }
  }, [initialIntegrationCockpitOpen]);

  // Memoized callback to open succession modal (prevents chart re-renders)
  const handleOpenSuccessionModal = useCallback(() => {
    setIsSuccessionModalOpen(true);
  }, []);

  // Persisted elemental grouping state (soil groups, future: light pockets, etc.)
  const [elementalGrouping, setElementalGrouping] = useAtom(
    ElementalGroupingAtom,
  );

  // Helper to update soil grouping
  const updateSoilGrouping = useCallback(
    (grouping: DimensionGrouping) => {
      setElementalGrouping((prev) => ({ ...prev, soil: grouping }));
    },
    [setElementalGrouping],
  );

  // Derive whether separateSoil is effectively enabled (for backward compat)
  const separateSoil = elementalGrouping.soil?.enabled ?? false;

  const activeIngredientIds = useMemo(() => {
    const ingredientIdsFromQuery =
      searchParams.get("ingredients")?.split(",").filter(Boolean) || [];
    return !preferInitialIngredientIds && ingredientIdsFromQuery.length > 0
      ? ingredientIdsFromQuery
      : (initialIngredientIds ?? []);
  }, [initialIngredientIds, preferInitialIngredientIds, searchParams]);

  const activeIngredientIdSet = useMemo(
    () => new Set(activeIngredientIds),
    [activeIngredientIds],
  );

  // Sync shared group with selected ingredients when INGREDIENTS change
  // This effect intentionally does NOT depend on elementalGrouping.soil
  // to avoid re-running when the user toggles grouping on/off
  useEffect(() => {
    // Use the updater function to read current state and avoid stale closures
    setElementalGrouping((prev) => {
      const soilGrouping = prev.soil;

      // Only sync if grouping is enabled
      if (!soilGrouping?.enabled) return prev;

      // Find the shared group
      const sharedGroup = soilGrouping.groups.find(
        (g) => g.id === SHARED_GROUP_ID,
      );
      if (!sharedGroup) return prev;

      // Check if we need to sync
      const allGroupIds = new Set(
        soilGrouping.groups.flatMap((g) => g.ingredientIds),
      );

      // Find new ingredients that should be added to shared
      const newIngredients = [...activeIngredientIdSet].filter(
        (id) => !allGroupIds.has(id),
      );

      // Find removed ingredients that should be removed from all groups
      const removedIngredients = [...allGroupIds].filter(
        (id) => !activeIngredientIdSet.has(id),
      );

      // No changes needed
      if (newIngredients.length === 0 && removedIngredients.length === 0) {
        return prev;
      }

      // Update groups
      const updatedGroups = soilGrouping.groups.map((group) => {
        let newIngredientIds = [...group.ingredientIds];

        // Remove deleted ingredients from all groups
        newIngredientIds = newIngredientIds.filter(
          (id) => !removedIngredients.includes(id),
        );

        // Add new ingredients to shared group only
        if (group.id === SHARED_GROUP_ID) {
          newIngredientIds = [...newIngredientIds, ...newIngredients];
        }

        return { ...group, ingredientIds: newIngredientIds };
      });

      return {
        ...prev,
        soil: {
          ...soilGrouping,
          groups: updatedGroups,
        },
      };
    });
  }, [activeIngredientIdSet, setElementalGrouping]);

  // Clean up respawn cycles when species are removed
  useEffect(() => {
    setRespawnConfig((prev) => {
      const newConfig: RespawnConfig = {};
      let changed = false;

      for (const [id, cycles] of Object.entries(prev)) {
        if (activeIngredientIdSet.has(id)) {
          newConfig[id] = cycles;
        } else {
          changed = true;
        }
      }

      return changed ? newConfig : prev;
    });
  }, [activeIngredientIdSet]);

  // Clean up speciesCountConfig when ingredients are removed
  useEffect(() => {
    setSpeciesCountConfig((prev) => {
      const newConfig: SpeciesCountConfig = {};
      let changed = false;

      for (const [id, count] of Object.entries(prev)) {
        if (activeIngredientIdSet.has(id)) {
          newConfig[id] = count;
        } else {
          changed = true;
        }
      }

      return changed ? newConfig : prev;
    });
  }, [activeIngredientIdSet]);

  // Auto-apply sample counts on initial load when sample ingredients are in URL
  // but no counts are configured (e.g., page refresh after loading sample)
  const sampleCountsAppliedRef = useRef(false);
  useEffect(() => {
    if (sampleCountsAppliedRef.current) return;
    if (activeIngredientIds.length !== SAMPLE_FOREST_IDS.length) return;
    const idSet = new Set(activeIngredientIds);
    const isSample = SAMPLE_FOREST_IDS.every((id) => idSet.has(id));
    if (isSample && Object.keys(speciesCountConfig).length === 0) {
      setSpeciesCountConfig(SAMPLE_FOREST_COUNTS);
      sampleCountsAppliedRef.current = true;
    }
  }, [activeIngredientIds, speciesCountConfig]);

  // Initialize selected ingredients from URL params
  const selectedIngredients = useMemo(() => {
    return activeIngredientIds
      .map((id) => IngredientMap[id])
      .filter((i): i is Ingredient => !!i);
  }, [activeIngredientIds]);

  // Update URL params when ingredients change
  const updateIngredients = useCallback(
    (ingredients: Ingredient[]) => {
      const newSearchParams = new URLSearchParams(searchParams);
      if (ingredients.length > 0) {
        newSearchParams.set(
          "ingredients",
          ingredients.map((i) => i.id).join(","),
        );
      } else {
        newSearchParams.delete("ingredients");
      }
      setSearchParams(newSearchParams);
    },
    [searchParams, setSearchParams],
  );

  // Load sample design from route parameter if present
  useEffect(() => {
    if (!forestDesignName) return;

    // Check if sample exists in registry
    const sampleIngredientIds = SAMPLE_DESIGNS[forestDesignName];
    if (!sampleIngredientIds) return;

    // Only load if ingredients aren't already in URL (user hasn't customized yet)
    const existingIngredients = searchParams.get("ingredients");
    if (existingIngredients) return;

    // Load the sample ingredients
    const sampleIngredients = sampleIngredientIds
      .map((id) => IngredientMap[id])
      .filter((i): i is Ingredient => !!i);

    if (sampleIngredients.length > 0) {
      // Replace URL with ingredients query param, removing forestDesignName from path
      const ingredientIds = sampleIngredients.map((i) => i.id).join(",");
      const newSearchParams = new URLSearchParams();
      newSearchParams.set("ingredients", ingredientIds);
      navigate(`/food-forest?${newSearchParams.toString()}`, { replace: true });

      setSpeciesCountConfig(SAMPLE_FOREST_COUNTS);
    }
  }, [forestDesignName, searchParams, navigate]);

  // Check if any selected ingredient has canopy growth form
  const hasCanopyIngredient = useMemo(() => {
    return selectedIngredients.some((i) =>
      i.properties.growth?.growthForms?.includes("canopy"),
    );
  }, [selectedIngredients]);

  // If viewing layers but no canopy ingredient, switch to another view
  useEffect(() => {
    if (viewMode === "layers" && !hasCanopyIngredient) {
      setViewMode("succession");
    }
  }, [viewMode, hasCanopyIngredient]);

  // If viewing dominance but only 1 ingredient, switch to succession
  useEffect(() => {
    if (viewMode === "dominance" && selectedIngredients.length <= 1) {
      setViewMode("succession");
    }
  }, [viewMode, selectedIngredients.length]);

  // Filter ingredients for search
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!searchTerm.trim()) return [];

    return GrowableIngredients.filter((ingredient) => {
      // Must not already be selected
      if (selectedIngredients.some((si) => si.id === ingredient.id))
        return false;
      // Must match search term (checks both ID and display name)
      return ingredientMatchesSearchTerm(ingredient.id, searchTerm);
    })
      .slice(0, 10)
      .map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.id.replace(/_/g, " "),
        imgPath: ingredient.imgPath,
      }));
  }, [searchTerm, selectedIngredients]);

  // Handle ingredient selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      const ingredient = IngredientMap[result.id];
      if (!ingredient) return;

      updateIngredients([...selectedIngredients, ingredient]);
      setSearchTerm("");
    },
    [selectedIngredients, updateIngredients],
  );

  // Handle ingredient removal
  const handleRemove = useCallback(
    (id: string) => {
      updateIngredients(selectedIngredients.filter((i) => i.id !== id));
    },
    [selectedIngredients, updateIngredients],
  );

  // Build lifetime segments for the charts
  const segments = useMemo(() => {
    // For ingredients without succession data, infer from growth
    const enriched = selectedIngredients.map((ingredient) => {
      if (ingredient.properties.succession) return ingredient;
      if (ingredient.properties.growth) {
        return {
          ...ingredient,
          properties: {
            ...ingredient.properties,
            succession: inferSuccessionFromGrowth(ingredient.properties.growth),
          },
        };
      }
      return ingredient;
    });

    return applySpeciesCountToSegments(
      buildLifetimeSegments(enriched, respawnConfig),
      speciesCountConfig,
    );
  }, [selectedIngredients, respawnConfig, speciesCountConfig]);

  // ─────────────────────────────────────────────────────────────────────────
  // DYNAMIC TIMELINE DURATION
  // Compute duration based on ingredient lifecycles, with user-selectable zoom
  // ─────────────────────────────────────────────────────────────────────────

  // Compute smart duration options from segments
  const durationOptions = useMemo<DurationOption[]>(() => {
    return computeDurationOptions(segments);
  }, [segments]);

  // Full timeline duration (auto-calculated from ingredients)
  const fullTimelineDuration = useMemo(() => {
    return computeTimelineDuration(segments);
  }, [segments]);

  // User can override to zoom in (null = use full timeline)
  const [durationOverride, setDurationOverride] = useState<number | null>(
    initialDurationOverride ?? null,
  );

  useEffect(() => {
    if (initialDurationOverride === undefined) return;
    setDurationOverride(initialDurationOverride);
  }, [initialDurationOverride]);

  // Effective duration is the override if set, otherwise full
  const effectiveDuration = durationOverride ?? fullTimelineDuration;
  const timelinePlaybackSpeed = useMemo(() => {
    const targetSeconds = isEarthImmersiveSession ? 360 : 240;
    return Math.max(effectiveDuration / targetSeconds, 0.005);
  }, [effectiveDuration, isEarthImmersiveSession]);

  // Reset duration override if it's no longer a valid option
  useEffect(() => {
    if (durationOverride !== null) {
      const isValidOption = durationOptions.some(
        (opt) => opt.value === durationOverride,
      );
      if (!isValidOption) {
        setDurationOverride(null); // Fall back to full
      }
    }
  }, [durationOptions, durationOverride]);

  // Reset year if it exceeds new duration
  useEffect(() => {
    if (activeYear > effectiveDuration) {
      setActiveYear(0);
    }
  }, [effectiveDuration, activeYear]);

  // Get phase index for each selected ingredient based on successionalPhase
  // This matches the waves chart coloring
  const ingredientPhaseMap = useMemo(() => {
    const map: Record<string, number> = {};
    selectedIngredients.forEach((ingredient) => {
      let profile = ingredient.properties.succession;
      if (!profile && ingredient.properties.growth) {
        profile = inferSuccessionFromGrowth(ingredient.properties.growth);
      }
      const phase = profile?.successionalPhase || "early";
      map[ingredient.id] = ROLE_TO_INDEX[phase] ?? 1;
    });
    return map;
  }, [selectedIngredients]);

  // Which species are visible in the 3D scene at the current year
  const activeSegmentsAtYear = useMemo(
    () => getActiveSegmentsAtYear(segments, activeYear),
    [segments, activeYear],
  );

  const visibleIngredientIds = useMemo(() => {
    const ids = new Set<string>();
    for (const { segment, intensity } of activeSegmentsAtYear) {
      if (intensity >= 0.01) ids.add(segment.ingredient.id);
    }
    return ids;
  }, [activeSegmentsAtYear]);

  const getIngredientLifecycleIntensity = useCallback(
    (ingredientId: string) =>
      activeSegmentsAtYear
        .filter(({ segment }) => segment.ingredient.id === ingredientId)
        .reduce((max, { intensity }) => Math.max(max, intensity), 0),
    [activeSegmentsAtYear],
  );

  // Get soil group labels for an ingredient (returns undefined if only in default group)
  // An ingredient can be in multiple soil groups
  // Returns undefined if there's only Shared Ground (no custom groups) - no need to label everything
  const getSoilGroupLabels = useCallback(
    (ingredientId: string): string[] | undefined => {
      const soilGrouping = elementalGrouping.soil;
      if (!soilGrouping?.enabled) return undefined;

      // Check if there are any custom groups (non-Shared Ground)
      const hasCustomGroups = soilGrouping.groups.some(
        (g) => g.id !== SHARED_GROUP_ID,
      );
      // If only Shared Ground exists, don't show labels - it's redundant
      if (!hasCustomGroups) return undefined;

      const labels: string[] = [];
      for (const group of soilGrouping.groups) {
        if (group.ingredientIds.includes(ingredientId)) {
          labels.push(group.label);
        }
      }

      return labels.length > 0 ? labels : undefined;
    },
    [elementalGrouping.soil],
  );

  const isEmpty = selectedIngredients.length === 0;

  // Filter out inedible ingredients for combo page
  const edibleIngredients = useMemo(() => {
    return selectedIngredients.filter((ingredient) => !ingredient.isInedible);
  }, [selectedIngredients]);

  // Memoized available ingredients for soil grouping modal
  const availableIngredientsForGrouping = useMemo(() => {
    return selectedIngredients.map((i) => ({
      id: i.id,
      label: formatIngredientIdForDisplay(i.id),
    }));
  }, [selectedIngredients]);

  // Memoized soil grouping for modal (avoid creating empty grouping on every render)
  const soilGroupingForModal = useMemo(() => {
    return elementalGrouping.soil ?? createEmptyDimensionGrouping();
  }, [elementalGrouping.soil]);

  // Generate narratives at parent level (always visible, not tab-dependent)
  const narratives = useMemo<PhaseNarrative[]>(() => {
    if (selectedIngredients.length === 0) return [];
    const placements = buildLayerPlacements(selectedIngredients);
    const dominanceData = computeLayerDominanceByPhase(placements);
    return generateSuccessionNarrative(
      dominanceData,
      placements,
      false,
      false,
      selectedIngredients.length,
      [],
      separateSoil,
    );
  }, [selectedIngredients, separateSoil]);

  // Navigate to combo page with selected ingredients
  const handleNavigateToCombo = useCallback(() => {
    if (edibleIngredients.length === 0) return;

    const params = new URLSearchParams();
    edibleIngredients.forEach((ingredient) => {
      params.append("ingredientId", ingredient.id);
    });
    navigate(`/combos?${params.toString()}`);
  }, [edibleIngredients, navigate]);

  // Sample forest ingredients
  const loadSampleForest = useCallback(() => {
    updateIngredients(SAMPLE_FOREST_IDS.map((id) => IngredientMap[id]));
    setSpeciesCountConfig(SAMPLE_FOREST_COUNTS);
    // Enable soil grouping with Shared Ground containing all sample ingredients
    const sharedGroup: ElementalGroup = {
      id: SHARED_GROUP_ID,
      label: "Shared Ground",
      ingredientIds: [...SAMPLE_FOREST_IDS],
    };
    updateSoilGrouping({
      ...createEmptyDimensionGrouping(),
      enabled: true,
      groups: [sharedGroup],
    });
  }, [updateIngredients, updateSoilGrouping]);

  const getIntegrationStoryForIngredient = useCallback(
    (ingredientId: string) => {
      const providedStory = integrationStoriesByIngredient?.[ingredientId];
      if (providedStory) return providedStory;

      if (!isEarthImmersiveSession) return null;

      return getIntegrationStoryForTourIngredient(
        immersiveTourId,
        ingredientId,
      );
    },
    [immersiveTourId, integrationStoriesByIngredient, isEarthImmersiveSession],
  );

  const buildFocusedIngredientState = useCallback(
    (ingredient: Ingredient): FocusedIngredientState => {
      const integrationStory = getIntegrationStoryForIngredient(ingredient.id);

      return {
        ingredient,
        showComboButton: false,
        storyText: integrationStory?.storyText,
        storyLabel: integrationStory?.storyLabel,
        integrationProfileContext: {
          mode: "active",
          year: activeYear,
          intensity: getIngredientLifecycleIntensity(ingredient.id),
        },
      };
    },
    [
      activeYear,
      getIngredientLifecycleIntensity,
      getIntegrationStoryForIngredient,
    ],
  );

  const openFocusedIngredient = useCallback(
    (ingredient: Ingredient) => {
      const inspection = buildFocusedIngredientState(ingredient);

      if (onIngredientInspect) {
        onIngredientInspect(inspection);
        return;
      }

      setFocusedIngredientState(inspection);
    },
    [
      buildFocusedIngredientState,
      onIngredientInspect,
      setFocusedIngredientState,
    ],
  );

  // Embedded fullscreen lives inside the same container as the overview layout.
  // Lock parent scrolling + hide underlying content to prevent bleed-through.
  const isEmbeddedFullscreenActive = embeddedFullscreen && isFullscreen3D;

  const containerClasses = clsx(
    "relative w-full bg-gradient-to-tr from-emerald-50 via-white to-cyan-50",
    "dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800",
    "px-3 py-4 lg:px-6 lg:py-10 overflow-x-hidden transition-opacity duration-200",
    {
      "min-h-full": !embeddedFullscreen,
      "h-full min-h-0": embeddedFullscreen,
      "lg:flex lg:items-center lg:justify-center]": isEmpty,
      "overflow-y-auto": !isEmbeddedFullscreenActive,
      "overflow-y-hidden": isEmbeddedFullscreenActive,
      // Keep base layout hidden while Earth-launched fullscreen is active so
      // only the immersive portal is visible during enter/exit animations.
      "opacity-0 pointer-events-none":
        isEarthImmersiveSession && isFullscreen3D && !embeddedFullscreen,
    },
  );

  const innerClasses = clsx("mx-auto flex flex-col gap-4 min-w-0 w-full", {
    "lg:items-center lg:text-center lg:relative top-[-200px]": isEmpty,
    "pointer-events-none select-none opacity-0": isEmbeddedFullscreenActive,
  });

  const fullscreenTabOptions: Array<{
    mode: ForestViewMode;
    label: string;
    icon: string;
    disabled?: boolean;
  }> = [
    { mode: "spatial", label: "Forest", icon: "fa-cube" },
    { mode: "succession", label: "Succession", icon: "fa-wave-square" },
    {
      mode: "dominance",
      label: "Dominance",
      icon: "fa-chart-simple",
      disabled: selectedIngredients.length <= 1,
    },
    { mode: "timeline", label: "Lifetime", icon: "fa-bars-staggered" },
  ];

  const renderFullscreenTabs = () => {
    if (!SHOW_FOREST_VIEW_TABS) return null;

    return (
      <div
        className={clsx(
          "inline-flex min-w-max items-center gap-1 rounded-xl border p-1 whitespace-nowrap",
          isDarkMode
            ? "border-neutral-600 bg-neutral-800/70"
            : "border-neutral-300 bg-neutral-100/90",
        )}
      >
        {fullscreenTabOptions.map(({ mode, label, icon, disabled }) => {
          const isActive = viewMode === mode;
          return (
            <button
              key={mode}
              onClick={() => {
                if (disabled) return;
                setViewMode(mode);
              }}
              disabled={disabled}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors md:text-base",
                isActive
                  ? isDarkMode
                    ? "bg-neutral-600 text-white shadow-sm"
                    : "bg-white text-neutral-900 shadow-sm"
                  : isDarkMode
                    ? "text-neutral-300 hover:bg-neutral-700/70"
                    : "text-neutral-600 hover:bg-white/80",
                disabled &&
                  (isDarkMode
                    ? "cursor-not-allowed text-neutral-500 hover:bg-transparent"
                    : "cursor-not-allowed text-neutral-400 hover:bg-transparent"),
              )}
              title={
                disabled
                  ? "Dominance requires at least 2 ingredients"
                  : undefined
              }
            >
              <i className={`fa-solid ${icon} text-xs`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const fullscreenChartContent = (() => {
    if (viewMode === "succession") {
      return (
        <SuccessionWavesChart
          segments={segments}
          isWidescreen={isWidescreen}
          isDarkMode={isDarkMode}
          selectedYear={activeYear}
          onYearSelect={setActiveYear}
          onInfoClick={handleOpenSuccessionModal}
        />
      );
    }

    if (viewMode === "layers") {
      return (
        <LayerMap
          ingredients={selectedIngredients}
          isDarkMode={isDarkMode}
          isWidescreen={isWidescreen}
          selectedYear={activeYear}
          onYearSelect={setActiveYear}
        />
      );
    }

    if (viewMode === "timeline") {
      return (
        <TimelineGantt
          segments={segments}
          isWidescreen={isWidescreen}
          isDarkMode={isDarkMode}
          expandedHeight
        />
      );
    }

    if (viewMode === "dominance") {
      return (
        <DominanceChart
          ingredients={selectedIngredients}
          isDarkMode={isDarkMode}
          isWidescreen={isWidescreen}
          speciesCountConfig={speciesCountConfig}
        />
      );
    }

    return null;
  })();

  const renderFullscreenSurface = (isEmbeddedSurface: boolean) => (
    <motion.div
      key={
        isEmbeddedSurface
          ? "forest-fullscreen-embedded"
          : "forest-fullscreen-portal"
      }
      initial={{ opacity: 0, y: 8, scale: 1.005 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.995 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        isEmbeddedSurface
          ? "absolute inset-0 z-[100000] flex flex-col overflow-hidden"
          : "fixed inset-0 z-[100000] flex flex-col overflow-hidden",
        isDarkMode ? "bg-neutral-900" : "bg-neutral-100",
      )}
    >
      {/* Top Bar - Ingredients & Controls */}
      <div
        className={clsx(
          "flex-shrink-0 border-b px-3 py-2 sm:px-4 sm:py-3",
          isEmbeddedSurface
            ? isDarkMode
              ? "bg-transparent border-neutral-700/60"
              : "bg-transparent border-neutral-200/70"
            : isDarkMode
              ? "bg-neutral-800/95 border-neutral-700"
              : "bg-white/95 border-neutral-200",
        )}
      >
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {!isEmbeddedSurface && (
            <>
              <button
                onClick={() => setIsFullscreen3D(false)}
                className={clsx(
                  "p-2 rounded-lg flex items-center gap-2 transition-colors",
                  isDarkMode
                    ? "hover:bg-neutral-700 text-neutral-300"
                    : "hover:bg-neutral-200 text-neutral-600",
                )}
              >
                <i className="fa-solid fa-compress" />
                <span className="text-base font-medium">Overview</span>
              </button>

              <div className="h-6 w-px bg-neutral-300 dark:bg-neutral-600" />
            </>
          )}

          {/* Selected ingredients */}
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide">
            {selectedIngredients.map((ingredient) => {
              const succession =
                ingredient.properties.succession ||
                (ingredient.properties.growth
                  ? inferSuccessionFromGrowth(ingredient.properties.growth)
                  : null);
              const phaseIndex = succession?.successionalPhase
                ? (ROLE_TO_INDEX[succession.successionalPhase] ?? 0)
                : 0;
              return (
                <SelectedIngredientChip
                  key={ingredient.id}
                  ingredient={ingredient}
                  phaseIndex={phaseIndex}
                  isDarkMode={isDarkMode}
                  soilGroupLabels={getSoilGroupLabels(ingredient.id)}
                  isVisible={visibleIngredientIds.has(ingredient.id)}
                  readOnly={readOnly}
                  compactMode={
                    compactPreviewMode || forceIntegrationPanelMobile
                  }
                  onClick={openFocusedIngredient}
                  onRemove={
                    readOnly
                      ? undefined
                      : (id) => {
                          const newIngredients = selectedIngredients.filter(
                            (i) => i.id !== id,
                          );
                          updateIngredients(newIngredients);
                        }
                  }
                />
              );
            })}
            {!readOnly && (
              <button
                onClick={() => {
                  setIsPantryVisible(true);
                }}
                className={clsx(
                  "px-3 py-1.5 rounded-full text-base font-medium flex-shrink-0 whitespace-nowrap",
                  "border-2 border-dashed transition-colors",
                  isDarkMode
                    ? "border-neutral-600 text-neutral-400 hover:border-emerald-500 hover:text-emerald-400"
                    : "border-neutral-300 text-neutral-500 hover:border-emerald-500 hover:text-emerald-600",
                )}
              >
                <i className="fa-solid fa-plus mr-1.5" />
                Add
              </button>
            )}
          </div>

          {showIntegrationEntry && (
            <div
              className={clsx(
                "flex items-center gap-2 rounded-lg px-1.5 py-1.5 sm:px-3 sm:py-2 flex-shrink-0",
                isDarkMode ? "bg-neutral-700/50" : "bg-neutral-100",
              )}
            >
              <button
                onClick={() => {
                  setViewMode("spatial");
                  setIsIntegrationCockpitOpen((prev) => !prev);
                }}
                className={clsx(
                  "inline-flex h-10 w-10 items-center justify-center rounded-md text-xs transition-colors sm:h-auto sm:w-auto sm:px-2 sm:py-1",
                  "gap-2",
                  isIntegrationCockpitOpen
                    ? "bg-emerald-600 text-white"
                    : isDarkMode
                      ? "bg-neutral-600 text-neutral-300"
                      : "bg-neutral-200 text-neutral-600",
                )}
                aria-label="Toggle integration cockpit"
              >
                <i className="fa-solid fa-gauge-high text-xs" />
                <span className="hidden sm:inline">Integration</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Surface */}
      <div className="relative flex-1 min-h-0">
        {viewMode === "spatial" ? (
          <>
            {/* Legend: amber border = visible in Cove */}
            <div
              className={clsx(
                "absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs pointer-events-none transition-opacity duration-500",
                isDarkMode
                  ? "bg-black/60 text-neutral-200"
                  : "bg-black/50 text-white",
                visibleIngredientIds.size > 0 &&
                  visibleIngredientIds.size < selectedIngredients.length
                  ? "opacity-100"
                  : "opacity-0",
              )}
            >
              <span className="w-2.5 h-2.5 rounded-sm border-2 border-amber-500 flex-shrink-0" />
              Active
            </div>

            <Suspense
              fallback={
                <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="flex h-full items-center justify-center">
                    <div className="flex flex-col items-center gap-3 opacity-40">
                      <div className="h-16 w-16 animate-pulse rounded-2xl bg-neutral-300 dark:bg-neutral-700" />
                      <div className="h-3 w-24 animate-pulse rounded bg-neutral-300 dark:bg-neutral-700" />
                    </div>
                  </div>
                </div>
              }
            >
              {/* isSimulating: true when time is moving (auto-play OR dragging)
              This makes fruit particles fall; when false, they hang static */}
              {isIntegrationCockpitOpen ? (
                <IntegrationCockpit
                  ingredients={selectedIngredients}
                  year={activeYear}
                  isDraggingTime={isDraggingTime}
                  isDarkMode={forest3DIsDarkMode}
                  isSimulating={isSimulating || isDraggingTime}
                  soilGrouping={elementalGrouping.soil}
                  respawnConfig={respawnConfig}
                  speciesCountConfig={speciesCountConfig}
                  positionOverrides={positionOverrides}
                  onPositionChange={
                    canRepositionPlants
                      ? (volumeId, pos) => {
                          setPositionOverrides((prev) => ({
                            ...prev,
                            [volumeId]: pos,
                          }));
                        }
                      : undefined
                  }
                  onArrange={setPositionOverrides}
                  onClose={() => setIsIntegrationCockpitOpen(false)}
                  canClose={showIntegrationEntry}
                  readOnly={readOnly}
                  showGroundDressing={showGroundDressing}
                  cameraDistanceScale={forest3DCameraDistanceScale}
                  controlsDefaultExpanded={forest3DControlsDefaultExpanded}
                  showOverlays={!compactPreviewMode}
                  forceMobilePanel={forceIntegrationPanelMobile}
                  onCollapsedPanelClick={onCollapsedIntegrationPanelClick}
                  onVolumeClick={(id) => {
                    const ingredient = IngredientMap[id];
                    if (ingredient) {
                      openFocusedIngredient(ingredient);
                    }
                  }}
                />
              ) : (
                <Forest3D
                  ingredients={selectedIngredients}
                  year={activeYear}
                  structures={{ separateSoil }}
                  isDarkMode={forest3DIsDarkMode}
                  isSimulating={isSimulating || isDraggingTime}
                  soilGrouping={elementalGrouping.soil}
                  respawnConfig={respawnConfig}
                  speciesCountConfig={speciesCountConfig}
                  positionOverrides={positionOverrides}
                  onPositionChange={
                    canRepositionPlants
                      ? (volumeId, pos) => {
                          setPositionOverrides((prev) => ({
                            ...prev,
                            [volumeId]: pos,
                          }));
                        }
                      : undefined
                  }
                  readOnly={readOnly}
                  showGroundDressing={showGroundDressing}
                  cameraDistanceScale={forest3DCameraDistanceScale}
                  controlsDefaultExpanded={forest3DControlsDefaultExpanded}
                  showOverlays={!compactPreviewMode}
                  className="rounded-none"
                  onVolumeClick={(id) => {
                    const ingredient = IngredientMap[id];
                    if (ingredient) {
                      openFocusedIngredient(ingredient);
                    }
                  }}
                />
              )}
            </Suspense>
          </>
        ) : (
          <div className="h-full overflow-auto p-2 sm:p-4 md:p-5">
            <div
              className={clsx(
                "h-full min-h-[320px] sm:min-h-[520px] overflow-auto rounded-xl sm:rounded-2xl border p-3 sm:p-4 md:p-6",
                isDarkMode
                  ? "border-neutral-700 bg-neutral-800/70"
                  : "border-neutral-200 bg-white/90",
              )}
            >
              {fullscreenChartContent}
            </div>
          </div>
        )}
      </div>

      {viewMode === "spatial" &&
      (compactPreviewMode || forceIntegrationPanelMobile) ? (
        <TimeCursor
          className="hidden"
          year={activeYear}
          onYearChange={setActiveYear}
          maxYear={effectiveDuration}
          isDarkMode={isDarkMode}
          compactMode
          simulationSpeedYearsPerSecond={timelinePlaybackSpeed}
          autoStartSimulation={
            isEmbeddedSurface ? autoStartSimulation : undefined
          }
          onSimulatingChange={setIsSimulating}
          onDraggingChange={setIsDraggingTime}
        />
      ) : null}

      {/* Bottom Bar - Time Cursor + Fullscreen Tabs */}
      {!compactPreviewMode &&
      !forceIntegrationPanelMobile &&
      (viewMode === "spatial" || SHOW_FOREST_VIEW_TABS) ? (
        <div
          className={clsx(
            "flex-shrink-0 border-t px-3 py-3 sm:px-4 sm:py-4 md:px-6",
            isDarkMode
              ? "bg-neutral-800/95 border-neutral-700"
              : "bg-white/95 border-neutral-200",
          )}
        >
          {viewMode === "spatial" ? (
            <>
              <TimeCursor
                year={activeYear}
                onYearChange={setActiveYear}
                maxYear={effectiveDuration}
                isDarkMode={isDarkMode}
                simulationSpeedYearsPerSecond={timelinePlaybackSpeed}
                autoStartSimulation={
                  isEmbeddedSurface ? autoStartSimulation : undefined
                }
                onSimulatingChange={setIsSimulating}
                onDraggingChange={setIsDraggingTime}
                durationOptions={durationOptions}
                selectedDuration={durationOverride}
                onDurationChange={setDurationOverride}
                headerRightContent={
                  SHOW_FOREST_VIEW_TABS ? (
                    <div className="hidden sm:block">
                      {renderFullscreenTabs()}
                    </div>
                  ) : undefined
                }
              />
              {SHOW_FOREST_VIEW_TABS ? (
                <div className="mt-2 w-full overflow-x-auto scrollbar-hide sm:hidden">
                  <div className="flex min-w-full">
                    <div className="ml-auto">{renderFullscreenTabs()}</div>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="w-full overflow-x-auto scrollbar-hide">
              <div className="flex min-w-full">
                <div className="ml-auto">{renderFullscreenTabs()}</div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </motion.div>
  );

  return (
    <div className={containerClasses}>
      {!isEmbeddedFullscreenActive ? (
        <div className={innerClasses}>
          {!readOnly && (
            <>
              {/* Header */}
              <div className="flex items-center gap-4 mb-4 lg:justify-center">
                <div className="relative overflow-hidden w-fit">
                  <div className="flex items-center gap-3 font-bona-nova-sc">
                    <h1 className={`text-3xl lg:text-4xl font-medium`}>
                      {brandLabel}{" "}
                      <span className="dark:bg-combo-reverse bg-gradient-to-r from-cyan-50 to-amber-100 via-white">
                        Design
                      </span>
                    </h1>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 max-w-2xl mt-4 hide-feature">
                    Build your syntropic timeline. Add ingredients to see when
                    to plant them, from fast pioneers that create shade to slow
                    canopy giants that define the final structure.
                  </p>
                </div>
              </div>

              {/* Search */}
              <div
                className={clsx(
                  "flex items-center gap-2",
                  "lg:justify-center",
                  isEmpty && "w-full",
                )}
              >
                <div
                  className={clsx(
                    isEmpty ? "w-[75vw] lg:w-[500px]" : "flex-1 max-w-md",
                  )}
                >
                  <Input
                    id="succession-search"
                    name="succession-search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={["banana", "cacao", "durian", "coconut"]}
                    leadingIconClasses="fa-solid fa-search"
                    inputPaddingClasses="py-2.5 px-3"
                    backgroundColorClasses="bg-white dark:bg-neutral-800"
                    borderClasses="border border-neutral-300 dark:border-neutral-600"
                    search={{
                      results: searchResults.map((result) => ({
                        id: result.id,
                        name: formatIngredientIdForDisplay(result.id),
                        imgPath: result.imgPath,
                      })),
                      onSelect: handleSelect,
                    }}
                  />
                </div>
                <button
                  onClick={() => {
                    setSearchParams((prev) => {
                      const newParams = new URLSearchParams(prev);
                      newParams.delete("types");
                      return newParams;
                    });
                    setIsPantryVisible(true);
                  }}
                  className={getShinyButtonClasses(
                    isDarkMode,
                    "bg-circadian border-circadian",
                  )}
                >
                  <i className="fa-solid fa-apple-whole" />
                  <span className="hidden lg:inline text-lg font-medium">
                    Species
                  </span>
                  <ShineEffect />
                </button>
                {/* Create Combo Button - shows when >1 ingredient and at least one is edible */}
                {selectedIngredients.length > 1 &&
                  edibleIngredients.length > 0 &&
                  false && (
                    <motion.button
                      onClick={handleNavigateToCombo}
                      className={getShinyButtonClasses(
                        isDarkMode,
                        "bg-combo border-combo text-white",
                      )}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <i className="fa-solid fa-utensils" />
                      <span className="hidden lg:inline text-base font-medium">
                        Design Dish
                      </span>
                      <ShineEffect />
                    </motion.button>
                  )}
              </div>

              {/* Horizontal divider separating header from content */}
              <div className="w-full h-px bg-neutral-200 dark:bg-neutral-700 my-4" />
            </>
          )}

          {/* Sample Forest Button - only show when empty */}
          {isEmpty && !readOnly && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <SampleDesignCard
                isDarkMode={isDarkMode}
                onLoadSample={loadSampleForest}
                currentIngredientIds={selectedIngredients.map((i) => i.id)}
              />
            </motion.div>
          )}

          {/* Main Content Area */}
          {selectedIngredients.length > 0 && (
            <div
              className={clsx(
                "grid gap-4",
                isWidescreen
                  ? "mx-auto w-full max-w-6xl grid-cols-1"
                  : "grid-cols-1",
              )}
            >
              {/* Center - Main Content */}
              <div className="flex flex-col gap-4 min-w-0">
                {/* Selected ingredients chips */}
                <div
                  className={clsx(
                    "flex gap-2",
                    isWidescreen ? "flex-wrap" : "overflow-x-auto pb-2",
                  )}
                >
                  {selectedIngredients.map((ingredient) => (
                    <SelectedIngredientChip
                      key={ingredient.id}
                      ingredient={ingredient}
                      onRemove={readOnly ? undefined : handleRemove}
                      onClick={openFocusedIngredient}
                      phaseIndex={ingredientPhaseMap[ingredient.id] ?? 0}
                      isDarkMode={isDarkMode}
                      soilGroupLabels={getSoilGroupLabels(ingredient.id)}
                      isVisible={visibleIngredientIds.has(ingredient.id)}
                      readOnly={readOnly}
                    />
                  ))}
                </div>

                {/* Combined Layer Map + Succession Waves with toggle */}
                <div
                  className={clsx(
                    "bg-white dark:bg-neutral-800 rounded-2xl p-4 lg:p-6 shadow-sm border border-neutral-200 dark:border-neutral-700",
                  )}
                >
                  {/* View mode toggle */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 min-w-0">
                    <div
                      className={clsx(
                        "inline-flex rounded-lg p-1 border gap-1",
                        "overflow-x-auto scrollbar-hide",
                        "flex-nowrap",
                        "min-w-0",
                        !SHOW_FOREST_VIEW_TABS && "hidden",
                        isDarkMode
                          ? "bg-neutral-700/50 border-neutral-600"
                          : "bg-neutral-100 border-neutral-200",
                      )}
                    >
                      <button
                        onClick={() => setViewMode("spatial")}
                        className={clsx(
                          "px-3 py-1.5 text-base font-medium rounded-md transition-all duration-200 flex items-center",
                          viewMode === "spatial"
                            ? isDarkMode
                              ? "bg-neutral-600 text-white shadow-sm"
                              : "bg-white text-neutral-900 shadow-sm"
                            : isDarkMode
                              ? "text-neutral-400 hover:text-neutral-200"
                              : "text-neutral-600 hover:text-neutral-900",
                        )}
                      >
                        <i className="fa-solid fa-cube mr-1.5 text-xs" />
                        <span>{brandLabel}</span>
                      </button>
                      <button
                        onClick={() => setViewMode("succession")}
                        className={clsx(
                          "px-3 py-1.5 text-base font-medium rounded-md transition-all duration-200 flex items-center",
                          viewMode === "succession"
                            ? isDarkMode
                              ? "bg-neutral-600 text-white shadow-sm"
                              : "bg-white text-neutral-900 shadow-sm"
                            : isDarkMode
                              ? "text-neutral-400 hover:text-neutral-200"
                              : "text-neutral-600 hover:text-neutral-900",
                        )}
                      >
                        <i className="fa-solid fa-wave-square mr-1.5 text-xs" />
                        <span>Succession</span>
                      </button>
                      {selectedIngredients.length > 1 && (
                        <button
                          onClick={() => setViewMode("dominance")}
                          className={clsx(
                            "hide-featfure px-3 py-1.5 text-base font-medium rounded-md transition-all duration-200 flex items-center",
                            viewMode === "dominance"
                              ? isDarkMode
                                ? "bg-neutral-600 text-white shadow-sm"
                                : "bg-white text-neutral-900 shadow-sm"
                              : isDarkMode
                                ? "text-neutral-400 hover:text-neutral-200"
                                : "text-neutral-600 hover:text-neutral-900",
                          )}
                        >
                          <i className="fa-solid fa-chart-simple mr-1.5 text-xs" />
                          <span>Dominance</span>
                        </button>
                      )}
                      {hasCanopyIngredient && (
                        <button
                          onClick={() => setViewMode("layers")}
                          className={clsx(
                            "hide-feature px-3 py-1.5 text-base font-medium rounded-md transition-all duration-200 flex items-center",
                            viewMode === "layers"
                              ? isDarkMode
                                ? "bg-neutral-600 text-white shadow-sm"
                                : "bg-white text-neutral-900 shadow-sm"
                              : isDarkMode
                                ? "text-neutral-400 hover:text-neutral-200"
                                : "text-neutral-600 hover:text-neutral-900",
                          )}
                        >
                          <i className="fa-solid fa-layer-group mr-1.5 text-xs" />
                          <span>Shade</span>
                        </button>
                      )}
                      <button
                        onClick={() => setViewMode("timeline")}
                        className={clsx(
                          "px-3 py-1.5 text-base font-medium rounded-md transition-all duration-200 flex items-center",
                          viewMode === "timeline"
                            ? isDarkMode
                              ? "bg-neutral-600 text-white shadow-sm"
                              : "bg-white text-neutral-900 shadow-sm"
                            : isDarkMode
                              ? "text-neutral-400 hover:text-neutral-200"
                              : "text-neutral-600 hover:text-neutral-900",
                        )}
                      >
                        <i className="fa-solid fa-bars-staggered mr-1.5 text-xs" />
                        <span className="hidden sm:inline">Lifetime</span>
                        <span className="sm:hidden">Timeline</span>
                      </button>
                    </div>

                    {/* Respawn & Count buttons */}
                    {!readOnly && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => setIsRespawnModalOpen(true)}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center gap-1.5 border",
                            "flex-1 sm:flex-none",
                            Object.keys(respawnConfig).length > 0
                              ? isDarkMode
                                ? "bg-emerald-900/30 border-emerald-700 text-emerald-400"
                                : "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : isDarkMode
                                ? "bg-neutral-700/50 border-neutral-600 text-neutral-400 hover:text-neutral-200"
                                : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900",
                          )}
                        >
                          <i className="fa-solid fa-rotate text-xs" />
                          <span>Respawn</span>
                          {Object.keys(respawnConfig).length > 0 && (
                            <span
                              className={clsx(
                                "px-1.5 py-0.5 rounded text-xs",
                                isDarkMode
                                  ? "bg-emerald-800 text-emerald-300"
                                  : "bg-emerald-200 text-emerald-800",
                              )}
                            >
                              {Object.values(respawnConfig).reduce(
                                (a, b) => a + b,
                                0,
                              )}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setIsSpeciesCountModalOpen(true)}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center gap-1.5 border",
                            "flex-1 sm:flex-none",
                            Object.keys(speciesCountConfig).length > 0
                              ? isDarkMode
                                ? "bg-blue-900/30 border-blue-700 text-blue-400"
                                : "bg-blue-50 border-blue-300 text-blue-700"
                              : isDarkMode
                                ? "bg-neutral-700/50 border-neutral-600 text-neutral-400 hover:text-neutral-200"
                                : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900",
                          )}
                        >
                          <i className="fa-solid fa-hashtag text-xs" />
                          <span>Count</span>
                          {Object.keys(speciesCountConfig).length > 0 && (
                            <span
                              className={clsx(
                                "px-1.5 py-0.5 rounded text-xs",
                                isDarkMode
                                  ? "bg-blue-800 text-blue-300"
                                  : "bg-blue-200 text-blue-800",
                              )}
                            >
                              {Object.values(speciesCountConfig).reduce(
                                (a, b) => a + b,
                                0,
                              ) +
                                selectedIngredients.length -
                                Object.keys(speciesCountConfig).length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setIsSoilGroupingModalOpen(true)}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg text-base font-medium transition-all duration-200 flex items-center justify-center gap-1.5 border",
                            "flex-1 sm:flex-none",
                            separateSoil
                              ? isDarkMode
                                ? "bg-lime-900/30 border-lime-700 text-lime-400"
                                : "bg-lime-50 border-lime-300 text-lime-700"
                              : isDarkMode
                                ? "bg-neutral-700/50 border-neutral-600 text-neutral-400 hover:text-neutral-200"
                                : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:text-neutral-900",
                          )}
                        >
                          <i className="fa-solid fa-mountain text-xs" />
                          <span>Soil</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Conditional rendering based on view mode */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewMode}
                      initial={{
                        opacity: 0,
                        x:
                          viewMode === "spatial"
                            ? 0
                            : viewMode === "timeline" ||
                                viewMode === "dominance"
                              ? 10
                              : -10,
                        scale: viewMode === "spatial" ? 0.98 : 1,
                      }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{
                        opacity: 0,
                        x:
                          viewMode === "spatial"
                            ? 0
                            : viewMode === "timeline" ||
                                viewMode === "dominance"
                              ? -10
                              : 10,
                        scale: viewMode === "spatial" ? 0.98 : 1,
                      }}
                      transition={{
                        duration: viewMode === "spatial" ? 0.3 : 0.2,
                      }}
                      className={
                        viewMode === "spatial"
                          ? "flex flex-col gap-4"
                          : undefined
                      }
                    >
                      {viewMode === "succession" && (
                        <SuccessionWavesChart
                          segments={segments}
                          isWidescreen={isWidescreen}
                          isDarkMode={isDarkMode}
                          selectedYear={selectedYear}
                          onYearSelect={setSelectedYear}
                          onInfoClick={handleOpenSuccessionModal}
                        />
                      )}
                      {viewMode === "layers" && (
                        <LayerMap
                          ingredients={selectedIngredients}
                          isDarkMode={isDarkMode}
                          isWidescreen={isWidescreen}
                          selectedYear={selectedYear}
                          onYearSelect={setSelectedYear}
                        />
                      )}
                      {viewMode === "timeline" && (
                        <TimelineGantt
                          segments={segments}
                          isWidescreen={isWidescreen}
                          isDarkMode={isDarkMode}
                        />
                      )}
                      {viewMode === "dominance" && (
                        <DominanceChart
                          ingredients={selectedIngredients}
                          isDarkMode={isDarkMode}
                          isWidescreen={isWidescreen}
                          speciesCountConfig={speciesCountConfig}
                        />
                      )}
                      {viewMode === "spatial" && (
                        <>
                          {/* Time Cursor for 3D view */}
                          <TimeCursor
                            year={activeYear}
                            onYearChange={setActiveYear}
                            maxYear={effectiveDuration}
                            isDarkMode={isDarkMode}
                            simulationSpeedYearsPerSecond={
                              timelinePlaybackSpeed
                            }
                            // Keep base-layout cursor passive; in embedded fullscreen
                            // this instance is hidden behind the fullscreen surface.
                            onSimulatingChange={setIsSimulating}
                            onDraggingChange={setIsDraggingTime}
                            durationOptions={durationOptions}
                            selectedDuration={durationOverride}
                            onDurationChange={setDurationOverride}
                          />

                          {/* 3D Forest Visualization */}
                          <div className="relative h-[500px] lg:h-[600px]">
                            {/* Legend: amber border = visible in Cove */}
                            <div
                              className={clsx(
                                "absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 rounded-md text-xs pointer-events-none transition-opacity duration-500",
                                isDarkMode
                                  ? "bg-black/60 text-neutral-200"
                                  : "bg-black/50 text-white",
                                visibleIngredientIds.size > 0 &&
                                  visibleIngredientIds.size <
                                    selectedIngredients.length
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            >
                              <span className="w-2.5 h-2.5 rounded-sm border-2 border-amber-500 flex-shrink-0" />
                              Active
                            </div>

                            <Suspense
                              fallback={
                                <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded-xl">
                                  <div className="flex h-full items-center justify-center">
                                    <div className="flex flex-col items-center gap-3 opacity-40">
                                      <div className="h-16 w-16 animate-pulse rounded-2xl bg-neutral-300 dark:bg-neutral-700" />
                                      <div className="h-3 w-24 animate-pulse rounded bg-neutral-300 dark:bg-neutral-700" />
                                    </div>
                                  </div>
                                </div>
                              }
                            >
                              {/* isSimulating: true when time is moving (auto-play OR dragging)
                                This makes fruit particles fall; when false, they hang static */}
                              {isIntegrationCockpitOpen ? (
                                <IntegrationCockpit
                                  ingredients={selectedIngredients}
                                  year={activeYear}
                                  isDraggingTime={isDraggingTime}
                                  isDarkMode={forest3DIsDarkMode}
                                  isSimulating={isSimulating || isDraggingTime}
                                  soilGrouping={elementalGrouping.soil}
                                  respawnConfig={respawnConfig}
                                  speciesCountConfig={speciesCountConfig}
                                  positionOverrides={positionOverrides}
                                  onPositionChange={
                                    canRepositionPlants
                                      ? (volumeId, pos) => {
                                          setPositionOverrides((prev) => ({
                                            ...prev,
                                            [volumeId]: pos,
                                          }));
                                        }
                                      : undefined
                                  }
                                  onArrange={setPositionOverrides}
                                  onClose={() =>
                                    setIsIntegrationCockpitOpen(false)
                                  }
                                  canClose={showIntegrationEntry}
                                  readOnly={readOnly}
                                  showGroundDressing={showGroundDressing}
                                  cameraDistanceScale={
                                    forest3DCameraDistanceScale
                                  }
                                  controlsDefaultExpanded={
                                    forest3DControlsDefaultExpanded
                                  }
                                  forceMobilePanel={forceIntegrationPanelMobile}
                                  onCollapsedPanelClick={
                                    onCollapsedIntegrationPanelClick
                                  }
                                  onVolumeClick={(id) => {
                                    const ingredient = IngredientMap[id];
                                    if (ingredient) {
                                      openFocusedIngredient(ingredient);
                                    }
                                  }}
                                />
                              ) : (
                                <Forest3D
                                  ingredients={selectedIngredients}
                                  year={activeYear}
                                  structures={{ separateSoil }}
                                  isDarkMode={forest3DIsDarkMode}
                                  isSimulating={isSimulating || isDraggingTime}
                                  soilGrouping={elementalGrouping.soil}
                                  respawnConfig={respawnConfig}
                                  speciesCountConfig={speciesCountConfig}
                                  positionOverrides={positionOverrides}
                                  onPositionChange={
                                    canRepositionPlants
                                      ? (volumeId, pos) => {
                                          setPositionOverrides((prev) => ({
                                            ...prev,
                                            [volumeId]: pos,
                                          }));
                                        }
                                      : undefined
                                  }
                                  readOnly={readOnly}
                                  showGroundDressing={showGroundDressing}
                                  cameraDistanceScale={
                                    forest3DCameraDistanceScale
                                  }
                                  controlsDefaultExpanded={
                                    forest3DControlsDefaultExpanded
                                  }
                                  onVolumeClick={(id) => {
                                    const ingredient = IngredientMap[id];
                                    if (ingredient) {
                                      openFocusedIngredient(ingredient);
                                    }
                                  }}
                                />
                              )}
                            </Suspense>

                            {/* Fullscreen and Integration buttons */}
                            <button
                              onClick={() => setIsFullscreen3D(true)}
                              className={clsx(
                                "absolute top-4 left-4 px-3 py-2 rounded-lg",
                                "backdrop-blur-sm flex items-center gap-2",
                                "hover:scale-105 transition-all",
                                isDarkMode
                                  ? "bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700/80"
                                  : "bg-white/80 text-neutral-700 hover:bg-white/90",
                              )}
                            >
                              <i className="fa-solid fa-expand text-base" />
                              <span className="text-base font-medium">
                                Fullscreen
                              </span>
                            </button>
                            {showIntegrationEntry && (
                              <button
                                onClick={() =>
                                  setIsIntegrationCockpitOpen((prev) => !prev)
                                }
                                className={clsx(
                                  "absolute top-4 left-40 px-3 py-2 rounded-lg",
                                  "backdrop-blur-sm flex items-center gap-2",
                                  "hover:scale-105 transition-all",
                                  isIntegrationCockpitOpen
                                    ? "bg-emerald-600/90 text-white"
                                    : isDarkMode
                                      ? "bg-neutral-800/80 text-neutral-200 hover:bg-neutral-700/80"
                                      : "bg-white/80 text-neutral-700 hover:bg-white/90",
                                )}
                              >
                                <i className="fa-solid fa-gauge-high text-base" />
                                <span className="text-base font-medium">
                                  Integration
                                </span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Sidebar - Sample Design Card & Narrative (widescreen only) */}
              {isWidescreen && (
                <div className="sticky top-4 self-start flex flex-col gap-4">
                  {!readOnly && (
                    <SampleDesignCard
                      isDarkMode={isDarkMode}
                      onLoadSample={loadSampleForest}
                      currentIngredientIds={selectedIngredients.map(
                        (i) => i.id,
                      )}
                    />
                  )}
                  <NarrativeSection
                    narratives={narratives}
                    isDarkMode={isDarkMode}
                    className={clsx(
                      "rounded-xl p-4 lg:p-5 border",
                      isDarkMode
                        ? "bg-neutral-800/30 border-neutral-700"
                        : "bg-gradient-to-br from-emerald-50/50 to-white border-neutral-200",
                    )}
                  />
                </div>
              )}

              {/* Mobile: Sample Design Card & Narrative Section (below charts) */}
              {!isWidescreen && (
                <>
                  {!readOnly && (
                    <SampleDesignCard
                      isDarkMode={isDarkMode}
                      onLoadSample={loadSampleForest}
                      currentIngredientIds={selectedIngredients.map(
                        (i) => i.id,
                      )}
                    />
                  )}
                  <NarrativeSection
                    narratives={narratives}
                    isDarkMode={isDarkMode}
                    className={clsx(
                      "rounded-xl p-4 border",
                      isDarkMode
                        ? "bg-neutral-800/30 border-neutral-700"
                        : "bg-gradient-to-br from-emerald-50/50 to-white border-neutral-200",
                    )}
                  />
                </>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Succession Overview Modal */}
      {createPortal(
        <Suspense>
          {isSuccessionModalOpen && (
            <Modal
              widthClasses="lg:w-[700px] w-[95%]"
              heightClasses="max-h-[90vh]"
              onDismiss={() => setIsSuccessionModalOpen(false)}
              scrollable
            >
              <div className="space-y-5 p-4">
                {(() => {
                  const { beforeImage, afterImage } = parseSuccessionOverview(
                    successionOverviewHTML,
                  );
                  return (
                    <>
                      <p dangerouslySetInnerHTML={{ __html: beforeImage }} />
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <img
                            src={successionImg}
                            alt="Ecological succession"
                            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                          />
                        </div>
                      </div>
                      <div className="space-y-5">
                        {afterImage.map((paragraph, index) => (
                          <p
                            key={index}
                            dangerouslySetInnerHTML={{ __html: paragraph }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setIsSuccessionModalOpen(false)}
                          className={clsx(
                            "px-4 py-2 rounded-lg text-base font-medium border",
                            isDarkMode
                              ? "border-neutral-600 text-neutral-100 hover:bg-neutral-700"
                              : "border-neutral-300 text-neutral-700 hover:bg-neutral-100",
                          )}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </Modal>
          )}
        </Suspense>,
        document.body,
      )}

      {/* Soil Grouping Modal */}
      {!readOnly &&
        createPortal(
          <Suspense fallback={null}>
            {isSoilGroupingModalOpen && (
              <Modal
                widthClasses="lg:w-[500px] w-[95%]"
                heightClasses="max-h-[80vh]"
                onDismiss={() => setIsSoilGroupingModalOpen(false)}
                scrollable={false}
              >
                <ElementalGroupManager
                  dimension="soil"
                  dimensionLabel="Soil Groups"
                  dimensionIcon="fa-mountain"
                  grouping={soilGroupingForModal}
                  onGroupingChange={updateSoilGrouping}
                  availableIngredients={availableIngredientsForGrouping}
                  isDarkMode={isDarkMode}
                  onClose={() => setIsSoilGroupingModalOpen(false)}
                />
              </Modal>
            )}
          </Suspense>,
          document.body,
        )}

      {/* Respawn Modal */}
      {!readOnly &&
        createPortal(
          <Suspense fallback={null}>
            {isRespawnModalOpen && (
              <Modal
                widthClasses="lg:w-[500px] w-[95%]"
                heightClasses="max-h-[80vh]"
                onDismiss={() => setIsRespawnModalOpen(false)}
                scrollable={false}
              >
                <RespawnModal
                  ingredients={selectedIngredients}
                  respawnConfig={respawnConfig}
                  onRespawnConfigChange={setRespawnConfig}
                  onClose={() => setIsRespawnModalOpen(false)}
                  isDarkMode={isDarkMode}
                />
              </Modal>
            )}
          </Suspense>,
          document.body,
        )}

      {/* Species Count Modal */}
      {!readOnly &&
        createPortal(
          <Suspense fallback={null}>
            {isSpeciesCountModalOpen && (
              <Modal
                widthClasses="lg:w-[500px] w-[95%]"
                heightClasses="max-h-[80vh]"
                onDismiss={() => setIsSpeciesCountModalOpen(false)}
                scrollable={false}
              >
                <SpeciesCountModal
                  ingredients={selectedIngredients}
                  speciesCountConfig={speciesCountConfig}
                  onSpeciesCountConfigChange={setSpeciesCountConfig}
                  onClose={() => setIsSpeciesCountModalOpen(false)}
                  isDarkMode={isDarkMode}
                />
              </Modal>
            )}
          </Suspense>,
          document.body,
        )}
      {/* GrowableIngredients Pantry Modal */}
      {!readOnly &&
        createPortal(
          <Suspense>
            {isPantryVisible && (
              <Modal
                widthClasses="lg:w-[90%] w-[95%]"
                heightClasses="h-[90vh]"
                onDismiss={() => {
                  setIsPantryVisible(false);
                  setRestrictedIngredientIds(undefined);
                  setSearchParams((prev) => {
                    const newParams = new URLSearchParams(prev);
                    // Clear all filter params when modal closes
                    newParams.delete("types");
                    newParams.delete("search");
                    newParams.delete("tastes");
                    newParams.delete("qualities");
                    newParams.delete("plantGrowth");
                    newParams.delete("growth"); // alias for plantGrowth
                    newParams.delete("fungiGrowth");
                    newParams.delete("algaeGrowth");
                    newParams.delete("ecoFunction");
                    newParams.delete("succession");
                    return newParams;
                  });
                }}
                scrollable={false}
              >
                <IngredientsPage
                  restrictToIngredientIds={restrictedIngredientIds}
                  onIngredientIdsSelect={(ingredientIds) => {
                    const newIngredients = ingredientIds
                      .map((id) => IngredientMap[id])
                      .filter((i): i is Ingredient => !!i);
                    // Combine both operations into a single setSearchParams call to avoid React batching issues
                    // Use replace: true to avoid creating unnecessary history entries
                    setSearchParams(
                      (prev) => {
                        const newParams = new URLSearchParams(prev);
                        // Update ingredients
                        if (newIngredients.length > 0) {
                          newParams.set(
                            "ingredients",
                            newIngredients.map((i) => i.id).join(","),
                          );
                        } else {
                          newParams.delete("ingredients");
                        }
                        // Clear all filter params after selection
                        newParams.delete("types");
                        newParams.delete("search");
                        newParams.delete("tastes");
                        newParams.delete("qualities");
                        newParams.delete("plantGrowth");
                        newParams.delete("growth"); // alias for plantGrowth
                        newParams.delete("fungiGrowth");
                        newParams.delete("algaeGrowth");
                        newParams.delete("ecoFunction");
                        newParams.delete("succession");
                        return newParams;
                      },
                      { replace: true },
                    );
                    // Close modal and clear restriction after selection
                    setIsPantryVisible(false);
                    setRestrictedIngredientIds(undefined);
                  }}
                  selectedIngredientIds={selectedIngredients.map((i) => i.id)}
                />
              </Modal>
            )}
          </Suspense>,
          document.body,
        )}

      {/* Fullscreen 3D View */}
      {embeddedFullscreen ? (
        <AnimatePresence>
          {isFullscreen3D ? renderFullscreenSurface(true) : null}
        </AnimatePresence>
      ) : (
        createPortal(
          <AnimatePresence>
            {isFullscreen3D ? renderFullscreenSurface(false) : null}
          </AnimatePresence>,
          document.body,
        )
      )}
    </div>
  );
}
