const GOVMAP_BASE_URL = 'https://www.govmap.gov.il/api';

const headers = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
  'Origin': 'https://www.govmap.gov.il',
  'Referer': 'https://www.govmap.gov.il/',
};

interface AutocompleteResult {
  id: string;
  text: string;
  type: string;
  shape: string; // "POINT(x y)"
  originalText?: string;
}

interface Deal {
  settlementNameHeb?: string;
  streetNameHeb?: string;
  houseNum?: string;
  floorNo?: string;
  assetArea?: number;
  dealAmount?: number;
  assetRoomNum?: number;
  neighborhood?: string;
  dealDate?: string;
  propertyTypeDescription?: string;
  dealNatureDescription?: string;
}

export async function autocompleteAddress(searchText: string): Promise<AutocompleteResult[]> {
  try {
    const response = await fetch(`${GOVMAP_BASE_URL}/search-service/autocomplete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        searchText: searchText,
        count: 5,
      }),
    });

    if (!response.ok) {
      console.error('Autocomplete error:', response.status, await response.text());
      throw new Error(`Autocomplete failed: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Autocomplete exception:', error);
    throw error;
  }
}

interface PolygonInfo {
  polygon_id: string;
  dealscount: string;
  settlementNameHeb?: string;
  streetNameHeb?: string;
}

async function getPolygonsByRadius(x: number, y: number, radius: number = 500): Promise<PolygonInfo[]> {
  try {
    const response = await fetch(
      `${GOVMAP_BASE_URL}/real-estate/deals/${x},${y}/${radius}`,
      { headers }
    );

    if (!response.ok) {
      console.error('GetPolygonsByRadius error:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('GetPolygonsByRadius exception:', error);
    return [];
  }
}

async function getStreetDealsByPolygon(polygonId: string): Promise<Deal[]> {
  try {
    const response = await fetch(
      `${GOVMAP_BASE_URL}/real-estate/street-deals/${polygonId}`,
      { headers }
    );

    if (!response.ok) {
      console.error('GetStreetDeals error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('GetStreetDeals exception:', error);
    return [];
  }
}


export async function findDealsForAddress(address: string, yearsBack: number = 2) {
  // Step 1: Autocomplete to get coordinates
  const results = await autocompleteAddress(address);

  console.log('Autocomplete results:', JSON.stringify(results.slice(0, 2)));

  if (!results.length) {
    return { address, deals: [], total_deals: 0, message: 'כתובת לא נמצאה' };
  }

  const location = results[0];

  // Parse coordinates from shape: "POINT(x y)"
  const coordMatch = location.shape.match(/POINT\(([0-9.]+)\s+([0-9.]+)\)/);
  if (!coordMatch) {
    return { address, deals: [], total_deals: 0, message: 'לא נמצאו קואורדינטות' };
  }
  const x = parseFloat(coordMatch[1]);
  const y = parseFloat(coordMatch[2]);

  console.log('Using coordinates:', { x, y });

  // Step 2: Get polygons by radius
  const polygons = await getPolygonsByRadius(x, y, 500);
  console.log('Found polygons:', polygons.length);

  if (!polygons.length) {
    return { address: location.text || address, deals: [], total_deals: 0, message: 'לא נמצאו עסקאות באזור' };
  }

  // Step 3: Get deals from top polygons
  const allDeals: Deal[] = [];
  for (const polygon of polygons.slice(0, 5)) {
    const deals = await getStreetDealsByPolygon(polygon.polygon_id);
    allDeals.push(...deals);
  }

  console.log('Total deals found:', allDeals.length);

  // Dedupe deals
  const uniqueDeals = allDeals.filter((deal, index, self) =>
    index === self.findIndex(d =>
      d.dealAmount === deal.dealAmount &&
      d.dealDate === deal.dealDate &&
      d.assetArea === deal.assetArea
    )
  );

  // Sort by date (newest first)
  uniqueDeals.sort((a, b) => {
    const dateA = a.dealDate || '';
    const dateB = b.dealDate || '';
    return dateB.localeCompare(dateA);
  });

  return {
    address: location.text || address,
    debug: {
      autocomplete_count: results.length,
      coordinates: { x, y },
      polygons_found: polygons.length,
      total_deals: allDeals.length,
    },
    coordinates: { x, y },
    total_deals: uniqueDeals.length,
    deals: uniqueDeals.slice(0, 15).map(deal => ({
      address: [deal.streetNameHeb, deal.houseNum, deal.settlementNameHeb].filter(Boolean).join(' '),
      neighborhood: deal.neighborhood,
      date: deal.dealDate,
      price: deal.dealAmount,
      area_sqm: deal.assetArea,
      rooms: deal.assetRoomNum,
      floor: deal.floorNo,
      property_type: deal.propertyTypeDescription,
      deal_type: deal.dealNatureDescription,
      price_per_sqm: deal.assetArea && deal.dealAmount
        ? Math.round(deal.dealAmount / deal.assetArea)
        : null,
    })),
  };
}
