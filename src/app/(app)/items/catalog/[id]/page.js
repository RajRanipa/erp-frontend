'use client';

import { use, useEffect, useState } from 'react';
import Loading from '@/Components/Loading';
import { Toast } from '@/Components/toast';
import ItemMasterForm from '../components/ItemMasterForm';
import ItemDeletionPanel from '../components/ItemDeletionPanel';
import { apiErrorMessage, itemMasterApi } from '../itemMasterApi';

export default function ItemMasterDetailPage({ params }) {
  const { id } = use(params);
  const [context, setContext] = useState(null);

  useEffect(() => {
    itemMasterApi.editContext(id)
      .then(setContext)
      .catch(error => Toast.error(apiErrorMessage(error, 'Unable to load Item')));
  }, [id]);

  if (!context?.item) return <Loading variant="skeleton" className="h-40" />;
  return (
    <div className="space-y-4">
      <div className="space-y-4 flex flex-col gap-3">
        <ItemMasterForm itemId={id} initialContext={context} ItemLifecycleHTML />
        <ItemDeletionPanel item={context.item} />
      </div>
    </div>
  );
}
