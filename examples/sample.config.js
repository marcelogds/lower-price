"use strict";

const { createRegexExtractor } = require("../src");

module.exports = {
  targets: [
    {
      name: "Flight company",
      url: "https://example.com/flights",
      priceRange: { min: 100, max: 450 },
      extractPrices: createRegexExtractor(/data-price="([^"]+)"/g)
    },
    {
      name: "Product seller",
      url: "https://example.com/products",
      priceRange: { min: 50, max: 200 },
      extractPrices: createRegexExtractor(/class="price">([^<]+)</g)
    }
  ]
};
