// Sửa component Thumbnail.jsx
import React, { useState, useRef } from "react";
import * as Icons from "react-icons/tb";
import Button from './Button.jsx';
import Image from '../../images/common/thumbnail.png';

const Thumbnail = ({ className, required, preloadedImage, onChange }) => {
  const [uploadedImage, setUploadedImage] = useState(preloadedImage || null);
  const fileInputRef = useRef(null);

  const handleDelete = () => {
    setUploadedImage(null);
    if (onChange) onChange(null);
  };

  const handleClick = () => {
    fileInputRef.current.click();
  }

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Hiển thị xem trước hình ảnh
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target.result);
      if (onChange) onChange(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={`thumbnail ${className ? className : ""}`}>
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        accept="image/*"
        onChange={handleFileChange}
      />
      <figure className="uploaded-image" onClick={handleClick}>
        {uploadedImage ? (
          <img src={uploadedImage} alt="Thumbnail" />
        ) : (
          <img src={Image} className="defualt_img" alt="Default Thumbnail" />
        )}
        <Icons.TbPencil className="thumbnail_edit" />
        {uploadedImage && (
          <Button onClick={handleDelete} icon={<Icons.TbTrash/>} className="delete_button sm"/>
        )}
      </figure>
    </div>
  );
};

export default Thumbnail;