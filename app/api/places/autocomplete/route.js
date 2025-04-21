import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('input');
  const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Use non-public env var

  if (!apiKey) {
    console.error('Google Maps API key is missing on the server.');
    return NextResponse.json({ error: 'API key configuration error' }, { status: 500 });
  }

  if (!input) {
    return NextResponse.json({ error: 'Input query parameter is required' }, { status: 400 });
  }

  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${apiKey}&types=establishment`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API Error:', data.status, data.error_message);
        // Avoid sending detailed Google errors to the client
        return NextResponse.json({ error: 'Failed to fetch autocomplete suggestions' }, { status: 500 });
    }

    // We only need description and place_id for the frontend
    const suggestions = data.predictions?.map(prediction => ({
        description: prediction.description,
        place_id: prediction.place_id,
    })) || [];

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Error fetching autocomplete suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 