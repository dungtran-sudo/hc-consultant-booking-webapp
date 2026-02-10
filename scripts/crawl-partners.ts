import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

interface Partner {
  id: string;
  name: string;
  website: string;
  crawl_urls: string[];
  booking_email: string;
  phone: string;
  city: string;
  district: string;
  address: string;
  branches?: { id: string; city: string; district?: string; address: string }[];
  specialties: string[];
  notes: string;
  services: {
    id: string;
    name: string;
    specialty: string;
    description: string;
    price_range: string;
    duration: string;
    notes: string;
  }[];
}

const SYSTEM_PROMPT = `You are a medical service data extraction specialist. Extract structured service/package data from Vietnamese healthcare provider website content.

Return ONLY valid JSON with this exact structure, no other text:
{
  "services": [
    {
      "id": "slug-of-service-name",
      "name": "Tên dịch vụ đầy đủ",
      "specialty": "one of: nhi|da-lieu|sinh-san|std-sti|tieu-hoa",
      "description": "Mô tả ngắn gọn dịch vụ",
      "price_range": "VD: 300,000 - 500,000 VND hoặc Liên hệ",
      "duration": "VD: 30-45 phút hoặc để trống nếu không rõ",
      "notes": "Ghi chú đặc biệt nếu có"
    }
  ],
  "confidence": "high|medium|low",
  "reason": "brief explanation if confidence is not high"
}

Rules:
- Only extract services relevant to these 5 specialties: nhi (pediatrics), da-lieu (dermatology), sinh-san (reproductive/obstetrics), std-sti (sexually transmitted infections), tieu-hoa (gastroenterology/digestive)
- Only include services that are clearly offered by this provider
- Do not invent services not mentioned in the content
- Maximum 15 services per partner
- Use Vietnamese for all text fields`;

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HealthcareBot/1.0)',
        'Accept': 'text/html',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.log(`  [WARN] HTTP ${res.status} for ${url}`);
      return '';
    }

    const html = await res.text();
    const text = stripHtml(html);
    return text.substring(0, 8000);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`  [WARN] Failed to fetch ${url}: ${message}`);
    return '';
  }
}

async function main() {
  const dataPath = path.join(__dirname, '..', 'data', 'partners.json');
  const partners: Partner[] = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const report: string[] = [];
  report.push('=== Partner Crawl Report ===');
  report.push(`Date: ${new Date().toISOString()}`);
  report.push('');

  let processedCount = 0;
  let successCount = 0;
  let lowConfidencePartners: string[] = [];

  for (const partner of partners) {
    if (!partner.crawl_urls || partner.crawl_urls.length === 0) {
      continue;
    }

    processedCount++;
    console.log(`\n[${processedCount}] Processing: ${partner.name}`);

    // Fetch all URLs
    const pageTexts: string[] = [];
    for (const url of partner.crawl_urls) {
      console.log(`  Fetching: ${url}`);
      const text = await fetchPage(url);
      if (text) {
        pageTexts.push(text);
      }
    }

    if (pageTexts.length === 0) {
      console.log(`  [SKIP] No content retrieved for ${partner.name}`);
      report.push(`${partner.name}: SKIPPED - no content retrieved`);
      continue;
    }

    const combinedText = pageTexts.join('\n\n---\n\n').substring(0, 15000);

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Extract services from this healthcare provider's website content.\n\nProvider: ${partner.name}\nSpecialties: ${partner.specialties.join(', ')}\n\nWebsite content:\n${combinedText}`,
          },
        ],
        max_tokens: 2000,
        temperature: 0.2,
      });

      const responseText = completion.choices[0]?.message?.content || '';

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText.trim());
      const services = parsed.services || [];
      const confidence = parsed.confidence || 'unknown';
      const reason = parsed.reason || '';

      partner.services = services;
      successCount++;

      console.log(`  [OK] ${services.length} services found (confidence: ${confidence})`);
      report.push(
        `${partner.name}: ${services.length} services (confidence: ${confidence})${
          reason ? ` - ${reason}` : ''
        }`
      );

      if (confidence === 'low') {
        lowConfidencePartners.push(partner.name);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`  [ERROR] Failed to extract services: ${message}`);
      report.push(`${partner.name}: ERROR - ${message}`);
    }

    // Rate limiting - wait between API calls
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Write updated partners data
  fs.writeFileSync(dataPath, JSON.stringify(partners, null, 2), 'utf-8');
  console.log(`\nUpdated ${dataPath}`);

  // Summary
  report.push('');
  report.push('=== Summary ===');
  report.push(`Total processed: ${processedCount}`);
  report.push(`Successful: ${successCount}`);
  report.push(`Failed: ${processedCount - successCount}`);

  if (lowConfidencePartners.length > 0) {
    report.push('');
    report.push('=== Low Confidence (Manual Review Needed) ===');
    for (const name of lowConfidencePartners) {
      report.push(`- ${name}`);
    }
  }

  const reportPath = path.join(__dirname, 'crawl-report.txt');
  fs.writeFileSync(reportPath, report.join('\n'), 'utf-8');
  console.log(`Report saved to ${reportPath}`);
}

main().catch((err) => {
  console.error('Crawl script failed:', err);
  process.exit(1);
});
