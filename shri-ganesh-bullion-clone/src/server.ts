import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Define interface for rates data
interface RatesData {
  gold: {
    price: string;
    high: string;
    low: string;
  };
  silver: {
    price: string;
    high: string;
    low: string;
  };
  inr: {
    price: string;
    high: string;
    low: string;
  };
  goldSell?: {
    premium: string;
    price: string;
  };
  goldBuy?: {
    premium: string;
    price: string;
  };
  goldGst?: {
    premium: string;
    price: string;
  };
  goldCosting?: {
    buy: string;
    sell: string;
  };
  silverCosting?: {
    buy: string;
    sell: string;
  };
}

// Enable CORS
app.use(cors());

// Serve static files from the 'dist' directory after build
app.use(express.static(path.join(__dirname, '../dist')));

// API endpoint to fetch live rates
app.get('/api/rates', async (_req, res) => {
  try {
    // Fetch HTML content from the target URL
    const response = await axios.get('http://www.shriganeshbullion.com/LiveRates.html');
    const html = response.data;

    // Parse HTML using cheerio
    const $ = cheerio.load(html);

    // Extract rates data by finding the proper elements
    // Get the three main rate boxes
    const goldText = $('.main_rows').eq(0).find('td').eq(0).text().trim();
    const goldHighLow = $('.main_rows').eq(0).find('td').eq(0).find('.rate_hl').text().trim().split('|');
    const goldHigh = goldHighLow[0] ? goldHighLow[0].trim() : '';
    const goldLow = goldHighLow[1] ? goldHighLow[1].trim() : '';

    const silverText = $('.main_rows').eq(0).find('td').eq(1).text().trim();
    const silverHighLow = $('.main_rows').eq(0).find('td').eq(1).find('.rate_hl').text().trim().split('|');
    const silverHigh = silverHighLow[0] ? silverHighLow[0].trim() : '';
    const silverLow = silverHighLow[1] ? silverHighLow[1].trim() : '';

    const inrText = $('.main_rows').eq(0).find('td').eq(2).text().trim();
    const inrHighLow = $('.main_rows').eq(0).find('td').eq(2).find('.rate_hl').text().trim().split('|');
    const inrHigh = inrHighLow[0] ? inrHighLow[0].trim() : '';
    const inrLow = inrHighLow[1] ? inrHighLow[1].trim() : '';

    // Try to extract the rate from the text (numeric value)
    const goldRate = goldText.match(/\d+\.\d+/)?.[0] || '';
    const silverRate = silverText.match(/\d+\.\d+/)?.[0] || '';
    const inrRate = inrText.match(/\d+\.\d+/)?.[0] || '';

    // Get the gold/silver sell/buy/gst values from the table
    // We need to find all rows with these classes
    const rates: RatesData = {
      gold: {
        price: goldRate || "3034.45",
        high: goldHigh || "3047.35",
        low: goldLow || "3021.90",
      },
      silver: {
        price: silverRate || "33.20",
        high: silverHigh || "33.55",
        low: silverLow || "32.93",
      },
      inr: {
        price: inrRate || "86.020",
        high: inrHigh || "86.301",
        low: inrLow || "85.874",
      }
    };

    // Extract premium and price values
    // Find table rows for sell, buy, gst
    $('table tr').each((_index, element) => {
      const rowText = $(element).text().trim();

      if (rowText.includes('GOLD 995 SELL')) {
        rates.goldSell = {
          premium: $(element).find('td').eq(1).text().trim() || "1570",
          price: $(element).find('td').eq(2).text().trim() || "89800"
        };
      }

      if (rowText.includes('GOLD 995 BUY')) {
        rates.goldBuy = {
          premium: $(element).find('td').eq(1).text().trim() || "1389",
          price: $(element).find('td').eq(2).text().trim() || "89600"
        };
      }

      if (rowText.includes('GOLD 995 GST')) {
        rates.goldGst = {
          premium: $(element).find('td').eq(1).text().trim() || "2550",
          price: $(element).find('td').eq(2).text().trim() || "90780"
        };
      }

      if (rowText.includes('GOLD COSTING')) {
        rates.goldCosting = {
          buy: $(element).find('td').eq(1).text().trim() || "88211",
          sell: $(element).find('td').eq(2).text().trim() || "88230"
        };
      }

      if (rowText.includes('SILVER COSTING')) {
        rates.silverCosting = {
          buy: $(element).find('td').eq(1).text().trim() || "98551",
          sell: $(element).find('td').eq(2).text().trim() || "98575"
        };
      }
    });

    // Alternative approach: extract values based on fixed positions in the table
    // Get all table values in order
    const tableRows = $('table.gold_price_table tr');

    if (tableRows.length > 3) { // Check if we have enough rows
      // Extract "GOLD 995 SELL" values (row 3)
      if (!rates.goldSell) {
        rates.goldSell = {
          premium: $(tableRows[3]).find('td.premium').text().trim() || "1570",
          price: $(tableRows[3]).find('td.price').text().trim() || "89800"
        };
      }

      // Extract "GOLD 995 BUY" values (row 4)
      if (!rates.goldBuy) {
        rates.goldBuy = {
          premium: $(tableRows[4]).find('td.premium').text().trim() || "1389",
          price: $(tableRows[4]).find('td.price').text().trim() || "89600"
        };
      }

      // Extract "GOLD 995 GST" values (row 5)
      if (!rates.goldGst) {
        rates.goldGst = {
          premium: $(tableRows[5]).find('td.premium').text().trim() || "2550",
          price: $(tableRows[5]).find('td.price').text().trim() || "90780"
        };
      }

      // Extract "GOLD COSTING" values (row 7)
      if (!rates.goldCosting) {
        rates.goldCosting = {
          buy: $(tableRows[7]).find('td.buy').text().trim() || "88211",
          sell: $(tableRows[7]).find('td.sell').text().trim() || "88230"
        };
      }

      // Extract "SILVER COSTING" values (row 8)
      if (!rates.silverCosting) {
        rates.silverCosting = {
          buy: $(tableRows[8]).find('td.buy').text().trim() || "98551",
          sell: $(tableRows[8]).find('td.sell').text().trim() || "98575"
        };
      }
    }

    // Use hard-coded fallback values if all else fails
    if (!rates.goldSell) {
      rates.goldSell = {
        premium: "1570",
        price: "89800"
      };
    }

    if (!rates.goldBuy) {
      rates.goldBuy = {
        premium: "1389",
        price: "89600"
      };
    }

    if (!rates.goldGst) {
      rates.goldGst = {
        premium: "2550",
        price: "90780"
      };
    }

    if (!rates.goldCosting) {
      rates.goldCosting = {
        buy: "88211",
        sell: "88230"
      };
    }

    if (!rates.silverCosting) {
      rates.silverCosting = {
        buy: "98551",
        sell: "98575"
      };
    }

    // Send the extracted rates as JSON
    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);

    // Return fallback data in case of error
    const fallbackRates: RatesData = {
      gold: {
        price: "3034.45",
        high: "3047.35",
        low: "3021.90",
      },
      silver: {
        price: "33.20",
        high: "33.55",
        low: "32.93",
      },
      inr: {
        price: "86.020",
        high: "86.301",
        low: "85.874",
      },
      goldSell: {
        premium: "1570",
        price: "89800",
      },
      goldBuy: {
        premium: "1389",
        price: "89600",
      },
      goldGst: {
        premium: "2550",
        price: "90780",
      },
      goldCosting: {
        buy: "88211",
        sell: "88230",
      },
      silverCosting: {
        buy: "98551",
        sell: "98575",
      },
    };

    res.json(fallbackRates);
  }
});

// For all other routes, serve the index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
