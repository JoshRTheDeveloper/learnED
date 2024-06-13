import Dexie from 'dexie';
import CryptoJS from 'crypto-js';
require('dotenv').config();

const db = new Dexie('InvoiceDB');

db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  users: '++id, encryptedData',
  loginCredentials: '++id, username, password',
  auth: '++id, token, userData',
});

const secretKey = process.env.ENCRYPT_SECRET_KEY;

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
    const encryptedUserData = CryptoJS.AES.encrypt(JSON.stringify(userData), secretKey).toString();
    await db.users.put({ encryptedData: encryptedUserData });
  } catch (error) {
    console.error('Failed to store user data in IndexedDB:', error);
  }
};

export const getUserData = async () => {
  try {
    const encryptedUserData = await db.users.get('user'); 
    if (!encryptedUserData) return null;

    const decryptedBytes = CryptoJS.AES.decrypt(encryptedUserData.encryptedData, secretKey);
    const decryptedUserData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
    console.log('Decrypted User Data:', decryptedUserData);
    return decryptedUserData;
  } catch (error) {
    console.error('Failed to get user data from IndexedDB:', error);
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
