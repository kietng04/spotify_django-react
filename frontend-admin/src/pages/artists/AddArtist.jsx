import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as Icons from "react-icons/tb";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Thumbnail from "../../components/common/Thumbnail.jsx";

const AddArtist = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fields, setFields] = useState({
    name: "",
    bio: "",
    image: null,
    spotify_id: "",
    followers: 0,
    popularity: 50
  });

  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  const handleImageChange = (imageDataUrl) => {
    setFields({
      ...fields,
      image: imageDataUrl,
    });
  };

  const handleSubmit = async () => {
    if (!fields.name) {
      setErrorMessage("Tên nghệ sĩ là bắt buộc");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const artistData = {
        name: fields.name,
        bio: fields.bio,
        image: fields.image,  
        spotify_id: fields.spotify_id,
        followers: parseInt(fields.followers) || 0,
        popularity: parseInt(fields.popularity) || 50
      };

      // Make API request
      const response = await fetch("http://localhost:8000/api/artists/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(artistData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Nghệ sĩ "${data.name}" đã được thêm thành công!`);
        navigate("/artists/manage");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Không thể thêm nghệ sĩ");
      }
    } catch (error) {
      console.error("Error adding artist:", error);
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
              <h2 className="sub_heading">Thông tin nghệ sĩ</h2>

              {errorMessage && (
                <div
                  className="error-message"
                  style={{ color: "white", backgroundColor: "#f44336", padding: "10px 15px", marginBottom: "15px", borderRadius: "4px" }}
                >
                  {errorMessage}
                </div>
              )}

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập tên nghệ sĩ"
                  label="Tên nghệ sĩ*"
                  icon={<Icons.TbUser />}
                  value={fields.name}
                  onChange={(value) => handleInputChange("name", value)}
                  required
                />
              </div>

              <div className="column">
                <label>Tiểu sử nghệ sĩ</label>
                <textarea
                  placeholder="Nhập tiểu sử nghệ sĩ"
                  value={fields.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  rows={5}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "4px",
                    border: "1px solid #ccc",
                    backgroundColor: "#2c2c2c",
                    color: "white",
                    resize: "vertical"
                  }}
                />
              </div>

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập Spotify ID (không bắt buộc)"
                  label="Spotify ID"
                  icon={<Icons.TbBrandSpotify />}
                  value={fields.spotify_id}
                  onChange={(value) => handleInputChange("spotify_id", value)}
                />
              </div>

              <div className="row" style={{ display: 'flex', gap: '20px' }}>
                <div className="column" style={{ flex: 1 }}>
                  <Input
                    type="number"
                    placeholder="Nhập số người theo dõi"
                    label="Người theo dõi"
                    icon={<Icons.TbUsers />}
                    value={fields.followers}
                    onChange={(value) => handleInputChange("followers", value)}
                    min="0"
                  />
                </div>
                <div className="column" style={{ flex: 1 }}>
                  <Input
                    type="number"
                    placeholder="Nhập độ phổ biến (0-100)"
                    label="Độ phổ biến"
                    icon={<Icons.TbChartBar />}
                    value={fields.popularity}
                    onChange={(value) => handleInputChange("popularity", value)}
                    min="0"
                    max="100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar_item">
              <h2 className="sub_heading">Tùy chọn</h2>
              <Button
                label="Lưu"
                icon={<Icons.TbCircleCheck />}
                className="success"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </div>

            <div className="sidebar_item">
              <h2 className="sub_heading">Hình ảnh nghệ sĩ</h2>
              <div className="column">
                <Thumbnail
                  preloadedImage={fields.image}
                  onChange={handleImageChange}
                />
                <small style={{ display: "block", marginTop: "5px" }}>
                  Nhấp vào trên đây để chọn hình ảnh từ máy tính của bạn
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AddArtist;