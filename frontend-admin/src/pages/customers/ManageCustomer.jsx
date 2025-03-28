import * as Icons from "react-icons/tb";
// Bỏ import dữ liệu tĩnh
// import Customers from "../../api/Customers.json";
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
  const [tableRow, setTableRow] = useState([
    { value: 2, label: "2" },
    { value: 5, label: "5" },
    { value: 10, label: "10" },
  ]);

  // Lấy dữ liệu người dùng từ API
  // Lấy dữ liệu người dùng từ API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true); // Add this back to show loading state
        console.log("Đang tải dữ liệu từ API...");
        
        // Thay thế đoạn code fetch hiện tại bằng đoạn đơn giản sau
const response = await fetch("http://localhost:8000/api/users/list/", {
  method: "GET",
  // Không gửi headers xác thực
});
  
        if (!response.ok) {
          console.error("API không hoạt động:", response.status, response.statusText);
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
            image: "https://lh3.googleusercontent.com/a/ACg8ocKMQDb9sPNgGDx14rJJhJ4LnXna6HFqr2g5w332xaLHosI4Jw=s96-c",
            status: "Active",
            createdAt: "2025-03-18",
            role: "user",
          },
          {
            id: 2,
            username: "pvksdafffffffffffffAAA210504@gmail.com",
            name: "pvk21050AAAAAAAAAAAA4@gmail.com",
            email: "pvk210504@gmail.com",
            image: "https://lh3.googleusercontent.com/a/ACg8ocIf8i9efjhegtgNuclCALN8B0kCA9GDW1X2GCPYy740oJ_wV_Lx4w=s96-c",
            status: "Active",
            createdAt: "2025-03-19",
            role: "admin",
          }
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
    { value: "delete", label: "Delete" },
    { value: "category", label: "Category" },
    { value: "status", label: "Status" },
  ];

  const bulkActionDropDown = (selectedOption) => {
    console.log(selectedOption);
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

  const actionItems = ["Delete", "edit"];

  const handleActionItemClick = async (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "delete") {
      if (confirm(`Bạn có chắc chắn muốn vô hiệu hóa người dùng #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/users/${itemID}/deactivate/`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
              },
            }
          );
    
          if (response.ok) {
            setCustomers(prevCustomers => 
              prevCustomers.map(customer => 
                customer.id === itemID 
                  ? { ...customer, status: 'Block' } 
                  : customer
              )
            );
            alert(`Đã vô hiệu hóa người dùng #${itemID} thành công`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error("API error:", errorData);
            alert(`Lỗi: ${errorData.message || "Không thể vô hiệu hóa người dùng"}`);
          }
        } catch (error) {
          console.error("Lỗi kết nối:", error);
          alert(`Lỗi kết nối: ${error.message}`);
        }
      }
    } else if (updateItem === "edit") {
      navigate(`/customers/manage/${itemID}`);
    }
  };

  // Phân trang
  const indexOfLastCustomer = currentPage * Number(selectedValue);
  const indexOfFirstCustomer = indexOfLastCustomer - Number(selectedValue);
  const currentCustomers = customers.slice(
    indexOfFirstCustomer,
    indexOfLastCustomer
  );

  

  return (
    <section className="customer">
      <div className="container">
        <div className="wrapper">
          <div className="content transparent">
            <div className="content_head">
              <Dropdown
                placeholder="Bulk Action"
                className="sm"
                onClick={bulkActionDropDown}
                options={bulkAction}
              />
              <Input
                placeholder="Search Customer..."
                className="sm table_search"
              />
              <div className="btn_parent">
                <Link to="/customers/add" className="sm button">
                  <Icons.TbPlus />
                  <span>Create Customer</span>
                </Link>
                <Button label="Advance Filter" className="sm" />
                <Button label="save" className="sm" />
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
                                )}`
                              }
                              alt={customer.username}
                            />
                          </td>
                          <td colSpan="4">
                            <Link to={customer.id.toString()}>
                              {customer.name || customer.username}
                            </Link>
                          </td>
                          <td>{customer.email}</td>
                          <td>{customer.role}</td>
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
                  Math.ceil(customers.length / Number(selectedValue)) || 1
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
