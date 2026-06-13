import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  IngredientProfilesVisibleMetaAtom,
  IsMenuOpenAtom,
  FocusedIngredientAtom,
} from "../../state";
import IngredientCard from "./Cards/Single";
import { GrowableIngredients, IngredientMap } from "./data/species";
import {
  GrowthOptions,
  PlantGrowthSections,
  FungiGrowthSections,
  AlgaeGrowthSections,
  SuccessionSections,
  SuccessionProperties,
  successionLabelMap,
  successionLabelToToken,
  yearsToHarvestRanges,
  productiveLifespanRanges,
} from "./growthOptions";
import { useCircadianTheme, useIsWidescreen } from "../../util/hooks/general";
import clsx from "clsx";
import { createPortal } from "react-dom";
// import Modal from "../Modal";
import Dropdown from "../Dropdown";
import { IngredientTypes, TasteMap, Tastes } from "./Taste/data";
import { TasteType } from "./Taste/types";
import {
  useParams,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { QualityMap, Qualities } from "./Qualities/Quality/data";
import { QualityType } from "./Qualities/Quality/types";
import {
  AlgaeHabitatType,
  AlgaeLifeCycleType,
  AlgaeLightPreferenceType,
  AlgaeMoisturePreferenceType,
  AlgaeSubstrateType,
  AlgaeTemperatureToleranceType,
  FrostToleranceType,
  FungiGrowthFormType,
  FungiLifeCycleType,
  FungiLightPreferenceType,
  FungiMoisturePreferenceType,
  FungiSubstrateDepthType,
  FungiTemperatureToleranceType,
  GrowthFormType,
  HeightClassType,
  IngredientType,
  LifeCycleType,
  LightPreferenceType,
  SoilPreferenceType,
} from "./types";
import type { EcologicalProcessFunctionType } from "../Forest/Conditions/types";
import Button from "../Button";
import FilterPanel from "./FilterPanel";
import Input from "../Input";
// import IngredientsKeyboardControls from "./KeyboardControls";
import KeyboardShortcutTooltip from "../Tooltip/KeyboardShortcut";

import { ingredientMatchesSearchTerm } from "../../util/functions";
import { IngredientTypeProfiles } from "./IngredientType/data";
import { useVirtualizedGrid } from "../../util/hooks/useVirtualizedGrid";
import Modal from "../Modal";

export const SIDEBAR_WIDTH = 300;
export const INGREDIENT_CARD_CONTAINER_PADDING_LEFT = 4;
export const INGREDIENT_CARD_WIDTH = 150;
export const INGREDIENT_CARD_HEIGHT_WIDESCREEN = 140;
export const INGREDIENT_CARD_HEIGHT_MOBILE = 120;
export const INGREDIENT_CARD_GAP = 25;

interface Props {
  onIngredientIdsSelect?: (ingredientIds: string[]) => void;
  selectedIngredientIds?: string[];
  /** Pre-select an ingredient type filter when opening (e.g., "process" for support species) */
  initialIngredientTypeFilter?: IngredientType;
  /** When provided, only show these specific ingredients (other filters still apply on top) */
  restrictToIngredientIds?: string[];
  /** When true, clicking an ingredient updates route to /ingredients/:id */
  navigateOnIngredientClick?: boolean;
  /** Force dark mode styling within this page regardless of global theme */
  enforceDarkMode?: boolean;
}

export default function IngredientsPage({
  onIngredientIdsSelect,
  selectedIngredientIds: initialSelectedIngredientIds,
  initialIngredientTypeFilter,
  restrictToIngredientIds,
  navigateOnIngredientClick = true,
  enforceDarkMode = false,
}: Props) {
  const { ingredientName } = useParams();
  const [isSearchInputFocused, setIsSearchInputFocused] = useState(false);
  const isIngredientSelectMode = !!onIngredientIdsSelect;
  const navigate = useNavigate();
  const { search } = useLocation();
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const setFocusedIngredientState = useSetAtom(FocusedIngredientAtom);
  const isMenuOpen = useAtomValue(IsMenuOpenAtom);

  const [selectedIngredientIds, setSelectedIngredientIds] = useState<string[]>(
    initialSelectedIngredientIds || [],
  );
  const [
    isShowingOnlyIngredientsWithCombos,
    setIsShowingOnlyIngredientsWithCombos,
  ] = useState(false);
  const isWidescreen = useIsWidescreen();
  const [isMobileFilterModalOpen, setIsMobileFilterModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTastes, setActiveTastes] = useState<TasteType[]>([]);
  const [activeIngredientTypes, setActiveIngredientTypes] = useState<
    IngredientType[]
  >(initialIngredientTypeFilter ? [initialIngredientTypeFilter] : []);
  // const [activeCuisines, setActiveCuisines] = useState<CuisineType[]>([]);
  const [activeQualities, setActiveQualities] = useState<QualityType[]>([]);
  const [activePlantGrowth, setActivePlantGrowth] = useState<string[]>([]);
  const [activeFungiGrowth, setActiveFungiGrowth] = useState<string[]>([]);
  const [activeAlgaeGrowth, setActiveAlgaeGrowth] = useState<string[]>([]);
  // Succession filters
  const [activeSuccession, setActiveSuccession] = useState<string[]>([]);
  // Ecological function filters (for support species)
  const [activeEcologicalFunctions, setActiveEcologicalFunctions] = useState<
    EcologicalProcessFunctionType[]
  >([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [searchParams, setSearchParams] = useSearchParams();
  const setIngredientProfilesVisibleMeta = useSetAtom(
    IngredientProfilesVisibleMetaAtom,
  );
  const [growthDomain] = useState<"plant" | "fungi" | "algae">("plant");

  useEffect(() => {
    document.title = "PerillaCove - Ingredients";
  }, []);

  // moved to ./growthOptions

  const filteredIngredients = useMemo(() => {
    // If restricted to specific IDs, show ONLY those (with optional search filter)
    if (restrictToIngredientIds) {
      const restricted = GrowableIngredients.filter((i) =>
        restrictToIngredientIds.includes(i.id),
      );
      // Still allow search to filter within the restricted set
      if (searchTerm.trim()) {
        return restricted.filter((ingredient) =>
          ingredientMatchesSearchTerm(ingredient.id, searchTerm),
        );
      }
      return restricted;
    }

    // Otherwise, apply all normal filters
    return GrowableIngredients.filter((ingredient) => {
      // Name filter (checks both ID and display name)
      const nameMatch = ingredientMatchesSearchTerm(ingredient.id, searchTerm);

      // Tastes filter
      const tastesMatch = activeTastes.every((taste) => {
        return ingredient.properties.tastes?.includes(taste);
      });

      // Qualities filter
      const qualitiesMatch = activeQualities.every((quality) => {
        return ingredient.properties.qualities?.includes(quality);
      });

      // Ingredient type filter
      const ingredientTypeMatch = activeIngredientTypes.every((type) => {
        return ingredient.type === type;
      });

      // Growth filters (separate domains)
      const g = ingredient.properties.growth;
      const f = ingredient.properties.fungiGrowth;
      const a = ingredient.properties.algaeGrowth;
      const tokenInPlant = (token: string) =>
        !!g &&
        ((g.growthForms?.includes(token as GrowthFormType) ||
          g.lightPreferences?.includes(token as LightPreferenceType) ||
          g.lifeCycles?.includes(token as LifeCycleType) ||
          g.heightClasses?.includes(token as HeightClassType) ||
          g.frostTolerances?.includes(token as FrostToleranceType) ||
          g.soilPreferences?.includes(token as SoilPreferenceType)) ??
          false);
      const tokenInFungi = (token: string) =>
        !!f &&
        ((f.substrateDepths?.includes(token as FungiSubstrateDepthType) ||
          f.lightPreferences?.includes(token as FungiLightPreferenceType) ||
          f.lifeCycles?.includes(token as FungiLifeCycleType) ||
          f.growthForms?.includes(token as FungiGrowthFormType) ||
          f.temperatureTolerances?.includes(
            token as FungiTemperatureToleranceType,
          ) ||
          f.soilPreferences?.includes(token as FungiMoisturePreferenceType)) ??
          false);
      const tokenInAlgae = (token: string) =>
        !!a &&
        ((a.habitats?.includes(token as AlgaeHabitatType) ||
          a.lightPreferences?.includes(token as AlgaeLightPreferenceType) ||
          a.substrates?.includes(token as AlgaeSubstrateType) ||
          a.temperatureTolerances?.includes(
            token as AlgaeTemperatureToleranceType,
          ) ||
          a.soilPreferences?.includes(token as AlgaeMoisturePreferenceType) ||
          a.lifeCycles?.includes(token as AlgaeLifeCycleType)) ??
          false);

      const plantGrowthMatch = activePlantGrowth.every(tokenInPlant);
      const fungiGrowthMatch = activeFungiGrowth.every(tokenInFungi);
      const algaeGrowthMatch = activeAlgaeGrowth.every(tokenInAlgae);

      // Succession filter (enum properties)
      const succession = ingredient.properties.succession;
      const successionMatch = activeSuccession.every((token) => {
        if (!succession) return false;
        // Check which property this token belongs to
        if (["pioneer", "early", "mid", "late", "legacy"].includes(token)) {
          return succession.successionalPhase === token;
        }
        if (
          ["full_sun", "filtered_light", "deep_shade", "partial_sun"].includes(
            token,
          )
        ) {
          return succession.establishmentLight === token;
        }
        if (["short_rotation", "medium_rotation", "keep"].includes(token)) {
          return succession.managementRotation === token;
        }
        // Years to harvest categorical filter
        if (token.startsWith("harvest_")) {
          const range = yearsToHarvestRanges[token];
          if (!range || !succession.yearsToFirstHarvest) return false;
          // Check if ingredient's harvest range overlaps with the category range
          return (
            succession.yearsToFirstHarvest[0] <= range[1] &&
            succession.yearsToFirstHarvest[1] >= range[0]
          );
        }
        // Productive lifespan categorical filter
        if (token.startsWith("lifespan_")) {
          const range = productiveLifespanRanges[token];
          if (!range || !succession.productiveLifespanYears) return false;
          // Check if ingredient's lifespan range overlaps with the category range
          return (
            succession.productiveLifespanYears[0] <= range[1] &&
            succession.productiveLifespanYears[1] >= range[0]
          );
        }
        return false;
      });

      // Ecological function filter (for support species)
      const ecoFunctions =
        ingredient.properties.ecologicalProcess?.functions || [];
      const ecologicalFunctionMatch = activeEcologicalFunctions.every((fn) =>
        ecoFunctions.includes(fn),
      );

      // Cuisine filter
      // const cuisineMatch = activeCuisines.every((cuisine) => {
      //   return ingredient.properties.cuisines?.includes(cuisine);
      // });

      return (
        nameMatch &&
        tastesMatch &&
        qualitiesMatch &&
        plantGrowthMatch &&
        fungiGrowthMatch &&
        algaeGrowthMatch &&
        ingredientTypeMatch &&
        successionMatch &&
        ecologicalFunctionMatch
      );
    });
  }, [
    restrictToIngredientIds,
    searchTerm,
    activeTastes,
    activeQualities,
    activePlantGrowth,
    activeFungiGrowth,
    activeAlgaeGrowth,
    activeSuccession,
    activeEcologicalFunctions,
    // activeCuisines,
    activeIngredientTypes,
  ]);

  // Virtualized grid configuration
  const cardWidth = isWidescreen ? INGREDIENT_CARD_WIDTH : 150;
  const cardHeight = isWidescreen
    ? INGREDIENT_CARD_HEIGHT_WIDESCREEN
    : INGREDIENT_CARD_HEIGHT_MOBILE;
  const gap = isWidescreen ? INGREDIENT_CARD_GAP : 12;

  const {
    containerRef,
    gridRef,
    totalHeight,
    virtualItems,
    scrollToIndex,
    isReady,
  } = useVirtualizedGrid({
    cardWidth,
    cardHeight,
    gap,
    totalItems: filteredIngredients.length,
    overscan: 5,
    // On mobile, force 2 columns and stretch cards to fill width
    fixedColumns: isWidescreen ? undefined : 2,
  });

  const preloadComponents = () => {
    // Trigger the dynamic imports
    import("./Qualities");
  };

  const isFilterActive = useMemo(() => {
    return (
      activeTastes.length > 0 ||
      activeQualities.length > 0 ||
      activePlantGrowth.length > 0 ||
      activeFungiGrowth.length > 0 ||
      activeAlgaeGrowth.length > 0 ||
      activeSuccession.length > 0 ||
      activeEcologicalFunctions.length > 0 ||
      // activeCuisines.length > 0 ||
      activeIngredientTypes.length > 0 ||
      (searchTerm.length > 0 && isWidescreen) ||
      isShowingOnlyIngredientsWithCombos
    );
  }, [
    activeTastes,
    activeQualities,
    activePlantGrowth,
    activeFungiGrowth,
    activeAlgaeGrowth,
    activeSuccession,
    activeEcologicalFunctions,
    // activeCuisines,
    activeIngredientTypes,
    searchTerm,
    isShowingOnlyIngredientsWithCombos,
    isWidescreen,
  ]);

  useEffect(() => {
    preloadComponents();
  }, []);

  // set the focused ingredient based on the route param :ingredientName
  useEffect(() => {
    if (!ingredientName) return;
    const ingredient = IngredientMap[ingredientName];
    if (!ingredient) return;
    setFocusedIngredientState({ ingredient, showComboButton: false });
  }, [ingredientName, setFocusedIngredientState]);

  // Note: URL navigation for focused ingredient is now handled via the route param
  // The global modal handles display, navigation is triggered when opening the modal

  // Track whether we previously had a `search` param so we can clear stale
  // search terms when suggestions open the pantry with a different filter set.
  const prevSearchParam = useRef<string | null>(null);

  // Initialize filters from URL params
  useEffect(() => {
    const tastes = searchParams.get("tastes")?.split(",").filter(Boolean) || [];
    const qualities =
      searchParams.get("qualities")?.split(",").filter(Boolean) || [];
    const types = searchParams.get("types")?.split(",").filter(Boolean) || [];
    const plantGrowth =
      (searchParams.get("plantGrowth") || searchParams.get("growth") || "")
        .split(",")
        .filter(Boolean) || [];
    const fungiGrowth =
      searchParams.get("fungiGrowth")?.split(",").filter(Boolean) || [];
    const algaeGrowth =
      searchParams.get("algaeGrowth")?.split(",").filter(Boolean) || [];
    // Ecological function filter (for support species filtering by function)
    const ecoFunction =
      searchParams.get("ecoFunction")?.split(",").filter(Boolean) || [];
    // Support search param for pre-populating search term (e.g., from diagnostic suggestions)
    const searchFromParams = searchParams.get("search");
    // const cuisines =
    //   searchParams.get("cuisines")?.split(",").filter(Boolean) || [];

    setActiveTastes(
      tastes.map((t) => Tastes.find((r) => r.name === t)?.id as TasteType),
    );
    setActiveQualities(
      qualities.map(
        (q) => Qualities.find((g) => g.name === q)?.id as QualityType,
      ),
    );
    setActiveIngredientTypes(
      types.map((t) => IngredientTypes.find((g) => g === t) as IngredientType),
    );
    setActivePlantGrowth(plantGrowth);
    setActiveFungiGrowth(fungiGrowth);
    setActiveAlgaeGrowth(algaeGrowth);
    setActiveEcologicalFunctions(
      ecoFunction as EcologicalProcessFunctionType[],
    );
    if (searchFromParams !== null) {
      // Explicitly set (including empty) when the param is present.
      prevSearchParam.current = searchFromParams;
      setSearchTerm(searchFromParams.replace(/_/g, " "));
    } else if (prevSearchParam.current !== null) {
      // If it used to exist but was removed, clear the input so stale searches
      // (ex: "alder") don't persist across suggestion clicks.
      prevSearchParam.current = null;
      setSearchTerm("");
    }
    // setActiveCuisines(
    //   cuisines.map(
    //     (c) => Cuisines.find((g) => g.name === c)?.id as CuisineType,
    //   ),
    // );
  }, [searchParams]);

  const onTasteChange = (tastes: string[]) => {
    setActiveTastes(
      tastes.map((t) => Tastes.find((r) => r.name === t)?.id as TasteType),
    );
    updateSearchParams("tastes", tastes);
  };

  const onQualityChange = (qualities: string[]) => {
    setActiveQualities(
      qualities.map(
        (q) => Qualities.find((g) => g.name === q)?.id as QualityType,
      ),
    );
    updateSearchParams("qualities", qualities);
  };

  const onIngredientTypeChange = (types: string[]) => {
    setActiveIngredientTypes(
      types.map((t) => IngredientTypes.find((g) => g === t) as IngredientType),
    );
    updateSearchParams("types", types);
  };

  const onPlantGrowthChange = (values: string[]) => {
    const tokens = values
      .map((label) => GrowthOptions.plantLabelToToken[label])
      .filter(Boolean);
    setActivePlantGrowth(tokens);
    updateSearchParams("plantGrowth", tokens);
  };
  const onFungiGrowthChange = (values: string[]) => {
    const tokens = values
      .map((label) => GrowthOptions.fungiLabelToToken[label])
      .filter(Boolean);
    setActiveFungiGrowth(tokens);
    updateSearchParams("fungiGrowth", tokens);
  };
  const onAlgaeGrowthChange = (values: string[]) => {
    const tokens = values
      .map((label) => GrowthOptions.algaeLabelToToken[label])
      .filter(Boolean);
    setActiveAlgaeGrowth(tokens);
    updateSearchParams("algaeGrowth", tokens);
  };

  const onSuccessionChange = (values: string[]) => {
    const tokens = values
      .map((label) => successionLabelToToken[label])
      .filter(Boolean);
    setActiveSuccession(tokens);
    updateSearchParams("succession", tokens);
  };

  // Ecological function options for support species
  const ecoFunctionOptions: {
    token: EcologicalProcessFunctionType;
    label: string;
  }[] = [
    { token: "fertility_nitrogen_fixer", label: "Nitrogen Fixer" },
    { token: "fertility_nutrient_pump", label: "Nutrient Pump (Deep-rooted)" },
    { token: "biomass_engine", label: "Biomass Engine" },
    { token: "microclimate_builder", label: "Microclimate Builder" },
    { token: "succession_pioneer", label: "Pioneer" },
    { token: "succession_scaffold", label: "Scaffold" },
    { token: "pollinator_support", label: "Pollinator Support" },
    { token: "groundcover_armor", label: "Groundcover Armor" },
    { token: "hydrology_support", label: "Hydrology Support" },
    { token: "living_trellis", label: "Living Trellis" },
    { token: "soil_structure_builder", label: "Soil Structure Builder" },
  ];

  const ecoFunctionLabelToToken = ecoFunctionOptions.reduce(
    (acc, opt) => {
      acc[opt.label] = opt.token;
      return acc;
    },
    {} as Record<string, EcologicalProcessFunctionType>,
  );

  const ecoFunctionTokenToLabel = ecoFunctionOptions.reduce(
    (acc, opt) => {
      acc[opt.token] = opt.label;
      return acc;
    },
    {} as Record<EcologicalProcessFunctionType, string>,
  );

  const onEcologicalFunctionChange = (values: string[]) => {
    const tokens = values
      .map((label) => ecoFunctionLabelToToken[label])
      .filter(Boolean);
    setActiveEcologicalFunctions(tokens);
    updateSearchParams("ecoFunction", tokens);
  };

  // const onCuisineChange = (cuisines: string[]) => {
  //   setActiveCuisines(
  //     cuisines.map(
  //       (c) => Cuisines.find((g) => g.name === c)?.id as CuisineType,
  //     ),
  //   );
  //   updateSearchParams("cuisines", cuisines);
  // };

  const updateSearchParams = (key: string, values: string[]) => {
    const newSearchParams = new URLSearchParams(searchParams);
    if (values.length > 0) {
      newSearchParams.set(key, values.join(","));
    } else {
      newSearchParams.delete(key);
    }
    setSearchParams(newSearchParams);
  };

  const sloganContainerClasses = clsx({
    "text-xl font-medium w-fit items-center mb-3": true,
    "flex gap-3": isWidescreen || (!isWidescreen && isIngredientSelectMode),
  });

  const clearFilters = useCallback(() => {
    if (!isFilterActive) return;
    setActiveQualities([]);
    setActiveIngredientTypes([]);
    setActiveTastes([]);
    setActivePlantGrowth([]);
    setActiveFungiGrowth([]);
    setActiveAlgaeGrowth([]);
    setActiveSuccession([]);
    setActiveEcologicalFunctions([]);
    // setActiveCuisines([]);
    setSearchTerm("");
    setSearchParams(new URLSearchParams());
    setIsShowingOnlyIngredientsWithCombos(false);
  }, [
    isFilterActive,
    setActiveQualities,
    setActiveIngredientTypes,
    setActiveTastes,
    setActivePlantGrowth,
    setActiveFungiGrowth,
    setActiveAlgaeGrowth,
    setActiveSuccession,
    // setActiveCuisines,
    setSearchTerm,
    setSearchParams,
    setIsShowingOnlyIngredientsWithCombos,
  ]);

  const sidebarClasses = clsx(
    "flex flex-col items-center h-full pb-5 pt-5 pl-3",
    "lg:overflow-y-auto",
  );

  const ingredientSectionContainerClasses = clsx(
    "flex flex-1 flex-col justify-between h-full overflow-y-auto overflow-x-hidden pb-5",
    {
      "lg:border-r border-neutral-300 dark:border-neutral-400": true,
      "w-full": !isWidescreen,
    },
  );

  const onInfoIconClick = (
    label:
      | "taste"
      | "quality"
      | "cuisine"
      | "growth"
      | "fungiGrowth"
      | "algaeGrowth"
      | "ingredientType"
      | "succession",
  ) => {
    setIngredientProfilesVisibleMeta({
      properties:
        label === "taste"
          ? Tastes
          : label === "quality"
            ? Qualities
            : label === "ingredientType"
              ? (IngredientTypeProfiles as unknown as typeof Tastes)
              : label === "succession"
                ? (SuccessionProperties as unknown as typeof Tastes)
                : label === "growth"
                  ? GrowthOptions.plantTokens.map((t) => ({
                      id: t as unknown as never,
                      name:
                        GrowthOptions.plantTokenToLabel[t] ??
                        t.replace(/_/g, " "),
                      description: GrowthOptions.tokenToDescription[t],
                      bgThemeClasses: "bg-neutral-200 dark:bg-neutral-700",
                      examples:
                        GrowthOptions.plantTokenToExamples[t]?.slice() ?? [],
                    }))
                  : label === "fungiGrowth"
                    ? GrowthOptions.fungiTokens.map((t) => ({
                        id: t as unknown as never,
                        name:
                          GrowthOptions.fungiTokenToLabel[t] ??
                          t.replace(/_/g, " "),
                        description: GrowthOptions.tokenToDescription[t],
                        bgThemeClasses: "bg-neutral-200 dark:bg-neutral-700",
                        examples:
                          GrowthOptions.fungiTokenToExamples[t]?.slice() ?? [],
                      }))
                    : GrowthOptions.algaeTokens.map((t) => ({
                        id: t as unknown as never,
                        name:
                          GrowthOptions.algaeTokenToLabel[t] ??
                          t.replace(/_/g, " "),
                        description: GrowthOptions.tokenToDescription[t],
                        bgThemeClasses: "bg-neutral-200 dark:bg-neutral-700",
                        examples:
                          GrowthOptions.algaeTokenToExamples[t]?.slice() ?? [],
                      })),
      label,
    });
  };

  // Scroll to a specific ingredient card
  const scrollCardIntoView = useCallback(
    (index: number) => {
      scrollToIndex(index);
    },
    [scrollToIndex],
  );

  // Update keyboard navigation to use the new layoutInfo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isWidescreen) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchInputFocused(true);
        return;
      }

      if (e.key === "Escape") {
        clearFilters();
        setFocusedIndex(-1);
        return;
      }

      if (e.key === "Enter" && isIngredientSelectMode) {
        e.preventDefault();
        onIngredientIdsSelect?.(selectedIngredientIds);
        return;
      }

      if (!filteredIngredients.length || isIngredientSelectMode) return;

      if (isMenuOpen) return;
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    filteredIngredients,
    isWidescreen,
    focusedIndex,
    clearFilters,
    isIngredientSelectMode,
    selectedIngredientIds,
    onIngredientIdsSelect,
    isMenuOpen,
    scrollCardIntoView,
  ]);

  useEffect(() => {
    const handleClickOutside = () => {
      setFocusedIndex(-1);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      setFocusedIngredientState(null);
    };
  }, [setFocusedIngredientState]);

  const topRowContainerClasses = clsx({
    "flex items-center justify-between pl-1 lg:pr-6 gap-3": true,
    "flex-row": (!isWidescreen && isIngredientSelectMode) || isWidescreen,
    "flex-col": !isWidescreen && !isIngredientSelectMode,
  });
  const searchInputPaddingClasses = isFilterActive
    ? "py-1.5 pl-2 pr-10"
    : "py-1.5 px-2";

  return (
    <div className={enforceDarkMode ? "dark h-full w-full" : "h-full w-full"}>
      <div className="w-full h-full bg-light-gradient dark:bg-dark-gradient overflow-hidden px-3">
        <div className="lg:hidden border-b border-neutral-300 dark:border-neutral-400 w-full flex flex-col lg:items-start items-center lg:pl-4 pt-4">
          <div className="flex items-center gap-2 w-full mb-3">
            <Input
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClasses="w-full"
              placeholder="Cacao"
              value={searchTerm}
              id="search-ingredient"
              name="search-ingredient"
              type="text"
              inputPaddingClasses={searchInputPaddingClasses}
              backgroundColorClasses="bg-white dark:bg-black"
              borderClasses="border border-neutral-300 dark:border-neutral-400"
              leadingIconClasses="fa-solid fa-search"
              onClearInput={isFilterActive ? clearFilters : undefined}
              showClearInputWhenEmpty={isFilterActive}
            />
            <div
              className="p-3 cursor-pointer relative left-[5px]"
              onClick={() => setIsMobileFilterModalOpen(true)}
            >
              <i
                className={`fa-solid fa-layer-group cursor-pointer animate-pulse fa-lg`}
              />
            </div>
          </div>
        </div>
        <div className="flex h-full w-full overflow-x-hidden">
          <div
            className={ingredientSectionContainerClasses}
            style={{ minWidth: 0 }}
            ref={containerRef}
          >
            <div className="flex flex-col w-full">
              <div className={topRowContainerClasses}>
                {isIngredientSelectMode && (
                  <div className="flex items-center gap-4 w-full justify-between mt-4">
                    <div className={sloganContainerClasses}>
                      <span
                        className={`${isDarkMode ? "text-cove-dark" : "text-cove"} font-medium`}
                      >
                        Select
                      </span>
                      <i
                        className={`fa-solid fa-arrow-turn-down relative top-[1px] ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
                      ></i>
                      {selectedIngredientIds.length > 0 && (
                        <span className="relative text-sm text-neutral-700 dark:text-neutral-200 font-medium">
                          ({selectedIngredientIds.length} selected)
                        </span>
                      )}
                    </div>
                    {isIngredientSelectMode &&
                      selectedIngredientIds.length > 0 && (
                        <KeyboardShortcutTooltip
                          shortcut="Enter"
                          position="left"
                          styleAsNormalText
                        >
                          <Button
                            onClick={() => {
                              onIngredientIdsSelect?.(selectedIngredientIds);
                            }}
                            text="Add"
                            paddingClasses="py-1.5 px-4"
                            borderClasses="border-combo"
                            colorClasses="bg-combo text-white"
                            textClasses="text-base"
                          />
                        </KeyboardShortcutTooltip>
                      )}
                  </div>
                )}

                {/* {!isIngredientSelectMode && (
                <ComboButton
                  canEnterToClick
                  keyboardShortcutWidthClasses="lg:w-[200px] w-full"
                  additionalClasses="lg:w-[200px] w-full"
                  keyboardShortcutPosition="left"
                  customKeyboardShortcutCondition={(e) => {
                    return (
                      (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i"
                    );
                  }}
                  customKeyboardShortcut="⌘I"
                  styleKeyboardShortcutAsNormalText
                />
              )} */}
                {/* {isIngredientSelectMode && selectedIngredientIds.length > 0 && (
                <KeyboardShortcutTooltip
                  shortcut="Enter"
                  position="left"
                  styleAsNormalText
                >
                  <Button
                    onClick={() => {
                      if (!canAddIngredientToCombo) return;
                      onIngredientIdsSelect?.(selectedIngredientIds);
                    }}
                    text="Add"
                    paddingClasses="py-1.5 px-4"
                    borderClasses="border-combo"
                    colorClasses="bg-combo text-white"
                    textClasses="text-base"
                    disabled={!canAddIngredientToCombo}
                  />
                </KeyboardShortcutTooltip>
              )} */}
              </div>
              {/* Virtualized grid container */}
              <div
                ref={gridRef}
                style={{
                  height: isReady ? totalHeight : "auto",
                  position: "relative",
                }}
                className="mt-3"
              >
                {/* Render only visible items with absolute positioning */}
                {isReady &&
                  virtualItems.map((virtualItem) => {
                    const ingredient = filteredIngredients[virtualItem.index];
                    if (!ingredient) return null;

                    return (
                      <div key={ingredient.id} style={virtualItem.style}>
                        <IngredientCard
                          onClick={() => {
                            if (isIngredientSelectMode) {
                              setSelectedIngredientIds((prev) => {
                                if (prev.includes(ingredient.id)) {
                                  return prev.filter(
                                    (id) => id !== ingredient.id,
                                  );
                                }
                                return [...prev, ingredient.id];
                              });
                            } else {
                              setFocusedIngredientState({
                                ingredient,
                                showComboButton: false,
                              });
                              if (
                                !isIngredientSelectMode &&
                                navigateOnIngredientClick
                              ) {
                                navigate(
                                  `/ingredients/${ingredient.id}${search}`,
                                  {
                                    replace: true,
                                  },
                                );
                              }
                            }
                          }}
                          ingredient={ingredient}
                          focused={focusedIndex === virtualItem.index}
                          data-index={virtualItem.index}
                          onHover={(ingredientId) => {
                            if (ingredientId === ingredient.id) {
                              setFocusedIndex(virtualItem.index);
                            }
                          }}
                          onHoverOut={() => {
                            setFocusedIndex(-1);
                          }}
                          isSelected={selectedIngredientIds.includes(
                            ingredient.id,
                          )}
                          isSelectable={isIngredientSelectMode}
                          additionalClasses="w-full h-full"
                          enforceDarkMode={enforceDarkMode}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>

            <div
              className={`font-medium mt-4 lg:mt-8 ${
                isDarkMode ? "text-neutral-100" : "text-cove"
              } lg:pl-3`}
            >
              More species coming soon.
            </div>
          </div>
          {isWidescreen && (
            <div
              className={sidebarClasses}
              style={{ width: SIDEBAR_WIDTH, flexShrink: 0 }}
            >
              <Input
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClasses="mb-3 w-full"
                placeholder="Cacao"
                value={searchTerm}
                id="search-ingredient"
                name="search-ingredient"
                type="text"
                inputPaddingClasses={searchInputPaddingClasses}
                backgroundColorClasses="bg-white dark:bg-black"
                borderClasses="border border-neutral-300 dark:border-neutral-400"
                leadingIconClasses="fa-solid fa-search"
                canQuickAccess={!isFilterActive}
                glow={isSearchInputFocused}
                onClearInput={isFilterActive ? clearFilters : undefined}
                showClearInputWhenEmpty={isFilterActive}
              />
              <div className="w-full">
                <Dropdown
                  enforceDarkMode={enforceDarkMode}
                  optionToColorClassesMap={Tastes.reduce(
                    (acc, r) => {
                      acc[r.name] = `${r.bgThemeClasses} text-black`;
                      return acc;
                    },
                    {} as Record<string, string>,
                  )}
                  headerLabel="Tastes"
                  allOptions={Tastes.map((r) => r.name)}
                  checkedOptions={activeTastes.map((t) => TasteMap[t].name)}
                  onChange={onTasteChange}
                  additionalClasses="mb-3"
                  canExpandCollapse={true}
                  expanded={activeTastes.length > 0}
                  searchable
                  searchPlaceholder="gamey"
                  infoIconOnClick={() => onInfoIconClick("taste")}
                />
                <Dropdown
                  enforceDarkMode={enforceDarkMode}
                  searchable
                  headerLabel="Feels"
                  allOptions={Qualities.filter(
                    (g) => !["hot"].includes(g.id),
                  ).map((g) => g.name)}
                  checkedOptions={activeQualities.map(
                    (q) => QualityMap[q].name,
                  )}
                  onChange={onQualityChange}
                  additionalClasses="mb-3"
                  searchPlaceholder="juicy"
                  expanded={activeQualities.length > 0}
                  infoIconOnClick={() => onInfoIconClick("quality")}
                />
                <Dropdown
                  enforceDarkMode={enforceDarkMode}
                  headerLabel="Growth"
                  searchable
                  sections={
                    growthDomain === "plant"
                      ? PlantGrowthSections
                      : growthDomain === "fungi"
                        ? FungiGrowthSections
                        : AlgaeGrowthSections
                  }
                  checkedOptions={
                    growthDomain === "plant"
                      ? activePlantGrowth.map(
                          (t) =>
                            GrowthOptions.plantTokenToLabel[t] ??
                            t.replace(/_/g, " "),
                        )
                      : growthDomain === "fungi"
                        ? activeFungiGrowth.map(
                            (t) =>
                              GrowthOptions.fungiTokenToLabel[t] ??
                              t.replace(/_/g, " "),
                          )
                        : activeAlgaeGrowth.map(
                            (t) =>
                              GrowthOptions.algaeTokenToLabel[t] ??
                              t.replace(/_/g, " "),
                          )
                  }
                  onChange={(vals) => {
                    if (growthDomain === "plant")
                      return onPlantGrowthChange(vals);
                    if (growthDomain === "fungi")
                      return onFungiGrowthChange(vals);
                    return onAlgaeGrowthChange(vals);
                  }}
                  additionalClasses="mb-3"
                  searchPlaceholder={
                    growthDomain === "plant"
                      ? "full sun"
                      : growthDomain === "fungi"
                        ? "surface"
                        : "freshwater"
                  }
                  expanded={
                    growthDomain === "plant"
                      ? activePlantGrowth.length > 0
                      : growthDomain === "fungi"
                        ? activeFungiGrowth.length > 0
                        : activeAlgaeGrowth.length > 0
                  }
                  infoIconOnClick={() =>
                    onInfoIconClick(
                      growthDomain === "plant"
                        ? "growth"
                        : growthDomain === "fungi"
                          ? "fungiGrowth"
                          : "algaeGrowth",
                    )
                  }
                  // topContent={
                  //   <GrowthDomainSwitcher
                  //     growthDomain={growthDomain}
                  //     setGrowthDomain={setGrowthDomain}
                  //   />
                  // }
                />
                <Dropdown
                  enforceDarkMode={enforceDarkMode}
                  headerLabel="Succession"
                  searchable
                  sections={SuccessionSections}
                  checkedOptions={activeSuccession.map(
                    (t) => successionLabelMap[t] ?? t.replace(/_/g, " "),
                  )}
                  onChange={onSuccessionChange}
                  additionalClasses="mb-3"
                  searchPlaceholder="pioneer"
                  expanded={activeSuccession.length > 0}
                  infoIconOnClick={() => onInfoIconClick("succession")}
                />
                {/* <Dropdown
                searchable
                headerLabel="Cuisines"
                allOptions={Cuisines.map((c) => c.name)}
                checkedOptions={activeCuisines}
                onChange={onCuisineChange}
                additionalClasses="mb-3"
                expanded={activeCuisines.length > 0}
                searchPlaceholder="italian"
                infoIconClasses={`fa-solid fa-book-open ${
                  isDarkMode ? "text-neutral-200" : "text-neutral-500"
                }`}
                infoIconOnClick={() => onInfoIconClick("cuisine")}
              /> */}
                <Dropdown
                  enforceDarkMode={enforceDarkMode}
                  searchable
                  headerLabel="Types"
                  allOptions={IngredientTypes}
                  checkedOptions={activeIngredientTypes}
                  onChange={onIngredientTypeChange}
                  onlyOne
                  expanded={activeIngredientTypes.length > 0}
                  searchPlaceholder="fruit"
                  infoIconOnClick={() => onInfoIconClick("ingredientType")}
                />
                {/* Ecological function filter - shows when process type selected or eco filter active */}
                {
                  <Dropdown
                    enforceDarkMode={enforceDarkMode}
                    searchable
                    headerLabel="Function"
                    allOptions={ecoFunctionOptions.map((o) => o.label)}
                    checkedOptions={activeEcologicalFunctions.map(
                      (t) => ecoFunctionTokenToLabel[t] ?? t,
                    )}
                    onChange={onEcologicalFunctionChange}
                    additionalClasses="mb-3 mt-3"
                    expanded={activeEcologicalFunctions.length > 0}
                    searchPlaceholder="nitrogen"
                  />
                }
              </div>
            </div>
          )}
          <>
            {createPortal(
              <>
                {!isWidescreen && isMobileFilterModalOpen && (
                  <Modal
                    widthClasses="lg:w-[500px] w-[95%]"
                    heightClasses="h-fit max-h-[90%]"
                    backgroundColorClasses={
                      enforceDarkMode
                        ? "bg-dark-gradient"
                        : "bg-light-gradient dark:bg-dark-gradient"
                    }
                    scrollable
                    onDismiss={() => setIsMobileFilterModalOpen(false)}
                  >
                    <div
                      className={`${enforceDarkMode ? "dark " : ""}flex flex-col p-3`}
                    >
                      <div className="flex items-center mb-2">
                        <FilterPanel
                          isFilterActive={isFilterActive}
                          clearFilters={clearFilters}
                        />
                        <Button
                          onClick={() => setIsMobileFilterModalOpen(false)}
                          iconClasses="fa-solid fa-xmark fa-lg"
                          borderClasses="border-none"
                          colorClasses="text-black dark:text-white"
                          containerPositionClasses="relative ml-auto"
                        />
                      </div>

                      <Dropdown
                        enforceDarkMode={enforceDarkMode}
                        optionToColorClassesMap={Tastes.reduce(
                          (acc, r) => {
                            acc[r.name] = `${r.bgThemeClasses} text-black`;
                            return acc;
                          },
                          {} as Record<string, string>,
                        )}
                        headerLabel="Tastes"
                        additionalClasses="mb-3"
                        expanded={activeTastes.length > 0}
                        allOptions={Tastes.map((r) => r.name)}
                        checkedOptions={activeTastes.map(
                          (t) => TasteMap[t].name,
                        )}
                        onChange={onTasteChange}
                        canExpandCollapse={true}
                        infoIconOnClick={() => onInfoIconClick("taste")}
                      />
                      <Dropdown
                        enforceDarkMode={enforceDarkMode}
                        searchable
                        headerLabel="Qualities"
                        allOptions={Qualities.filter(
                          (g) => !["hot"].includes(g.id),
                        ).map((g) => g.name)}
                        checkedOptions={activeQualities.map(
                          (q) => QualityMap[q].name,
                        )}
                        onChange={onQualityChange}
                        canExpandCollapse={true}
                        additionalClasses="mb-3"
                        expanded={activeQualities.length > 0}
                        infoIconOnClick={() => onInfoIconClick("quality")}
                      />
                      <Dropdown
                        enforceDarkMode={enforceDarkMode}
                        searchable
                        headerLabel="Growth"
                        sections={
                          growthDomain === "plant"
                            ? PlantGrowthSections
                            : growthDomain === "fungi"
                              ? FungiGrowthSections
                              : AlgaeGrowthSections
                        }
                        checkedOptions={
                          growthDomain === "plant"
                            ? activePlantGrowth.map(
                                (t) =>
                                  GrowthOptions.plantTokenToLabel[t] ??
                                  t.replace(/_/g, " "),
                              )
                            : growthDomain === "fungi"
                              ? activeFungiGrowth.map(
                                  (t) =>
                                    GrowthOptions.fungiTokenToLabel[t] ??
                                    t.replace(/_/g, " "),
                                )
                              : activeAlgaeGrowth.map(
                                  (t) =>
                                    GrowthOptions.algaeTokenToLabel[t] ??
                                    t.replace(/_/g, " "),
                                )
                        }
                        onChange={(vals) => {
                          if (growthDomain === "plant")
                            return onPlantGrowthChange(vals);
                          if (growthDomain === "fungi")
                            return onFungiGrowthChange(vals);
                          return onAlgaeGrowthChange(vals);
                        }}
                        canExpandCollapse={true}
                        additionalClasses="mb-3"
                        expanded={
                          growthDomain === "plant"
                            ? activePlantGrowth.length > 0
                            : growthDomain === "fungi"
                              ? activeFungiGrowth.length > 0
                              : activeAlgaeGrowth.length > 0
                        }
                        infoIconOnClick={() =>
                          onInfoIconClick(
                            growthDomain === "plant"
                              ? "growth"
                              : growthDomain === "fungi"
                                ? "fungiGrowth"
                                : "algaeGrowth",
                          )
                        }
                        // topContent={
                        //   <GrowthDomainSwitcher
                        //     growthDomain={growthDomain}
                        //     setGrowthDomain={setGrowthDomain}
                        //   />
                        // }
                      />
                      <Dropdown
                        enforceDarkMode={enforceDarkMode}
                        headerLabel="Succession"
                        searchable
                        sections={SuccessionSections}
                        checkedOptions={activeSuccession.map(
                          (t) => successionLabelMap[t] ?? t.replace(/_/g, " "),
                        )}
                        onChange={onSuccessionChange}
                        canExpandCollapse={true}
                        additionalClasses="mb-3"
                        searchPlaceholder="pioneer"
                        expanded={activeSuccession.length > 0}
                        infoIconOnClick={() => onInfoIconClick("succession")}
                      />
                      {/* <Dropdown
                      searchable
                      headerLabel="Cuisines"
                      allOptions={Cuisines.map((c) => c.name)}
                      checkedOptions={activeCuisines}
                      onChange={onCuisineChange}
                      additionalClasses="mb-3"
                      searchPlaceholder="italian"
                      expanded={activeCuisines.length > 0}
                    /> */}
                      <Dropdown
                        enforceDarkMode={enforceDarkMode}
                        searchable
                        headerLabel="Types"
                        allOptions={IngredientTypes}
                        checkedOptions={activeIngredientTypes}
                        onChange={onIngredientTypeChange}
                        onlyOne
                        expanded={activeIngredientTypes.length > 0}
                        infoIconOnClick={() =>
                          onInfoIconClick("ingredientType")
                        }
                      />
                      {/* Ecological function filter - shows when process type selected or eco filter active */}
                      {
                        <Dropdown
                          enforceDarkMode={enforceDarkMode}
                          searchable
                          headerLabel="Function"
                          allOptions={ecoFunctionOptions.map((o) => o.label)}
                          checkedOptions={activeEcologicalFunctions.map(
                            (t) => ecoFunctionTokenToLabel[t] ?? t,
                          )}
                          onChange={onEcologicalFunctionChange}
                          additionalClasses="mb-3 mt-3"
                          expanded={activeEcologicalFunctions.length > 0}
                          searchPlaceholder="nitrogen"
                        />
                      }
                    </div>
                  </Modal>
                )}
              </>,
              document.body,
            )}
          </>
        </div>
      </div>
    </div>
  );
}
