import api from './axios';

export const uploadReceiptOcr = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/ml/ocr', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.data;
};

export const getOcrJobStatus = async (jobId: string) => {
  const response = await api.get(`/ml/ocr/${jobId}`);
  return response.data.data;
};

export const getSpendingPrediction = async (categoryId?: string) => {
  const response = await api.post('/ml/predict', { categoryId });
  return response.data.data;
};
