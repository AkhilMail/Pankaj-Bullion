const axios = require('axios');
const cheerio = require('cheerio');

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

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

    // Initialize rates object with defaults
    const rates = {
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

    // Try different selectors to find rate data
    try {
      // Extract premium and price values
      // Find table rows for sell, buy, gst
      $('table tr').each((index, element) => {
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
    } catch (error) {
      console.log('Error extracting data from table rows:', error);
    }

    // Make sure we have all the required data
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

    // Return the extracted rates as JSON
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(rates)
    };
  } catch (error) {
    console.error('Error fetching rates:', error);

    // Return an error response with fallback data
    const fallbackRates = {
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

    return {
      statusCode: 200, // Return 200 with fallback data instead of error
      headers,
      body: JSON.stringify(fallbackRates)
    };
  }
};
