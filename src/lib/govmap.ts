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
  ResultType: string;
  ResultLable: string;
  X: number;
  Y: number;
  ObjectId?: string;
}

interface Deal {
  FULLADRESS?: string;
  DEALAMOUNT?: number;
  DEALNATURE?: number;
  ASSETROOMNUM?: number;
  BUILDINGYEAR?: number;
  ASSETAREA?: number;
  FLOORNO?: number;
  DEALDATE?: string;
  NEWPROJECTNAME?: string;
  TREND?: number;
  POLYGON_ID?: string;
  DISPLAYDATE?: string;
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
    return data.Results || [];
  } catch (error) {
    console.error('Autocomplete exception:', error);
    throw error;
  }
}

export async function getDealsByRadius(x: number, y: number, radius: number = 100): Promise<Deal[]> {
  try {
    const response = await fetch(
      `${GOVMAP_BASE_URL}/nadlan/GetNadlanByRadius?x=${x}&y=${y}&radius=${radius}`,
      { headers }
    );

    if (!response.ok) {
      console.error('GetDealsByRadius error:', response.status);
      throw new Error(`GetDealsByRadius failed: ${response.status}`);
    }

    const data = await response.json();
    return data.NadlanItems || [];
  } catch (error) {
    console.error('GetDealsByRadius exception:', error);
    throw error;
  }
}

export async function getStreetDeals(polygonId: string, yearsBack: number = 2): Promise<Deal[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - yearsBack);

  try {
    const response = await fetch(`${GOVMAP_BASE_URL}/nadlan/GetNadlanByPolygon`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        PolygonId: polygonId,
        FromDate: startDate.toISOString().split('T')[0],
        ToDate: endDate.toISOString().split('T')[0],
        PageNo: 1,
        PageSize: 50,
      }),
    });

    if (!response.ok) {
      console.error('GetStreetDeals error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.NadlanItems || [];
  } catch (error) {
    console.error('GetStreetDeals exception:', error);
    return [];
  }
}

export async function findDealsForAddress(address: string, yearsBack: number = 2) {
  // Step 1: Autocomplete to get coordinates
  const results = await autocompleteAddress(address);

  if (!results.length) {
    return { address, deals: [], total_deals: 0, message: 'כתובת לא נמצאה' };
  }

  const location = results[0];
  const x = location.X;
  const y = location.Y;

  // Step 2: Get deals by radius
  const radiusDeals = await getDealsByRadius(x, y, 200);

  // Step 3: Get street deals if we have a polygon ID
  let streetDeals: Deal[] = [];
  if (radiusDeals.length > 0 && radiusDeals[0].POLYGON_ID) {
    streetDeals = await getStreetDeals(radiusDeals[0].POLYGON_ID, yearsBack);
  }

  // Combine and dedupe deals
  const allDeals = [...radiusDeals, ...streetDeals];
  const uniqueDeals = allDeals.filter((deal, index, self) =>
    index === self.findIndex(d =>
      d.DEALAMOUNT === deal.DEALAMOUNT &&
      d.DEALDATE === deal.DEALDATE &&
      d.ASSETAREA === deal.ASSETAREA
    )
  );

  // Sort by date (newest first)
  uniqueDeals.sort((a, b) => {
    const dateA = a.DEALDATE || a.DISPLAYDATE || '';
    const dateB = b.DEALDATE || b.DISPLAYDATE || '';
    return dateB.localeCompare(dateA);
  });

  return {
    address: location.ResultLable || address,
    coordinates: { x, y },
    total_deals: uniqueDeals.length,
    deals: uniqueDeals.slice(0, 15).map(deal => ({
      address: deal.FULLADRESS,
      date: deal.DISPLAYDATE || deal.DEALDATE,
      price: deal.DEALAMOUNT,
      area_sqm: deal.ASSETAREA,
      rooms: deal.ASSETROOMNUM,
      floor: deal.FLOORNO,
      building_year: deal.BUILDINGYEAR,
      is_new: deal.DEALNATURE === 1,
      project_name: deal.NEWPROJECTNAME,
      price_per_sqm: deal.ASSETAREA && deal.DEALAMOUNT
        ? Math.round(deal.DEALAMOUNT / deal.ASSETAREA)
        : null,
    })),
  };
}
