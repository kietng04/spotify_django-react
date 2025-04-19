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

const ManageUser = () => {
  console.log("ManageUser component mounted");
  const [users, setUsers] = useState([]);
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
  const [filter, setFilter] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        console.error("Authentication token not found in localStorage. Cannot fetch users.");
        setError("User not authenticated for admin panel."); 
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching users from API with token..."); 

        const response = await fetch("http://localhost:8000/api/userz/list/", {
          method: "GET",
          headers: {
            'Authorization': `Token ${token}`,
          }
        });
        console.log("API Response Status:", response.status);

        if (response.status === 401 || response.status === 403) {
          console.error("Authorization failed (401/403). Token might be invalid or expired, or user lacks permissions for this specific API.");
          setError("Authorization failed. Please log in again or check permissions.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          console.error(
            "API không hoạt động:",
            response.status,
            response.statusText
          );
          const errorData = await response.text();
          console.error("API Error Body:", errorData);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("API Data Received:", data);
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log("Finished fetching users."); 
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
      users.forEach((user) => {
        updateChecks[user.id] = true;
      });
      setSpecificChecks(updateChecks);
    } else {
      setSpecificChecks({});
    }
  };

  const handleCheckUser = (isCheck, id) => {
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
            `http://localhost:8000/api/users/blockuser/${itemID}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (response.ok) {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === itemID
                  ? { ...user, status: "Block" }
                  : user
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
      navigate(`/users/edit/${itemID}`);
    } else if (updateItem === "unblock") {
      if (confirm(`Bạn có chắc chắn muốn kích hoạt người dùng #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/users/unblock/${itemID}/`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({}),
            }
          );

          if (response.ok) {
            setUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.id === itemID
                  ? { ...user, status: "Active" }
                  : user
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
  const filteredUsers = users.filter((user) => {
    const searchMatches =
      !searchQuery ||
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!searchMatches) return false;

    if (!filter || filter === "all") return true;

    switch (filter) {
      case "active":
        return user.status?.toLowerCase() === "active";
      case "block":
        return user.status?.toLowerCase() !== "active";
      case "user":
        return user.role === "user";
      case "admin":
        return user.role === "admin";
      case "superuser":
        return (
          user.role === "user" &&
          (user.is_superuser === true || user.is_superuser === 1)
        );
      case "staff":
        return (
          user.role === "admin" &&
          (user.is_staff === true || user.is_staff === 1)
        );
      default:
        return true;
    }
  });
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };
  const indexOfLastUser = currentPage * Number(selectedValue);
  const indexOfFirstUser = indexOfLastUser - Number(selectedValue);
  const currentUsers = filteredUsers.slice(
    indexOfFirstUser,
    indexOfLastUser
  );

  const formatDisplayName = (name) => {
    if (!name) return "";
    return name.replace(
      /@gmail\.com|@yahoo\.com|@outlook\.com|@hotmail\.com/gi,
      ""
    );
  };

  console.log("Current State:", { users, loading, error });

  if (loading) {
    console.log("Rendering loading state...");
    return <div>Loading...</div>;
  }

  if (error) {
    console.log("Rendering error state:", error);
    return <div>Error: {error}</div>;
  }

  console.log("Rendering user table...");

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
                      <th>Advance</th>
                      <th className="td_status">status</th>
                      <th className="td_date">created at</th>
                      <th>actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {console.log("Current users to render:", currentUsers)}
                    {currentUsers.length === 0 && !loading && <tr><td colSpan="10">No users found.</td></tr>}
                    {currentUsers.map((user, key) => {
                      return (
                        <tr key={key}>
                          <td className="td_checkbox">
                            <CheckBox
                              onChange={(isCheck) =>
                                handleCheckUser(isCheck, user.id)
                              }
                              isChecked={specificChecks[user.id] || false}
                            />
                          </td>
                          <td className="td_id">{user.id}</td>
                          <td className="td_image">
                            <img
                              src={
                                user.image ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.username
                                )}&background=random&color=fff`
                              }
                              alt={user.username}
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "50%",
                                objectFit: "cover",
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  user.username
                                )}&background=random&color=fff`;
                              }}
                            />
                          </td>
                          <td colSpan="4">
                            <Link to={user.id.toString()}>
                              {formatDisplayName(
                                user.name || user.username
                              )}
                            </Link>
                          </td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            {user.role === "user" &&
                              user.is_superuser === true && (
                                <Badge
                                  label="Super"
                                  className="light-warning"
                                />
                              )}
                            {user.role === "admin" &&
                              user.is_staff === true && (
                                <Badge
                                  label="Staff"
                                  className="light-warning"
                                />
                              )}
                            {!(
                              (user.role === "user" &&
                                user.is_superuser === true) ||
                              (user.role === "admin" &&
                                user.is_staff === true)
                            ) && <span style={{ color: "#999" }}>-</span>}
                          </td>
                          <td className="td_status">
                            {user.status.toLowerCase() === "active" ? (
                              <Badge
                                label={user.status}
                                className="light-success"
                              />
                            ) : (
                              <Badge
                                label="Block"
                                className="light-danger"
                              />
                            )}
                          </td>
                          <td className="td_date">{user.createdAt}</td>

                          <td className="td_action">
                            <TableAction
                              actionItems={actionItems}
                              onActionItemClick={(item) =>
                                handleActionItemClick(item, user.id)
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
                  Math.ceil(filteredUsers.length / Number(selectedValue)) ||
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

export default ManageUser;
