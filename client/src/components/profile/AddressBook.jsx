/**
 * AddressBook - list, add, edit, delete and set a default address.
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, MapPin, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import * as userService from '../../services/userService';
import { readApiError } from '../../utils/apiErrors';
import AddressForm from './AddressForm';
import Button from '../ui/Button';
import Alert from '../ui/Alert';

export default function AddressBook() {
  const { t } = useLanguage();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | address id
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Loads the saved addresses (Phase 3: GET /api/users/addresses)
  const loadAddresses = useCallback(async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data.addresses);
    } catch (error) {
      setFeedback({ type: 'error', text: readApiError(error, t).message });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Used by AddressForm for both "add" and "edit"
  async function handleSave(values) {
    if (editing === 'new') {
      await userService.addAddress(values);
      setFeedback({ type: 'success', text: t('account.addresses.added') });
    } else {
      await userService.updateAddress(editing, values);
      setFeedback({ type: 'success', text: t('account.addresses.updated') });
    }
    setEditing(null);
    await loadAddresses(); // reload so the "default" flags are correct
  }

  async function runAction(action, successKey) {
    try {
      await action();
      setFeedback({ type: 'success', text: t(successKey) });
      await loadAddresses();
    } catch (error) {
      setFeedback({ type: 'error', text: readApiError(error, t).message });
    }
  }

  const handleDelete = (id) =>
    runAction(async () => {
      await userService.deleteAddress(id);
      setConfirmDeleteId(null);
    }, 'account.addresses.deleted');

  const handleMakeDefault = (id) =>
    runAction(() => userService.updateAddress(id, { isDefault: true }), 'account.addresses.updated');

  const editingAddress = addresses.find((a) => a._id === editing);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{t('account.addresses.title')}</h2>
        {editing === null && (
          <Button
            variant="outline"
            onClick={() => {
              setEditing('new');
              setFeedback({ type: '', text: '' });
            }}
          >
            <Plus size={16} /> {t('account.addresses.add')}
          </Button>
        )}
      </div>

      <Alert type={feedback.type}>{feedback.text}</Alert>

      {editing !== null && (
        <AddressForm
          key={editing}
          initial={editing === 'new' ? undefined : editingAddress}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      )}

      {loading && (
        <div className="flex justify-center py-8 text-cocoa-600" role="status">
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span className="sr-only">{t('common.loading')}</span>
        </div>
      )}

      {!loading && addresses.length === 0 && editing === null && (
        <p className="rounded-xl border border-dashed border-cocoa-300 p-6 text-center text-sm text-cocoa-500">
          {t('account.addresses.empty')}
        </p>
      )}

      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((address) => (
          <li key={address._id} className="flex flex-col rounded-xl border border-cocoa-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <p className="flex items-center gap-2 font-semibold text-cocoa-900">
                <MapPin size={16} className="text-gold-700" /> {address.label || '—'}
              </p>
              {address.isDefault && (
                <span className="rounded-full bg-gold-300/40 px-2 py-0.5 text-xs font-semibold text-cocoa-800">
                  {t('account.addresses.default')}
                </span>
              )}
            </div>
            <address className="mt-2 flex-1 text-sm not-italic text-cocoa-600">
              {address.street}
              <br />
              {address.city}
              {address.state && `, ${address.state}`} {address.postalCode}
              <br />
              {address.country}
            </address>

            {confirmDeleteId === address._id ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-cocoa-700">{t('account.addresses.confirmDelete')}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(address._id)}
                  className="font-semibold text-red-600 hover:underline"
                >
                  {t('account.addresses.yesDelete')}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="text-cocoa-500 hover:underline"
                >
                  {t('account.cancel')}
                </button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <button
                  type="button"
                  onClick={() => setEditing(address._id)}
                  className="inline-flex items-center gap-1 text-cocoa-700 hover:text-cocoa-950"
                >
                  <Pencil size={14} /> {t('account.addresses.edit')}
                </button>
                {!address.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleMakeDefault(address._id)}
                    className="inline-flex items-center gap-1 text-cocoa-700 hover:text-cocoa-950"
                  >
                    <Star size={14} /> {t('account.addresses.makeDefault')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(address._id)}
                  className="inline-flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} /> {t('account.addresses.delete')}
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
