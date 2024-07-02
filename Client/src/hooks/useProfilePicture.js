import { useState, useEffect } from 'react';
import axios from 'axios';
import { useMutation } from '@apollo/client';
import { storeProfilePicture, getProfilePicture, storeProfileFile, getProfileFile } from '../utils/indexedDB';
import { CHANGE_PROFILE_PICTURE } from '../utils/mutations';

const useProfilePicture = (userId, initialLogoUrl) => {
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [logo, setLogo] = useState(null);
  const [renamedFile, setRenamedFile] = useState(null);

  const [changeProfilePicture] = useMutation(CHANGE_PROFILE_PICTURE);

  useEffect(() => {
    const fetchProfilePicture = async () => {
      const profilePictureBlob = await getProfilePicture(userId);
      const profilePictureFile = await getProfileFile(userId);

      if (profilePictureBlob) {
        setLogoUrl(URL.createObjectURL(profilePictureBlob));
      }

      if (profilePictureFile) {
        setRenamedFile(profilePictureFile);
      }
    };

    if (!navigator.onLine) {
      fetchProfilePicture();
    }
  }, [userId]);

  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    const blobUrl = URL.createObjectURL(file);
    setLogo(file);
    setLogoUrl(blobUrl);
    const filename = `${userId}_profile_picture.jpg`;
    const renamedFile = new File([file], filename, { type: file.type });
    setRenamedFile(renamedFile);
    await storeProfilePicture(userId, file); 
    await storeProfileFile(userId, renamedFile); 
  };

  const uploadProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('https://invoicinator3000-d580657ecca9.herokuapp.com/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'userId': userId,
        },
      });
      return response.data.fileUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      throw error;
    }
  };

  const syncProfilePicture = async () => {
    if (navigator.onLine) {
      let picturePath = logoUrl;

      if (logo) {
        const uploadedPicturePath = await uploadProfilePicture(renamedFile);
        picturePath = uploadedPicturePath;
        await storeProfilePicture(userId, picturePath); 
      }

      await changeProfilePicture({ variables: { userId, profilePicture: picturePath } });

      return picturePath;
    } else {
      return logoUrl;
    }
  };

  return { logoUrl, handleLogoChange, syncProfilePicture };
};

export default useProfilePicture;
