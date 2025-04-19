import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import FileUpload from "../../components/common/FileUpload.jsx"; // Assuming you have a FileUpload component

const AddTrack = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [albums, setAlbums] = useState([]); // Start with empty array
  const [fields, setFields] = useState({
    title: "",
    audio_file: null,
    duration_ms: 0,
    track_number: 1,
    album: null, // Start with null, let dropdown select
  });

  // Fetch albums (replace with actual API call)
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/albums/list/"); // Replace with your album API
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.map(album => ({
            value: album.id,
            label: album.title
          })));
          // Optionally set default album if albums list is not empty
          if (data.length > 0) {
            // setFields(prev => ({ ...prev, album: data[0].id }));
          }
        } else {
          console.error("Không thể lấy danh sách album");
          setErrorMessage("Không thể tải danh sách album.");
          // Set sample data for development if API fails
          setAlbums([
            { value: 1, label: "Sample Album 1" },
            { value: 2, label: "Sample Album 2" },
          ]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy danh sách album:", error);
        setErrorMessage("Lỗi tải danh sách album: " + error.message);
         setAlbums([
            { value: 1, label: "Sample Album 1" },
            { value: 2, label: "Sample Album 2" },
          ]);
      }
    };

    fetchAlbums();
  }, []);

  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  const handleAlbumSelect = (selectedOption) => {
    setFields({
      ...fields,
      album: selectedOption.value, // Store the selected album ID
    });
  };

  const handleAudioUpload = (file) => {
    if (!file) {
        setFields(prev => ({ ...prev, audio_file: null, duration_ms: 0 }));
        return;
    }

    if (!file.type.startsWith('audio/')) {
        setErrorMessage("Vui lòng chọn một file âm thanh hợp lệ (ví dụ: MP3, WAV).");
        setFields(prev => ({ ...prev, audio_file: null, duration_ms: 0 }));
        return;
    }

    console.log("File được chọn:", file.name);
    setErrorMessage(""); // Clear previous errors

    setFields(prev => ({
      ...prev,
      audio_file: file,
      duration_ms: 0, // Reset duration until calculated
    }));

    // Calculate duration
    const audio = document.createElement('audio');
    audio.preload = 'metadata'; // Important for getting duration quickly

    audio.onloadedmetadata = () => {
      console.log("Đã đọc metadata:", audio.duration);
      window.URL.revokeObjectURL(audio.src); // Clean up URL object
      setFields((prev) => ({
        ...prev,
        // Ensure duration is a positive number, default to 0 if NaN or invalid
        duration_ms: Math.round(audio.duration * 1000) > 0 ? Math.round(audio.duration * 1000) : 0,
      }));
    };

    audio.onerror = (e) => {
      console.error("Lỗi khi đọc file audio metadata:", e);
      window.URL.revokeObjectURL(audio.src); // Clean up URL object
      setErrorMessage("Không thể đọc thời lượng file audio. Vui lòng thử file khác.");
      setFields((prev) => ({
        ...prev,
        duration_ms: 0, // Set duration to 0 on error
        // audio_file: null // Optionally clear the file on error
      }));
    };

    audio.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // --- Validation --- 
    if (!fields.title.trim()) {
      setErrorMessage("Vui lòng nhập tên bài hát.");
      return;
    }
    if (!fields.album) {
      setErrorMessage("Vui lòng chọn một album.");
      return;
    }
    if (!fields.audio_file) {
      setErrorMessage("Vui lòng tải lên file âm thanh.");
      return;
    }
     if (fields.duration_ms <= 0 && fields.audio_file) {
      setErrorMessage("Không thể xác định thời lượng file âm thanh hoặc file không hợp lệ.");
      // Optionally try recalculating or ask user to re-upload
      // return; // Decide if you want to block submission here
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      console.log("Submitting data:", fields);
      const formData = new FormData();

      formData.append("title", fields.title.trim());
      formData.append("album", fields.album); // Send album ID
      formData.append("audio_file", fields.audio_file);
      formData.append("duration_ms", fields.duration_ms > 0 ? fields.duration_ms : 1000); // Send duration, default to 1s if 0
      formData.append("track_number", fields.track_number || 1);
      // Add other fields required by the backend API
      // formData.append("disc_number", 1);
      // formData.append("explicit", false);
      // formData.append("popularity", 50);
      // formData.append("artists", 1); // Send default artist ID or implement artist selection

      console.log("FormData prepared:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      const response = await fetch("http://localhost:8000/api/tracks/add/", {
        method: "POST",
        // 'Content-Type': 'multipart/form-data' is set automatically by browser for FormData
        body: formData,
        // Add authentication headers if required by backend
        // headers: { 'Authorization': `Bearer ${your_token}` },
      });

      if (response.ok) {
        const result = await response.json(); // Get response data
        console.log("Track added successfully:", result);
        alert(`Bài hát "${result.title}" đã được thêm thành công!`);
        navigate("/tracks/manage"); // Navigate to manage page
      } else {
        // Attempt to parse error response
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: `Lỗi máy chủ: ${response.status} ${response.statusText}` };
        }
        console.error("API Error Response:", errorData);
        setErrorMessage(errorData.detail || "Không thể thêm bài hát. Đã xảy ra lỗi.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi form thêm bài hát:", error);
      setErrorMessage("Lỗi kết nối hoặc lỗi không xác định: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="add-track">
      <div className="container">
        <div className="wrapper">
          <div className="content" style={{ maxWidth: '700px', margin: '0 auto' }}> {/* Center content */}
            <div className="content_item">
              <h2 className="sub_heading">Thêm bài hát mới</h2>

              {errorMessage && (
                <div
                  className="error-message"
                  style={{ color: 'white', backgroundColor: '#f44336', padding: '10px 15px', marginBottom: '15px', borderRadius: '4px' }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}> {/* Use form element */} 
                <div className="column" style={{ marginBottom: '15px' }}>
                  <Input
                    type="text"
                    placeholder="Nhập tên bài hát"
                    label="Tên bài hát*"
                    icon={<Icons.TbMusic />}
                    value={fields.title}
                    onChange={(value) => handleInputChange("title", value)}
                    required // Add basic HTML5 validation
                  />
                </div>

                 <div className="column" style={{ marginBottom: '15px' }}>
                   <Dropdown
                    label="Album*"
                    placeholder="-- Chọn Album --"
                    options={albums} // Pass fetched albums
                    selectedValue={albums.find(a => a.value === fields.album)?.label} // Show selected album label
                    onClick={handleAlbumSelect} // Use the correct handler
                    required
                   />
                 </div>

                 <div className="column" style={{ marginBottom: '15px' }}>
                    <Input
                        type="number"
                        placeholder="Số thứ tự track"
                        label="Số thứ tự track"
                        icon={<Icons.TbListNumbers />}
                        value={fields.track_number}
                        min="1" // Set minimum value
                        onChange={(value) => handleInputChange("track_number", parseInt(value) || 1)} // Ensure it's a number
                    />
                 </div>

                <div className="column" style={{ marginBottom: '15px' }}>
                   <FileUpload
                       label="File âm thanh* (MP3, WAV, etc.)"
                       onFileSelect={handleAudioUpload}
                       // Pass other props needed by FileUpload component
                   />
                   {/* Display selected file name and calculated duration */} 
                   {fields.audio_file && (
                       <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#ccc' }}>
                           Đã chọn: {fields.audio_file.name}
                           {fields.duration_ms > 0 && ` - Thời lượng: ${Math.floor(fields.duration_ms / 1000 / 60)}:${String(Math.floor(fields.duration_ms / 1000) % 60).padStart(2, '0')}`}
                           {fields.duration_ms === 0 && fields.audio_file && ` (Đang đọc thời lượng...)`}
                       </div>
                   )}
                </div>

                {/* Add other fields here if needed (Artist, etc.) */}

                <div className="form_footer" style={{ marginTop: '20px', textAlign: 'right' }}>
                  <Button
                    label={isSubmitting ? "Đang thêm..." : "Thêm bài hát"}
                    className="button sm primary" // Use appropriate button classes
                    type="submit" // Set button type to submit
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AddTrack; 