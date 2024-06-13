import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');


db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData',
  loginCredentials: '++id, username, password',
  auth: '++id, token, userData',
});


const generateKey = async () => {
  const key = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
  return key;
};


const encryptData = async (data, key) => {
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(JSON.stringify(data));

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


const decryptData = async (encryptedData, iv, key) => {
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


export const storeUserData = async (userData) => {
  try {
    const key = await generateKey();
    const { encryptedData, iv } = await encryptData(userData, key);
    await db.userData.put({ encryptedUserData: encryptedData, iv: iv });
  } catch (error) {
    console.error('Failed to store user data securely in IndexedDB:', error);
  }
};

export const getUserData = async () => {
  try {
    const { encryptedUserData, iv } = await db.users.get(1); // Assuming the user data is stored with ID 1
    if (encryptedUserData && iv) {
      const key = await generateKey();
      const decryptedUserData = await decryptData(encryptedUserData, iv, key);
      return decryptedUserData;
    }
    return null;
  } catch (error) {
    console.error('Failed to get user data securely from IndexedDB:', error);
    return null;
  }
};

export const storeAuthData = async (token, userData) => {
  try {
    await db.auth.put({ token, userData });
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


export const storeLoginCredentials = async (username, password) => {
  try {
    await db.loginCredentials.add({ username, password });
  } catch (error) {
    console.error('Failed to store login credentials in IndexedDB:', error);
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


export const addInvoiceToIndexedDB = async (invoice) => {
  try {
    await db.invoices.add(invoice);
  } catch (error) {
    console.error('Failed to add invoice to IndexedDB:', error);
  }
};

export const updateInvoiceInIndexedDB = async (invoice) => {
  try {
    await db.invoices.put(invoice);
  } catch (error) {
    console.error('Failed to update invoice in IndexedDB:', error);
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
    await Promise.all([
      db.invoices.clear(),
      db.users.clear(),
      db.loginCredentials.clear(),
      db.auth.clear(),
    ]);
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
};

// Export the Dexie instance for use in other parts of your application
export default db;
