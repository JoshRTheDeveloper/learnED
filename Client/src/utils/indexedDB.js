import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(2).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  users: '++id, username, password, email, otherUserData', 
  loginCredentials: '++id, username, password', 
});

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
