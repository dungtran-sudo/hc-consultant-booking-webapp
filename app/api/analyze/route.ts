import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { buildPrompt } from '@/lib/prompts';
import { FormData } from '@/lib/types';
import { reserveBudgetSlot, finalizeBudgetSlot, cancelBudgetSlot } from '@/lib/usage';
import { sanitizeFormData } from '@/lib/sanitize';
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit';

const VALID_SPECIALTIES = ['nhi', 'da-lieu', 'sinh-san', 'std-sti', 'tieu-hoa', 'tim-mach', 'co-xuong-khop', 'tai-mui-hong', 'mat', 'nam-khoa', 'tiem-chung', 'xet-nghiem'];

export async function POST(request: Request) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`analyze:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return rateLimitResponse(rl, 10);
    }

    const body = await request.json();
    const { specialty, formData: rawFormData } = body as {
      specialty: string;
      formData: FormData;
    };
    const formData = sanitizeFormData(rawFormData);

    if (!VALID_SPECIALTIES.includes(specialty)) {
      return NextResponse.json(
        { error: 'Chuyên khoa không hợp lệ' },
        { status: 400 }
      );
    }

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Reserve budget slot atomically (prevents concurrent overspend)
    const reservation = await reserveBudgetSlot(specialty, sessionId);
    if (!reservation) {
      return NextResponse.json(
        { error: 'Hệ thống tạm ngưng phân tích do đã đạt giới hạn chi phí. Vui lòng thử lại sau.' },
        { status: 503 }
      );
    }

    const prompt = buildPrompt(specialty, formData);

    let completion;
    try {
      const startTime = Date.now();
      completion = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3500,
        temperature: 0.3,
      });
      const durationMs = Date.now() - startTime;

      // Finalize reservation with actual usage
      const usage = completion.usage;
      if (usage) {
        try {
          await finalizeBudgetSlot(reservation.id, {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            specialty,
            sessionId,
            durationMs,
          });
        } catch (logError) {
          console.error('Usage finalization failed (non-critical):', logError);
        }
      }
    } catch (apiError) {
      // Cancel reservation if OpenAI call fails
      await cancelBudgetSlot(reservation.id);
      throw apiError;
    }

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse response: split display content from JSON metadata
    let displayContent = responseText;
    let recommendedSpecialties: string[] = [specialty];
    let redFlags: string[] = [];

    const metadataMatch = responseText.match(
      /%%JSON_METADATA_START%%([\s\S]*?)%%JSON_METADATA_END%%/
    );

    if (metadataMatch) {
      displayContent = responseText
        .split('%%JSON_METADATA_START%%')[0]
        .trim();

      try {
        const metadata = JSON.parse(metadataMatch[1].trim());
        if (Array.isArray(metadata.recommended_specialties)) {
          const validated = metadata.recommended_specialties.filter(
            (s: unknown) => typeof s === 'string' && VALID_SPECIALTIES.includes(s)
          );
          if (validated.length > 0) {
            recommendedSpecialties = validated;
          }
        }
        if (metadata.red_flags_present) {
          redFlags = ['red_flags_present'];
        }
      } catch {
        // If JSON parsing fails, use defaults
      }
    }

    const response: Record<string, unknown> = {
      displayContent,
      recommendedSpecialties,
      redFlags,
      sessionId,
    };

    const res = NextResponse.json(response);
    res.headers.set('X-RateLimit-Limit', '10');
    res.headers.set('X-RateLimit-Remaining', rl.remaining.toString());
    return res;
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi phân tích. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
