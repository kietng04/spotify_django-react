import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import FileUpload from "../../components/common/FileUpload.jsx"; // Assuming you have this

const EditTrack = () => {
  const navigate = useNavigate();
  const { id: trackId } = useParams(); // Get track ID from URL parameter
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Loading state for fetching data
  const [errorMessage, setErrorMessage] = useState("");
  const [albums, setAlbums] = useState([]);
  const [fields, setFields] = useState({
    title: "",
    audio_file: null, // For potential new upload
    current_audio_uri: "", // To display current file info
    duration_ms: 0,
    track_number: 1,
    album: null,
  });

  // Fetch Albums (Similar to AddTrack)
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/albums/list/");
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.map(album => ({ value: album.id, label: album.title })));
        } else {
          setErrorMessage("Không thể tải danh sách album.");
          setAlbums([{ value: 1, label: "Sample Album 1" }, { value: 2, label: "Sample Album 2" }]);
        }
      } catch (error) {
        setErrorMessage("Lỗi tải danh sách album: " + error.message);
        setAlbums([{ value: 1, label: "Sample Album 1" }, { value: 2, label: "Sample Album 2" }]);
      }
    };
    fetchAlbums();
  }, []);

  // Fetch Track Data
  useEffect(() => {
    if (!trackId) return;
    const fetchTrackData = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        // Replace with your actual API endpoint for getting a single track
        const response = await fetch(`http://localhost:8000/api/tracks/${trackId}/`);
        if (response.ok) {
          const data = await response.json();
          setFields({
            title: data.title || "",
            album: data.album?.id || data.album_id || null,
            duration_ms: data.duration_ms || 0,
            track_number: data.track_number || 1,
            current_audio_uri: data.uri || "", // Store the current audio file path/uri
            audio_file: null, // Reset file input
          });
        } else {
          setErrorMessage(`Không thể tải dữ liệu bài hát #${trackId}. Lỗi ${response.status}`);
        }
      } catch (error) {
        console.error("Lỗi khi fetch track data:", error);
        setErrorMessage("Lỗi kết nối khi tải dữ liệu bài hát: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTrackData();
  }, [trackId]);

  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  const handleAlbumSelect = (selectedOption) => {
    setFields({
      ...fields,
      album: selectedOption.value,
    });
  };

  // handleAudioUpload is similar to AddTrack, but might clear current_audio_uri
  const handleAudioUpload = (file) => {
     if (!file) {
        setFields(prev => ({ ...prev, audio_file: null, duration_ms: prev.duration_ms })); // Keep old duration if no new file
        return;
    }
    if (!file.type.startsWith('audio/')) {
        setErrorMessage("Vui lòng chọn một file âm thanh hợp lệ.");
        setFields(prev => ({ ...prev, audio_file: null }));
        return;
    }
    console.log("File mới được chọn:", file.name);
    setErrorMessage("");
    setFields(prev => ({
      ...prev,
      audio_file: file,
      duration_ms: 0, // Reset duration for new file
      // current_audio_uri: "" // Optionally clear current URI display immediately
    }));

    // Calculate duration (same logic as AddTrack)
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      console.log("Đã đọc metadata file mới:", audio.duration);
      window.URL.revokeObjectURL(audio.src);
      setFields((prev) => ({
        ...prev,
        duration_ms: Math.round(audio.duration * 1000) > 0 ? Math.round(audio.duration * 1000) : 0,
      }));
    };
    audio.onerror = (e) => {
      console.error("Lỗi đọc metadata file mới:", e);
      window.URL.revokeObjectURL(audio.src);
      setErrorMessage("Không thể đọc thời lượng file audio mới.");
      setFields((prev) => ({ ...prev, duration_ms: 0 }));
    };
    audio.src = URL.createObjectURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!fields.title.trim()) {
      setErrorMessage("Vui lòng nhập tên bài hát.");
      return;
    }
    if (!fields.album) {
      setErrorMessage("Vui lòng chọn một album.");
      return;
    }
    // No need to validate audio_file presence for update, unless it's mandatory to re-upload
     if (fields.duration_ms <= 0 && fields.audio_file) {
         // If a new file was selected but duration couldn't be read
         setErrorMessage("Không thể xác định thời lượng file audio mới.");
         return;
     }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const formData = new FormData();

      // Append only fields that changed or are always needed
      formData.append("title", fields.title.trim());
      formData.append("album", fields.album);
      formData.append("track_number", fields.track_number || 1);

      // Append audio file ONLY if a new one was selected
      if (fields.audio_file) {
        formData.append("audio_file", fields.audio_file);
        // Send duration calculated from the new file
        formData.append("duration_ms", fields.duration_ms > 0 ? fields.duration_ms : 1000);
      } else {
          // If no new file, send the existing duration (or don't send if backend keeps it)
          // formData.append("duration_ms", fields.duration_ms > 0 ? fields.duration_ms : 0);
      }

      // Add other fields as needed by backend API for update
      // formData.append("disc_number", ...);

      console.log("Updating track with FormData:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }

      // Use PATCH or PUT for update, adjust API endpoint
      const response = await fetch(`http://localhost:8000/api/tracks/${trackId}/update/`, { // Adjust endpoint if needed
        method: "PATCH", // or PUT
        body: formData,
        // Add auth headers if needed
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Track updated successfully:", result);
        alert(`Bài hát "${result.title}" đã được cập nhật!`);
        navigate("/tracks/manage");
      } else {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
             errorData = { detail: `Lỗi máy chủ: ${response.status} ${response.statusText}` };
        }
        console.error("API Error Response:", errorData);
        setErrorMessage(errorData.detail || "Không thể cập nhật bài hát.");
      }
    } catch (error) {
      console.error("Lỗi khi gửi form cập nhật:", error);
      setErrorMessage("Lỗi kết nối hoặc lỗi không xác định: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div>Đang tải dữ liệu bài hát...</div>;

  return (
    <section className="edit-track">
      <div className="container">
        <div className="wrapper">
          <div className="content" style={{ maxWidth: '700px', margin: '0 auto' }}>
            <div className="content_item">
              <h2 className="sub_heading">Chỉnh sửa bài hát #{trackId}</h2>

              {errorMessage && (
                <div
                  className="error-message"
                  style={{ color: 'white', backgroundColor: '#f44336', padding: '10px 15px', marginBottom: '15px', borderRadius: '4px' }}
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                 <div className="column" style={{ marginBottom: '15px' }}>
                  <Input
                    type="text"
                    placeholder="Nhập tên bài hát"
                    label="Tên bài hát*"
                    icon={<Icons.TbMusic />}
                    value={fields.title}
                    onChange={(value) => handleInputChange("title", value)}
                    required
                  />
                </div>

                 <div className="column" style={{ marginBottom: '15px' }}>
                   <Dropdown
                    label="Album*"
                    placeholder="-- Chọn Album --"
                    options={albums}
                    selectedValue={albums.find(a => a.value === fields.album)?.label}
                    onClick={handleAlbumSelect}
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
                        min="1"
                        onChange={(value) => handleInputChange("track_number", parseInt(value) || 1)}
                    />
                 </div>

                <div className="column" style={{ marginBottom: '15px' }}>
                   <FileUpload
                       label="Tải lên file âm thanh mới (tùy chọn)"
                       onFileSelect={handleAudioUpload}
                       // Pass other props
                   />
                   {/* Display current or new file info */} 
                   <div style={{ marginTop: '5px', fontSize: '0.9em', color: '#ccc' }}>
                       {fields.audio_file ? (
                           <span>
                               File mới: {fields.audio_file.name}
                               {fields.duration_ms > 0 && ` - Thời lượng: ${Math.floor(fields.duration_ms / 1000 / 60)}:${String(Math.floor(fields.duration_ms / 1000) % 60).padStart(2, '0')}`}
                               {fields.duration_ms === 0 && ` (Đang đọc...)`}
                           </span>
                       ) : fields.current_audio_uri ? (
                           <span>File hiện tại: {fields.current_audio_uri.split('/').pop()}</span>
                       ) : (
                           <span>Chưa có file âm thanh.</span>
                       )}
                   </div>
                </div>

                <div className="form_footer" style={{ marginTop: '20px', textAlign: 'right' }}>
                  <Button
                    label={isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                    className="button sm primary"
                    type="submit"
                    disabled={isSubmitting || isLoading}
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

export default EditTrack; 