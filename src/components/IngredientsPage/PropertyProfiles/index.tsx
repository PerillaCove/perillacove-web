import Profile from "./Profile";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { useCircadianTheme } from "../../../util/hooks/general";
import clsx from "clsx";
import Input from "../../Input";
import {
  Ingredient,
  IngredientProperty,
  IngredientPropertyType,
  PropertyProfilesFinalLabelMap,
  PropertyProfilesLabel,
} from "../types";
import { IngredientProfilesVisibleMetaAtom } from "../../../state";

export interface IngredientPropertyProfilesMeta {
  ingredientPropertyId?: IngredientPropertyType;
  properties: IngredientProperty[];
  label: PropertyProfilesLabel;
  ingredientsInPlay?: Ingredient[];
  includedPropertyTypes?: IngredientPropertyType[];
  enforceDarkMode?: boolean;
}

export default function IngredientPropertyProfiles({
  ingredientPropertyId,
  properties,
  label,
  ingredientsInPlay,
  includedPropertyTypes,
  enforceDarkMode = false,
}: IngredientPropertyProfilesMeta) {
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const ingredientChipCheckClasses =
    label === "taste" ? "text-black" : "text-black dark:text-white";
  const ingredientPropertyProfileRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
  const ingredientPropertyChipRefs = useRef<{
    [key: string]: HTMLDivElement | null;
  }>({});
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIngredientPropertyId, setActiveIngredientPropertyId] = useState<
    IngredientPropertyType | undefined
  >(ingredientPropertyId);
  const setIngredientProfilesVisibleMeta = useSetAtom(
    IngredientProfilesVisibleMetaAtom,
  );
  const scrollToIngredientProperty = useCallback(
    (ingredientPropertyId: string) => {
      ingredientPropertyProfileRefs.current[
        ingredientPropertyId
      ]?.scrollIntoView({ behavior: "smooth" });
    },
    [ingredientPropertyProfileRefs],
  );

  useEffect(() => {
    setActiveIngredientPropertyId(ingredientPropertyId);
    if (ingredientPropertyId) {
      const element = ingredientPropertyChipRefs.current[ingredientPropertyId];
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        element.classList.add("flash-highlight");
        setTimeout(() => {
          element.classList.remove("flash-highlight");
        }, 1000);
      }
    }
  }, [ingredientPropertyId]);

  const scrollToTop = useCallback(() => {
    containerRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [containerRef]);

  useEffect(() => {
    if (activeIngredientPropertyId) {
      scrollToIngredientProperty(activeIngredientPropertyId);
    } else {
      scrollToTop();
    }
  }, [activeIngredientPropertyId, scrollToTop, scrollToIngredientProperty]);

  const scrollToSearch = useCallback(() => {
    scrollToTop();
    setActiveIngredientPropertyId(undefined);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 1000);
  }, [scrollToTop, inputRef, setActiveIngredientPropertyId]);

  const filteredProperties = useMemo(() => {
    return properties.filter(
      (ingredientProperty) =>
        ingredientProperty.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        ingredientProperty.description
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, properties]);

  const ingredientPropertyChipClasses = (
    ingredientProperty: IngredientProperty,
  ) => {
    return clsx(
      "flex items-center justify-between w-full font-bold",
      "lowercase",
      "cursor-pointer",
      "p-2 mb-4 rounded-r-full",
      "border border-neutral-300 dark:border-0 text-black",
      "transition-all duration-300",
      [ingredientProperty.bgThemeClasses],
      {
        [`font-bold`]: ingredientProperty.id === activeIngredientPropertyId,
        "font-medium": ingredientProperty.id !== activeIngredientPropertyId,
        "dark:opacity-10 opacity-10":
          includedPropertyTypes &&
          !includedPropertyTypes.includes(ingredientProperty.id),
      },
    );
  };

  return (
    <div className={enforceDarkMode ? "dark" : undefined}>
      <div className="flex items-center w-full justify-between bg-light-gradient dark:bg-dark-gradient">
        <div className="hidden lg:block flex flex-col relative overflow-y-auto h-[calc(100vh-100px)] w-[10%] pr-2">
          {properties.map((ingredientProperty) => (
            <div
              onClick={() => {
                if (ingredientProperty.id !== activeIngredientPropertyId) {
                  setActiveIngredientPropertyId(ingredientProperty.id);
                } else {
                  setActiveIngredientPropertyId(undefined);
                }
              }}
              key={ingredientProperty.id}
              className={ingredientPropertyChipClasses(ingredientProperty)}
              ref={(el) =>
                (ingredientPropertyChipRefs.current[ingredientProperty.id] = el)
              }
            >
              <span className="truncate max-w-[100px]">
                {ingredientProperty.name}
              </span>
              {ingredientProperty.id === activeIngredientPropertyId && (
                <i
                  className={`fa-solid fa-check-circle ${ingredientChipCheckClasses}`}
                />
              )}
            </div>
          ))}
        </div>
        <div
          ref={containerRef}
          className="flex flex-col items-center relative overflow-y-auto h-[calc(100vh-100px)] overflow-x-hidden lg:w-[90%] w-full lg:pl-24 lg:pr-6 px-2 lg:px-0"
        >
          <div className={`font-medium lg:pt-4 pt-2 text-2xl w-full uppercase`}>
            <span className={`${isDarkMode ? "text-cove-dark" : "text-cove"}`}>
              {PropertyProfilesFinalLabelMap[label].singular} Profiles
            </span>
          </div>
          <Input
            containerClasses="w-full mt-4"
            inputPaddingClasses="py-1.5 px-2"
            leadingIconClasses="fa-solid fa-search"
            onChange={(e) => setSearchTerm(e.target.value)}
            backgroundColorClasses="bg-white dark:bg-black"
            value={searchTerm}
            id="ingredientProperty-search"
            name="ingredientProperty-search"
            type="text"
            placeholder="Search ..."
            inputRef={inputRef}
            onClearInput={() => setSearchTerm("")}
          />
          <div className="flex flex-col w-full">
            {filteredProperties.map((ingredientProperty) => (
              <div
                key={ingredientProperty.id}
                ref={(el) =>
                  (ingredientPropertyProfileRefs.current[
                    ingredientProperty.id
                  ] = el)
                }
                className="pt-5 pb-5"
              >
                <Profile
                  ingredientProperty={ingredientProperty}
                  searchTerm={searchTerm}
                  showBorderAroundName={false}
                  ingredientsInPlay={ingredientsInPlay}
                  propertyProfilesLabel={label}
                  enforceDarkMode={enforceDarkMode}
                />
              </div>
            ))}
          </div>
          <div className="fixed top-0 right-0 flex items-center">
            <div
              onClick={scrollToSearch}
              className="p-3 rounded-bl-lg bg-black dark:bg-neutral-600 flex flex-col items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-magnifying-glass text-white" />
            </div>
            <div
              onClick={() => {
                setIngredientProfilesVisibleMeta(null);
              }}
              className="p-3 bg-black dark:bg-neutral-600 flex flex-col items-center justify-center cursor-pointer"
            >
              <i className="fa-solid fa-xmark text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
