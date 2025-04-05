import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import CheckBox from "../../components/common/CheckBox.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import TableAction from "../../components/common/TableAction.jsx";
import SelectOption from "../../components/common/SelectOption.jsx";

const ManageCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkCheck, setBulkCheck] = useState(false);
  const [specificChecks, setSpecificChecks] = useState({});
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");

  const [tableRow, setTableRow] = useState([
    { value: 2, label: "2" },
    { value: 5, label: "5" },
    { value: 10, label: "10" },
  ]);
  const [filter, setFilter] = useState(null); // Thêm state để lưu trạng thái lọc

  // Lấy dữ liệu người dùng từ API
  // Lấy dữ liệu người dùng từ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true); // Add this back to show loading state
        console.log("Đang tải dữ liệu từ API...");

        // Thay thế đoạn code fetch hiện tại bằng đoạn đơn giản sau
        const response = await fetch("http://localhost:8000/api/userz/list/", {
          method: "GET",
          // Không gửi headers xác thực
        });

        if (!response.ok) {
          console.error(
            "API không hoạt động:",
            response.status,
            response.statusText
          );
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Dữ liệu nhận được từ API:", data);
        setCustomers(data);
      } catch (err) {
        console.error("Lỗi khi lấy danh sách người dùng:", err);
        // Use your actual database data as fallback
        const sampleData = [
          {
            id: 1,
            username: "kietgemini9@gmail.com",
            name: "kietgemini9@gmail.com",
            email: "kietgemini9@gmail.com",
            image:
              "https://lh3.googleusercontent.com/a/ACg8ocKMQDb9sPNgGDx14rJJhJ4LnXna6HFqr2g5w332xaLHosI4Jw=s96-c",
            status: "Active",
            createdAt: "2025-03-18",
            role: "user",
          },
          {
            id: 2,
            username: "pvksdafffffffffffffAAA210504@gmail.com",
            name: "pvk21050AAAAAAAAAAAA4@gmail.com",
            email: "pvk210504@gmail.com",
            image:
              "https://lh3.googleusercontent.com/a/ACg8ocIf8i9efjhegtgNuclCALN8B0kCA9GDW1X2GCPYy740oJ_wV_Lx4w=s96-c",
            status: "Active",
            createdAt: "2025-03-19",
            role: "admin",
          },
        ];
        setCustomers(sampleData);
        setError(err.message);
      } finally {
        setLoading(false); // Always set loading to false when done
      }
    };

    fetchUsers();
  }, []);

  const bulkAction = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "block", label: "Block" },
    { value: "user", label: "User" },
    { value: "admin", label: "Admin" },
    { value: "superuser", label: "Superuser" },
    { value: "staff", label: "Staff" },
  ];
  const bulkActionDropDown = (selectedOption) => {
    setFilter(selectedOption.value);
    setCurrentPage(1);
    console.log("Đã chọn filter:", selectedOption.value);
  };

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleBulkCheckbox = (isCheck) => {
    setBulkCheck(isCheck);
    if (isCheck) {
      const updateChecks = {};
      customers.forEach((customer) => {
        updateChecks[customer.id] = true;
      });
      setSpecificChecks(updateChecks);
    } else {
      setSpecificChecks({});
    }
  };

  const handleCheckCustomer = (isCheck, id) => {
    setSpecificChecks((prevSpecificChecks) => ({
      ...prevSpecificChecks,
      [id]: isCheck,
    }));
  };

  const showTableRow = (selectedOption) => {
    setSelectedValue(selectedOption.label);
  };

  const actionItems = ["edit", "Block", "Unblock"];

  const handleActionItemClick = async (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "block") {
      if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa người dùng #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/userz/blockuser/${itemID}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (response.ok) {
            setCustomers((prevCustomers) =>
              prevCustomers.map((customer) =>
                customer.id === itemID
                  ? { ...customer, status: "Block" }
                  : customer
              )
            );
            alert(`Đã vô hiệu hóa người dùng #${itemID} thành công`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("API error:", errorData);
            alert(
              `Lỗi: ${errorData.message || "Không thể vô hiệu hóa người dùng"}`
            );
          }
        } catch (error) {
          console.error("Lỗi kết nối:", error);
          alert(`Lỗi kết nối: ${error.message}`);
        }
      }
    } else if (updateItem === "edit") {
      navigate(`/customers/manage/${itemID}`);
    } else if (updateItem === "unblock") {
      if (confirm(`Bạn có chắc chắn muốn kích hoạt người dùng #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/userz/unblock/${itemID}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (response.ok) {
            setCustomers((prevCustomers) =>
              prevCustomers.map((customer) =>
                customer.id === itemID
                  ? { ...customer, status: "Active" }
                  : customer
              )
            );
            alert(`Đã kích hoạt người dùng #${itemID} thành công`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("API error:", errorData);
            alert(
              `Lỗi: ${errorData.message || "Không thể kích hoạt người dùng"}`
            );
          }
        } catch (error) {
          console.error("Lỗi kết nối:", error);
          alert(`Lỗi kết nối: ${error.message}`);
        }
      }
    }
  };
  const filteredCustomers = customers.filter((customer) => {
    // Kiểm tra điều kiện tìm kiếm
    const searchMatches =
      !searchQuery ||
      customer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase());

    // Nếu không khớp với tìm kiếm, loại bỏ ngay
    if (!searchMatches) return false;

    // Tiếp tục lọc theo filter từ dropdown
    if (!filter || filter === "all") return true;

    switch (filter) {
      case "active":
        return customer.status?.toLowerCase() === "active";
      case "block":
        return customer.status?.toLowerCase() !== "active";
      case "user":
        return customer.role === "user";
      case "admin":
        return customer.role === "admin";
      case "superuser":
        return (
          customer.role === "user" &&
          (customer.is_superuser === true || customer.is_superuser === 1)
        );
      case "staff":
        return (
          customer.role === "admin" &&
          (customer.is_staff === true || customer.is_staff === 1)
        );
      default:
        return true;
    }
  });
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const indexOfLastCustomer = currentPage * Number(selectedValue);
  const indexOfFirstCustomer = indexOfLastCustomer - Number(selectedValue);
  const currentCustomers = filteredCustomers.slice(
    indexOfFirstCustomer,
    indexOfLastCustomer
  );

  const formatDisplayName = (name) => {
    if (!name) return "";
    // Loại bỏ phần @gmail.com hoặc các dạng email khác
    return name.replace(
      /@gmail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com/gi,
      ""
    );
  };
  return (
    <section className="customer">
      <div className="container">
        <div className="wrapper">
          <div className="content transparent">
            <div className="content_head">
              <Dropdown
                placeholder="Filter"
                className="sm"
                onClick={bulkActionDropDown}
                options={bulkAction}
              />
              <Input
                placeholder="Search Customer..."
                className="sm table_search"
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <div className="btn_parent">
                <Link to="/customers/add" className="sm button">
                  <Icons.TbPlus />
                  <span>Create Customer</span>
                </Link>
                <Button
                  label="Reset"
                  className="sm"
                  onClick={() => {
                    setFilter(null);
                    setSearchQuery(""); 
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            <div className="content_body">
              <div className="table_responsive">
                <table className="separate">
                  <thead>
                    <tr>
                      <th className="td_checkbox">
                        <CheckBox
                          onChange={handleBulkCheckbox}
                          isChecked={bulkCheck}
                        />
                      </th>
                      <th className="td_id">id</th>
                      <th className="td_image">image</th>
                      <th colSpan="4">name</th>
                      <th>email</th>
                      <th>role</th>
                      <th>Advance</th> {/* Thêm cột mới */}
                      <th className="td_status">status</th>
                      <th className="td_date">created at</th>
                      <th>actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.map((customer, key) => {
                      return (
                        <tr key={key}>
                          <td className="td_checkbox">
                            <CheckBox
                              onChange={(isCheck) =>
                                handleCheckCustomer(isCheck, customer.id)
                              }
                              isChecked={specificChecks[customer.id] || false}
                            />
                          </td>
                          <td className="td_id">{customer.id}</td>
                          <td className="td_image">
                            <img
                              src={
                                customer.image ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  customer.username
                                )}&background=random&color=fff`
                              }
                              alt={customer.username}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                // Fallback khi hình ảnh không tải được
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  customer.username
                                )}&background=random&color=fff`;
                              }}
                            />
                          </td>
                          <td colSpan="4">
                            <Link to={customer.id.toString()}>
                              {formatDisplayName(
                                customer.name || customer.username
                              )}
                            </Link>
                          </td>
                          <td>{customer.email}</td>
                          {/* Cột "role" chỉ hiển thị tên role */}
                          <td>{customer.role}</td>

                          {/* Cột "role detail" mới hiển thị badge */}
                          <td>
                            {customer.role === "user" &&
                              customer.is_superuser === true && (
                                <Badge
                                  label="Super"
                                  className="light-warning"
                                />
                              )}
                            {customer.role === "admin" &&
                              customer.is_staff === true && (
                                <Badge
                                  label="Staff"
                                  className="light-warning"
                                />
                              )}
                            {/* Hiển thị "N/A" hoặc "-" nếu không có quyền đặc biệt */}
                            {!(
                              (customer.role === "user" &&
                                customer.is_superuser === true) ||
                              (customer.role === "admin" &&
                                customer.is_staff === true)
                            ) && <span style={{ color: "#999" }}>-</span>}
                          </td>
                          <td className="td_status">
                            {customer.status.toLowerCase() === "active" ? (
                              <Badge
                                label={customer.status}
                                className="light-success"
                              />
                            ) : (
                              <Badge
                                label="Block" // Thay đổi từ customer.status thành "Block"
                                className="light-danger"
                              />
                            )}
                          </td>
                          <td className="td_date">{customer.createdAt}</td>

                          <td className="td_action">
                            <TableAction
                              actionItems={actionItems}
                              onActionItemClick={(item) =>
                                handleActionItemClick(item, customer.id)
                              }
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="content_footer">
              <Dropdown
                className="top show_rows sm"
                placeholder="please select"
                selectedValue={selectedValue}
                onClick={showTableRow}
                options={tableRow}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={
                  Math.ceil(filteredCustomers.length / Number(selectedValue)) ||
                  1
                }
                onPageChange={onPageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageCustomer;
