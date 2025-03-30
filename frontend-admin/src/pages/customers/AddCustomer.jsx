import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import Toggler from "../../components/common/Toggler.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import Thumbnail from "../../components/common/Thumbnail.jsx";
import { useNavigate } from "react-router-dom";

const AddCustomer = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fields, setFields] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    is_superuser: false,
    is_staff: false,
    is_active: true,
    avatarImg: "",
    role: "user",
  });

  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  const toggleField = (key) => {
    setFields({
      ...fields,
      [key]: !fields[key],
    });
  };

  const roleOptions = [
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
  ];

  const statusOptions = [
    { value: true, label: "Active" },
    { value: false, label: "Inactive" },
  ];

  const handleRoleSelect = (option) => {
    setFields({
      ...fields,
      role: option.value,
    });
  };

  const handleStatusSelect = (option) => {
    setFields({
      ...fields,
      is_active: option.value,
    });
  };
  const handleImageChange = (base64Image) => {
    setFields({
      ...fields,
      avatarImg: base64Image,
    });
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  const handleSubmit = async () => {
    // Kiểm tra các trường bắt buộc
    if (!fields.username || !fields.email || !fields.password) {
      setErrorMessage("Vui lòng nhập username, email và mật khẩu");
      return;
    }

    // Kiểm tra mật khẩu xác nhận
    if (fields.password !== fields.password_confirm) {
      setErrorMessage("Mật khẩu xác nhận không khớp");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/userz/add/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: fields.username,
          email: fields.email,
          first_name: fields.first_name,
          last_name: fields.last_name,
          password: fields.password,
          is_superuser: fields.is_superuser,
          is_staff: fields.is_staff,
          is_active: fields.is_active,
          avatarImg: fields.avatarImg,
          role: fields.role,
        }),
      });

      if (response.ok) {
        alert("Người dùng đã được tạo thành công!");
        navigate("/customers/manage");
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.detail || "Không thể tạo người dùng mới");
      }
    } catch (error) {
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
              <h2 className="sub_heading">Thông tin người dùng</h2>

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
                  placeholder="Nhập tên đăng nhập"
                  label="Username*"
                  icon={<Icons.TbUser />}
                  value={fields.username}
                  onChange={(value) => handleInputChange("username", value)}
                />
              </div>

              <div className="column">
                <Input
                  type="email"
                  placeholder="Nhập email"
                  label="Email*"
                  icon={<Icons.TbMail />}
                  value={fields.email}
                  onChange={(value) => handleInputChange("email", value)}
                />
              </div>

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập tên"
                  label="Tên"
                  icon={<Icons.TbUserCircle />}
                  value={fields.first_name}
                  onChange={(value) => handleInputChange("first_name", value)}
                />
              </div>

              <div className="column">
                <Input
                  type="text"
                  placeholder="Nhập họ"
                  label="Họ"
                  icon={<Icons.TbUserCircle />}
                  value={fields.last_name}
                  onChange={(value) => handleInputChange("last_name", value)}
                />
              </div>

              <div className="column">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  label="Mật khẩu*"
                  icon={<Icons.TbLock />}
                  value={fields.password}
                  onChange={(value) => handleInputChange("password", value)}
                  buttonIcon={
                    showPassword ? <Icons.TbEyeOff /> : <Icons.TbEye />
                  }
                  onButtonClick={togglePasswordVisibility}
                />
              </div>

              <div className="column">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  label="Xác nhận mật khẩu*"
                  icon={<Icons.TbLockCheck />}
                  value={fields.password_confirm}
                  onChange={(value) =>
                    handleInputChange("password_confirm", value)
                  }
                  buttonIcon={
                    showConfirmPassword ? <Icons.TbEyeOff /> : <Icons.TbEye />
                  }
                  onButtonClick={toggleConfirmPasswordVisibility}
                />
              </div>
            </div>
          </div>

          <div className="sidebar">
            <div className="sidebar_item">
              <h2 className="sub_heading">Tùy chọn</h2>
              {/* <Button
                label="Lưu & Thoát"
                icon={<Icons.TbDeviceFloppy />}
                className=""
                onClick={() => {
                  handleSubmit();
                  if (!errorMessage) navigate("/customers");
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
              <h2 className="sub_heading">Quyền</h2>
              <div className="column">
                <Dropdown
                  placeholder="Chọn quyền"
                  selectedValue={fields.role}
                  onClick={handleRoleSelect}
                  options={roleOptions}
                />
              </div>

              {/* Chỉ hiển thị Superuser toggler nếu role là user */}
              {fields.role === "user" && (
                <div className="column">
                  <Toggler
                    label="Superuser"
                    checked={fields.is_superuser}
                    onChange={() => toggleField("is_superuser")}
                  />
                </div>
              )}

              {/* Chỉ hiển thị Staff toggler nếu role là admin */}
              {fields.role === "admin" && (
                <div className="column">
                  <Toggler
                    label="Staff"
                    checked={fields.is_staff}
                    onChange={() => toggleField("is_staff")}
                  />
                </div>
              )}
            </div>

            <div className="sidebar_item">
              <h2 className="sub_heading">Trạng thái</h2>
              <div className="column">
                <Dropdown
                  placeholder="Chọn trạng thái"
                  selectedValue={fields.is_active ? "Active" : "Inactive"}
                  onClick={handleStatusSelect}
                  options={statusOptions}
                />
              </div>
            </div>

            <div className="sidebar_item">
              <h2 className="sub_heading">Ảnh đại diện</h2>
              <div className="column">
                <Thumbnail
                  preloadedImage={fields.avatarImg}
                  onChange={handleImageChange}
                />
                <small style={{ display: "block", marginTop: "5px" }}>
                  Nhấp vào ô trên để chọn hình ảnh từ máy tính
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AddCustomer;
