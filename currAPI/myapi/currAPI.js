const express = require('express');
const request = require("request-promise");
const app = express();
const port = 3000;

let curr = {
  usd: {},
  eur: {},
  gold: {}
};

// JSON verilerini parse etmek için
app.use(express.json());

// Tüm kullanıcıları listeleme
app.get('/curr', async (req, res) => {
  try {
    // getExchangeInfo fonksiyonundan dönen veriyi API yanıtı olarak kullan
    const exchangeInfo = await getExchangeInfo();
    // exchangeInfo'yu curr değişkenine ata
    curr = exchangeInfo;
    // API yanıtını gönder
    res.json(curr);
  } catch (error) {
    // Hata oluştuğunda hata mesajını API yanıtı olarak gönder
    res.status(500).json({ error: error.message });
  }
});

async function getExchangeInfo() {
  let body = await request({
    url: "https://www.qnbfinansbank.enpara.com/hesaplar/doviz-ve-altin-kurlari",
    method: "GET"
  });
  return extractWithRegex(body);
}

function extractWithRegex(body) {
  let extractedInfo = body.match(/enpara-gold-exchange-rates__table-item(.*?)enpara-gold-exchange-rates__information/g);
  if (!extractedInfo) throw new Error("Regex is not match any values. Please check your regex");

  extractedInfo = extractedInfo[0].match(/([0-9,]+)\s*TL/g);
  if (!extractedInfo) throw new Error("Regex is not match any values. Please check your regex");

  for (let i = 0; i < extractedInfo.length; i++) {
    extractedInfo[i] = parseFloat(parseFloat(extractedInfo[i].replace(/\s*TL/g, "").replace(/,/g,".")).toFixed(3));
  }

  return createJSON(extractedInfo);
}

function createJSON(info) {
  let usd = {}, eur = {}, gold = {};
  if (!Array.isArray(info)) throw new Error("info parameter must be an Array");

  if (info.length >= 2) {
    usd.buy = info[0];
    usd.sell = info[1];
  }

  if (info.length >= 4) {
    eur.buy = info[2];
    eur.sell = info[3];
  }

  if (info.length >= 6) {
    gold.buy = info[4];
    gold.sell = info[5];
  }

  return {
    usd,
    eur,
    gold
  };
}

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
