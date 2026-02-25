import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type HousingCriteria = {
  priceMin?: number;
  priceMax?: number;
  areaMin?: number;
  areaMax?: number;
  bedsMin?: number;
  wifi?: boolean;
  parking?: boolean;
  furnished?: boolean;
  campus?: 'CS1' | 'CS2' | 'CS3';
  district?: string;
  type?: string;
  availability?: 'available' | 'rented';
  query?: string;
  tags?: string[];
};

@Injectable()
export class AiService {
  constructor(private readonly configService: ConfigService) {}

  async parseHousingQuery(input: string, districtOptions: string[] = []) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    if (!apiKey) {
      return {
        criteria: null,
        reply:
          'AI cloud chưa được cấu hình (thiếu OPENAI_API_KEY). Hệ thống sẽ fallback sang parser rule-based ở frontend.',
        provider: 'fallback',
      };
    }

    const endpoint = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    const districtHint = districtOptions.length
      ? `Danh sách khu vực hợp lệ: ${districtOptions.join(', ')}.`
      : 'Nếu người dùng nhắc quận/khu vực, trích xuất district nếu chắc chắn.';

    const systemPrompt = `Bạn là trợ lý lọc phòng trọ VLU.
Trích xuất tiêu chí tìm kiếm từ câu tiếng Việt và trả JSON duy nhất theo schema:
{
  "criteria": {
    "priceMin": number?,
    "priceMax": number?,
    "areaMin": number?,
    "areaMax": number?,
    "bedsMin": number?,
    "wifi": boolean?,
    "parking": boolean?,
    "furnished": boolean?,
    "campus": "CS1"|"CS2"|"CS3"?,
    "district": string?,
    "type": string?,
    "availability": "available"|"rented"?,
    "query": string?,
    "tags": string[]?
  },
  "reply": string
}
- Không bịa dữ liệu.
- Nếu thiếu chắc chắn thì bỏ trống field.
- Chuẩn availability: "available" hoặc "rented".
- Chuẩn campus: CS1/CS2/CS3.
${districtHint}`;

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`AI provider error: ${response.status} ${text}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('AI response empty');
      }

      const parsed = JSON.parse(content) as {
        criteria?: HousingCriteria;
        reply?: string;
      };

      return {
        criteria: this.sanitizeCriteria(parsed.criteria ?? {}),
        reply: parsed.reply || 'Mình đã phân tích tiêu chí và áp dụng bộ lọc phù hợp.',
        provider: model,
      };
    } catch {
      return {
        criteria: null,
        reply:
          'AI cloud tạm thời không khả dụng. Hệ thống sẽ fallback sang parser rule-based ở frontend.',
        provider: 'fallback',
      };
    }
  }

  private sanitizeCriteria(criteria: HousingCriteria): HousingCriteria {
    const next: HousingCriteria = {};

    const numericKeys: Array<keyof HousingCriteria> = [
      'priceMin',
      'priceMax',
      'areaMin',
      'areaMax',
      'bedsMin',
    ];
    for (const key of numericKeys) {
      const value = criteria[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        if (key === 'priceMin') next.priceMin = value;
        if (key === 'priceMax') next.priceMax = value;
        if (key === 'areaMin') next.areaMin = value;
        if (key === 'areaMax') next.areaMax = value;
        if (key === 'bedsMin') next.bedsMin = value;
      }
    }

    if (criteria.wifi === true) next.wifi = true;
    if (criteria.parking === true) next.parking = true;
    if (criteria.furnished === true) next.furnished = true;

    if (criteria.campus && ['CS1', 'CS2', 'CS3'].includes(criteria.campus)) {
      next.campus = criteria.campus;
    }
    if (criteria.availability && ['available', 'rented'].includes(criteria.availability)) {
      next.availability = criteria.availability;
    }

    if (typeof criteria.district === 'string' && criteria.district.trim()) {
      next.district = criteria.district.trim();
    }
    if (typeof criteria.type === 'string' && criteria.type.trim()) {
      next.type = criteria.type.trim();
    }
    if (typeof criteria.query === 'string' && criteria.query.trim()) {
      next.query = criteria.query.trim();
    }

    if (Array.isArray(criteria.tags) && criteria.tags.length > 0) {
      next.tags = criteria.tags
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => item.trim());
    }

    return next;
  }
}
