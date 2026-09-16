'use client';

import { use, useEffect, useState } from 'react';
import Loading from '@/Components/Loading';
import { Toast } from '@/Components/toast';
import ItemMasterForm from '../components/ItemMasterForm';
import ItemLifecycleActions from '../components/ItemLifecycleActions';
import ItemDeletionPanel from '../components/ItemDeletionPanel';
import { apiErrorMessage, itemMasterApi } from '../itemMasterApi';

export default function ItemMasterDetailPage({ params }) {
  const { id } = use(params);
  const [item, setItem] = useState(null);

  useEffect(() => {
    itemMasterApi.get(id)
      .then(setItem)
      .catch(error => Toast.error(apiErrorMessage(error, 'Unable to load Item')));
  }, [id]);

  if (!item) return <Loading variant="skeleton" className="h-40" />;
  return (
    <div className="space-y-4">
      <div className="space-y-4 flex flex-col gap-3">
        <ItemMasterForm itemId={id} ItemLifecycleHTML={true} />
        <ItemDeletionPanel item={item} />
      </div>
    </div>
  );
}
