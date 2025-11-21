import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHRPolicyAdvice = async (
  organizationContext: string,
  concern: string
): Promise<string> => {
  try {
    const prompt = `
      あなたは日本の労働法と人事労務管理に精通したプロフェッショナルな社会保険労務士兼人事コンサルタントです。
      以下の組織コンテキストに基づいて、社内副業（インターナル・ギグワーク）制度の設計に関するアドバイスと規約のドラフトを作成してください。

      ## 組織の状況
      ${organizationContext}

      ## 相談内容
      ${concern}

      ## 出力要件
      1. マークダウン形式で出力してください。
      2. 法的リスク（労働時間管理、割増賃金、安全配慮義務など）を考慮した具体的な条項案を含めてください。
      3. 運用フロー（募集から給与支払いまで）の提案を含めてください。
      4. 文体は「である」調で、専門的かつ実用的に記述してください。
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
        systemInstruction: "あなたは優秀な人事労務スペシャリストです。具体的かつ法的に適切なアドバイスを提供します。"
      }
    });

    return response.text || "アドバイスを生成できませんでした。もう一度お試しください。";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "エラーが発生しました。APIキーを確認するか、しばらく待ってから再試行してください。";
  }
};