import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { buildPrompt } from '@/lib/prompts';
import { FormData } from '@/lib/types';
import { checkBudget, logUsage } from '@/lib/usage';
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
    const { specialty, formData } = body as {
      specialty: string;
      formData: FormData;
    };

    if (!VALID_SPECIALTIES.includes(specialty)) {
      return NextResponse.json(
        { error: 'Chuyên khoa không hợp lệ' },
        { status: 400 }
      );
    }

    // Budget check before calling OpenAI
    const budget = await checkBudget();
    if (!budget.allowed) {
      return NextResponse.json(
        { error: budget.message },
        { status: 503 }
      );
    }

    const prompt = buildPrompt(specialty, formData);

    const startTime = Date.now();
    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
      temperature: 0.3,
    });
    const durationMs = Date.now() - startTime;

    const responseText = completion.choices[0]?.message?.content || '';

    // Parse response: split display content from JSON metadata
    let displayContent = responseText;
    let recommendedSpecialties: string[] = [specialty];
    let redFlags: string[] = [];
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

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

    // Log usage (non-critical)
    const usage = completion.usage;
    if (usage) {
      try {
        await logUsage({
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
          specialty,
          sessionId,
          durationMs,
        });
      } catch (logError) {
        console.error('Usage logging failed (non-critical):', logError);
      }
    }

    const response: Record<string, unknown> = {
      displayContent,
      recommendedSpecialties,
      redFlags,
      sessionId,
    };

    if (budget.budgetWarning) {
      response.budgetWarning = budget.message;
    }

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
