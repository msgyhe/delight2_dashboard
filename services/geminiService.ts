
import { GoogleGenAI } from "@google/genai";
import { SheetData } from "../types";

export async function analyzeData(data: SheetData[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";
  
  // Create a summary of the data
  const summary = data.slice(0, 50).map(row => JSON.stringify(row)).join("\n");
  
  const prompt = `
    다음은 구글 시트('total' 시트)에서 가져온 데이터 분석 요청입니다.
    제공된 데이터는 상위 50개 행의 샘플입니다.
    
    데이터 요약:
    ${summary}
    
    다음 내용을 포함하여 분석을 작성해 주세요 (모든 답변은 한국어로 작성):
    1. 데이터의 목적에 대한 간결한 개요.
    2. 관찰된 주요 트렌드 또는 이상 징후.
    3. 수치를 기반으로 한 3가지 실행 가능한 권장 사항.
    4. 주요 수치 컬럼에 대한 간단한 통계 요약.
    
    분석은 전문적인 느낌의 마크다운 형식을 사용하고 명확한 헤더를 포함해 주세요.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "분석 결과가 생성되지 않았습니다.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "분석 생성 중 오류가 발생했습니다. 다시 시도해 주세요.";
  }
}
