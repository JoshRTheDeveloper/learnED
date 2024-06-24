import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData, iv, key',
  loginCredentials: '++id, email, encryptedPassword, iv, key',
  auth: '++id, token, userData',
  profilePictures: '++id, userId, profilePictureBlob',
  profileFiles: 'userId,file',
  offlineMutations: '++id,type,invoiceId',
});

const generateKeyAndIV = async () => {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(16));
  return { key, iv };
};

const encryptData = async (data, key, iv) => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(JSON.stringify(data));
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-CBC",
      iv: iv,
    },
    key,
    dataBuffer
  );
  return {
    encryptedData: new Uint8Array(encryptedBuffer),
    iv: iv,
  };
};

const decryptData = async (encryptedData, key, iv) => {
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: iv,
    },
    key,
    encryptedData
  );
  const decoder = new TextDecoder();
  return JSON.parse(decoder.decode(decryptedBuffer));
};

const exportKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Uint8Array(exported);
};

const importKey = async (keyData) => {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-CBC',
    },
    true,
    ['encrypt', 'decrypt']
  );
};

export const addInvoiceToIndexedDB = async (invoice) => {
  try {
    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);

    const { encryptedData } = await encryptData(invoice, key, iv);

    const encryptedInvoice = {
      ...invoice,
      encryptedData: Array.from(encryptedData),
      iv: Array.from(iv),
      key: Array.from(exportedKey),
    };

    await db.invoices.add(encryptedInvoice);
  } catch (error) {
    console.error('Failed to add invoice to IndexedDB:', error);
  }
};

export const updateInvoiceInIndexedDB = async (invoice) => {
  try {
    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);

    const encryptedInvoice = {
      ...invoice,
      encryptedData: Array.from(await encryptData(invoice, key, iv).encryptedData),
      iv: Array.from(iv),
      key: Array.from(exportedKey),
    };

    await db.invoices.put(encryptedInvoice);
  } catch (error) {
    console.error('Failed to update invoice in IndexedDB:', error);
  }
};

export const getInvoicesFromIndexedDB = async () => {
  try {
    const invoices = await db.invoices.toArray();
    const decryptedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const key = await importKey(new Uint8Array(invoice.key));
        const iv = new Uint8Array(invoice.iv);

        const decryptedData = await decryptData(new Uint8Array(invoice.encryptedData), key, iv);

        return {
          ...invoice,
          ...decryptedData,
        };
      })
    );
    return decryptedInvoices;
  } catch (error) {
    console.error('Failed to get invoices from IndexedDB:', error);
    return [];
  }
};

export const deleteInvoiceFromIndexedDB = async (id) => {
  try {
    await db.invoices.delete(id);
  } catch (error) {
    console.error('Failed to delete invoice from IndexedDB:', error);
  }
};

export const clearIndexedDB = async () => {
  try {
    await Promise.all([
      db.invoices.clear(),
      db.userData.clear(),
      db.loginCredentials.clear(),
      db.auth.clear(),
    ]);
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
};

export const storeProfileFile = async (userId, file) => {
  try {
    await db.profileFiles.put({ userId, file });
  } catch (error) {
    console.error('Failed to store profile file in IndexedDB:', error);
  }
};

export const getProfileFile = async (userId) => {
  try {
    const result = await db.profileFiles.get(userId);
    return result ? result.file : null;
  } catch (error) {
    console.error('Failed to get profile file from IndexedDB:', error);
    return null;
  }
};

export const addOfflineMutation = async (mutation) => {
  try {
    await db.offlineMutations.add(mutation);
  } catch (error) {
    console.error('Failed to add offline mutation to IndexedDB:', error);
  }
};

export const getOfflineMutations = async () => {
  try {
    return await db.offlineMutations.toArray();
  } catch (error) {
    console.error('Failed to get offline mutations from IndexedDB:', error);
    return [];
  }
};

export const clearOfflineMutations = async () => {
  try {
    await db.offlineMutations.clear();
  } catch (error) {
    console.error('Failed to clear offline mutations from IndexedDB:', error);
  }
};

export default db;
