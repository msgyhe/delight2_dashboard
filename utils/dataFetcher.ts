
import { SheetData } from "../types";

/**
 * Fetches data from a Google Sheet using the CSV Export method.
 * This is generally more reliable and has fewer CORS issues than the gviz API.
 */
export async function fetchSheetData(sheetId: string, gid: number = 0): Promise<SheetData[]> {
  // CSV 내보내기 URL 생성
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  
  console.log(`Fetching CSV data from GID: ${gid}`);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`시트에 접근할 수 없습니다. (HTTP ${response.status})\n공유 설정에서 '링크가 있는 모든 사용자'가 '뷰어' 이상인지 확인해 주세요.`);
    }
    
    const csvText = await response.text();
    
    // HTML이 반환되었다면 로그인 페이지로 리다이렉트된 것이므로 권한 문제임
    if (csvText.includes("<!DOCTYPE html>") || csvText.includes("<html")) {
      throw new Error("권한 오류: 구글 시트가 공개되어 있지 않습니다.\n[공유] 버튼 -> [링크가 있는 모든 사용자]로 변경해 주세요.");
    }

    return parseCSV(csvText);
  } catch (error) {
    console.error("Fetch Error:", error);
    throw error;
  }
}

/**
 * Parses raw CSV text into an array of objects.
 * Automatically finds the header row containing key columns.
 */
function parseCSV(csvText: string): SheetData[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  const rows = lines.map(line => {
    // 쉼표로 구분하되 따옴표 안의 쉼표는 무시하는 정규식
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    return matches ? matches.map(m => m.replace(/^"|"$/g, "").trim()) : [];
  });

  // 1. 헤더 행 찾기 (필수 키워드가 가장 많이 포함된 행)
  const keywords = ['현장', '공종', '계정', '금액'];
  let headerIndex = 0;
  let maxMatchCount = 0;

  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const matchCount = rows[i].filter(cell => keywords.some(k => cell.includes(k))).length;
    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      headerIndex = i;
    }
  }

  const headers = rows[headerIndex];
  const dataRows = rows.slice(headerIndex + 1);

  return dataRows.map(row => {
    const obj: SheetData = {};
    headers.forEach((header, index) => {
      if (header) {
        let val: any = row[index] || null;
        // 숫자인 경우 숫자로 변환
        if (val && !isNaN(val.replace(/,/g, "")) && val.trim() !== "") {
          val = parseFloat(val.replace(/,/g, ""));
        }
        obj[header] = val;
      }
    });
    return obj;
  });
}
