import clsx from "clsx";
import { ReactNode, useCallback, useEffect, useState } from "react";
import { useCircadianTheme } from "../../util/hooks/general";
import { DropdownItem } from "./Item";
import Input from "../Input";
import { motion } from "motion/react";
import RangeSlider from "../RangeSlider";

export interface DropdownSection {
  label: string;
  options: string[];
  onlyOne?: boolean; // if true, only one option in this section can be selected
}

export interface DropdownRangeSection {
  id: string;
  label: string;
  min: number;
  max: number;
  unit?: string;
  step?: number;
}

export type RangeValues = Record<string, [number, number] | null>;

interface CheckedDropdownProps {
  headerLabel: string;
  allOptions?: string[];
  checkedOptions: string[];
  onChange: (checkedOptionLabels: string[]) => void;
  searchable?: boolean;
  isReadonly?: boolean;
  expanded?: boolean;
  headerIconClasses?: string;
  unchangeableOptionLabels?: string[];
  additionalClasses?: string;
  canExpandCollapse?: boolean;
  optionToColorClassesMap?: Record<string, string>;
  onlyOne?: boolean;
  searchPlaceholder?: string;
  infoIconOnClick?: () => void;
  topContent?: ReactNode;
  sections?: DropdownSection[]; // if provided, use sections instead of flat allOptions
  // Range filter support
  rangeSections?: DropdownRangeSection[];
  rangeValues?: RangeValues;
  onRangeChange?: (id: string, value: [number, number] | null) => void;
  enforceDarkMode?: boolean;
}

const MAX_HEIGHT = 800;

const Dropdown = ({
  allOptions = [],
  checkedOptions,
  headerLabel,
  onChange,
  searchable = false,
  isReadonly = false,
  expanded = false,
  headerIconClasses = "",
  unchangeableOptionLabels = [],
  additionalClasses = "",
  canExpandCollapse = true,
  optionToColorClassesMap = {},
  onlyOne = false,
  searchPlaceholder = "Search...",
  infoIconOnClick,
  topContent,
  sections,
  rangeSections,
  rangeValues = {},
  onRangeChange,
  enforceDarkMode = false,
}: CheckedDropdownProps) => {
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const [isOpen, setIsOpen] = useState<boolean>(expanded);
  const [localCheckedOptions, setLocalCheckedOptions] =
    useState<string[]>(checkedOptions);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    setIsOpen(expanded);
  }, [expanded]);

  useEffect(() => {
    setLocalCheckedOptions(checkedOptions);
  }, [checkedOptions]);

  const canChangeOption = useCallback(
    (label: string) => {
      if (unchangeableOptionLabels.includes(label) || isReadonly) {
        return false;
      }
      return true;
    },
    [isReadonly, unchangeableOptionLabels],
  );

  const toggleCheckedDropdown = () => {
    if (isReadonly) {
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleCheckboxChange = useCallback(
    (label: string, sectionOnlyOne?: boolean) => {
      if (!canChangeOption(label)) {
        return;
      }

      let updatedOptions: string[] = [];
      const isSectionSingleSelect = sectionOnlyOne ?? onlyOne;

      if (isSectionSingleSelect && sections) {
        // Find which section this option belongs to
        const section = sections.find((s) => s.options.includes(label));
        if (section?.onlyOne) {
          // Remove all other options from this section
          updatedOptions = localCheckedOptions.filter(
            (opt) => !section.options.includes(opt),
          );
          // Toggle or set the clicked option
          if (!localCheckedOptions.includes(label)) {
            updatedOptions.push(label);
          }
        } else {
          // Standard multi-select behavior for this section
          updatedOptions = [...localCheckedOptions];
          if (localCheckedOptions.includes(label)) {
            const removed = new Set(localCheckedOptions);
            removed.delete(label);
            updatedOptions = [...removed];
          } else {
            updatedOptions.push(label);
          }
        }
      } else if (isSectionSingleSelect) {
        updatedOptions = [localCheckedOptions.includes(label) ? "" : label];
      } else {
        updatedOptions = [...localCheckedOptions];
        if (localCheckedOptions.includes(label)) {
          const removed = new Set(localCheckedOptions);
          removed.delete(label);
          updatedOptions = [...removed];
        } else {
          updatedOptions.push(label);
        }
      }

      setLocalCheckedOptions(updatedOptions);
      onChange(updatedOptions);
    },
    [
      canChangeOption,
      localCheckedOptions,
      setLocalCheckedOptions,
      onChange,
      onlyOne,
      sections,
    ],
  );

  // Build flat list or sectioned list based on props
  const flatOptions = sections
    ? sections.flatMap((s) => s.options)
    : allOptions;

  const filteredOptions = flatOptions.filter((option) =>
    option.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredSections = sections
    ?.map((section) => ({
      ...section,
      options: section.options.filter((option) =>
        option.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((section) => section.options.length > 0);

  const containerClasses = clsx({
    "pt-2 pl-2 lg:rounded-lg rounded w-full overflow-y-auto ": true,
    "cursor-pointer": !isReadonly,
    "border border-neutral-300 dark:border-neutral-500": !isReadonly,
    "bg-white text-neutral-900": !isDarkMode,
    "bg-neutral-900/55 text-neutral-100": isDarkMode,
    [additionalClasses]: true,
  });

  return (
    <div className={containerClasses}>
      <div
        className="flex items-center justify-between mb-3 pr-4"
        onClick={toggleCheckedDropdown}
      >
        <div className="flex items-center">
          {headerIconClasses && <i className={headerIconClasses}></i>}
          <div>{headerLabel}</div>
          {canExpandCollapse && (
            <i
              className={`fa-regular ${
                isOpen ? "fa-chevron-up" : "fa-chevron-down"
              } ml-3 ${isDarkMode ? "text-neutral-200" : "text-neutral-500"}`}
            ></i>
          )}
        </div>
        {infoIconOnClick && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              infoIconOnClick();
            }}
            className={`cursor-pointer w-5 h-5 border rounded-lg text-xs flex items-center justify-center ${isDarkMode ? "border-neutral-500 text-neutral-200" : "border-neutral-300 text-neutral-700"}`}
          >
            <i className="fa-solid fa-info fa-xs"></i>
          </div>
        )}
      </div>
      <motion.div
        animate={{ maxHeight: isOpen ? MAX_HEIGHT : 0 }}
        initial={false}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div
          className="w-full mb-2 overflow-y-auto"
          style={{ maxHeight: MAX_HEIGHT }}
        >
          {topContent && <div className="mb-2">{topContent}</div>}
          {searchable && (
            <Input
              id={`search-${headerLabel}`}
              name={`search-${headerLabel}`}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              containerClasses="w-full mb-2 pr-2"
              leadingIconClasses={`fa-solid fa-search ${isDarkMode ? "text-neutral-300" : "text-neutral-600"}`}
              inputPaddingClasses="py-1.5 px-2"
              backgroundColorClasses={
                isDarkMode ? "bg-neutral-900/70" : "bg-white"
              }
              borderClasses={
                isDarkMode
                  ? "border border-neutral-500"
                  : "border border-neutral-300"
              }
            />
          )}
          <div className="flex flex-col">
            {sections && filteredSections
              ? // Render sections
                filteredSections.map((section, idx) => (
                  <div key={section.label} className={idx > 0 ? "mt-3" : ""}>
                    <div
                      className={`text-xs font-semibold mb-1.5 px-2 ${isDarkMode ? "text-neutral-300" : "text-neutral-600"}`}
                    >
                      {section.label}
                    </div>
                    {section.options.map((option) => (
                      <DropdownItem
                        key={option}
                        isDarkMode={isDarkMode}
                        option={option}
                        isReadonly={isReadonly}
                        unchangeableOptionLabels={unchangeableOptionLabels}
                        checkedOptions={checkedOptions}
                        optionToColorClassesMap={optionToColorClassesMap}
                        handleCheckboxChange={(label) =>
                          handleCheckboxChange(label, section.onlyOne)
                        }
                        onCheckboxChange={(label) =>
                          handleCheckboxChange(label, section.onlyOne)
                        }
                        onlyOne={section.onlyOne ?? onlyOne}
                      />
                    ))}
                  </div>
                ))
              : // Render flat list
                filteredOptions.map((option) => (
                  <DropdownItem
                    key={option}
                    isDarkMode={isDarkMode}
                    option={option}
                    isReadonly={isReadonly}
                    unchangeableOptionLabels={unchangeableOptionLabels}
                    checkedOptions={checkedOptions}
                    optionToColorClassesMap={optionToColorClassesMap}
                    handleCheckboxChange={handleCheckboxChange}
                    onCheckboxChange={handleCheckboxChange}
                    onlyOne={onlyOne}
                  />
                ))}
          </div>
          {/* Range filter sections */}
          {rangeSections && rangeSections.length > 0 && (
            <div className="flex flex-col mt-3 pr-2">
              {rangeSections.map((rangeSection) => {
                const currentValue = rangeValues[rangeSection.id] ?? [
                  rangeSection.min,
                  rangeSection.max,
                ];
                const isActive =
                  rangeValues[rangeSection.id] !== null &&
                  rangeValues[rangeSection.id] !== undefined &&
                  (currentValue[0] !== rangeSection.min ||
                    currentValue[1] !== rangeSection.max);

                return (
                  <div
                    key={rangeSection.id}
                    className="mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-600 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs font-semibold ${isDarkMode ? "text-neutral-300" : "text-neutral-600"}`}
                      >
                        {rangeSection.label}
                      </span>
                      {isActive && onRangeChange && (
                        <button
                          type="button"
                          onClick={() => onRangeChange(rangeSection.id, null)}
                          className={`text-[10px] ${isDarkMode ? "text-neutral-400 hover:text-neutral-200" : "text-neutral-500 hover:text-neutral-700"}`}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <RangeSlider
                      min={rangeSection.min}
                      max={rangeSection.max}
                      value={currentValue}
                      onChange={(val) => onRangeChange?.(rangeSection.id, val)}
                      unit={rangeSection.unit}
                      step={rangeSection.step ?? 1}
                      disabled={isReadonly}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dropdown;
