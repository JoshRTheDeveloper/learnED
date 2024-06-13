import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  users: '++id, userData',
  loginCredentials: '++id, username, password',
  auth: '++id, token, userData',
});


const encryptData = async (data) => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));
  
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  return {
    encryptedData: new Uint8Array(encryptedData),
    iv: iv,
  };
};

const decryptData = async (encryptedData, iv) => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  const decodedData = decoder.decode(decryptedData);

  return JSON.parse(decodedData);
};




export const storeAuthData = async (token, userData) => {
  try {
    await db.auth.put({ token, userData });
  } catch (error) {
    console.error('Failed to store authentication data in IndexedDB:', error);
  }
};

export const getLoginCredentials = async () => {
  try {
    return await db.loginCredentials.toArray();
  } catch (error) {
    console.error('Failed to get login credentials from IndexedDB:', error);
    return [];
  }
};

export const getAuthData = async () => {
  try {
    return await db.auth.get('auth');
  } catch (error) {
    console.error('Failed to get authentication data from IndexedDB:', error);
    return null;
  }
};

export const storeUserData = async (userData) => {
  try {
    const { encryptedData, iv } = await encryptData(userData);
    await db.users.put({ userData: encryptedData, iv: iv });
  } catch (error) {
    console.error('Failed to store user data securely in IndexedDB:', error);
  }
};

// Retrieve and decrypt user data
export const getUserData = async () => {
  try {
    const { userData, iv } = await db.users.toArray();
    if (userData && iv) {
      const decryptedUserData = await decryptData(userData, iv);
      return decryptedUserData;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user data securely from IndexedDB:', error);
    return null;
  }
};


export const updateInvoiceInIndexedDB = async (invoice) => {
  try {
    await db.invoices.put(invoice);
  } catch (error) {
    console.error('Failed to update invoice in IndexedDB:', error);
  }
};

export const addInvoiceToIndexedDB = async (invoice) => {
  try {
    await db.invoices.add(invoice);
  } catch (error) {
    console.error('Failed to add invoice to IndexedDB:', error);
  }
};

export const getInvoicesFromIndexedDB = async () => {
  try {
    return await db.invoices.toArray();
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
    await db.invoices.clear();
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
};

export default db;
