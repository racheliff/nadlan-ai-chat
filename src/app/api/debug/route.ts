export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address') || 'רוטשילד 50 תל אביב';

  try {
    // Raw API call to see exactly what Govmap returns
    const response = await fetch('https://www.govmap.gov.il/api/search-service/autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
        'Origin': 'https://www.govmap.gov.il',
        'Referer': 'https://www.govmap.gov.il/',
      },
      body: JSON.stringify({
        searchText: address,
        count: 5,
      }),
    });

    const responseText = await response.text();

    return Response.json({
      status: response.status,
      statusText: response.statusText,
      body: responseText,
      address
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
    });
  }
}
