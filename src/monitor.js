"use strict";

function normalizePrice(rawPrice) {
  if (typeof rawPrice === "number" && Number.isFinite(rawPrice)) {
    return rawPrice;
  }

  if (typeof rawPrice !== "string") {
    return null;
  }

  const cleaned = rawPrice.replace(/[^\d,.-]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);

  if (decimalIndex >= 0) {
    const decimalPart = cleaned.slice(decimalIndex + 1).replace(/[.,]/g, "");

    if (decimalPart.length > 0 && decimalPart.length <= 2) {
      const integerPart = cleaned.slice(0, decimalIndex).replace(/[.,]/g, "");
      const normalized = `${integerPart}.${decimalPart}`;
      const value = Number(normalized);
      return Number.isFinite(value) ? value : null;
    }
  }

  const value = Number(cleaned.replace(/[.,]/g, ""));
  return Number.isFinite(value) ? value : null;
}

function createRegexExtractor(pattern, groupIndex = 1) {
  if (!(pattern instanceof RegExp)) {
    throw new TypeError("pattern must be a regular expression");
  }

  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);

  return ({ html }) => {
    const matches = html.matchAll(globalPattern);
    return Array.from(matches, (match) => match[groupIndex]).filter(Boolean);
  };
}

function validateMonitorConfig(target) {
  if (!target || typeof target !== "object") {
    throw new TypeError("Each target must be an object");
  }

  if (!target.name) {
    throw new TypeError("Each target must define a name");
  }

  if (!target.url) {
    throw new TypeError(`Target "${target.name}" must define a url`);
  }

  if (typeof target.extractPrices !== "function") {
    throw new TypeError(`Target "${target.name}" must define extractPrices`);
  }
}

async function monitorTarget(target, fetchImpl) {
  validateMonitorConfig(target);

  const response = await fetchImpl(target.url, { headers: target.headers });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${target.url}: ${response.status}`);
  }

  const html = await response.text();
  const extractedPrices = await target.extractPrices({ html, url: target.url, target });
  const priceRange = target.priceRange || {};
  const min = priceRange.min ?? Number.NEGATIVE_INFINITY;
  const max = priceRange.max ?? Number.POSITIVE_INFINITY;
  const prices = extractedPrices == null ? [] : Array.isArray(extractedPrices) ? extractedPrices : [extractedPrices];

  const matches = prices
    .map((price) => normalizePrice(price))
    .filter((price) => price !== null)
    .filter((price) => price >= min && price <= max)
    .sort((left, right) => left - right);

  return {
    name: target.name,
    url: target.url,
    matches,
    matched: matches.length > 0,
    lowestPrice: matches[0] ?? null,
    priceRange: { min, max }
  };
}

async function monitorWebsites({ targets, fetchImpl = globalThis.fetch } = {}) {
  if (!Array.isArray(targets) || targets.length === 0) {
    throw new TypeError("targets must be a non-empty array");
  }

  if (typeof fetchImpl !== "function") {
    throw new TypeError("A fetch implementation is required");
  }

  return Promise.all(targets.map((target) => monitorTarget(target, fetchImpl)));
}

module.exports = {
  createRegexExtractor,
  monitorWebsites,
  normalizePrice
};
