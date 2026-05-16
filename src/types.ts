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
  hyperparameters: Record<string, any>;
  metrics: Metrics;
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
}

export interface AnomalyPoint {
  timestamp: string;
  value: number;
  score: number;
}

export interface AnomalyResponse {
  anomalies: AnomalyPoint[];
  method: string;
  threshold: number;
  total_points: number;
  anomaly_count: number;
}

export interface ApiProvider {
  id: string;
  name: string;
  apiKeyMasked: string;
  status: 'Active' | 'Expired' | 'Revoked';
}
