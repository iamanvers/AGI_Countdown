export const articles = [
  {
    slug: "forecast-anchor",
    title: "Why the Clock Starts With Forecasts",
    kicker: "Methodology",
    summary:
      "The headline date is anchored in external forecast distributions first, then moved by bounded live signals so the model stays legible.",
    readingTime: "5 min",
    sections: [
      {
        heading: "A countdown needs a ground truth proxy",
        body:
          "AGI has no observed arrival rate, so the first responsibility of the clock is restraint. The anchor starts with external forecast distributions instead of an invented internal date."
      },
      {
        heading: "Live factors are bounded",
        body:
          "Benchmarks, compute, adoption, energy, policy, and sentiment can move the estimate, but their net shift is clamped. The live model shapes the date without overpowering the forecast baseline."
      },
      {
        heading: "The arithmetic stays inspectable",
        body:
          "Each move is stored as a contribution in months with a citation. The date should be emotionally clear on the home screen and mechanically clear in the methodology."
      }
    ]
  },
  {
    slug: "definitions-move-the-date",
    title: "Definitions Move the Date",
    kicker: "AGI Targets",
    summary:
      "Weak AGI, transformative AI, and strong AGI are separate targets. The switcher makes that dependency visible instead of hiding it.",
    readingTime: "4 min",
    sections: [
      {
        heading: "A single AGI date is too blunt",
        body:
          "People use AGI to mean different thresholds. A useful clock needs to show that a weaker economic-task threshold can arrive earlier than a robust strong-AGI threshold."
      },
      {
        heading: "The UI makes the assumption tactile",
        body:
          "Switching the definition changes the target date, confidence band, progress weighting, and interpretation of the same underlying signals."
      },
      {
        heading: "Uncertainty is part of the product",
        body:
          "The range matters as much as the median. The interface keeps the confidence band visible so the countdown never pretends to know more than it does."
      }
    ]
  },
  {
    slug: "zero-cost-architecture",
    title: "The Zero-Cost Architecture",
    kicker: "Build Notes",
    summary:
      "The app serves precomputed JSON from the edge while GitHub Actions handles deterministic refreshes on a cadence.",
    readingTime: "6 min",
    sections: [
      {
        heading: "The request path is static",
        body:
          "Visitors read precomputed JSON and static HTML. There is no database query, no Redis call, no worker hop, and no model call in the hot path."
      },
      {
        heading: "The pipeline does the heavy work",
        body:
          "Scheduled refreshes fetch structured sources, validate samples, compute engine states, and write the public data files that the app consumes."
      },
      {
        heading: "Free is a design constraint",
        body:
          "The default system runs on GitHub Actions, repository storage, and static hosting. Optional paid upgrades can exist later without changing the deterministic core."
      }
    ]
  },
  {
    slug: "what-slows-agi-down",
    title: "What Can Slow AGI Down",
    kicker: "External Factors",
    summary:
      "Energy headroom, hardware supply, regulation, public backlash, and macro stress can push the countdown later.",
    readingTime: "5 min",
    sections: [
      {
        heading: "Scaling is physical",
        body:
          "Datacenters need chips, power, cooling, capital, and time. The clock treats infrastructure pressure as a first-class signal rather than background noise."
      },
      {
        heading: "Deployment is social",
        body:
          "Policy friction, lawsuits, safety incidents, and public backlash can slow the path from capability to broad economic deployment."
      },
      {
        heading: "Decelerators need citations too",
        body:
          "A slowdown signal is only useful when it is visible, sourced, and bounded. The same provenance rules apply whether a factor pulls the date sooner or later."
      }
    ]
  }
] as const;

export type Article = (typeof articles)[number];

export function findArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}
