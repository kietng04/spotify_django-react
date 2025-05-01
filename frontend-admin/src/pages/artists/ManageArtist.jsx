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
import Offcanvas from "../../components/common/Offcanvas.jsx";

const ManageArtist = () => {
  // State variables
  const [artists, setArtists] = useState([]);
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
    name: "",
    popularity: [0, 100],
    followers: [0, 10000000],
    dateRange: [null, null],
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
    { value: "all", label: "All" },
    { value: "popular", label: "Popular (70%+)" },
    { value: "unpopular", label: "Unpopular (<30%)" },
    { value: "recent", label: "Recently Added" },
  ];

  // Fetch artists on component mount
  useEffect(() => {
    const fetchArtists = async () => {
      const token = localStorage.getItem("adminAuthToken");
      if (!token) {
        setError("User not authenticated for admin panel.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          "http://localhost:8000/api/artists/list/",
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
        setArtists(data);
      } catch (err) {
        console.error("Error fetching artists:", err);
        setError(err.message);

        // Sample data for development if API fails
        setArtists([
          {
            id: 1,
            name: "Taylor Swift",
            bio: "American singer-songwriter",
            image_url: "/images/artists/taylor.jpg",
            spotify_id: "06HL4z0CvFAxyc27GXpf02",
            followers: 82000000,
            popularity: 98,
            created_at: "2023-01-15 12:30:45",
            updated_at: "2023-04-22 08:15:30",
          },
          {
            id: 2,
            name: "The Weeknd",
            bio: "Canadian singer and songwriter",
            image_url: "/images/artists/weeknd.jpg",
            spotify_id: "1Xyo4u8uXC1ZmMpatF05PJ",
            followers: 45000000,
            popularity: 94,
            created_at: "2023-02-10 16:45:20",
            updated_at: "2023-04-18 11:30:15",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchArtists();
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
      artists.forEach((artist) => {
        updateChecks[artist.id] = true;
      });
      setSpecificChecks(updateChecks);
    } else {
      setSpecificChecks({});
    }
  };

  // Individual checkbox handler
  const handleCheckArtist = (isCheck, id) => {
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

  // Action items for each artist
  const actionItems = ["edit", "delete"];

  // Handle action item click
  const handleActionItemClick = async (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "delete") {
      if (confirm(`Bạn có chắc chắn muốn xóa nghệ sĩ #${itemID}?`)) {
        try {
          const response = await fetch(
            `http://localhost:8000/api/artists/${itemID}/`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            setArtists((prevArtists) =>
              prevArtists.filter((artist) => artist.id !== itemID)
            );
            alert(`Đã xóa nghệ sĩ #${itemID} thành công`);
          } else {
            const errorData = await response.json().catch(() => ({}));
            alert(
              `Lỗi: ${
                errorData.detail || errorData.message || "Không thể xóa nghệ sĩ"
              }`
            );
          }
        } catch (error) {
          alert(`Lỗi kết nối: ${error.message}`);
        }
      }
    } else if (updateItem === "edit") {
      navigate(`/artists/edit/${itemID}`);
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
      name: "",
      popularity: [0, 100],
      followers: [0, 10000000],
      dateRange: [null, null],
    });
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Image URL formatter
  const getImageUrl = (url) => {
    if (!url) {
      return `https://ui-avatars.com/api/?name=Artist&background=random&color=fff&size=150`;
    }
    
    if (url.startsWith('http')) {
      return url;
    }
    const cleanPath = url.replace(/^.*\/artists\//, 'artists/');
    return `http://localhost:8000/media/${cleanPath}`;
  };

  // Filter artists based on search and filter criteria
  const filteredArtists = artists.filter((artist) => {
    // Search by name, bio, or Spotify ID
    const searchMatches =
      !searchQuery ||
      artist.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artist.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (artist.spotify_id &&
        artist.spotify_id.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!searchMatches) return false;

    // Apply advanced filter from fields
    const nameMatch =
      !fields.name ||
      (artist.name &&
        artist.name.toLowerCase().includes(fields.name.toLowerCase()));

    const popularityMatch =
      artist.popularity >= fields.popularity[0] &&
      artist.popularity <= fields.popularity[1];

    const followersMatch =
      artist.followers >= fields.followers[0] &&
      artist.followers <= fields.followers[1];

    // Apply additional filter from dropdown
    if (filter) {
      switch (filter) {
        case "popular":
          return (
            nameMatch &&
            popularityMatch &&
            followersMatch &&
            artist.popularity >= 70
          );
        case "unpopular":
          return (
            nameMatch &&
            popularityMatch &&
            followersMatch &&
            artist.popularity < 30
          );
        case "recent":
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return (
            nameMatch &&
            popularityMatch &&
            followersMatch &&
            new Date(artist.created_at) >= thirtyDaysAgo
          );
        default:
          return nameMatch && popularityMatch && followersMatch;
      }
    }

    return nameMatch && popularityMatch && followersMatch;
  });

  // Pagination calculation
  const indexOfLastArtist = currentPage * parseInt(selectedValue);
  const indexOfFirstArtist = indexOfLastArtist - parseInt(selectedValue);
  const currentArtists = filteredArtists.slice(
    indexOfFirstArtist,
    indexOfLastArtist
  );
  const totalPages = Math.ceil(
    filteredArtists.length / parseInt(selectedValue)
  );

  // Handle loading and error states
  if (loading) {
    return (
      <div className="content_body">
        <div className="loading">Đang tải dữ liệu nghệ sĩ...</div>
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
                <h2 className="heading">Quản lý nghệ sĩ</h2>
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
                  placeholder="Tìm nghệ sĩ..."
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
                  label="Thêm nghệ sĩ mới"
                  className="sm"
                  icon={<Icons.TbPlus />}
                  onClick={() => navigate("/artists/add")}
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
                    placeholder="Nhập tên nghệ sĩ"
                    label="Tên nghệ sĩ"
                    value={fields.name}
                    onChange={(value) => handleInputChange("name", value)}
                  />
                </div>

                <div className="column">
                  <label>Mức độ phổ biến (%)</label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      margin: "10px 0",
                    }}
                  >
                    <span>{fields.popularity[0]}%</span>
                    <span>{fields.popularity[1]}%</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fields.popularity[0]}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          popularity: [
                            parseInt(e.target.value),
                            fields.popularity[1],
                          ],
                        })
                      }
                      style={{ width: "50%" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={fields.popularity[1]}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          popularity: [
                            fields.popularity[0],
                            parseInt(e.target.value),
                          ],
                        })
                      }
                      style={{ width: "50%" }}
                    />
                  </div>
                </div>

                <div className="column">
                  <label>Số người theo dõi</label>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      margin: "10px 0",
                    }}
                  >
                    <span>{fields.followers[0].toLocaleString()}</span>
                    <span>{fields.followers[1].toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="100000"
                      value={fields.followers[0]}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          followers: [
                            parseInt(e.target.value),
                            fields.followers[1],
                          ],
                        })
                      }
                      style={{ width: "50%" }}
                    />
                    <input
                      type="range"
                      min="0"
                      max="10000000"
                      step="100000"
                      value={fields.followers[1]}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          followers: [
                            fields.followers[0],
                            parseInt(e.target.value),
                          ],
                        })
                      }
                      style={{ width: "50%" }}
                    />
                  </div>
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
                      <th className="td_image">Ảnh</th>
                      <th>Tên nghệ sĩ</th>
                      <th>Spotify ID</th>
                      <th>Tiểu sử</th>
                      <th>Người theo dõi</th>
                      <th>Độ phổ biến</th>
                      <th className="td_date">Ngày tạo</th>
                      <th className="td_action">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentArtists.length === 0 ? (
                      <tr>
                        <td
                          colSpan="10"
                          style={{ textAlign: "center", padding: "20px" }}
                        >
                          Không tìm thấy nghệ sĩ nào
                        </td>
                      </tr>
                    ) : (
                      currentArtists.map((artist, key) => {
                        const imageUrl = getImageUrl(artist.image_url);
                        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          artist.name
                        )}&background=random&color=fff&size=150`;

                        return (
                          <tr key={key}>
                            <td className="td_checkbox">
                              <CheckBox
                                onChange={(isCheck) =>
                                  handleCheckArtist(isCheck, artist.id)
                                }
                                isChecked={specificChecks[artist.id] || false}
                              />
                            </td>
                            <td className="td_id">{artist.id}</td>
                            <td className="td_image">
                              <img
                                src={imageUrl || fallbackUrl}
                                alt={artist.name}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "50%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = fallbackUrl;
                                }}
                              />
                            </td>
                            <td>
                              <Link
                                to={`/artists/edit/${artist.id}`}
                                className="hover:underline font-medium"
                              >
                                {artist.name}
                              </Link>
                            </td>
                            <td>{artist.spotify_id || "—"}</td>
                            <td
                              className="truncate max-w-[200px]"
                              title={artist.bio}
                            >
                              {artist.bio || "—"}
                            </td>
                            <td>{artist.followers?.toLocaleString() || 0}</td>
                            <td>
                              {artist.popularity && (
                                <Badge
                                  label={`${artist.popularity}%`}
                                  className={
                                    artist.popularity >= 70
                                      ? "light-success"
                                      : artist.popularity >= 30
                                      ? "light-warning"
                                      : "light-danger"
                                  }
                                />
                              )}
                            </td>
                            <td className="td_date">
                              {formatDate(artist.created_at)}
                            </td>
                            <td className="td_action">
                              <TableAction
                                actionItems={actionItems}
                                onActionItemClick={(item) =>
                                  handleActionItemClick(item, artist.id)
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

export default ManageArtist;
