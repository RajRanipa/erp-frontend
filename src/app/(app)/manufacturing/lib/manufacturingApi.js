import { axiosInstance } from '@/lib/axiosInstance';

export async function getCampaignOverview(signal) {
  const response = await axiosInstance.get('/api/campaigns/overview', {
    signal,
    skipGlobalLoading: true,
  });
  return Array.isArray(response.data) ? response.data : [];
}

export async function getCampaignProductionReport(campaignId, filters, signal) {
  const response = await axiosInstance.get(`/api/campaigns/${campaignId}/production-report`, {
    params: filters,
    signal,
    skipGlobalLoading: true,
  });
  return response.data;
}

export async function deleteCampaign(campaignId) {
  return axiosInstance.delete(`/api/campaigns/${campaignId}`);
}
