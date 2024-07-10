import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(6).stores({
  invoices: '++id, _id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData, iv, key',
  loginCredentials: '++id, email, encryptedPassword, iv, key',
  auth: '++id, token, userData',
  profilePictures: '++id, userId, profilePictureBlob',
  profileFiles: 'userId,file',
  offlineMutations: '++id, mutationType, variables',
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

export const storeLoginCredentials = async (email, password) => {
  try {
    const existingRecord = await db.loginCredentials.get(1);

    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);
    const { encryptedData } = await encryptData({ email, password }, key, iv);

    const newCredentials = {
      email,
      encryptedPassword: Array.from(encryptedData),
      iv: Array.from(iv),
      key: Array.from(exportedKey),
    };

    if (existingRecord) {
      await db.loginCredentials.update(1, newCredentials);
    } else {
      await db.loginCredentials.put({ ...newCredentials, id: 1 });
    }
  } catch (error) {
    console.error('Failed to store login credentials securely in IndexedDB:', error);
  }
};

export const getLoginCredentials = async () => {
  try {
    const record = await db.loginCredentials.get(1);

    if (record && record.encryptedPassword && record.iv && record.key) {
      const key = await importKey(new Uint8Array(record.key));
      const iv = new Uint8Array(record.iv);
      const encryptedData = new Uint8Array(record.encryptedPassword);

      const { email, password } = await decryptData(encryptedData, key, iv);

      return { email, password };
    } else {
      console.error('Missing data in login credentials IndexedDB record:', record);
    }
    return null;
  } catch (error) {
    console.error('Failed to get login credentials securely from IndexedDB:', error);
    return null;
  }
};

export const storeProfilePicture = async (userId, profilePictureBlob) => {
  try {
    const existingRecord = await db.profilePictures.get({ userId });

    if (existingRecord) {
      await db.profilePictures.update(existingRecord.id, { profilePictureBlob });
    } else {
      await db.profilePictures.put({ userId, profilePictureBlob });
    }
  } catch (error) {
    console.error('Failed to store profile picture in IndexedDB:', error);
    throw error;
  }
};

export const getProfilePicture = async (userId) => {
  try {
    const profilePicture = await db.profilePictures.get({ userId });
    return profilePicture ? profilePicture.profilePictureBlob : null;
  } catch (error) {
    console.error('Failed to get profile picture from IndexedDB:', error);
    return null;
  }
};

export const storeUserData = async (userData) => {
  try {
    const existingRecord = await db.userData.get(1);

    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);
    const { encryptedData } = await encryptData(userData, key, iv);

    const newData = {
      encryptedUserData: Array.from(encryptedData),
      iv: Array.from(iv),
      key: Array.from(exportedKey),
    };

    if (existingRecord) {
      await db.userData.update(1, newData);
    } else {
      await db.userData.put({ ...newData, id: 1 });
    }
  } catch (error) {
    console.error('Failed to store user data securely in IndexedDB:', error);
  }
};

export const getUserData = async () => {
  try {
    const record = await db.userData.get(1);

    if (record && record.encryptedUserData && record.iv && record.key) {
      const key = await importKey(new Uint8Array(record.key));
      const iv = new Uint8Array(record.iv);
      const encryptedData = new Uint8Array(record.encryptedUserData);
      const decryptedUserData = await decryptData(encryptedData, key, iv);

      return decryptedUserData;
    } else {
      console.error('Missing data in IndexedDB record:', record);
    }
    return null;
  } catch (error) {
    console.error('Failed to get user data securely from IndexedDB:', error);
    return null;
  }
};

export const storeAuthData = async (token, userData) => {
  try {
    await db.auth.put({ id: 1, token, userData });
  } catch (error) {
    console.error('Failed to store authentication data in IndexedDB:', error);
  }
};

export const getAuthData = async () => {
  try {
    return await db.auth.get(1);
  } catch (error) {
    console.error('Failed to get authentication data from IndexedDB:', error);
    return null;
  }
};

export const updateInvoiceInIndexedDB = async (invoiceNumber, paidStatus) => {
  try {
    const invoice = await db.invoices.where('invoiceNumber').equals(invoiceNumber).first();

    if (!invoice) {
      throw new Error(`Invoice with invoice number ${invoiceNumber} not found in IndexedDB.`);
    }

    const key = await importKey(new Uint8Array(invoice.key));
    const iv = new Uint8Array(invoice.iv);
    const encryptedData = new Uint8Array(invoice.encryptedData);
    const decryptedData = await decryptData(encryptedData, key, iv);

    decryptedData.paidStatus = paidStatus;

    const { encryptedData: updatedEncryptedData, iv: updatedIV } = await encryptData(decryptedData, key, iv);

    invoice.encryptedData = Array.from(updatedEncryptedData);
    invoice.iv = Array.from(updatedIV);
    await db.invoices.put(invoice);

    console.log(`Invoice with invoice number ${invoiceNumber} updated successfully with paidStatus: ${paidStatus}.`);
  } catch (error) {
    console.error('Failed to update invoice in IndexedDB:', error);
    throw error;
  }
};

export const getInvoicesFromIndexedDB = async () => {
  try {
    const invoices = await db.invoices.toArray();
    const decryptedInvoices = await Promise.all(
      invoices.map(async (invoice) => {
        const key = await importKey(new Uint8Array(invoice.key));
        const iv = new Uint8Array(invoice.iv);
        const encryptedData = new Uint8Array(invoice.encryptedData);
        const decryptedData = await decryptData(encryptedData, key, iv);
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

export const addInvoiceToIndexedDB = async (invoice) => {
  try {
    const invoiceId = String(invoice._id); // Convert _id to string if necessary

    console.log('Attempting to add invoice to IndexedDB:', invoiceId);
    const existingInvoice = await db.invoices.get({ _id: invoiceId });

    if (existingInvoice) {
      console.log(`Invoice with _id ${invoiceId} already exists in IndexedDB. Skipping insertion.`);
      return;
    }

    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);
    const { encryptedData, iv: encryptionIV } = await encryptData(invoice, key, iv);

    const encryptedInvoice = {
      _id: invoiceId,
      encryptedData: Array.from(encryptedData),
      iv: Array.from(encryptionIV),
      key: Array.from(exportedKey),
      invoiceNumber: invoice.invoiceNumber, 
    };

    await db.invoices.put(encryptedInvoice);

    console.log('Invoice added to IndexedDB:', invoiceId);
  } catch (error) {
    console.error('Failed to add invoice to IndexedDB:', error);
    throw error;
  }
};

export const deleteInvoiceByNumberFromIndexedDB = async (invoiceNumber) => {
  try {
    await db.invoices.where('invoiceNumber').equals(invoiceNumber).delete();
    console.log(`Invoice with invoiceNumber ${invoiceNumber} deleted from IndexedDB.`);
  } catch (error) {
    console.error('Failed to delete invoice from IndexedDB:', error);
    throw error;
  }
};

export const removeInvoiceFromIndexedDB = async (invoiceNumber) => {
  try {
    await db.invoices.where('invoiceNumber').equals(invoiceNumber).delete();
  } catch (error) {
    console.error('Failed to remove invoice from IndexedDB:', error);
    throw error;
  }
};

export const storeOfflineMutation = async (mutationType, variables) => {
  try {
    await db.offlineMutations.put({ mutationType, variables });
  } catch (error) {
    console.error('Failed to store offline mutation in IndexedDB:', error);
    throw error;
  }
};

export const getOfflineMutations = async () => {
  try {
    const offlineMutations = await db.offlineMutations.toArray();
    return offlineMutations.map((mutation) => ({ mutationType: mutation.mutationType, variables: mutation.variables }));
  } catch (error) {
    console.error('Failed to get offline mutations from IndexedDB:', error);
    return [];
  }
};

export const removeOfflineMutation = async (id) => {
  try {
    await db.offlineMutations.delete(id);
  } catch (error) {
    console.error('Failed to remove offline mutation from IndexedDB:', error);
    throw error;
  }
};

export default db;
