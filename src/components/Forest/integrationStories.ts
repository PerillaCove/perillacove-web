import { resolveHotspotById } from "../PanoramicTour/hotspotKnowledge";

export interface IntegrationStoryPayload {
  storyText: string;
  storyLabel?: string;
}

type TourIntegrationStoryMap = Record<string, IntegrationStoryPayload>;

const TOUR_INTEGRATION_STORIES: Record<string, TourIntegrationStoryMap> = {
  india: {
    mango: {
      storyText:
        "Mango anchors long-cycle canopy structure in this Terai design. Its crown converts monsoon-season abundance into moderated light below, while deep roots hold seasonal water and stabilize soil life through dry intervals. Leaf litter and pruned biomass return canopy energy back to the ground, feeding the same understory and root-layer companions that keep this system resilient.",
      storyLabel: "Integration",
    },
    jackfruit: {
      storyText:
        "Jackfruit shares upper-layer space with mango and broadens the canopy envelope so light arrives in softer pulses instead of shock. Large fruit and heavy leaf turnover feed decomposers directly, and that decomposition stream strengthens the fertility loop supporting banana, ginger, turmeric, and ground-layer nitrogen partners.",
      storyLabel: "Integration",
    },
    banana: {
      storyText:
        "Banana is the fast structural responder. It creates early shade, quick biomass, and rapid mulch turnover, buffering soil heat while slower canopy trees mature overhead. In this design, banana bridges establishment to maturity, then yields space as permanent structure closes in, turning succession into a productive handoff rather than a conflict.",
      storyLabel: "Integration",
    },
    pigeon_pea: {
      storyText:
        "Pigeon pea operates as a timed support layer, fixing atmospheric nitrogen and feeding nearby roots through shared soil biology. It occupies bright gaps and edges during early-to-mid development, then naturally recedes as canopy density rises, leaving behind improved fertility for the species that follow.",
      storyLabel: "Integration",
    },
    peanut: {
      storyText:
        "Peanut acts as living ground armor across the forest floor. By covering exposed soil, it protects moisture, cools root zones, and reduces opportunistic weed pressure while contributing nitrogen. Its role is foundational: it secures the biological base that allows upper layers to remain productive without exhausting the ground beneath them.",
      storyLabel: "Integration",
    },
    ginger: {
      storyText:
        "Ginger thrives in the filtered-light understory created by canopy and mid-layer structure. Its rhizome growth turns stable moisture and organic-rich topsoil into harvestable yield while helping keep the lower layer continuously occupied. In system terms, ginger converts canopy-created microclimate into edible density at soil level.",
      storyLabel: "Integration",
    },
    turmeric: {
      storyText:
        "Turmeric partners with ginger in the humid understory, using protected light and warm, moisture-retentive soil to build rhizome reserves. Its biomass cycle contributes to organic matter turnover, and its shade tolerance lets the system intensify production below the canopy without forcing light competition.",
      storyLabel: "Integration",
    },
  },
  "etna-north-flank": {
    chestnut: {
      storyText:
        "Chestnut carries the long-cycle canopy role on Etna's restored terraces. Its broad crown converts intense upland light into moderated understory conditions, while deep roots hold structure across porous volcanic profiles. Leaf and burr litter returns mineral-rich biomass back to the same Andosol layer feeding the whole stack below.",
      storyLabel: "Integration",
    },
    hazelnut: {
      storyText:
        "Hazelnut fills the mid-structure between canopy and herb layers, adding dense seasonal leaf turnover close to the soil surface. Its multi-stem form helps stabilize terrace edges and keeps the productivity band active where chestnut spacing opens light. In this system it works as a bridge layer, translating upper-canopy energy into understory fertility.",
      storyLabel: "Integration",
    },
    fig: {
      storyText:
        "Fig performs as a drought-resilient fruiting anchor in the warm volcanic corridor. It tolerates summer stress while still cycling meaningful leaf biomass back into the topsoil, keeping decomposition active through dry intervals. That resilience smooths the productivity curve for the rest of the forest when seasonal water tightens.",
      storyLabel: "Integration",
    },
    apple__green: {
      storyText:
        "Green apple occupies a cooler fruiting niche within Etna's elevation window, adding shoulder-season yield to a system otherwise dominated by hotter Mediterranean rhythms. Its pruning and leaf drop feed organic turnover near the root zone, reinforcing moisture retention in porous ash-derived soils. It complements, rather than duplicates, the warmer-fruiting species around it.",
      storyLabel: "Integration",
    },
    pomegranate: {
      storyText:
        "Pomegranate operates as a sun-loving structural fruit layer that holds productivity on the drier side of the terrace mosaic. Its hardy architecture keeps canopy function and fruit set active where summer heat rises, while litter and pruned wood continue feeding soil biology. In integration terms, it extends system reliability into the dry season rather than competing for the same microclimate as cooler species.",
      storyLabel: "Integration",
    },
    grape__trebbiano: {
      storyText:
        "Trebbiano grape captures vertical light pathways that tree crowns leave unused, converting open-air energy into clustered yield without demanding new ground footprint. Seasonal pruning generates fast-cycling biomass that can be returned as mulch along the terrace line. The vine layer increases total system output by occupying structure, not by displacing tree roots.",
      storyLabel: "Integration",
    },
    kiwi__green: {
      storyText:
        "Green kiwi uses the humid, sheltered pockets created by terrace geometry and mixed canopy cover. As a climbing layer it turns support structures and filtered airflow into high-value fruit while sharing soil space with deeper-rooted trees. Its role is relational: it depends on the microclimate the forest builds, then feeds that same forest through seasonal pruning return.",
      storyLabel: "Integration",
    },
    oregano: {
      storyText:
        "Oregano forms a low aromatic matrix that keeps bare soil exposure down between larger perennials. It shades the surface, slows evaporative loss, and adds frequent small biomass pulses that feed upper-soil biology. This is the ground-level continuity layer that keeps terrace fertility active between heavier litter cycles.",
      storyLabel: "Integration",
    },
    rosemary: {
      storyText:
        "Rosemary provides woody evergreen structure in the lower layer, supporting pollinator presence across longer seasonal windows. It tolerates lean, sunlit terrace edges while still contributing organic matter and root activity where erosion pressure can rise. In practice it is both ecological scaffolding and culinary yield in one form.",
      storyLabel: "Integration",
    },
    thyme: {
      storyText:
        "Thyme works as fine-scale living cover across exposed volcanic topsoil. Its dense, low habit reduces weed pressure, cushions raindrop impact, and helps keep the surface biologically active instead of crusting between events. At system scale, thyme protects the soil interface that every upper layer depends on.",
      storyLabel: "Integration",
    },
    garlic: {
      storyText:
        "Garlic occupies quick turnover windows in the lower layer, producing reliable bulb yield while larger perennials continue their slower cycles overhead. Its shallow seasonal rooting keeps soil biologically engaged in spaces that might otherwise go idle. It contributes edible density without interrupting the long-term canopy framework.",
      storyLabel: "Integration",
    },
    carrot: {
      storyText:
        "Carrot adds root-layer productivity that complements fruit and canopy outputs rather than competing with them. As a taproot crop it uses a distinct below-ground niche, then returns residue that supports aggregate stability and microbial turnover near the surface. It is part of how this Etna design turns vertical layering into practical multi-strata harvest.",
      storyLabel: "Integration",
    },
  },
  "eastern-lower-fraser-valley": {
    walnut: {
      storyText:
        "Walnut provides upper-canopy structure that slows direct exposure across the Fraser clay corridor and turns long-season light into durable biomass. Its deep rooting helps stitch soil layers through wet-dry swings, while heavy leaf fall feeds decomposition that builds carbon back into the same ground that has been losing it under annual disturbance.",
      storyLabel: "Integration",
    },
    chestnut: {
      storyText:
        "Chestnut strengthens the long-cycle canopy tier with reliable litter return and broad seasonal shading. In this valley system, it helps convert mineral-rich alluvium into stable humus by supplying steady woody and foliar inputs to decomposers. That process supports moisture buffering and nutrient retention in heavy textured soils.",
      storyLabel: "Integration",
    },
    fig: {
      storyText:
        "Fig adds resilient fruiting architecture that performs through warm spells while remaining anchored in the valley's moist, deep soils. Its pruning cycle contributes quick-to-medium turnover biomass, helping keep organic activity continuous beneath larger trees. It serves as a flexible bridge between canopy structure and mid-layer yield.",
      storyLabel: "Integration",
    },
    apple__green: {
      storyText:
        "Green apple occupies a cooler temperate fruit niche that fits the Fraser's long frost-free window without requiring Mediterranean heat. Managed pruning and leaf drop cycle nutrients close to the root zone, and its placement within layered light keeps production distributed through the vertical profile rather than concentrated in one stratum.",
      storyLabel: "Integration",
    },
    pear__green: {
      storyText:
        "Green pear complements apple in the temperate fruit layer while diversifying flowering and harvest timing. That timing spread supports pollinator continuity and reduces single-window production risk. As with the rest of the perennial stack, its seasonal biomass return helps shift the site from extractive turnover toward cumulative soil building.",
      storyLabel: "Integration",
    },
    blueberry: {
      storyText:
        "Blueberry occupies the shrub layer where moisture is reliable and organic matter can be maintained near the surface. It converts lower-profile light into concentrated yield while contributing fine litter and root turnover that feed topsoil biology. In system terms, blueberry increases edible density without disrupting canopy-root architecture.",
      storyLabel: "Integration",
    },
    strawberry: {
      storyText:
        "Strawberry functions as a living ground cover that protects exposed soil, suppresses opportunistic weeds, and keeps the surface biologically active between larger-rooted perennials. Its horizontal spread reduces bare-earth intervals and helps conserve moisture at the interface where decomposition, aeration, and nutrient cycling converge.",
      storyLabel: "Integration",
    },
    garlic: {
      storyText:
        "Garlic provides fast-cycle root-layer productivity inside a slower perennial framework. It uses shallow seasonal space, then returns residue that supports microbial turnover and soil structure near the top horizon. This is how the design maintains year-to-year food output while the larger canopy continues rebuilding long-term carbon.",
      storyLabel: "Integration",
    },
  },
};

const TOUR_ID_ALIASES: Record<string, string> = {
  "india-soil-from-stone": "india",
};

function normalizeTourId(rawTourId?: string | null): string | null {
  if (!rawTourId) return null;
  const normalized = rawTourId.trim().toLowerCase();
  if (!normalized) return null;
  return TOUR_ID_ALIASES[normalized] ?? normalized;
}

export function getIntegrationStoryForTourIngredient(
  tourId: string | null | undefined,
  ingredientId: string,
): IntegrationStoryPayload | null {
  const normalizedTourId = normalizeTourId(tourId);
  if (!normalizedTourId) return null;

  const tourStories = TOUR_INTEGRATION_STORIES[normalizedTourId];
  if (!tourStories) {
    if (normalizedTourId === "sample-tropical") {
      const hotspot = resolveHotspotById(ingredientId);
      return hotspot
        ? { storyText: hotspot.description, storyLabel: "Integration" }
        : null;
    }
    return null;
  }

  return tourStories[ingredientId] ?? null;
}
