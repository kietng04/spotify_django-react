import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";

const AddTrack = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [albums, setAlbums] = useState([
    { value: 1, label: "Epic Sounds" },
    { value: 2, label: "Summer Hits" },
    { value: 3, label: "Corporate Music" },
    { value: 4, label: "Love Songs" },
    { value: 5, label: "Yoga & Meditation" }
  ]);
  
  const [fields, setFields] = useState({
    title: "",
    audio_file: null,
    duration_ms: 0,
    track_number: 1,
    album: 1, // Giá trị mặc định
    

  });

  // Fetch danh sách album khi component mount
  // useEffect(() => {
  //   const fetchAlbums = async () => {
  //     try {
  //       const response = await fetch("http://localhost:8000/api/albums/list/");
  //       if (response.ok) {
  //         const data = await response.json();
  //         setAlbums(data.map(album => ({
  //           value: album.id,
  //           label: album.title
  //         })));
  //       } else {
  //         console.error("Không thể lấy danh sách album");
  //         // Dữ liệu mẫu nếu API không tồn tại
  //         setAlbums([
  //           { value: 1, label: "Epic Sounds" },
  //           { value: 2, label: "Summer Hits" },
  //           { value: 3, label: "Corporate Music" },
  //           { value: 4, label: "Love Songs" },
  //           { value: 5, label: "Yoga & Meditation" }
  //         ]);
  //       }
  //     } catch (error) {
  //       console.error("Lỗi khi lấy danh sách album:", error);
  //       // Dữ liệu mẫu nếu có lỗi
  //       setAlbums([
  //         { value: 1, label: "Epic Sounds" },
  //         { value: 2, label: "Summer Hits" },
  //         { value: 3, label: "Corporate Music" },
  //         { value: 4, label: "Love Songs" },
  //         { value: 5, label: "Yoga & Meditation" }
  //       ]);
  //     }
  //   };

  //   fetchAlbums();
  // }, []);

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

  const handleAudioUpload = (file) => {
    if (!file) return;

    console.log("File được chọn:", file.name);

    setFields({
      ...fields,
      audio_file: file,
    });

    try {
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);

      audio.onloadedmetadata = () => {
        console.log("Đã đọc metadata:", audio.duration);
        setFields((prev) => ({
          ...prev,
          duration_ms: Math.round(audio.duration * 1000),
        }));
      };

      audio.onerror = (e) => {
        console.error("Lỗi khi đọc file audio:", e);
        setFields((prev) => ({
          ...prev,
          duration_ms: 180000,
        }));
      };
    } catch (error) {
      console.error("Lỗi khi xử lý file:", error);
    }
  };

  const handleSubmit = async () => {
    // Kiểm tra các trường bắt buộc
    if (!fields.title) {
      setErrorMessage("Vui lòng nhập tên bài hát");
      return;
    }

    if (!fields.audio_file) {
      setErrorMessage("Vui lòng tải lên file âm thanh");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      console.log("Bắt đầu gửi form với dữ liệu:", fields);
      const formData = new FormData();

      formData.append("title", fields.title);
      console.log("Đã thêm title:", fields.title);

      formData.append("album", fields.album);
      console.log("Đã thêm album:", fields.album);

      formData.append("audio_file", fields.audio_file);
      console.log("Đã thêm audio_file:", fields.audio_file?.name);

      formData.append("duration_ms", fields.duration_ms || 180000);
      formData.append("track_number", fields.track_number);
      formData.append("disc_number", 1);
      formData.append("explicit", false);
      formData.append("popularity", 50);
      formData.append("artists", 1);

      const response = await fetch("http://localhost:8000/api/tracks/add/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Bài hát đã được thêm thành công!");
        navigate("/tracks/manage");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Không thể thêm bài hát mới");
      }
    } catch (error) {
      console.error("Lỗi khi thêm bài hát:", error);
      setErrorMessage("Lỗi kết nối: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section>
      <div className="container">
        <div className="wrapper">
          <div className="content">
            <div className="content_item">
              <h2 className="sub_heading">Thông tin bài hát</h2>

              {errorMessage && (
                <div
                  className="error-message"
                  style={{ color: "red", marginBottom: "15px" }}
                >
                  {errorMessage}
                </div>
              )}

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập tên bài hát"
                  label="Tên bài hát*"
                  icon={<Icons.TbMusic />}
                  value={fields.title}
                  onChange={(value) => handleInputChange("title", value)}
                />
              </div>

              <div className="column">
                <div className="upload-container">
                  <label>File âm thanh (MP3)*</label>
                  <div
                    className="file-upload-wrapper"
                    style={{
                      position: "relative",
                      border: "1px dashed #ccc",
                      borderRadius: "5px",
                      padding: "15px",
                      cursor: "pointer",
                      backgroundColor: "#f9f9f9",
                    }}
                    onClick={() =>
                      document.getElementById("audio-file-input").click()
                    }
                  >
                    <input
                      id="audio-file-input"
                      type="file"
                      accept="audio/mpeg,audio/mp3"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          console.log("File selected:", file.name);
                          handleAudioUpload(file);
                        }
                      }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        zIndex: -1,
                      }}
                    />
                    <div
                      className="upload-ui"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Icons.TbUpload />
                      <span>
                        {fields.audio_file
                          ? fields.audio_file.name
                          : "Tải lên file MP3"}
                      </span>
                    </div>
                  </div>
                  {fields.duration_ms > 0 && (
                    <small>
                      Thời lượng: {Math.floor(fields.duration_ms / 60000)}:
                      {Math.floor((fields.duration_ms % 60000) / 1000)
                        .toString()
                        .padStart(2, "0")}
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="content_item">
              <h2 className="sub_heading">Thông tin bổ sung</h2>

              <div className="column">
                <Input
                  type="number"
                  placeholder="Nhập số thứ tự bài hát"
                  label="Số thứ tự bài hát"
                  icon={<Icons.TbListNumbers />}
                  value={fields.track_number}
                  onChange={(value) => handleInputChange("track_number", value)}
                />
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar_item">
              <h2 className="sub_heading">Tùy chọn</h2>
              {/* <Button
                label="Lưu & thoát"
                icon={<Icons.TbDeviceFloppy />}
                className=""
                onClick={() => {
                  handleSubmit();
                }}
                disabled={isSubmitting}
              /> */}
              <Button
                label="Lưu"
                icon={<Icons.TbCircleCheck />}
                className="success"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </div>

            <div className="sidebar_item">
              <h2 className="sub_heading">Album</h2>
              <div className="column">
                <Dropdown
                  placeholder="Chọn album"
                  selectedValue={
                    albums.find((a) => a.value === fields.album)?.label || ""
                  }
                  onClick={handleAlbumSelect}
                  options={albums}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AddTrack;
