
export interface SheetData {
  [key: string]: any;
}

export interface DashboardStats {
  label: string;
  value: string | number;
  trend?: number;
  icon?: string;
}

export interface ChartData {
  name: string;
  [key: string]: any;
}

export interface Insight {
  title: string;
  content: string;
  type: 'info' | 'warning' | 'positive';
}
