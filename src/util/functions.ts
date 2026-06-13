import { FormValue } from "./hooks/form";
import { FormErrors } from "./hooks/form";

export const isValidEmail = (email: string) => {
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};

export const getEmailValidationStr = (email: string) => {
  if (!email) {
    return "Email is required";
  }
  if (!isValidEmail(email)) {
    return "Please enter a valid email.";
  }

  return "";
};

export function formatIngredientIdForDisplay(
  id: string,
  options?: { includeDescriptors?: boolean },
): string {
  const includeDescriptors = options?.includeDescriptors ?? true;

  // If there are no descriptors (no double underscore), just replace underscores with spaces
  if (!id.includes("__")) {
    return id.replace(/_/g, " ");
  }

  const [mainName, descriptors] = id.split("__");

  // Convert main name's underscores to spaces
  const formattedMainName = mainName.replace(/_/g, " ");

  // If there are descriptors, format them within brackets
  if (descriptors && includeDescriptors) {
    const formattedDescriptors = descriptors.split("_").join(", ");
    return `${formattedMainName} (${formattedDescriptors})`;
  }

  return formattedMainName;
}

export const formatDate = (dateString: string, showTime?: boolean) => {
  const date = new Date(dateString);
  const dateOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  } as const;

  if (showTime) {
    return `${date.toLocaleDateString("en-US", dateOptions)} ${date.toLocaleTimeString(
      "en-US",
      {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      },
    )}`;
  }

  return date.toLocaleDateString("en-US", dateOptions);
};

export const isWithinTimeframe = (
  dateString: string,
  deltaMs: number,
): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return diffMs < deltaMs;
};

export const validateFormValue = (value: FormValue, errorMessage?: string) => {
  if (!value) {
    return errorMessage || "This field is required";
  }
};

export const createValidationErrorObject = <T>(
  requiredFields: Partial<keyof T>[],
  formState: T,
) => {
  return requiredFields.reduce((acc, field) => {
    const value = formState[field];
    return { ...acc, [field]: validateFormValue(value as FormValue) };
  }, {} as FormErrors);
};

export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function formatDisplayToIngredientId(display: string): string {
  // Handle case with descriptors in parentheses
  const match = display.trim().match(/^(.*?)\s*\((.*?)\)\s*$/);

  if (match) {
    const [, mainName, descriptors] = match;
    // Convert descriptors by replacing commas and spaces with underscores
    // First trim each descriptor, then join with underscores
    const formattedDescriptors = descriptors
      .split(",")
      .map((d) => d.trim())
      .join("_");

    // Convert main name spaces to underscores and combine with descriptors
    return `${mainName.trim().replace(/\s+/g, "_")}__${formattedDescriptors}`;
  }

  // If no descriptors, just replace spaces with underscores
  return display.trim().replace(/\s+/g, "_");
}

export const formatSubscriptionEndDate = (
  timestamp?: string | null,
  fallbackText?: string,
) => {
  if (!timestamp) return fallbackText || "the end of you current billing cycle";

  return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export const getSearchParamsMinusKey = (
  searchParams: URLSearchParams,
  parentKey: string,
  childKey: string,
) => {
  const newSearchParams = new URLSearchParams(searchParams);
  const currentIngredientIds = newSearchParams.get(parentKey)?.split(",") || [];
  const newIngredientIds = currentIngredientIds.filter((id) => id !== childKey);

  if (newIngredientIds.length > 0) {
    newSearchParams.set(parentKey, newIngredientIds.join(","));
  } else {
    newSearchParams.delete(parentKey);
  }

  return newSearchParams;
};

export const getSearchParamsPlusKey = (
  searchParams: URLSearchParams,
  parentKey: string,
  childKey: string,
) => {
  const newSearchParams = new URLSearchParams(searchParams);
  const currentIngredientIds = newSearchParams.get(parentKey)?.split(",") || [];
  const newIngredientIds = [...currentIngredientIds, childKey];

  if (newIngredientIds.length > 0) {
    newSearchParams.set(parentKey, newIngredientIds.join(","));
  } else {
    newSearchParams.delete(parentKey);
  }

  return newSearchParams;
};

/**
 * Removes surrounding quotes (single or double) from a string if they exist.
 *
 * @param str - The string that may have surrounding quotes
 * @returns The string with surrounding quotes removed, or the original string if no quotes were present
 */
export const removeQuotes = (str: string): string => {
  if (!str) return "";

  // Check if string starts and ends with the same quote character (single or double)
  if (
    (str.startsWith('"') && str.endsWith('"')) ||
    (str.startsWith("'") && str.endsWith("'"))
  ) {
    return str.slice(1, -1);
  }

  return str;
};

/**
 * Removes the second string from the beginning of the first string if it exists.
 *
 * @param original - The original string
 * @param toRemove - The string to remove from the beginning
 * @returns The original string with the second string removed from the beginning
 *
 * @example
 * // Returns "best"
 * subtractString("the best", "the ")
 */
export const subtractString = (original: string, toRemove: string): string => {
  if (!original || !toRemove) return original;

  if (original.startsWith(toRemove)) {
    return original.slice(toRemove.length);
  }

  return original;
};

export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const copyToClipboard = async (url: string) => {
  await navigator.clipboard.writeText(url);
};

/**
 * Checks if an ingredient matches a search term by checking both the ingredient ID
 * and the formatted display name. This allows searching by either "pigeon_pea" or "pigeon pea".
 */
export function ingredientMatchesSearchTerm(
  ingredientId: string,
  searchTerm: string,
): boolean {
  if (!searchTerm.trim()) return true;

  const term = searchTerm.toLowerCase();
  const idLower = ingredientId.toLowerCase();
  const displayName = formatIngredientIdForDisplay(ingredientId).toLowerCase();

  return idLower.includes(term) || displayName.includes(term);
}

// Helper function to ensure absolute path navigation
export const getAbsolutePath = (path: string | null) => {
  if (!path) return "/ingredients";
  return path.startsWith("/") ? path : `/${path}`;
};
