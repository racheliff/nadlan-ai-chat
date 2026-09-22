import { findDealsForAddress, autocompleteAddress } from '@/lib/govmap';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address') || 'רוטשילד 50 תל אביב';

  try {
    // Test autocomplete first
    const autocomplete = await autocompleteAddress(address);

    if (!autocomplete.length) {
      return Response.json({
        success: false,
        step: 'autocomplete',
        error: 'No results',
        address
      });
    }

    // Test full search
    const result = await findDealsForAddress(address, 2);

    return Response.json({
      success: true,
      autocomplete_results: autocomplete.length,
      result
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
