import { 
  Dataset, 
  Model, 
  ForecastResponse, 
  AnomalyResponse,
  Metrics
} from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Datasets
  async uploadDataset(file: File, dateColumn: string, targetColumn: string, featureColumns?: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('date_column', dateColumn);
    formData.append('target_column', targetColumn);
    if (featureColumns) {
      formData.append('feature_columns', featureColumns);
    }

    const response = await fetch(`${API_BASE_URL}/datasets/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload dataset');
    }

    return response.json();
  },

  async getDatasets(): Promise<Dataset[]> {
    const response = await fetch(`${API_BASE_URL}/datasets`);
    if (!response.ok) throw new Error('Failed to fetch datasets');
    return response.json();
  },

  // Training
  async trainModel(params: {
    dataset_id: string;
    model_type: string;
    validation_size: number;
    forecast_horizon: number;
    [key: string]: any;
  }): Promise<Model> {
    const response = await fetch(`${API_BASE_URL}/train`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to train model');
    }

    return response.json();
  },

  // Models
  async getModels(): Promise<Model[]> {
    const response = await fetch(`${API_BASE_URL}/models`);
    if (!response.ok) throw new Error('Failed to fetch models');
    return response.json();
  },

  async getMetrics(modelId: string): Promise<Metrics> {
    const response = await fetch(`${API_BASE_URL}/metrics/${modelId}`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  },

  // Forecasting
  async getForecast(modelId: string, horizon?: number): Promise<ForecastResponse> {
    const response = await fetch(`${API_BASE_URL}/forecast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model_id: modelId, forecast_horizon: horizon }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to generate forecast');
    }

    return response.json();
  },

  getDownloadUrl(modelId: string): string {
    return `${API_BASE_URL}/forecast/download/${modelId}`;
  },

  // Anomalies
  async getAnomalies(datasetId: string, params?: { method?: string; threshold?: number; window?: number }): Promise<AnomalyResponse> {
    const queryParams = new URLSearchParams();
    if (params?.method) queryParams.append('method', params.method);
    if (params?.threshold) queryParams.append('threshold', params.threshold.toString());
    if (params?.window) queryParams.append('window', params.window.toString());

    const response = await fetch(`${API_BASE_URL}/anomalies/${datasetId}?${queryParams.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch anomalies');
    return response.json();
  },
};
