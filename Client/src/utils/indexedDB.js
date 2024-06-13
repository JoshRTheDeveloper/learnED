import Dexie from 'dexie';
import forge from 'node-forge';

const db = new Dexie('InvoiceDB');

db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData, iv',
  loginCredentials: '++id, username, password',
  auth: '++id, token, userData',
});

const generateKeyAndIV = () => {
  const key = forge.random.getBytesSync(16);
  const iv = forge.random.getBytesSync(16); 
  return { key, iv };
};


const encryptData = (data, key, iv) => {
  const cipher = forge.cipher.createCipher('AES-CBC', key);
  cipher.start({ iv: iv });
  cipher.update(forge.util.createBuffer(JSON.stringify(data), 'utf8'));
  cipher.finish();
  return cipher.output.toHex();
};


const decryptData = (encryptedHex, key, iv) => {
  const decipher = forge.cipher.createDecipher('AES-CBC', key);
  decipher.start({ iv: iv });
  decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedHex)));
  decipher.finish();
  return JSON.parse(decipher.output.toString('utf8'));
};

export const storeUserData = async (userData) => {
  try {
    const { key, iv } = generateKeyAndIV();
    const encryptedUserData = encryptData(userData, key, iv);
    await db.userData.put({ encryptedUserData, iv });
  } catch (error) {
    console.error('Failed to store user data securely in IndexedDB:', error);
  }
};

export const getUserData = async () => {
  try {
    const { encryptedUserData, iv } = await db.userData.get(1);
    if (encryptedUserData && iv) {
      const decryptedUserData = decryptData(encryptedUserData, iv);
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
      db.userData.clear(),
      db.loginCredentials.clear(),
      db.auth.clear(),
    ]);
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error);
  }
};

export default db;
