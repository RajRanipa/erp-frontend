'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Dialog from '@/Components/Dialog';
import CustomInput from '@/Components/inputs/CustomInput';
import SubmitButton from '@/Components/buttons/SubmitButton';
import { Toast } from '@/Components/toast';
import useAuthz from '@/hooks/useAuthz';
import {
  apiErrorMessage,
  apiMessage,
  itemMasterApi,
} from '../itemMasterApi';

export default function ItemDeletionPanel({ item }) {
  const router = useRouter();
  const { can } = useAuthz();
  const [open, setOpen] = useState(false);
  const [assessment, setAssessment] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!can('items:delete')) return null;

  const close = () => {
    if (deleting) return;
    setOpen(false);
    setAssessment(null);
    setConfirmation('');
  };

  const inspectDeletion = async () => {
    setOpen(true);
    setAssessment(null);
    setConfirmation('');
    setChecking(true);
    try {
      setAssessment(await itemMasterApi.deletionAssessment(item._id));
    } catch (error) {
      Toast.error(apiErrorMessage(error, 'Unable to check whether this Item can be deleted'));
      setOpen(false);
    } finally {
      setChecking(false);
    }
  };

  const permanentlyDelete = async () => {
    setDeleting(true);
    try {
      const response = await itemMasterApi.delete(item._id, confirmation);
      Toast.success(apiMessage(response, 'Item permanently deleted'));
      router.replace('/items/catalog');
      router.refresh();
    } catch (error) {
      const nextAssessment = error?.response?.data?.error?.details;
      if (nextAssessment?.blockers) setAssessment(nextAssessment);
      Toast.error(apiErrorMessage(error, 'Unable to delete Item'));
    } finally {
      setDeleting(false);
    }
  };

  const confirmationMatches = confirmation.trim().toUpperCase() === item.sku;

  return (
    <>
      <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-red-400">Danger zone</h2>
            <p className="mt-1 text-sm text-secondary-text">
              Inactive Items can be deleted only when no inventory, manufacturing or transaction history depends on them.
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg border border-red-500 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            onClick={inspectDeletion}
          >
            Delete Item permanently
          </button>
        </div>
      </section>

      <Dialog
        open={open}
        onClose={close}
        title="Permanent Item deletion"
        size="sm"
        side="center"
        closeOnOverlay={!deleting}
        closeOnEsc={!deleting}
        actions={(
          <>
            <button type="button" className="btn" onClick={close} disabled={deleting}>
              {assessment?.allowed ? 'Cancel' : 'Close'}
            </button>
            {assessment?.allowed && (
              <SubmitButton
                type="button"
                loading={deleting}
                disabled={!confirmationMatches}
                className="bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:ring-red-700"
                onClick={permanentlyDelete}
              >
                Delete permanently
              </SubmitButton>
            )}
          </>
        )}
      >
        <div className="space-y-4 flex flex-col gap-3">
          <div className="rounded-lg border border-white-100 p-3">
            <div className="font-medium">{item.name}</div>
            <div className="mt-1 font-mono text-sm text-secondary-text">{item.sku}</div>
          </div>

          {checking && (
            <div className="flex items-center gap-2 text-sm text-secondary-text">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Checking inventory and manufacturing dependencies…
            </div>
          )}

          {assessment && !assessment.allowed && (
            <div className="space-y-3 flex flex-col gap-2">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                This Item cannot be deleted because ERP records depend on it.
              </div>
              <ul className="space-y-2 flex flex-col gap-2">
                {assessment.blockers.map(blocker => (
                  <li
                    key={blocker.code}
                    className="flex items-start justify-between gap-4 rounded-lg border border-white-100 p-3 text-sm"
                  >
                    <span>{blocker.label}</span>
                    {blocker.code !== 'ITEM_IS_ACTIVE' && (
                      <span className="rounded-full bg-white-100 px-2 py-0.5 font-medium">
                        {blocker.count}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-secondary-text">{assessment.recommendation}</p>
            </div>
          )}

          {assessment?.allowed && (
            <div className="space-y-3 flex flex-col gap-3">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                This action cannot be undone. The Item and its SKU will be removed permanently.
              </div>
              <CustomInput
                label={`Type ${item.sku} to confirm`}
                name="itemDeleteConfirmation"
                value={confirmation}
                onChange={event => setConfirmation(event.target.value)}
                autoComplete="off"
                required
              />
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}
