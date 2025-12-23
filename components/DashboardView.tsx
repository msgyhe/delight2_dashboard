
import React, { useMemo, useState } from 'react';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { SheetData } from '../types';
import { TrendingUp, Activity, Sparkles, BrainCircuit, ArrowLeft, Wallet } from 'lucide-react';

interface Props {
  data: SheetData[];
  aiAnalysis: string;
  isAnalyzing: boolean;
}

const MINT = '#b5f5be';
const PURPLE = '#d8b4fe';

const THEME_COLORS = [MINT, PURPLE, '#e2e8f0', '#fbbf24', '#f472b6', '#60a5fa'];
const EXCLUDED_SITES = ['본당', 'DMZ', '샤론키친'];

const formatCurrency = (val: number) => {
  return val.toLocaleString() + ' 원';
};

const DashboardView: React.FC<Props> = ({ data, aiAnalysis, isAnalyzing }) => {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const site = String(row['현장'] || '');
      return !EXCLUDED_SITES.includes(site);
    });
  }, [data]);

  const numericColumns = useMemo(() => {
    if (filteredData.length === 0) return [];
    const firstRow = filteredData[0];
    
    // '날짜' 키워드가 포함된 컬럼은 통계 합산에서 제외
    return Object.keys(firstRow).filter(key => {
      const isNumber = typeof firstRow[key] === 'number';
      const isDateColumn = key.includes('날짜') || key.toLowerCase().includes('date');
      return isNumber && !isDateColumn;
    });
  }, [filteredData]);

  const primaryMetric = useMemo(() => {
    const keywords = ['금액', '합계', '비용', 'Amount', 'Total', '실적'];
    const found = numericColumns.find(col => keywords.some(k => col.includes(k)));
    return found || numericColumns[0];
  }, [numericColumns]);

  const siteSummary = useMemo(() => {
    const summary: Record<string, number> = {};
    filteredData.forEach(row => {
      const site = String(row['현장'] || '기타');
      const val = Number(row[primaryMetric] || 0);
      summary[site] = (summary[site] || 0) + val;
    });
    return Object.entries(summary)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData, primaryMetric]);

  const groupedDetail = useMemo(() => {
    if (!selectedSite) return [];
    const filteredForSite = filteredData.filter(row => String(row['현장'] || '기타') === selectedSite);
    const groups: Record<string, { account: string, value: number }[]> = {};
    
    filteredForSite.forEach(row => {
      const type = String(row['공종'] || '기타 공종');
      const account = String(row['계정'] || '기타 계정');
      const val = Number(row[primaryMetric] || 0);
      if (!groups[type]) groups[type] = [];
      const existing = groups[type].find(i => i.account === account);
      if (existing) existing.value += val;
      else groups[type].push({ account, value: val });
    });

    return Object.entries(groups).map(([type, items]) => ({
      type,
      items: items.sort((a, b) => b.value - a.value),
      total: items.reduce((sum, item) => sum + item.value, 0)
    })).sort((a, b) => b.total - a.total);
  }, [filteredData, selectedSite, primaryMetric]);

  const stats = useMemo(() => {
    if (filteredData.length === 0 || numericColumns.length === 0) return [];
    // 상위 3개의 순수 숫자 컬럼(금액 등)만 표시
    return numericColumns.slice(0, 3).map((col) => {
      const sum = filteredData.reduce((acc, row) => acc + (row[col] || 0), 0);
      return { label: col, value: sum };
    });
  }, [filteredData, numericColumns]);

  const totalSum = useMemo(() => siteSummary.reduce((acc, s) => acc + s.value, 0), [siteSummary]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* 1. Main KPI Statistics (Dark Card) */}
      <div className="md:col-span-4 bg-[#1a1a1a] text-white p-8 rounded-[32px] shadow-2xl flex flex-col justify-between min-h-[300px]">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-xl font-bold">지출 통계</h3>
            <span className="text-xs font-bold text-slate-500 uppercase">Real-time stats</span>
          </div>
          <p className="text-slate-500 text-sm font-medium mb-8">주요 지표 누적 총액 (날짜 제외)</p>
          
          <div className="space-y-6">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value.toLocaleString()} <span className="text-sm font-normal text-slate-400">원</span></p>
                </div>
                {i === 0 && <div className="p-2 bg-emerald-500/20 rounded-full"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-400">DATA READY</span>
        </div>
      </div>

      {/* 2. Site Summary List (White Card) */}
      <div className="md:col-span-4 bg-white p-8 rounded-[32px] shadow-sm flex flex-col h-[400px] md:h-auto border border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">최근 집계 현황</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Site Breakdown</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl">
            <Wallet className="w-5 h-5 text-slate-400" />
          </div>
        </div>
        <div className="flex-1 overflow-auto space-y-3 pr-2 scrollbar-thin">
          {siteSummary.map((item, idx) => (
            <div 
              key={item.name} 
              onClick={() => setSelectedSite(item.name)}
              className={`group flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${selectedSite === item.name ? 'bg-[#b5f5be]/10 border-[#b5f5be]' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${selectedSite === item.name ? 'bg-[#b5f5be] text-black' : 'bg-white text-slate-500 shadow-sm'}`}>
                  {idx + 1}
                </div>
                <span className="font-bold text-slate-700">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="font-black text-sm">{formatCurrency(item.value)}</p>
                <p className="text-[10px] font-bold text-slate-400">TOTAL</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Detail Drilldown (Mint Card) */}
      <div className="md:col-span-4 bg-[#b5f5be] p-8 rounded-[32px] shadow-sm flex flex-col h-[400px] md:h-auto overflow-hidden">
        {selectedSite ? (
          <>
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setSelectedSite(null)}
                className="p-2 bg-white/50 rounded-xl hover:bg-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h3 className="text-xl font-black">{selectedSite}</h3>
                <p className="text-xs font-bold text-emerald-900/50 uppercase">Detailed Account</p>
              </div>
            </div>
            <div className="flex-1 overflow-auto space-y-6 pr-2 scrollbar-thin">
              {groupedDetail.map((group, idx) => (
                <div key={idx} className="bg-white/60 p-6 rounded-[32px] shadow-sm backdrop-blur-md">
                  <h4 className="text-2xl font-black text-emerald-950 mb-4 border-b-2 border-emerald-900/10 pb-2 leading-tight tracking-tighter">
                    {group.type}
                  </h4>
                  <div className="space-y-4">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex justify-between items-center border-b border-emerald-900/5 pb-2 last:border-0">
                        <span className="text-xs font-semibold text-emerald-900/60 max-w-[65%] uppercase tracking-tight leading-tight">
                          {item.account}
                        </span>
                        <span className="text-sm font-bold text-emerald-900 shrink-0">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-4 border-t-2 border-emerald-900/20 flex flex-col items-end text-emerald-950">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-900/40 mb-1">소계</span>
                    <span className="text-3xl font-black tracking-tighter drop-shadow-sm">
                      {formatCurrency(group.total)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="bg-white/40 w-20 h-20 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-10 h-10 text-emerald-800" />
            </div>
            <p className="text-emerald-900 font-bold max-w-[200px]">현장을 선택하여<br/>상세 내역을 확인하세요</p>
          </div>
        )}
      </div>

      {/* 4. Pie Chart Section */}
      <div className="md:col-span-8 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm min-h-[500px] flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black">현장별 비중</h3>
            <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">Market distribution</p>
          </div>
          <div className="bg-[#d8b4fe] px-6 py-4 rounded-[24px] text-purple-900 text-center shadow-lg shadow-purple-100">
             <p className="text-[10px] font-black uppercase">전체 합계</p>
             <p className="text-2xl font-black">{formatCurrency(totalSum)}</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-8">
           <div className="w-full h-[350px] lg:w-3/5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={siteSummary}
                    cx="50%"
                    cy="50%"
                    innerRadius={100}
                    outerRadius={140}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {siteSummary.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
           </div>
           
           <div className="w-full lg:w-2/5 space-y-4">
              <div className="p-6 bg-[#f2f4f1] rounded-[24px]">
                 <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest">Top Contributors</p>
                 <div className="space-y-4">
                    {siteSummary.slice(0, 4).map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm font-bold mb-1">
                          <span>{item.name}</span>
                          <span>{((item.value / totalSum) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                           <div 
                            className="h-full rounded-full transition-all duration-1000" 
                            style={{ 
                              width: `${(item.value / totalSum) * 100}%`, 
                              backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] 
                            }}
                           ></div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 5. AI Insights */}
      <div className="md:col-span-4 bg-[#1a1a1a] p-8 rounded-[32px] text-white overflow-y-auto max-h-[600px] shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-xl font-black">AI ANALYTICS</h3>
        </div>

        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-400 rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm font-bold animate-pulse tracking-widest uppercase">Deep Analyzing Data...</p>
          </div>
        ) : aiAnalysis ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: formatMarkdown(aiAnalysis) }} />
          </div>
        ) : (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mb-6">
              <BrainCircuit className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-bold mb-8">데이터 기반 분석을<br/>시작하려면 상단의 버튼을<br/>클릭하세요.</p>
          </div>
        )}
      </div>
    </div>
  );
};

function formatMarkdown(text: string): string {
  return text
    .replace(/^### (.*$)/gim, '<h4 class="text-purple-400 font-bold mt-6 mb-2 text-lg uppercase tracking-tight">$1</h4>')
    .replace(/^## (.*$)/gim, '<h3 class="text-white font-black mt-8 mb-4 border-b border-white/10 pb-2 text-xl">$1</h3>')
    .replace(/^# (.*$)/gim, '<h2 class="text-[#b5f5be] font-black text-2xl mb-6">$1</h2>')
    .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-2 text-slate-300 font-medium list-disc">$1</li>')
    .replace(/\*\*(.*)\*\*/gim, '<strong class="text-white font-black">$1</strong>')
    .replace(/\n/gim, '<br />');
}

export default DashboardView;
