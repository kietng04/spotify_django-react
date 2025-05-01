import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as Icons from "react-icons/tb";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const EditGenre = () => {
  const { genreId } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [name, setName] = useState("");

  // Fetch genre data
  useEffect(() => {
    const fetchGenreData = async () => {
      if (!genreId) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `http://localhost:8000/api/genres/${genreId}/`
        );

        if (response.ok) {
          const data = await response.json();
          setName(data.name || "");
        } else {
          setErrorMessage("Không thể tải thông tin thể loại");
        }
      } catch (error) {
        setErrorMessage("Lỗi kết nối: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGenreData();
  }, [genreId]);

  const handleNameChange = (value) => {
    setName(value);
  };

  const handleSubmit = async () => {
    // Validate inputs
    if (!name.trim()) {
      setErrorMessage("Vui lòng nhập tên thể loại");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        `http://localhost:8000/api/genres/${genreId}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim()
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Thể loại "${result.name}" đã được cập nhật thành công!`);
        navigate("/genres/manage");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Không thể cập nhật thể loại");
      }
    } catch (error) {
      setErrorMessage("Lỗi kết nối: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div>Đang tải dữ liệu...</div>;
  }

  return (
    <section>
      <div className="container">
        <div className="wrapper">
          <div className="content">
            <div className="content_item">
              <h2 className="sub_heading">Thông tin thể loại</h2>

              {errorMessage && (
                <div
                  className="error-message"
                  style={{
                    color: "white",
                    backgroundColor: "#f44336",
                    padding: "10px 15px",
                    marginBottom: "15px",
                    borderRadius: "4px",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập tên thể loại"
                  label="Tên thể loại*"
                  icon={<Icons.TbCategory />}
                  value={name}
                  onChange={handleNameChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar_item">
              <h2 className="sub_heading">Tùy chọn</h2>
              <Button
                label="Lưu thay đổi"
                icon={<Icons.TbCircleCheck />}
                className="success"
                onClick={handleSubmit}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditGenre;