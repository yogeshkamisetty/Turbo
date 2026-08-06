import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CopilotService {
  private readonly logger = new Logger(CopilotService.name);

  async analyzeFleetWithGemini(query: string, allocations: any[]): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
    try {
      const prompt = `You are the Switchyard AI Fleet Copilot. Analyze the following live EV fleet allocation receipts and answer the user query concisely.

User Query: "${query}"

Recent Allocation Receipts & Constraints:
${JSON.stringify(allocations.slice(0, 10), null, 2)}

Provide a JSON response with:
1. "summaryText": A 2-sentence explanation of why vehicles were throttled or delayed, citing specific binding constraints (Site Capacity, Entitlement Floor, Transformer Limit) and dual shadow prices (marginal congestion value in ₹/kW).
2. "primaryBottleneck": Name of the main constraint.
3. "recommendation": A concrete operational recommendation for the fleet manager.

Return raw valid JSON only.`;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
        },
        { timeout: 8000 }
      );

      const responseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJsonStr = responseText.replace(/```json|```/g, '').trim();

      if (cleanJsonStr) {
        const parsed = JSON.parse(cleanJsonStr);
        return {
          query,
          summaryText: parsed.summaryText,
          primaryBottleneck: parsed.primaryBottleneck || 'Site Capacity',
          samplesAnalyzed: allocations.length,
          recommendation: parsed.recommendation || 'Shift non-urgent departures past peak hours.',
        };
      }
    } catch (err) {
      this.logger.warn('Gemini API call failed or timed out, falling back to receipt summarizer:', err?.message || err);
    }
    }

    // Fallback heuristic receipt summarizer
    const bindingCounts: Record<string, number> = {};
    let totalThrottledKw = 0;

    for (const alloc of allocations) {
      const constr = alloc.bindingConstraint || 'Site Capacity';
      bindingCounts[constr] = (bindingCounts[constr] || 0) + 1;
      if (alloc.allocatedKw < 22) {
        totalThrottledKw += (22 - alloc.allocatedKw);
      }
    }

    const primaryBottleneck = Object.keys(bindingCounts).reduce((a, b) =>
      bindingCounts[a] > bindingCounts[b] ? a : b, 'Site Capacity'
    );

    return {
      query,
      summaryText: `Analysis of ${allocations.length} recent allocation cycles indicates primary throttling was caused by '${primaryBottleneck}'. A total of ${Math.round(totalThrottledKw)} kW capacity was constrained to protect site transformer limits and tenant entitlement floors.`,
      primaryBottleneck,
      samplesAnalyzed: allocations.length,
      recommendation: 'Consider shifting non-urgent vehicle departures past 06:30 AM or upgrading site peak transformer capacity.',
    };
  }
}
