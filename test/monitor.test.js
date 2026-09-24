"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createRegexExtractor, monitorWebsites, normalizePrice } = require("../src");

test("normalizePrice parses localized price strings", () => {
  assert.equal(normalizePrice("$1,299.99"), 1299.99);
  assert.equal(normalizePrice("R$ 199,90"), 199.9);
  assert.equal(normalizePrice("2500"), 2500);
  assert.equal(normalizePrice("not a price"), null);
});

test("monitorWebsites filters prices for different website types", async () => {
  const pages = new Map([
    [
      "https://example.com/flights",
      '<div data-price="99"></div><div data-price="220"></div><div data-price="480"></div>'
    ],
    [
      "https://example.com/products",
      '<span class="price">R$ 89,90</span><span class="price">R$ 240,00</span>'
    ]
  ]);

  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    text: async () => pages.get(url)
  });

  const results = await monitorWebsites({
    targets: [
      {
        name: "Flights",
        url: "https://example.com/flights",
        priceRange: { min: 100, max: 300 },
        extractPrices: createRegexExtractor(/data-price="([^"]+)"/g)
      },
      {
        name: "Products",
        url: "https://example.com/products",
        priceRange: { min: 80, max: 100 },
        extractPrices: createRegexExtractor(/class="price">([^<]+)</g)
      }
    ],
    fetchImpl
  });

  assert.deepEqual(results, [
    {
      name: "Flights",
      url: "https://example.com/flights",
      matches: [220],
      matched: true,
      lowestPrice: 220,
      priceRange: { min: 100, max: 300 }
    },
    {
      name: "Products",
      url: "https://example.com/products",
      matches: [89.9],
      matched: true,
      lowestPrice: 89.9,
      priceRange: { min: 80, max: 100 }
    }
  ]);
});

test("monitorWebsites validates target definitions", async () => {
  await assert.rejects(
    () =>
      monitorWebsites({
        targets: [{ name: "Broken", url: "https://example.com" }],
        fetchImpl: async () => ({ ok: true, status: 200, text: async () => "" })
      }),
    /must define extractPrices/
  );
});

test("createRegexExtractor accepts regexes without a global flag", async () => {
  const results = await monitorWebsites({
    targets: [
      {
        name: "Single price",
        url: "https://example.com/single",
        priceRange: { min: 10, max: 20 },
        extractPrices: createRegexExtractor(/data-price="([^"]+)"/)
      }
    ],
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      text: async () => '<div data-price="15"></div>'
    })
  });

  assert.deepEqual(results[0].matches, [15]);
});
