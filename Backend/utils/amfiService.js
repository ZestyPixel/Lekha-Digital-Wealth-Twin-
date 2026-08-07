/**
 * Utility to look up mutual fund NAV from AMFI's official data.
 */

const AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

let cachedAmfiData = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

/* Fetch and cache the full AMFI NAV text file. Returns an array of parsed lines: { schemeCode, isinGrowth, isinReinvestment, schemeName, nav, date } */

async function getAmfiData() {
  const now = Date.now();
  if (cachedAmfiData && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedAmfiData;
  }

  const res = await fetch(AMFI_NAV_URL);
  const text = await res.text();
  const lines = text.split("\n");

  const parsed = [];
  for (const line of lines) {
    if (!line.includes(";")) continue;
    const parts = line.split(";");
    if (parts.length < 5) continue;

    parsed.push({
      schemeCode: parts[0].trim(),
      isinGrowth: (parts[1] || "").trim().replace(/-/g, ""),
      isinReinvestment: (parts[2] || "").trim().replace(/-/g, ""),
      schemeName: parts[3].trim(),
      nav: parseFloat(parts[4].trim()),
      date: (parts[5] || "").trim(),
    });
  }

  cachedAmfiData = parsed;
  cacheTimestamp = now;
  return parsed;
}

/**
 * Fuzzy-match a fund name against the AMFI data and return the best match.
 * Returns: { schemeCode, isin, schemeName, nav, date } or null
 */
async function lookupFundByName(fundName) {
  try {
    const data = await getAmfiData();
    const searchName = fundName.toLowerCase().trim();
    const searchWords = searchName.split(/\s+/);

    let bestMatch = null;
    let bestScore = 0;

    for (const entry of data) {
      const name = entry.schemeName.toLowerCase();
      // Prefer Growth variants
      if (!name.includes("growth")) continue;

      const matchCount = searchWords.filter((w) => name.includes(w)).length;
      const score = matchCount / searchWords.length;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      const isin = bestMatch.isinGrowth || bestMatch.isinReinvestment;
      if (isin && /^[A-Z0-9]{12}$/.test(isin)) {
        return {
          schemeCode: bestMatch.schemeCode,
          isin,
          schemeName: bestMatch.schemeName,
          nav: bestMatch.nav,
          date: bestMatch.date,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("AMFI lookup failed:", error);
    return null;
  }
}

/*Get current NAV for a specific scheme code.*/

async function getNavBySchemeCode(schemeCode) {
  try {
    const data = await getAmfiData();
    const entry = data.find((d) => d.schemeCode === schemeCode);
    return entry ? entry.nav : null;
  } catch (error) {
    console.error("NAV lookup by scheme code failed:", error);
    return null;
  }
}

/* Batch lookup: get latest NAVs for multiple scheme codes at once. Returns a Map<schemeCode, nav> */
async function getNavBatch(schemeCodes) {
  try {
    const data = await getAmfiData();
    const navMap = new Map();

    for (const entry of data) {
      if (schemeCodes.includes(entry.schemeCode)) {
        navMap.set(entry.schemeCode, entry.nav);
      }
    }

    return navMap;
  } catch (error) {
    console.error("Batch NAV lookup failed:", error);
    return new Map();
  }
}

module.exports = { lookupFundByName, getNavBySchemeCode, getNavBatch };
