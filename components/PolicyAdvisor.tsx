import React, { useState } from 'react';
import { generateHRPolicyAdvice } from '../services/geminiService';

const PolicyAdvisor: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [orgContext, setOrgContext] = useState(`
法人概要：複数の病棟（2A, 3A, 3B, 4A）を持つ医療法人。主な職種は看護師と看護補助者。
現状の課題：慢性的な人材不足に加え、急な欠勤（体調不良、忌引）や育休・産休による欠員が発生しており、現場が疲弊している。
導入目的：外部派遣ではなく「勝手知ったる」他部署の自社職員が、空き時間（公休や勤務前後）に手伝いに行ける「社内副業」制度を構築したい。
  `.trim());

  const [concern, setConcern] = useState(`
勤務表から明らかな人材不足（必要人員数と必要時間）を可視化して募集する場合の制度設計について、以下のアドバイスをお願いします。

1. 募集・応募のルール（常時ではなく、欠員発生時のみの運用方法）
2. 業務範囲の明確化（例：看護師は病室受け持ち・入浴リーダー・他院搬送。補助者は入浴介助のみなど）
3. 安全配慮義務と労務管理（本業と合わせた労働時間管理、休息時間の確保）
4. インセンティブ設計（急な欠員補充に対する手当など）
5. 規約ドラフト（これらの要素を盛り込んだもの）
  `.trim());

  const handleGenerate = async () => {
    setLoading(true);
    const advice = await generateHRPolicyAdvice(orgContext, concern);
    setResult(advice);
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <span className="text-3xl">⚖️</span>
          人事労務スペシャリストAI (Gemini 3 Pro)
        </h2>
        <p className="text-slate-600 mt-2">
          社内人材活用（インターナル・ギグワーク）制度の設計をAIが支援します。<br/>
          病棟の人員配置や業務内容に基づいて、最適な運用ルールと規約案を生成してください。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              組織のコンテキスト
            </label>
            <textarea
              className="w-full h-40 p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={orgContext}
              onChange={(e) => setOrgContext(e.target.value)}
            />
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              相談・依頼内容
            </label>
            <textarea
              className="w-full h-40 p-4 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={concern}
              onChange={(e) => setConcern(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all ${
              loading
                ? 'bg-slate-400 cursor-wait'
                : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-xl hover:-translate-y-1'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                規約案を生成中... (Geminiが思考中)
              </span>
            ) : (
              '規約・運用ルール案を生成する'
            )}
          </button>
        </div>

        {/* Output Section */}
        <div className="bg-slate-50 p-6 rounded-xl shadow-inner border border-slate-200 h-[calc(100vh-200px)] overflow-y-auto relative">
          {result ? (
            <div className="prose prose-slate prose-sm max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed text-slate-800">
                {result}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-4">📄</span>
              <p>左側の情報を確認し、ボタンを押してください。<br/>ここにAIのアドバイスが表示されます。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolicyAdvisor;