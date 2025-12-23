
import React, { useState, useEffect, useCallback } from 'react';
import { fetchSheetData } from './utils/dataFetcher';
import { analyzeData } from './services/geminiService';
import { SheetData } from './types';
import DashboardView from './components/DashboardView';
import { Layout, Loader2, RefreshCcw, BrainCircuit, AlertCircle, ExternalLink, Database, Globe } from 'lucide-react';

const SHEET_ID = '14PZTMvf1iLqV-0_XrGIRq6l1zkoCj4cKe-4IXqKRBUs';
const TARGET_GID = 1825334005; 

const App: React.FC = () => {
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<{message: string, raw?: string} | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedData = await fetchSheetData(SHEET_ID, TARGET_GID);
      
      if (!fetchedData || fetchedData.length === 0) {
        throw new Error("시트에서 데이터를 찾을 수 없습니다. 내용이 비어있는지 확인해 주세요.");
      }

      // 필수 열 체크 (현장, 공종, 계정 중 하나라도 제목에 포함된 행 찾기)
      const sample = fetchedData[0];
      const headers = Object.keys(sample);
      const hasRequired = ['현장', '공종', '계정'].some(key => headers.some(h => h.includes(key)));
      
      if (!hasRequired) {
        throw new Error(`필수 데이터 열을 식별할 수 없습니다. 시트의 제목행(현장, 공종, 계정 등)을 확인해 주세요.`);
      }

      setData(fetchedData);
    } catch (err: any) {
      setError({ 
        message: err.message || '데이터 로드 중 예상치 못한 오류가 발생했습니다.',
        raw: err.stack 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f2f4f1] gap-6 p-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <Database className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-emerald-600" />
        </div>
        <div className="text-center">
          <p className="text-slate-800 font-black text-2xl mb-2">실시간 데이터 동기화</p>
          <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.3em]">
            <Globe className="w-3 h-3" />
            <span>Connecting Live Cloud</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f4f1] text-[#1a1a1a]">
      <header className="px-8 py-8 flex flex-col md:flex-row items-center justify-between max-w-[1600px] mx-auto w-full gap-6">
        <div className="flex items-center gap-5">
          <div className="bg-[#1a1a1a] p-4 rounded-[24px] shadow-2xl shadow-emerald-900/10 transform rotate-3">
            <Layout className="w-7 h-7 text-[#b5f5be]" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#1a1a1a]">디라이트 2관 지출</h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Dashboard System</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={loadData}
            className="flex items-center gap-2 px-6 py-4 bg-white rounded-2xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-bold text-slate-600"
          >
            <RefreshCcw className="w-5 h-5" />
            데이터 갱신
          </button>
          <button 
            onClick={async () => {
               if (data.length === 0) return;
               setIsAnalyzing(true);
               try {
                 setAiAnalysis(await analyzeData(data));
               } finally {
                 setIsAnalyzing(false);
               }
            }}
            disabled={isAnalyzing || data.length === 0}
            className="flex items-center gap-3 px-8 py-4 font-black text-white bg-[#1a1a1a] rounded-[24px] hover:bg-black disabled:opacity-50 transition-all shadow-2xl shadow-slate-300 active:scale-95"
          >
            {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-6 h-6 text-[#b5f5be]" />}
            AI 정밀 분석
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 pt-0 max-w-[1600px] mx-auto w-full">
        {error ? (
          <div className="bg-white rounded-[48px] p-12 border border-red-100 shadow-2xl max-w-4xl mx-auto mt-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-50 w-24 h-24 rounded-full flex items-center justify-center mb-8">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">구글 시트 연결 필요</h2>
              <p className="text-slate-500 font-bold text-lg mb-10 max-w-md mx-auto leading-relaxed">
                {error.message}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                  onClick={loadData}
                  className="px-10 py-5 bg-[#1a1a1a] text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  <RefreshCcw className="w-6 h-6" /> 다시 로드하기
                </button>
                <a 
                  href={`https://docs.google.com/spreadsheets/d/${SHEET_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3"
                >
                  <ExternalLink className="w-6 h-6" /> 시트 공개 설정
                </a>
              </div>
            </div>
          </div>
        ) : (
          <DashboardView 
            data={data} 
            aiAnalysis={aiAnalysis} 
            isAnalyzing={isAnalyzing} 
          />
        )}
      </main>

      <footer className="py-12 px-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-6 opacity-30 grayscale contrast-200">
           <img src="https://www.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png" className="h-6" alt="Google Sheets" />
           <div className="w-px h-4 bg-slate-400"></div>
           <span className="font-black text-sm tracking-widest">GEMINI 3 FLASH AI</span>
        </div>
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
          &copy; 2024 D-Light Hall 2 Dashboard • Enterprise Edition
        </p>
      </footer>
    </div>
  );
};

export default App;
