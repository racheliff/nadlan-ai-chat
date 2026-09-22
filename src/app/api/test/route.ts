import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';

export async function GET() {
  try {
    const result = await generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt: 'Say hello in Hebrew',
    });
    return Response.json({ success: true, text: result.text });
  } catch (error) {
    return Response.json({
      success: false,
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
