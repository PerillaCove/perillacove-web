import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import Error from "./Error";
import { SearchResult } from "./types";

export interface Props {
  value: string | number;
  label?: string;
  id: string;
  name: string;
  placeholder?: string | string[];
  error?: string;
  type: string;
  readOnly?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  additionalClasses?: string;
  containerClasses?: string;
  onEnterClick?: () => void;
  limit?: number;
  leadingIconClasses?: string;
  inputPaddingClasses?: string;
  search?: {
    onSelect?: (result: SearchResult) => void;
    results?: SearchResult[];
  };
  backgroundColorClasses?: string;
  borderClasses?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
  labelImgPath?: string;
  onClearInput?: () => void;
  showClearInputWhenEmpty?: boolean;
  canQuickAccess?: boolean;
  glow?: boolean;
  textCasingClasses?: string;
  onQuickAccess?: () => void;
  onFocus?: () => void;
}

export default function Input({
  value,
  id,
  name,
  placeholder,
  error,
  type,
  readOnly = false,
  onChange,
  onKeyDown,
  onClick,
  autoFocus,
  disabled,
  additionalClasses = "",
  containerClasses = "",
  label,
  onEnterClick,
  limit,
  search,
  leadingIconClasses: leadingIconClassesProp = "",
  inputPaddingClasses = "py-3 px-2",
  backgroundColorClasses = "bg-inherit",
  borderClasses:
    borderClassesProp = "border border-neutral-300 dark:border-neutral-400",
  inputRef: inputRefProp,
  labelImgPath,
  onClearInput,
  showClearInputWhenEmpty = false,
  canQuickAccess = false,
  glow = false,
  textCasingClasses = "",
  onQuickAccess,
  onFocus,
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPristine, setIsPristine] = useState(true);
  const [isGlowing, setIsGlowing] = useState(glow);
  const containerRef = useRef<HTMLDivElement>(null);
  const defaultInputRef = useRef<HTMLInputElement>(null);
  const inputRef = inputRefProp || defaultInputRef;

  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsGlowing(glow);
  }, [glow]);

  useEffect(() => {
    if (Array.isArray(placeholder) && placeholder.length > 1) {
      const intervalTimer = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setCurrentPlaceholderIndex(
            (prevIndex) => (prevIndex + 1) % placeholder.length,
          );
          setFade(true);
        }, 300);
      }, 2000);
      return () => clearInterval(intervalTimer);
    }
  }, [placeholder]);

  const actualPlaceholder = Array.isArray(placeholder)
    ? placeholder[currentPlaceholderIndex]
    : placeholder;

  const borderClasses = clsx({
    "rounded-lg transition-all duration-300 ease-in-out": true,
    [borderClassesProp]: !error && !value && !isGlowing,
    "border border-red-600 dark:border-red-300 border-2": !!error,
    "border-2 border-blue-500 dark:border-blue-300":
      (!!value && !error) || isGlowing,
    "animate-pulse": isGlowing,
  });

  const inputClasses = clsx({
    [inputPaddingClasses]: true,
    [textCasingClasses]: true,
    "w-full outline-none text-neutral-900 dark:text-neutral-100": true,
    [additionalClasses]: true,
    [borderClasses]: !search && !leadingIconClassesProp,
    [backgroundColorClasses]: !search && !leadingIconClassesProp,
    "bg-transparent": !!search || !!leadingIconClassesProp,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPristine(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsGlowing(true);
        onQuickAccess?.();
        return;
      }
    };
    if (canQuickAccess) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [canQuickAccess, onQuickAccess]);

  useEffect(() => {
    if (!isGlowing) return;
    inputRef?.current?.focus();
  }, [isGlowing, inputRef]);

  const isEmblem = useMemo(() => {
    return !!onClick;
  }, [onClick]);

  const inputType = useMemo(() => {
    if (type !== "password") return type;
    return isPasswordVisible ? "text" : "password";
  }, [type, isPasswordVisible]);

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPasswordVisible(!isPasswordVisible);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!value) return;

    if (search?.results?.length) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < (search.results?.length || 0) - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > -1 ? prev - 1 : prev));
          break;
        case "Enter":
          if (selectedIndex >= 0) {
            search.onSelect?.(search.results[selectedIndex]);
          } else if (search.results.length > 0) {
            search.onSelect?.(search.results[0]);
          } else {
            onEnterClick?.();
          }
          break;
      }
    } else if (e.key === "Enter") {
      onEnterClick?.();
    }
    onKeyDown?.(e);
  };

  const enterButtonClasses = clsx({
    "transition-all duration-300 absolute right-0 top-1/2 -translate-y-1/2 flex items-center text-base rounded-full w-8 h-8 mr-2 justify-center items-center border dark:border-0": true,
    "cursor-pointer bg-slate-500 dark:bg-slate-300 text-white dark:text-black":
      !!value,
    "cursor-not-allowed bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400":
      !value,
  });

  const leadingIconClasses = clsx({
    "ml-3": true,
    "fa-solid fa-search": !!search,
    [leadingIconClassesProp]: !search,
  });

  const leadingIconContainerClasses = clsx(
    "fa-sm",
    "h-full flex items-center justify-center",
    {
      hidden: !search && !leadingIconClassesProp,
    },
  );

  const inputContainerClasses = clsx({
    "relative flex items-center w-full": true,
    [borderClasses]: !!search || !!leadingIconClassesProp,
    [backgroundColorClasses]: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPristine(false);
    onChange(e);
    setIsGlowing(false);
  };

  const handleBlur = () => {
    setIsGlowing(false);
  };

  useEffect(() => {
    if (selectedIndex >= 0 && resultsContainerRef.current) {
      const container = resultsContainerRef.current;
      const selectedElement = container.children[selectedIndex] as HTMLElement;

      if (selectedElement) {
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.clientHeight;
        const elementTop = selectedElement.offsetTop;
        const elementBottom = elementTop + selectedElement.clientHeight;

        if (elementBottom > containerBottom) {
          container.scrollTop = elementBottom - container.clientHeight;
        } else if (elementTop < containerTop) {
          container.scrollTop = elementTop;
        }
      }
    }
  }, [selectedIndex]);

  return (
    <div className={`relative ${containerClasses}`} ref={containerRef}>
      <div className="flex flex-col items-start relative w-full">
        {label && (
          <div className="flex items-center mb-2">
            <label htmlFor={id} className="font-semibold text-base">
              {label}
            </label>

            {labelImgPath && (
              <img
                src={labelImgPath}
                alt={label}
                width={23}
                height={23}
                className="ml-1"
              />
            )}
          </div>
        )}

        <div className={inputContainerClasses}>
          <div className={leadingIconContainerClasses}>
            <i className={leadingIconClasses} />
          </div>
          <input
            type={inputType}
            id={id}
            name={name}
            value={value}
            onChange={handleChange}
            className={inputClasses}
            placeholder=""
            readOnly={readOnly}
            onKeyDown={handleKeyDown}
            autoFocus={autoFocus}
            disabled={disabled || isEmblem}
            maxLength={limit}
            autoComplete="off"
            ref={inputRef}
            onBlur={handleBlur}
            onFocus={onFocus}
          />
          {!value && actualPlaceholder && (
            <span
              className={clsx(
                "absolute pointer-events-none text-gray-400 transition-opacity duration-300 z-10",
                "top-1/2 transform -translate-y-1/2",
                {
                  "left-10": search || leadingIconClassesProp,
                  "left-2": !(search || leadingIconClassesProp),
                  "opacity-100": !Array.isArray(placeholder) || fade,
                  "opacity-0": Array.isArray(placeholder) && !fade,
                },
              )}
            >
              {actualPlaceholder}
            </span>
          )}
          {onEnterClick && !readOnly && (
            <button
              onClick={() => {
                if (value) {
                  onEnterClick();
                }
              }}
              className={enterButtonClasses}
            >
              <i className="fa-solid fa-arrow-right"></i>
            </button>
          )}
          {onClearInput &&
            (!!value || showClearInputWhenEmpty) &&
            !readOnly && (
              <button
                type="button"
                onClick={onClearInput}
                className="absolute inset-y-0 right-0  flex items-center p-2 text-neutral-500 dark:text-neutral-200 transition-all duration-300"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}

          {canQuickAccess && !readOnly && (
            <div className="flex items-center inset-y-0 right-0 pr-3 text-base text-neutral-500 dark:text-neutral-400">
              ⌘K
            </div>
          )}

          {type === "password" && (
            <button
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-base leading-5"
            >
              <i
                className={`fa-solid ${isPasswordVisible ? "fa-eye-slash" : "fa-eye"}`}
              ></i>
            </button>
          )}

          {readOnly && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-base">
              <i
                className={`fa-solid fa-lock text-neutral-500 dark:text-neutral-400`}
              ></i>
            </div>
          )}
        </div>

        <div
          className={`flex items-center ${error ? "justify-between" : "justify-end"} w-full`}
        >
          {!!error && <Error text={error} />}
          {limit && (
            <div className="text-neutral-500 dark:text-neutral-400 font-semibold text-base pr-1.5">
              {limit - `${value}`.length}
            </div>
          )}
        </div>
      </div>
      {!isPristine && value && search?.results && search.results.length > 0 && (
        <div
          ref={resultsContainerRef}
          className="bg-white dark:bg-black absolute left-0 right-0 mt-1 rounded z-50 max-h-[400px] overflow-y-auto border border-neutral-300 dark:border-neutral-500"
        >
          {search.results.map((result, index) => (
            <div
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                search.onSelect?.(result);
              }}
              key={result.id}
              className={clsx(
                "text-base px-4 py-2 border-b border-neutral-300 dark:border-neutral-500 font-medium cursor-pointer capitalize flex items-center w-full",
                {
                  "bg-neutral-300 dark:bg-neutral-500": index === selectedIndex,
                  "hover:bg-neutral-300 dark:hover:bg-neutral-500":
                    index !== selectedIndex,
                },
              )}
            >
              {result.imgPath && (
                <img
                  src={result.imgPath}
                  alt={result.name}
                  width={30}
                  height={30}
                />
              )}
              <span className="ml-6">{result.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
