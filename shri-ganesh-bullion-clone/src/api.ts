import axios from 'axios';
import * as cheerio from 'cheerio';

export async function onRequest(_context: Record<string, unknown>) {
  // Set CORS headers
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  });

  try {
    // Fetch HTML content from the target URL
    const response = await axios.get('http://www.shriganeshbullion.com/LiveRates.html');
    const html = response.data;

    // Parse HTML using cheerio
    const $ = cheerio.load(html);

    // Extract rates data (similar to server.ts)
    const rates = {
      gold: {
        price: $('.main_rows > .gold_rates').eq(0).text().trim(),
        high: $('.main_rows > .gold_rates .high').text().trim(),
        low: $('.main_rows > .gold_rates .low').text().trim(),
      },
      silver: {
        price: $('.main_rows > .silver_rates').eq(0).text().trim(),
        high: $('.main_rows > .silver_rates .high').text().trim(),
        low: $('.main_rows > .silver_rates .low').text().trim(),
      },
      inr: {
        price: $('.main_rows > .inr_rates').eq(0).text().trim(),
        high: $('.main_rows > .inr_rates .high').text().trim(),
        low: $('.main_rows > .inr_rates .low').text().trim(),
      },
      goldSell: {
        premium: $('.gold_sell .premium').text().trim(),
        price: $('.gold_sell .price').text().trim(),
      },
      goldBuy: {
        premium: $('.gold_buy .premium').text().trim(),
        price: $('.gold_buy .price').text().trim(),
      },
      goldGst: {
        premium: $('.gold_gst .premium').text().trim(),
        price: $('.gold_gst .price').text().trim(),
      },
      goldCosting: {
        buy: $('.gold_costing .buy').text().trim(),
        buyH: $('.gold_costing .buy_h').text().trim(),
        sell: $('.gold_costing .sell').text().trim(),
        sellL: $('.gold_costing .sell_l').text().trim(),
      },
      silverCosting: {
        buy: $('.silver_costing .buy').text().trim(),
        buyH: $('.silver_costing .buy_h').text().trim(),
        sell: $('.silver_costing .sell').text().trim(),
        sellL: $('.silver_costing .sell_l').text().trim(),
      },
    };

    // Return the extracted rates as JSON
    return new Response(JSON.stringify(rates), { headers });
  } catch (error) {
    console.error('Error fetching rates:', error);

    // Return an error response
    return new Response(
      JSON.stringify({ error: 'Failed to fetch rates' }),
      {
        status: 500,
        headers
      }
    );
  }
}
