import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as Icons from "react-icons/tb";

// Đổi tên component và nhận props
const FileUpload = ({ label, onFileSelect, accept, required }) => {

  // Hàm xử lý khi file được chọn/kéo thả
  const onDrop = useCallback(acceptedFiles => {
    // Gọi hàm onFileSelect của component cha với file đầu tiên (hoặc null nếu không có file)
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    } else {
      // Có thể gọi onFileSelect(null) nếu muốn xử lý trường hợp hủy chọn
      // onFileSelect(null);
    }
  }, [onFileSelect]); // Thêm onFileSelect vào dependency array

  // Cấu hình useDropzone, sử dụng prop 'accept'
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept ? accept.split(',').reduce((acc, type) => ({ ...acc, [type.trim()]: [] }), {}) : undefined, // Chuyển đổi chuỗi accept thành object yêu cầu bởi react-dropzone v11+
    multiple: false // Chỉ cho phép chọn 1 file mỗi lần
  });

  return (
    <div className="file-upload-container">
      {/* Hiển thị label */}
      {label && (
        <label className="form-label" style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
          {label}{required && <span style={{ color: 'red', marginLeft: '2px' }}>*</span>}
        </label>
      )}
      {/* Dropzone Area */}
      <div 
        {...getRootProps()} 
        className={`drop-zone ${isDragActive ? 'active' : ''}`}
        style={dropzoneStyles}
      >
        <input {...getInputProps()} />
        <Icons.TbCloudUpload size={30} style={{ marginBottom: '10px', color: '#6c757d' }} />
        {isDragActive ?
          <p style={textStyles}>Thả file vào đây...</p> : 
          <p style={textStyles}>Kéo thả file vào đây, hoặc nhấn để chọn file</p>
        }
      </div>
      {/* Loại bỏ phần hiển thị preview và nút xóa ở đây */}
    </div>
  );
};

// Style cơ bản cho dropzone (có thể tùy chỉnh thêm)
const dropzoneStyles = {
  border: '2px dashed #ced4da',
  borderRadius: '5px',
  padding: '20px',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: '#f8f9fa',
  transition: 'border .24s ease-in-out, background-color .24s ease-in-out'
};

const textStyles = {
  margin: 0,
  fontSize: '0.95em',
  color: '#495057'
};

// Đảm bảo export đúng tên component
export default FileUpload;
