import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(5).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData, iv, key',
  loginCredentials: '++id, email, encryptedPassword, iv, key',
  auth: '++id, token, userData',
  profilePictures: '++id, userId, profilePictureBlob',
  profileFiles: 'userId, file',
  offlineMutations: '++id, mutation',
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
  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decryptedBuffer);

    // Validate the decrypted string before parsing
    if (!decryptedString || decryptedString.trim() === '') {
      throw new Error('Decrypted data is empty or malformed.');
    }

    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error during decryption:', error);
    throw new Error('Failed to decrypt data.');
  }
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
    throw error;
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
      return null;
    }
  } catch (error) {
    console.error('Failed to get user data securely from IndexedDB:', error);
    return null;
  }
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
    throw error;
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
    const existingRecord = await db.profilePictures.get(1);

    if (existingRecord) {
      await db.profilePictures.update(1, { userId, profilePictureBlob });
    } else {
      await db.profilePictures.put({ id: 1, userId, profilePictureBlob });
    }
  } catch (error) {
    console.error('Failed to store profile picture in IndexedDB:', error);
    throw error;
  }
};

export const getProfilePicture = async () => {
  try {
    const profilePicture = await db.profilePictures.get(1);
    return profilePicture ? profilePicture.profilePictureBlob : null;
  } catch (error) {
    console.error('Failed to get profile picture from IndexedDB:', error);
    return null;
  }
};

export const storeAuthData = async (token, userData) => {
  try {
    await db.auth.put({ token, userData });
  } catch (error) {
    console.error('Failed to store authentication data in IndexedDB:', error);
    throw error;
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

export const updateInvoiceInIndexedDB = async (invoiceId, paidStatus) => {
  try {
    const existingInvoice = await db.invoices.get(invoiceId);

    if (!existingInvoice) {
      throw new Error(`Invoice with id ${invoiceId} not found in IndexedDB.`);
    }

    // Update the paidStatus
    existingInvoice.paidStatus = paidStatus;

    // Put the updated invoice back into IndexedDB
    await db.invoices.put(existingInvoice);

    console.log(`Invoice with id ${invoiceId} updated successfully.`);
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
    if (!invoice._id) {
      throw new Error('Invoice must have a unique _id');
    }

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
    console.log(`Invoice with id ${invoice._id} added successfully.`);
  } catch (error) {
    console.error('Failed to add invoice to IndexedDB:', error);
    throw error;
  }
};

export const deleteInvoiceFromIndexedDB = async (_id) => {
  try {
  
    await db.transaction('rw', db.invoices, async () => {

      const invoiceToDelete = await db.invoices.where('_id').equals(_id).first();
      if (invoiceToDelete) {
        await db.invoices.delete(invoiceToDelete.id);
        console.log(`Invoice with id ${_id} deleted successfully.`);
      } else {
        throw new Error(`Invoice with id ${_id} not found in IndexedDB.`);
      }
    });
  } catch (error) {
    console.error('Failed to delete invoice from IndexedDB:', error);
    throw error;
  }
};

export default db;
