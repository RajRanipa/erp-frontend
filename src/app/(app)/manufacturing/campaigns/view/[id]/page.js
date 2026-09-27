import { redirect } from 'next/navigation';

export default async function LegacyCampaignView({ params }) {
  const { id } = await params;
  redirect(`/manufacturing/campaigns/${id}`);
}
