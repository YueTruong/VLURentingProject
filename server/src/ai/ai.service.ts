import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PostEntity } from 'src/database/entities/post.entity';

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

type CloudProvider = 'openai' | 'dialogflow' | 'ollama';

type AssistantStatus = {
  cloudAvailable: boolean;
  provider: CloudProvider | 'fallback';
  openaiConfigured: boolean;
  dialogflowConfigured: boolean;
  ollamaConfigured: boolean;
  message: string;
};

type ParsedAssistantResponse = {
  criteria: HousingCriteria | null;
  reply: string;
  provider: string;
  mode: 'cloud' | 'fallback';
  cloudAvailable: boolean;
};

type ListingContextCache = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private listingContextCache: ListingContextCache | null = null;
  private readonly throttledWarnings = new Map<string, number>();

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(PostEntity)
    private readonly postRepository: Repository<PostEntity>,
  ) {}

  getStatus(): AssistantStatus {
    const openaiConfigured = this.hasValue(this.configService.get<string>('OPENAI_API_KEY'));
    const dialogflowConfigured = this.hasValue(
      this.configService.get<string>('DIALOGFLOW_WEBHOOK_URL'),
    );
    const ollamaConfigured = this.hasValue(
      this.configService.get<string>('OLLAMA_MODEL'),
    );
    const cloudAvailable =
      openaiConfigured || dialogflowConfigured || ollamaConfigured;
    const providerOrder = this.resolveProviderOrder();
    const provider = cloudAvailable
      ? providerOrder.find((item) =>
          item === 'openai'
            ? openaiConfigured
            : item === 'dialogflow'
              ? dialogflowConfigured
              : ollamaConfigured,
        ) ?? 'fallback'
      : 'fallback';

    if (ollamaConfigured) {
      return {
        cloudAvailable: true,
        provider,
        openaiConfigured,
        dialogflowConfigured,
        ollamaConfigured,
        message:
          'Ollama đã được cấu hình trên server. Chatbot có thể chạy bằng mô hình nội bộ kiểu ChatGPT mà không cần API key OpenAI.',
      };
    }

    if (openaiConfigured) {
      return {
        cloudAvailable: true,
        provider,
        openaiConfigured,
        dialogflowConfigured,
        ollamaConfigured,
        message:
          'OpenAI đã được cấu hình trên server. Chatbot sẽ ưu tiên AI cloud và tự động fallback khi cần.',
      };
    }

    if (dialogflowConfigured) {
      return {
        cloudAvailable: true,
        provider,
        openaiConfigured,
        dialogflowConfigured,
        ollamaConfigured,
        message:
          'Dialogflow đã được cấu hình trên server. Chatbot đang chạy cloud và vẫn có fallback local.',
      };
    }

    return {
      cloudAvailable: false,
      provider: 'fallback',
      openaiConfigured,
      dialogflowConfigured,
      ollamaConfigured,
      message:
        'Chưa cấu hình OPENAI_API_KEY trên server. Chatbot hiện đang dùng bộ phân tích nội bộ để giữ tính năng tìm kiếm.',
    };
  }

  async parseHousingQuery(
    input: string,
    districtOptions: string[] = [],
  ): Promise<ParsedAssistantResponse> {
    const normalizedInput = this.normalizeInput(input);
    const normalizedDistrictOptions = this.normalizeDistrictOptions(districtOptions);
    const listingContext = await this.getListingContext();

    for (const provider of this.resolveProviderOrder()) {
      const result =
        provider === 'openai'
          ? await this.tryOpenAI(
              normalizedInput,
              normalizedDistrictOptions,
              listingContext,
            )
          : provider === 'ollama'
            ? await this.tryOllama(
                normalizedInput,
                normalizedDistrictOptions,
                listingContext,
              )
            : await this.tryDialogflow(normalizedInput, normalizedDistrictOptions);

      if (result) {
        return result;
      }
    }

    return {
      criteria: null,
      reply: this.buildFallbackReply(normalizedInput),
      provider: 'fallback',
      mode: 'fallback',
      cloudAvailable: false,
    };
  }

  private resolveProviderOrder(): CloudProvider[] {
    const providerPreference = (
      this.configService.get<string>('AI_PROVIDER') || 'auto'
    )
      .trim()
      .toLowerCase();

    if (providerPreference === 'ollama') {
      return ['ollama', 'openai', 'dialogflow'];
    }

    if (providerPreference === 'dialogflow') {
      return ['dialogflow', 'openai', 'ollama'];
    }

    if (providerPreference === 'openai') {
      return ['openai', 'ollama', 'dialogflow'];
    }

    return ['openai', 'ollama', 'dialogflow'];
  }

  private async tryDialogflow(
    input: string,
    districtOptions: string[],
  ): Promise<ParsedAssistantResponse | null> {
    const endpoint = this.configService.get<string>('DIALOGFLOW_WEBHOOK_URL')?.trim();
    if (!endpoint) return null;

    const token = this.configService.get<string>('DIALOGFLOW_TOKEN')?.trim();

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
        this.logThrottledWarning(
          `dialogflow_http_${response.status}`,
          `Dialogflow gateway returned HTTP ${response.status} ${response.statusText}`,
        );
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
        data.reply ??
        data.response?.reply ??
        'Mình đã phân tích yêu cầu và áp dụng tiêu chí phù hợp.';

      return {
        criteria: this.sanitizeCriteria(resolvedCriteria),
        reply: resolvedReply,
        provider: 'dialogflow',
        mode: 'cloud',
        cloudAvailable: true,
      };
    } catch (error) {
      this.logThrottledWarning(
        'dialogflow_request_failed',
        `Dialogflow gateway request failed: ${this.getErrorMessage(error)}`,
      );
      return null;
    }
  }

  private async tryOpenAI(
    input: string,
    districtOptions: string[],
    listingContext: string,
  ): Promise<ParsedAssistantResponse | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY')?.trim();
    if (!apiKey) return null;

    const model = this.configService.get<string>('OPENAI_MODEL')?.trim() || 'gpt-4o-mini';
    const endpoint =
      this.configService.get<string>('OPENAI_BASE_URL')?.trim() ||
      'https://api.openai.com/v1';
    const districtHint = districtOptions.length
      ? `Danh sách khu vực hợp lệ: ${districtOptions.join(', ')}.`
      : 'Nếu người dùng nhắc quận hoặc khu vực, chỉ trích district khi chắc chắn.';

    const systemPrompt = this.buildOpenAISystemPrompt(
      districtHint,
      listingContext,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${endpoint.replace(/\/+$/, '')}/chat/completions`, {
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
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        const classifiedError = this.classifyOpenAIError(response.status, errorBody);
        this.logThrottledWarning(
          `openai_${classifiedError}`,
          `OpenAI request failed (${response.status}): ${classifiedError}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        this.logThrottledWarning(
          'openai_missing_content',
          'OpenAI response did not include message content',
        );
        return null;
      }

      const parsed = this.parseJsonContent<{
        criteria?: HousingCriteria;
        reply?: string;
      }>(content);

      if (!parsed) {
        this.logThrottledWarning(
          'openai_invalid_json_content',
          'OpenAI response was not valid JSON content',
        );
        return null;
      }

      return {
        criteria: this.sanitizeCriteria(parsed.criteria ?? {}),
        reply:
          parsed.reply?.trim() ||
          'Mình đã phân tích yêu cầu và cập nhật bộ lọc phù hợp.',
        provider: model,
        mode: 'cloud',
        cloudAvailable: true,
      };
    } catch (error) {
      this.logThrottledWarning(
        'openai_request_failed',
        `OpenAI request failed: ${this.getErrorMessage(error)}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async tryOllama(
    input: string,
    districtOptions: string[],
    listingContext: string,
  ): Promise<ParsedAssistantResponse | null> {
    const model = this.configService.get<string>('OLLAMA_MODEL')?.trim();
    if (!model) return null;

    const endpoint =
      this.configService.get<string>('OLLAMA_BASE_URL')?.trim() ||
      'http://127.0.0.1:11434';
    const districtHint = districtOptions.length
      ? `Danh sách khu vực hợp lệ: ${districtOptions.join(', ')}.`
      : 'Nếu người dùng nhắc quận hoặc khu vực, chỉ trích district khi chắc chắn.';
    const systemPrompt = this.buildOpenAISystemPrompt(
      districtHint,
      listingContext,
    );

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch(`${endpoint.replace(/\/+$/, '')}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1,
          },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: input },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this.logThrottledWarning(
          `ollama_http_${response.status}`,
          `Ollama request failed (${response.status}): ${errorBody || response.statusText}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        message?: { content?: string };
      };
      const content = data.message?.content;

      if (!content) {
        this.logThrottledWarning(
          'ollama_missing_content',
          'Ollama response did not include message content',
        );
        return null;
      }

      const parsed = this.parseJsonContent<{
        criteria?: HousingCriteria;
        reply?: string;
      }>(content);

      if (!parsed) {
        this.logThrottledWarning(
          'ollama_invalid_json_content',
          'Ollama response was not valid JSON content',
        );
        return null;
      }

      return {
        criteria: this.sanitizeCriteria(parsed.criteria ?? {}),
        reply:
          parsed.reply?.trim() ||
          'Mình đã phân tích yêu cầu và cập nhật bộ lọc phù hợp.',
        provider: `ollama:${model}`,
        mode: 'cloud',
        cloudAvailable: true,
      };
    } catch (error) {
      this.logThrottledWarning(
        'ollama_request_failed',
        `Ollama request failed: ${this.getErrorMessage(error)}`,
      );
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildOpenAISystemPrompt(
    districtHint: string,
    listingContext: string,
  ): string {
    return `
Bạn là trợ lý AI cho website tìm phòng trọ sinh viên VLU.
Mục tiêu của bạn:
- Hiểu câu hỏi tiếng Việt tự nhiên của người dùng.
- Nếu người dùng đang tìm phòng, trích xuất bộ lọc và trả lời ngắn gọn, thực tế.
- Nếu người dùng hỏi thông tin tổng quan, trả lời dựa trên dữ liệu website bên dưới. Không được bịa.
- Nếu không chắc chắn, để trống field trong criteria thay vì đoán.
- Nếu câu hỏi liên quan hợp đồng, cọc, pháp lý, chỉ đưa hướng dẫn chung và khuyên người dùng xác minh với chủ trọ.

Dữ liệu website hiện có:
${listingContext}

Yêu cầu trích xuất:
${districtHint}
- Chuẩn campus: CS1, CS2, CS3.
- Chuẩn availability: available hoặc rented.
- Query chỉ dùng khi người dùng có từ khóa tìm kiếm text thật sự.

Trả về JSON duy nhất theo schema:
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
    `.trim();
  }

  private buildFallbackReply(input: string): string {
    const normalized = this.normalizeVietnamese(input);

    if (
      /tieu chi|kiem tra truoc khi thue|can kiem tra|luu y truoc khi thue/.test(
        normalized,
      )
    ) {
      return [
        'AI cloud tạm thời chưa sẵn sàng nên mình đang trả lời bằng trợ lý nội bộ.',
        'Bạn nên kiểm tra 6 nhóm tiêu chí trước khi thuê phòng:',
        '1. Giá thuê, tiền cọc, điện nước, wifi và phí gửi xe.',
        '2. Hợp đồng có ghi rõ thời hạn thuê, điều kiện hoàn cọc và báo trước khi trả phòng.',
        '3. Vị trí đi lại đến trường, đồ ăn, bến xe buýt và độ an toàn khu vực.',
        '4. Tình trạng phòng thực tế: ẩm mốc, nhà vệ sinh, điện, nước, máy lạnh.',
        '5. Giờ giấc, quy định ở ghép, nuôi thú cưng và mức độ ồn ào.',
        '6. Giấy tờ xác nhận của chủ trọ và biên nhận khi đặt cọc.',
      ].join('\n');
    }

    if (/tien coc|dat coc|coc bao nhieu|coc may thang/.test(normalized)) {
      return [
        'AI cloud tạm thời chưa sẵn sàng nên mình đang trả lời bằng trợ lý nội bộ.',
        'Với phòng trọ sinh viên, mức cọc phổ biến thường là 1 đến 2 tháng tiền phòng.',
        'Nếu chủ trọ yêu cầu cọc cao hơn, bạn nên xem kỹ hợp đồng, điều kiện hoàn cọc và yêu cầu biên nhận rõ ràng trước khi chuyển tiền.',
      ].join('\n');
    }

    if (/hop dong|dieu khoan|ky hop dong/.test(normalized)) {
      return [
        'AI cloud tạm thời chưa sẵn sàng nên mình đang trả lời bằng trợ lý nội bộ.',
        'Trước khi ký hợp đồng, bạn nên kiểm tra: thông tin chủ trọ, giá thuê, tiền cọc, cách tính điện nước, thời hạn báo trước, điều kiện hoàn cọc và trách nhiệm sửa chữa.',
      ].join('\n');
    }

    if (/lua dao|an toan|canh giac|rui ro/.test(normalized)) {
      return [
        'AI cloud tạm thời chưa sẵn sàng nên mình đang trả lời bằng trợ lý nội bộ.',
        'Dấu hiệu cần cảnh giác: yêu cầu chuyển cọc trước khi xem phòng, giá rẻ bất thường, thông tin chủ trọ mơ hồ, không cho xem giấy tờ hoặc hợp đồng.',
      ].join('\n');
    }

    return [
      'AI cloud tạm thời chưa sẵn sàng nên mình đang quay về trợ lý nội bộ.',
      'Bạn vẫn có thể nhập giá, khu vực, loại phòng, diện tích, wifi, bãi xe hoặc hỏi các vấn đề cơ bản như tiền cọc, hợp đồng và lưu ý khi thuê phòng.',
    ].join('\n');
  }

  private async getListingContext(): Promise<string> {
    const now = Date.now();
    if (this.listingContextCache && this.listingContextCache.expiresAt > now) {
      return this.listingContextCache.value;
    }

    try {
      const [approvedCount, posts] = await Promise.all([
        this.postRepository.count({
          where: { status: 'approved' },
        }),
        this.postRepository.find({
          where: { status: 'approved' },
          relations: {
            category: true,
            amenities: true,
          },
          order: { updatedAt: 'DESC' },
          take: 12,
        }),
      ]);

      if (!approvedCount || posts.length === 0) {
        const emptyContext =
          'Hiện chưa có tin đăng đã duyệt nào trên website để làm ngữ cảnh.';
        this.listingContextCache = {
          value: emptyContext,
          expiresAt: now + 60_000,
        };
        return emptyContext;
      }

      const prices = posts
        .map((post) => this.toFiniteNumber(post.price))
        .filter((value): value is number => value !== null);
      const areas = posts
        .map((post) => this.toFiniteNumber(post.area))
        .filter((value): value is number => value !== null);

      const campusCounts = new Map<string, number>();
      const districtCounts = new Map<string, number>();

      for (const post of posts) {
        if (post.campus) {
          campusCounts.set(post.campus, (campusCounts.get(post.campus) ?? 0) + 1);
        }

        const district = this.extractDistrict(post.address);
        if (district) {
          districtCounts.set(district, (districtCounts.get(district) ?? 0) + 1);
        }
      }

      const campusSummary = Array.from(campusCounts.entries())
        .map(([campus, count]) => `${campus}: ${count}`)
        .join(', ');
      const districtSummary = Array.from(districtCounts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, 5)
        .map(([district, count]) => `${district}: ${count}`)
        .join(', ');

      const listingSamples = posts.map((post) => {
        const priceText = this.formatPrice(post.price);
        const areaText = this.formatArea(post.area);
        const district = this.extractDistrict(post.address) || post.address;
        const typeLabel = post.category?.name?.trim() || 'Không rõ loại';
        const amenityText = (post.amenities ?? [])
          .map((amenity) => amenity?.name?.trim())
          .filter(Boolean)
          .slice(0, 4)
          .join(', ');

        return `- #${post.id}: ${post.title} | ${typeLabel} | ${priceText} | ${areaText} | ${post.campus ?? 'Chưa rõ cơ sở'} | ${district} | ${post.availability}${amenityText ? ` | ${amenityText}` : ''}`;
      });

      const priceSummary =
        prices.length > 0
          ? `Gia cac tin moi nhat dao dong tu ${this.formatPrice(
              Math.min(...prices),
            )} den ${this.formatPrice(Math.max(...prices))}.`
          : null;
      const areaSummary =
        areas.length > 0
          ? `Dien tich dao dong tu ${this.formatArea(
              Math.min(...areas),
            )} den ${this.formatArea(Math.max(...areas))}.`
          : null;

      const context = [
        `Tổng số tin đăng đã duyệt hiện có: ${approvedCount}.`,
        priceSummary,
        areaSummary,
        campusSummary ? `Phân bố theo cơ sở: ${campusSummary}.` : null,
        districtSummary ? `Khu vực xuất hiện nhiều: ${districtSummary}.` : null,
        'Một số tin đăng gần đây:',
        ...listingSamples,
      ]
        .filter(Boolean)
        .join('\n');

      this.listingContextCache = {
        value: context,
        expiresAt: now + 60_000,
      };

      return context;
    } catch (error) {
      this.logger.warn(
        `Unable to build listing context: ${this.getErrorMessage(error)}`,
      );
      return 'Không truy xuất được dữ liệu listing hiện tại để làm ngữ cảnh.';
    }
  }

  private parseJsonContent<T>(content: string): T | null {
    const trimmed = content.trim();
    const directCandidate = trimmed
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    for (const candidate of [trimmed, directCandidate]) {
      try {
        return JSON.parse(candidate) as T;
      } catch {
        continue;
      }
    }

    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1)) as T;
      } catch {
        return null;
      }
    }

    return null;
  }

  private normalizeDistrictOptions(options: string[]): string[] {
    return Array.from(
      new Set(
        options
          .map((option) => this.normalizeInput(option))
          .filter(Boolean),
      ),
    );
  }

  private normalizeInput(input: string): string {
    return input.replace(/\s+/g, ' ').trim();
  }

  private normalizeVietnamese(input: string): string {
    return this.normalizeInput(input)
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private logThrottledWarning(
    key: string,
    message: string,
    cooldownMs = 300000,
  ) {
    const now = Date.now();
    const lastLoggedAt = this.throttledWarnings.get(key) ?? 0;

    if (now - lastLoggedAt < cooldownMs) {
      return;
    }

    this.throttledWarnings.set(key, now);
    this.logger.warn(message);
  }

  private hasValue(value?: string | null): boolean {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private classifyOpenAIError(status: number, errorBody: string): string {
    const normalizedBody = errorBody.toLowerCase();

    if (status === 401 || normalizedBody.includes('invalid_api_key')) {
      return 'invalid_api_key_or_authentication_error';
    }

    if (
      status === 429 ||
      normalizedBody.includes('rate limit') ||
      normalizedBody.includes('quota')
    ) {
      return 'rate_limit_or_quota_exceeded';
    }

    if (
      status === 403 ||
      normalizedBody.includes('billing') ||
      normalizedBody.includes('organization')
    ) {
      return 'forbidden_or_billing_issue';
    }

    if (status >= 500) {
      return 'openai_server_error';
    }

    return 'unknown_openai_error';
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }

  private extractDistrict(address?: string | null): string | null {
    if (!address) return null;

    const trimmed = address.trim();
    if (!trimmed) return null;

    const districtMatch = trimmed.match(
      /(Thanh pho Thu Duc|Thu Duc|Quan\s+\d+|Huyen\s+[A-Za-zÀ-ỹ\s]+|Binh Thanh|Go Vap|Phu Nhuan|Tan Binh|Tan Phu|Binh Tan)/i,
    );
    if (districtMatch?.[0]) {
      return districtMatch[0].trim();
    }

    const parts = trimmed
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return null;

    return parts[parts.length - 1] || null;
  }

  private formatPrice(value: unknown): string {
    const parsed = this.toFiniteNumber(value);
    if (parsed === null) return 'khong ro gia';
    const priceInMillions = parsed >= 100000 ? parsed / 1_000_000 : parsed;
    const normalized = Number.isInteger(priceInMillions)
      ? priceInMillions.toFixed(0)
      : priceInMillions.toFixed(1);
    return `${normalized} trieu`;
  }

  private formatArea(value: unknown): string {
    const parsed = this.toFiniteNumber(value);
    if (parsed === null) return 'khong ro dien tich';
    const normalized = Number.isInteger(parsed) ? parsed.toFixed(0) : parsed.toFixed(1);
    return `${normalized} m2`;
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
    if (
      criteria.availability &&
      ['available', 'rented'].includes(criteria.availability)
    ) {
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
