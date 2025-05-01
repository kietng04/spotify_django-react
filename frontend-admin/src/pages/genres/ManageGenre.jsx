import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";
import CheckBox from "../../components/common/CheckBox.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import TableAction from "../../components/common/TableAction.jsx";
import Offcanvas from "../../components/common/Offcanvas.jsx";

const ManageGenre = () => {
  // State variables
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkCheck, setBulkCheck] = useState(false);
  const [specificChecks, setSpecificChecks] = useState({});
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState("5");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const [filter, setFilter] = useState(null);
  const [fields, setFields] = useState({
    name: ""
  });

  // Table row options
  const tableRow = [
    { value: "5", label: "5" },
    { value: "10", label: "10" },
    { value: "20", label: "20" },
    { value: "50", label: "50" },
  ];

  // Filter options
  const bulkAction = [
    { value: "all", label: "All" }
  ];

  // Fetch genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      const token = localStorage.getItem("adminAuthToken");
      if (!token) {
        setError("User not authenticated for admin panel.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          "http://localhost:8000/api/genres/list/",
          {
            method: "GET",
            headers: {
              Authorization: `Token ${token}`,
            },
          }
        );

        if (response.status === 401 || response.status === 403) {
          setError(
            "Authorization failed. Please log in again or check permissions."
          );
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setGenres(data);
      } catch (err) {
        console.error("Error fetching genres:", err);
        setError(err.message);

        // Sample data for development if API fails
        setGenres([
          {
            id: 1,
            name: "Pop"
          },
          {
            id: 2,
            name: "Rock"
          },
          {
            id: 3,
            name: "Hip Hop"
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  // Input change handler
  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  // Filter dropdown handler
  const bulkActionDropDown = (selectedOption) => {
    setFilter(selectedOption.value);
    setCurrentPage(1);
  };

  // Page change handler
  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Bulk checkbox handler
  const handleBulkCheckbox = (isCheck) => {
    setBulkCheck(isCheck);
    if (isCheck) {
      const updateChecks = {};
      genres.forEach((genre) => {
        updateChecks[genre.id] = true;
      });
      setSpecificChecks(updateChecks);
    } else {
      setSpecificChecks({});
    }
  };

  // Individual checkbox handler
  const handleCheckGenre = (isCheck, id) => {
    setSpecificChecks((prevSpecificChecks) => ({
      ...prevSpecificChecks,
      [id]: isCheck,
    }));
  };

  // Row selection handler
  const showTableRow = (selectedOption) => {
    setSelectedValue(selectedOption.label);
    setCurrentPage(1);
  };

  // Action items for each genre
  const actionItems = ["edit", "delete"];

  // Handle action item click
  const handleActionItemClick = async (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "delete") {
      if (confirm(`Bạn có chắc chắn muốn xóa thể loại #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/genres/${itemID}/`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            setGenres((prevGenres) =>
              prevGenres.filter((genre) => genre.id !== itemID)
            );
            alert(`Đã xóa thể loại #${itemID} thành công`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            alert(
              `Lỗi: ${
                errorData.detail || errorData.message || "Không thể xóa thể loại"
              }`
            );
          }
        } catch (error) {
          alert(`Lỗi kết nối: ${error.message}`);
        }
      }
    } else if (updateItem === "edit") {
      navigate(`/genres/edit/${itemID}`);
    }
  };

  // Search and filter handlers
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleToggleOffcanvas = () => {
    setIsOffcanvasOpen(!isOffcanvasOpen);
  };

  const handleCloseOffcanvas = () => {
    setIsOffcanvasOpen(false);
  };

  const handleApplyFilter = () => {
    setCurrentPage(1);
    handleCloseOffcanvas();
  };

  const handleResetFilter = () => {
    setFields({
      name: ""
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Filter genres based on search and filter criteria
  const filteredGenres = genres.filter((genre) => {
    // Search by name
    const searchMatches =
      !searchQuery ||
      genre.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!searchMatches) return false;

    // Apply advanced filter from fields
    const nameMatch =
      !fields.name ||
      (genre.name &&
        genre.name.toLowerCase().includes(fields.name.toLowerCase()));

    return nameMatch;
  });

  // Pagination calculation
  const indexOfLastGenre = currentPage * parseInt(selectedValue);
  const indexOfFirstGenre = indexOfLastGenre - parseInt(selectedValue);
  const currentGenres = filteredGenres.slice(
    indexOfFirstGenre,
    indexOfLastGenre
  );
  const totalPages = Math.ceil(
    filteredGenres.length / parseInt(selectedValue)
  );

  // Handle loading and error states
  if (loading) {
    return (
      <div className="content_body">
        <div className="loading">Đang tải dữ liệu thể loại...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="content_body">
        <div className="error">Lỗi: {error}</div>
      </div>
    );
  }

  return (
    <section>
      <div className="container">
        <div className="wrapper">
          <div className="content">
            {/* Header */}
            <div
              className="content_head"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "nowrap",
                gap: "12px",
              }}
            >
              {/* Left side with title */}
              <div className="title-section" style={{ flex: "0 0 auto" }}>
                <h2 className="heading">Quản lý thể loại</h2>
              </div>

              {/* Middle section with search and filter */}
              <div
                className="search-filter-section"
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: "1 1 auto",
                  gap: "8px",
                  maxWidth: "500px",
                }}
              >
                <Dropdown
                  placeholder="Lọc theo"
                  className="sm"
                  onClick={bulkActionDropDown}
                  options={bulkAction}
                  style={{ minWidth: "120px" }}
                />
                <Input
                  placeholder="Tìm thể loại..."
                  className="sm table_search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  icon={<Icons.TbSearch />}
                  style={{ flex: "1" }}
                />
              </div>

              {/* Right section with action buttons */}
              <div
                className="action-buttons"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  flex: "0 0 auto",
                }}
              >
                <Button
                  label="Tìm kiếm nâng cao"
                  className="sm"
                  icon={<Icons.TbFilter />}
                  onClick={handleToggleOffcanvas}
                />
                <Button
                  label="Thêm thể loại mới"
                  className="sm"
                  icon={<Icons.TbPlus />}
                  onClick={() => navigate("/genres/add")}
                />
                <Button
                  label="Làm mới"
                  className="sm"
                  icon={<Icons.TbRefresh />}
                  onClick={() => window.location.reload()}
                />
              </div>
            </div>

            {/* Advanced Search Offcanvas */}
            <Offcanvas
              isOpen={isOffcanvasOpen}
              onClose={handleCloseOffcanvas}
              title="Tìm kiếm nâng cao"
            >
              <div className="offcanvas-body">
                <div className="column">
                  <Input
                    type="text"
                    placeholder="Nhập tên thể loại"
                    label="Tên thể loại"
                    value={fields.name}
                    onChange={(value) => handleInputChange("name", value)}
                  />
                </div>
              </div>

              <div className="offcanvas-footer">
                <Button
                  label="Đặt lại"
                  className="sm secondary"
                  onClick={handleResetFilter}
                />
                <Button
                  label="Áp dụng"
                  className="sm"
                  onClick={handleApplyFilter}
                />
              </div>
            </Offcanvas>

            {/* Table Content */}
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
                      <th className="td_id">ID</th>
                      <th>Tên thể loại</th>
                      <th className="td_action">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentGenres.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          style={{ textAlign: "center", padding: "20px" }}
                        >
                          Không tìm thấy thể loại nào
                        </td>
                      </tr>
                    ) : (
                      currentGenres.map((genre, key) => {
                        return (
                          <tr key={key}>
                            <td className="td_checkbox">
                              <CheckBox
                                onChange={(isCheck) =>
                                  handleCheckGenre(isCheck, genre.id)
                                }
                                isChecked={specificChecks[genre.id] || false}
                              />
                            </td>
                            <td className="td_id">{genre.id}</td>
                            <td>
                              <Link
                                to={`/genres/edit/${genre.id}`}
                                className="hover:underline font-medium"
                              >
                                {genre.name}
                              </Link>
                            </td>
                            <td className="td_action">
                              <TableAction
                                actionItems={actionItems}
                                onActionItemClick={(item) =>
                                  handleActionItemClick(item, genre.id)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Footer */}
            <div className="content_footer">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
              <Dropdown
                className="sm table_row_show"
                selectedValue={selectedValue}
                onClick={showTableRow}
                options={tableRow}
                placeholder={`${selectedValue} Dòng`}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageGenre;