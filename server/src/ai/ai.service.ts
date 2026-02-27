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
    const providerPreference = (this.configService.get<string>('AI_PROVIDER') || 'auto').toLowerCase();

    if (providerPreference !== 'openai') {
      const dialogflowResult = await this.tryDialogflow(input, districtOptions);
      if (dialogflowResult) return dialogflowResult;
    }

    if (providerPreference !== 'dialogflow') {
      const openAiResult = await this.tryOpenAI(input, districtOptions);
      if (openAiResult) return openAiResult;
    }

    return {
      criteria: null,
      reply:
        'AI cloud chưa được cấu hình hoặc tạm thời gián đoạn. Hệ thống đang chạy AI local parser để đảm bảo lọc ổn định.',
      provider: 'fallback',
    };
  }

  private async tryDialogflow(input: string, districtOptions: string[]) {
    const endpoint = this.configService.get<string>('DIALOGFLOW_WEBHOOK_URL');
    if (!endpoint) return null;

    const token = this.configService.get<string>('DIALOGFLOW_TOKEN');

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: input,
          districtOptions,
        }),
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        criteria?: HousingCriteria;
        reply?: string;
        response?: {
          criteria?: HousingCriteria;
          reply?: string;
        };
      };

      const resolvedCriteria = data.criteria ?? data.response?.criteria ?? {};
      const resolvedReply =
        data.reply ?? data.response?.reply ?? 'Mình đã phân tích bằng Dialogflow và áp dụng tiêu chí phù hợp.';

      return {
        criteria: this.sanitizeCriteria(resolvedCriteria),
        reply: resolvedReply,
        provider: 'dialogflow',
      };
    } catch {
      return null;
    }
  }

  private async tryOpenAI(input: string, districtOptions: string[]) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;

    const model = this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';
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
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return null;
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
      return null;
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
