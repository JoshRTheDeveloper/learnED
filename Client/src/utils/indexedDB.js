
import { openDB } from 'idb';

const DB_NAME = 'invoiceApp';
const DB_VERSION = 1;
const STORE_NAME = 'invoices';

const getDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      }
    },
  });
};

export const saveInvoices = async (invoices) => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await Promise.all(invoices.map(invoice => store.put(invoice)));
  await tx.done;
};

export const getInvoices = async () => {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);
  return store.getAll();
};
