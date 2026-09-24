# lower-price
Projeto para varrer sites em busca de preços baixos

## O que o app faz

O projeto agora oferece uma base simples para monitorar diferentes tipos de sites
(como companhias aéreas e lojas) usando uma configuração por alvo:

- `url`: página a ser consultada
- `priceRange`: faixa de preço aceitável
- `extractPrices`: estratégia de extração dos preços encontrados

Cada site pode ter sua própria regra de extração, permitindo reutilizar o mesmo
motor para HTMLs diferentes.

## Como usar

1. Ajuste a configuração em `/home/runner/work/lower-price/lower-price/examples/sample.config.js`
2. Execute:

```bash
npm start -- ./examples/sample.config.js
```

O comando imprime um JSON com:

- preços encontrados dentro da faixa desejada
- menor preço encontrado
- indicação se houve correspondência (`matched`)

## Exemplo de API

```js
const { createRegexExtractor, monitorWebsites } = require("./src");

const results = await monitorWebsites({
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
});

console.log(results);
```
