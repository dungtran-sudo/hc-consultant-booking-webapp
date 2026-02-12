import { NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/openai';
import { buildPrompt } from '@/lib/prompts';
import { FormData } from '@/lib/types';

const VALID_SPECIALTIES = ['nhi', 'da-lieu', 'sinh-san', 'std-sti', 'tieu-hoa'];

export async function POST(request: Request) {
  try {
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

    const prompt = buildPrompt(specialty, formData);

    const completion = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 3500,
      temperature: 0.3,
    });

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
        if (metadata.recommended_specialties) {
          recommendedSpecialties = metadata.recommended_specialties;
        }
        if (metadata.red_flags_present) {
          redFlags = ['red_flags_present'];
        }
      } catch {
        // If JSON parsing fails, use defaults
      }
    }

    return NextResponse.json({
      displayContent,
      recommendedSpecialties,
      redFlags,
      sessionId,
    });
  } catch (error) {
    console.error('Analyze API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi phân tích. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}
