/**
 * Ecological process functions are NOT "what the plant is" (tree/herb),
 * but "what the plant does for the system over time".
 *
 * These functions are about condition-creation:
 * - fertility injection (nitrogen fixation)
 * - nutrient pumping (deep mineral lift)
 * - biomass throughput (mulch + soil building)
 * - microclimate creation (shade, humidity, wind buffering)
 * - succession scaffolding (temporary structure for later species)
 *
 * Many species can have multiple functions at once, and most functions
 * are time-bounded (strong early, then fade or are managed out).
 */

import { SuccessionalPhase } from "../types";

export type EcologicalProcessFunctionType =
  | "succession_pioneer" // colonizes disturbed/open ground quickly
  | "succession_scaffold" // provides temporary structure/shade for later layers
  | "fertility_nitrogen_fixer" // adds N via symbiosis
  | "fertility_nutrient_pump" // mines deep minerals, returns via leaf drop/chop
  | "biomass_engine" // produces lots of biomass quickly for mulch/soil
  | "microclimate_builder" // increases humidity, reduces temp swings, buffers wind
  | "hydrology_support" // supports wet edges, drainage zones, or water cycling
  | "pollinator_support" // flowers/nectar/pollen provisioning
  | "groundcover_armor" // protects soil surface, reduces erosion, suppresses weeds
  | "living_trellis" // used as support for climbers/vines
  | "soil_structure_builder"; // roots stabilize soil, improve aggregation, reduce compaction

export type ManagementStrategyType =
  | "leave" // let it persist without active control
  | "coppice" // cut back periodically, regrow (woody support species)
  | "pollard" // cut high to avoid browsing/shade issues
  | "chop_and_drop" // cut and mulch in place (esp. herbaceous/shrubs)
  | "thin" // remove individuals as canopy closes
  | "ring_bark_remove" // kill standing tree when transitioning (advanced practice)
  | "self_seed_control" // allow reseeding but manage spread
  | "contain" // root barriers, spacing, edge control
  | "rotate"; // repeat in waves as part of a cycle

export type NitrogenFixationType =
  | "none"
  | "rhizobial_legume" // legumes: pigeon pea, acacia, tagasaste
  | "frankia_actinorhizal"; // alder and some other actinorhizal plants

export type PersistenceCurveType =
  | "front_loaded" // strong early, fades quickly
  | "mid_peaking" // ramps then peaks in early-mid, then declines
  | "steady" // stays relevant long-term
  | "managed_cycle"; // depends on pruning/coppice schedule

export interface EcologicalProcessProfile {
  /**
   * Functions this species can play. (Many-to-many.)
   */
  functions: EcologicalProcessFunctionType[];

  /**
   * Where it sits in succession, and when it is most useful.
   */
  succession: {
    primaryPhase: SuccessionalPhase;
    peakPhases: SuccessionalPhase[]; // often ["pioneer","early"]
    isTypicallyTemporary: boolean; // commonly removed/thinned later
    typicalServiceYears?: {
      // optional because species vary by climate/management
      min: number;
      max: number;
    };
  };

  /**
   * Fertility mechanisms.
   */
  fertility: {
    nitrogenFixation: NitrogenFixationType;
    nutrientPump: {
      isNutrientPump: boolean;
      depthClass?: "shallow" | "medium" | "deep"; // comfrey often "deep"
      notes?: string;
    };
  };

  /**
   * Biomass and cycling behavior.
   */
  biomass: {
    throughput: "low" | "medium" | "high" | "extreme";
    coppiceResponse?: "poor" | "ok" | "good" | "excellent";
    chopAndDropSuitability?: "low" | "medium" | "high";
    leafDropValue?: "low" | "medium" | "high"; // mulch quality/quantity
  };

  /**
   * Microclimate effects (useful for your shade and humidity logic).
   */
  microclimate: {
    shadeBuildRate: "slow" | "medium" | "fast" | "very_fast";
    humidityLift: "low" | "medium" | "high";
    windBuffering: "low" | "medium" | "high";
    soilCooling: "low" | "medium" | "high";
  };

  /**
   * How it should be handled in a designed system.
   */
  management: {
    strategies: ManagementStrategyType[];
    typicalIntervalMonths?: number; // e.g., coppice every 6–18 months
    removalTrigger?: {
      trigger: "canopy_closure" | "shade_threshold" | "year" | "competition";
      value?: number; // e.g., shade_threshold=60 (%), year=5, etc.
      notes?: string;
    };
    invasivenessRisk?: "low" | "medium" | "high";
    cautions?: string[];
  };
}
