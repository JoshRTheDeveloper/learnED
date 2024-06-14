import Dexie from 'dexie';

const db = new Dexie('InvoiceDB');

db.version(4).stores({
  invoices: '++id, invoiceNumber, clientEmail, clientName, clientAddress, clientCity, invoiceAmount, dueDate, paidStatus, userID',
  userData: '++id, encryptedUserData, iv',
  loginCredentials: '++id, username, password',
  auth: '++id, token, userData',
  profilePictures: '++id, profilePictureBlob',
});

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
    console.log('Record from IndexedDB:', record);

    if (record && record.encryptedUserData && record.iv && record.key) {
      const key = await importKey(new Uint8Array(record.key));
      const iv = new Uint8Array(record.iv);
      const encryptedData = new Uint8Array(record.encryptedUserData);
      
      console.log('Key:', key);
      console.log('IV:', iv);
      console.log('Encrypted Data:', encryptedData);

      const decryptedUserData = await decryptData(encryptedData, key, iv);
      console.log('Decrypted User Data:', decryptedUserData); 

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




export const addInvoiceToIndexedDB = async (invoice) => {
  try {
    const { key, iv } = await generateKeyAndIV();
    const exportedKey = await exportKey(key);
    
    const encryptedInvoice = {
      ...invoice,
      encryptedData: Array.from(await encryptData(invoice, key, iv).encryptedData),
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
        
        return {
          ...invoice,
          ...await decryptData(new Uint8Array(invoice.encryptedData), key, iv),
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

export default db;
