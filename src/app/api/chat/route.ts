import { anthropic } from '@ai-sdk/anthropic';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { findDealsForAddress } from '@/lib/govmap';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    system: `אתה עוזר נדל"ן ישראלי מומחה. אתה עוזר למשתמשים למצוא מידע על עסקאות נדל"ן בישראל.

כשמשתמש שואל על נכס או כתובת:
1. השתמש בכלי find_deals כדי למצוא עסקאות
2. הצג את התוצאות בצורה ברורה עם טבלה
3. חשב מחיר ממוצע למ"ר (התעלם מעסקאות מתחת ל-500,000 ש"ח - אלו בד"כ חניות/מחסנים)
4. תן ניתוח קצר של המגמות

תמיד ענה בעברית.`,
    messages,
    tools: {
      find_deals: tool({
        description: 'מצא עסקאות נדל"ן לכתובת מסוימת בישראל. מחזיר רשימת עסקאות עם מחיר, שטח ותאריך.',
        parameters: z.object({
          address: z.string().describe('הכתובת לחיפוש בעברית'),
          years_back: z.number().default(2).describe('שנים אחורה'),
        }),
        execute: async ({ address, years_back }) => {
          try {
            const result = await findDealsForAddress(address, years_back);
            return result;
          } catch (error) {
            return { error: `שגיאה בחיפוש: ${error}` };
          }
        },
      }),
    },
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
