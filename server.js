const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN;

// ✅ Hardcoded Unified Sheet script URL
const targetUrl = 'https://script.google.com/macros/s/AKfycbx5cUYw6AhWLwxNtvh2RN-J3Xk-ATxxSe2X1jVstaOUah-f_qqwXAxVtOh9I6_voUCi/exec';

async function getLatLng(address) {
  try {
    console.log('🗺️ Geocoding:', address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const lat = data.features[0].center[1];
      const lng = data.features[0].center[0];
      console.log('✅ Geocoded:', lat, lng);
      return { lat, lng };
    }
  } catch (err) {
    console.error('❌ Geocoding Error:', err.message);
  }
  return { lat: '', lng: '' };
}

async function handleBlessingPost(req, res) {
  try {
    const body = req.body;

    // If lat/lng provided in the form, use them. Else try to geocode based on address.
    const addressParts = [body.address, body.city, body.country].filter(Boolean).join(', ');
    const coords = (body.latitude && body.longitude)
      ? { lat: body.latitude, lng: body.longitude }
      : await getLatLng(addressParts);

    const payload = {
      ...body,
      latitude: String(coords.lat || ''),
      longitude: String(coords.lng || ''),
    };

    console.log('📤 Sending to:', targetUrl);
    console.log('📦 Payload:', payload);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resultText = await response.text();
    console.log('✅ Google Script Response:', resultText);

    res.send(resultText);
  } catch (err) {
    console.error('❌ Server Error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

app.post('/', handleBlessingPost);
app.post('/post', handleBlessingPost);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Million Diamonds Proxy running on port ${PORT}`));
