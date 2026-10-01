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

export async function getCampaignProductionRecords(campaignId, filters, signal) {
  const response = await axiosInstance.get(`/api/campaigns/${campaignId}/production-records`, {
    params: filters,
    signal,
    skipGlobalLoading: true,
  });
  return response.data;
}

export async function getAllCampaignProductionRecords(campaignId, filters, signal) {
  const firstPage = await getCampaignProductionRecords(
    campaignId,
    { ...filters, page: 1, limit: 1000 },
    signal,
  );
  const pageCount = Number(firstPage?.pagination?.pages || 1);
  if (pageCount <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) => (
      getCampaignProductionRecords(
        campaignId,
        { ...filters, page: index + 2, limit: 1000 },
        signal,
      )
    )),
  );
  const records = [
    ...(firstPage.records || []),
    ...remainingPages.flatMap(page => page.records || []),
  ];

  return {
    ...firstPage,
    records,
    pagination: {
      ...firstPage.pagination,
      page: 1,
      limit: records.length,
      pages: 1,
    },
  };
}

export async function deleteCampaign(campaignId) {
  return axiosInstance.delete(`/api/campaigns/${campaignId}`);
}
