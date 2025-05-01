import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import FileUpload from "../../components/common/FileUpload.jsx";

const AddTrack = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [albums, setAlbums] = useState([]);
  const [genres, setGenres] = useState([]);
  const [fields, setFields] = useState({
    title: "",
    audio_file: null,
    cover_image: null,
    duration_ms: 0,
    album: null,
    genre: null,
  });

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/albums/list/");
        if (response.ok) {
          const data = await response.json();
          setAlbums(data.map(album => ({ value: album.id, label: album.title })));
        } else {
          console.error("Could not fetch albums list");
          setErrorMessage("Không thể tải danh sách album.");
          setAlbums([{ value: 1, label: "Sample Album 1" }, { value: 2, label: "Sample Album 2" }]); 
        }
      } catch (error) {
        console.error("Error fetching albums:", error);
        setErrorMessage("Lỗi tải danh sách album: " + error.message);
        setAlbums([{ value: 1, label: "Sample Album 1" }, { value: 2, label: "Sample Album 2" }]); 
      }
    };
    fetchAlbums();
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const adminAuthToken = localStorage.getItem('adminAuthToken');
        const headers = {};
        if (adminAuthToken) {
          headers['Authorization'] = `Token ${adminAuthToken}`;
        } else {
           console.warn("Admin token not found. Genre list might be restricted.");
        }

        const response = await fetch("http://localhost:8000/api/genres/list/", { headers });
        if (response.ok) {
          const data = await response.json();
          setGenres(data.map(genre => ({ value: genre.id, label: genre.name })));
        } else {
          console.error("Could not fetch genres list. Status:", response.status);
          setErrorMessage(`Không thể tải danh sách thể loại (${response.status}).`);
           setGenres([{ value: 1, label: "Sample Genre 1" }, { value: 2, label: "Sample Genre 2" }]); 
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
        setErrorMessage("Lỗi mạng hoặc lỗi không xác định khi tải thể loại: " + error.message);
         setGenres([{ value: 1, label: "Sample Genre 1" }, { value: 2, label: "Sample Genre 2" }]); 
      }
    };
    fetchGenres();
  }, []);

  const handleInputChange = (key, value) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  const handleAlbumSelect = (selectedOption) => {
    setFields(prev => ({ ...prev, album: selectedOption.value }));
  };

  const handleGenreSelect = (selectedOption) => {
    console.log("Genre selected:", selectedOption);
    setFields(prev => ({ ...prev, genre: selectedOption ? selectedOption.value : null }));
  };

  const handleImageUpload = (file) => {
    if (!file) {
      setFields(prev => ({ ...prev, cover_image: null }));
      setErrorMessage("");
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setErrorMessage("Vui lòng chỉ chọn file hình ảnh JPG hoặc PNG.");
      setFields(prev => ({ ...prev, cover_image: null }));
      return;
    }
    setErrorMessage("");
    setFields(prev => ({ ...prev, cover_image: file }));
  };

  const handleAudioUpload = (file) => {
    if (!file) {
      setFields(prev => ({ ...prev, audio_file: null, duration_ms: 0 }));
      setErrorMessage("");
      return;
    }
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/mp4')) {
      setErrorMessage("Vui lòng chọn một file âm thanh (MP3, WAV...) hoặc video MP4.");
      setFields(prev => ({ ...prev, audio_file: null, duration_ms: 0 }));
      return;
    }
    setErrorMessage("");
    setFields(prev => ({ ...prev, audio_file: file, duration_ms: 0 }));
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => {
      const duration = Math.round(audio.duration * 1000);
      window.URL.revokeObjectURL(audio.src);
      setFields(prev => ({ ...prev, duration_ms: duration > 0 ? duration : 0 }));
    };
    audio.onerror = (e) => {
      console.error("Error loading audio metadata:", e);
      window.URL.revokeObjectURL(audio.src);
      setErrorMessage("Không thể đọc thời lượng file audio.");
      setFields(prev => ({ ...prev, duration_ms: 0, audio_file: null }));
    };
    audio.src = URL.createObjectURL(file);
  };

  const formatDuration = (ms) => {
    if (!ms || ms <= 0) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!fields.title.trim()) return setErrorMessage("Vui lòng nhập tên bài hát.");
    if (!fields.album) return setErrorMessage("Vui lòng chọn một album.");
    if (!fields.audio_file) return setErrorMessage("Vui lòng tải lên file âm thanh.");

    setIsSubmitting(true);
    setErrorMessage("");

    const formData = new FormData();
    formData.append("title", fields.title.trim());
    formData.append("album", fields.album);
    if (fields.genre) {
      formData.append("genres", fields.genre);
    }
    formData.append("audio_file", fields.audio_file);
    if (fields.cover_image) {
      formData.append("cover_image", fields.cover_image);
    }
    formData.append("duration_ms", fields.duration_ms > 0 ? fields.duration_ms : 1);

    console.log("Submitting FormData:", Object.fromEntries(formData));

    try {
      const response = await fetch("http://localhost:8000/api/tracks/add/", {
        method: "POST",
        body: formData,
        headers: localStorage.getItem('adminAuthToken') ? { 'Authorization': `Token ${localStorage.getItem('adminAuthToken')}` } : {},
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Bài hát "${result.title}" đã được thêm thành công!`);
        navigate("/products/manage");
      } else {
        let errorData = { detail: `Lỗi máy chủ: ${response.status}` };
        try { errorData = await response.json(); } catch (e) { /* Ignore */ }
        setErrorMessage(errorData.detail || "Lỗi không xác định khi thêm bài hát.");
      } 
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMessage("Lỗi kết nối: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="add-track page_section">
      <div className="container">
        <div className="page_header">
          <h2 className="page_title">Thêm bài hát mới</h2>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          {errorMessage && (
            <div className="alert alert-danger" role="alert" style={{ marginBottom: '15px' }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: '15px' }}>
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
            
            <div style={{ marginBottom: '15px' }}>
               <Dropdown
                  label="Album*"
                  placeholder="-- Chọn Album --"
                  options={albums}
                  selectedValue={albums.find(a => a.value === fields.album)?.label}
                  onClick={handleAlbumSelect}
                  required
               />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
               <Dropdown
                  label="Thể loại"
                  placeholder="-- Chọn Thể loại --"
                  options={genres}
                  selectedValue={genres.find(g => g.value === fields.genre)?.label}
                  onClick={handleGenreSelect}
               />
            </div>  

            <div style={{ marginBottom: '15px' }}>
                <FileUpload
                    label="File âm thanh* (MP3, WAV, OGG, MP4)"
                    onFileSelect={handleAudioUpload}
                    accept="audio/*,video/mp4"
                    required
                />
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px dashed #ced4da', borderRadius: '4px', fontSize: '0.9em', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fields.audio_file ? (
                        <>
                          <Icons.TbFileMusic />
                          <span style={{ fontWeight: 500, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {fields.audio_file.name}
                          </span>
                          <span style={{ fontStyle: 'italic', color: '#6c757d', whiteSpace: 'nowrap' }}>
                            {fields.duration_ms === 0 ? "(Đang đọc...)" : formatDuration(fields.duration_ms)}
                          </span>
                        </>
                    ) : (
                        <span style={{ color: '#6c757d' }}>Chưa chọn file</span>
                    )}
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <FileUpload
                    label="Ảnh bìa (JPG, PNG)"
                    onFileSelect={handleImageUpload}
                    accept=".jpg, .jpeg, .png, image/jpeg, image/png"
                />
                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px dashed #ced4da', borderRadius: '4px', fontSize: '0.9em', color: '#495057', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {fields.cover_image ? (
                        <>
                            <Icons.TbPhoto />
                            <span style={{ fontWeight: 500, flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {fields.cover_image.name}
                            </span>
                            <span style={{ fontStyle: 'italic', color: '#6c757d', whiteSpace: 'nowrap' }}>
                                ({ (fields.cover_image.size / 1024).toFixed(1) } KB)
                            </span>
                        </>
                    ) : (
                        <span style={{ color: '#6c757d' }}>Chưa chọn ảnh bìa</span>
                    )}
                </div>
            </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
            <Button
              label="Hủy bỏ"
              className="button sm outline"
              icon={<Icons.TbX />}
              onClick={() => navigate('/products/manage')}
              type="button"
            />
            <Button
              label={isSubmitting ? "Đang thêm..." : "Thêm bài hát"}
              className="button sm"
              icon={<Icons.TbDeviceFloppy />}
              type="submit"
              disabled={isSubmitting}
            />
          </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AddTrack; 