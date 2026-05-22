export type DatasetStatus = 'Active' | 'Processing' | 'Failed';

export interface Dataset {
  dataset_id: string;
  original_filename: string;
  date_column: string;
  target_column: string;
  feature_columns: string[];
  start_date?: string;
  end_date?: string;
  frequency?: string;
  row_count: number;
  created_at: string;
}

export type Screen = 'datasets' | 'explore' | 'train' | 'forecasts' | 'profile' | 'settings';

export interface Metrics {
  rmse: number;
  mse: number;
  mae: number;
  mape: number;
  smape: number;
}

export interface Model {
  model_id: string;
  dataset_id: string;
  model_type: 'ARIMA' | 'PROPHET' | 'LSTM' | 'GRU' | 'TRANSFORMER';
  status?: 'training' | 'completed' | 'failed';
  hyperparameters: Record<string, any>;
  metrics?: Metrics;
  forecast_horizon: number;
  validation_size: number;
  created_at: string;
}

export interface HistoricalPoint {
  timestamp: string;
  value: number;
}

export interface ForecastPoint {
  timestamp: string;
  predicted: number;
  lower?: number;
  upper?: number;
}

export interface ForecastResponse {
  historical: HistoricalPoint[];
  forecast: ForecastPoint[];
  history?: HistoricalPoint[];
}

export interface AnomalyPoint {
  timestamp: string;
  value: number;
  score: number;
}

export interface AnomalyDataPoint {
  timestamp: string;
  value: number;
  score: number;
  is_anomaly: boolean;
}

export interface AnomalyStats {
  min: number;
  max: number;
  mean: number;
  std: number;
}

export interface AnomalyResponse {
  anomalies: AnomalyPoint[];
  method: string;
  threshold: number;
  total_points: number;
  anomaly_count: number;
  data?: AnomalyDataPoint[];
  stats?: AnomalyStats;
}

export interface ApiProvider {
  id: string;
  name: string;
  apiKeyMasked: string;
  status: 'Active' | 'Expired' | 'Revoked';
}

export interface ModelHistoryItem {
  model_id: string;
  model_type: string;
  dataset_id: string;
  metrics: Metrics;
  created_at: string;
}

