import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import Dropdown from "../../components/common/Dropdown.jsx";
import Offcanvas from "../../components/common/Offcanvas.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import TableAction from "../../components/common/TableAction.jsx";
import RangeSlider from "../../components/common/RangeSlider.jsx";
import MultiSelect from "../../components/common/MultiSelect.jsx";

const ManageTrack = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fields, setFields] = useState({
    title: "",
    album: "",
    durationRange: [0, 300],
  });
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(5); // Default rows per page
  const [searchQuery, setSearchQuery] = useState("");

  const [tableRow, setTableRow] = useState([
    { value: 2, label: "2" },
    { value: 5, label: "5" },
    { value: 10, label: "10" },
  ]);

  // Fetch tracks data
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/api/tracks/list/");
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setTracks(data || []);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài hát:", error);
        setError(error.message);
        setTracks([
          {
            id: 1,
            title: "Sample Track 1",
            uri: "sample1.mp3",
            duration_ms: 180000,
            track_number: 1,
            album_id: 1,
            album_title: "Sample Album",
            created_at: "2024-01-01T12:00:00Z",
            updated_at: "2024-01-01T12:00:00Z",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTracks();
  }, []);

  const handleInputChange = (key, value) => {
    setFields({ ...fields, [key]: value });
  };

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const showTableRow = (selectedOption) => {
    setSelectedValue(selectedOption.value);
    setCurrentPage(1);
  };

  const actionItems = ["Edit", "Delete", "Play"];

  const handleActionItemClick = (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "delete") {
      if (confirm(`Bạn có chắc chắn muốn xóa bài hát #${itemID}?`)) {
        console.log(`Deleting track #${itemID}`);
        alert(`Đã xóa bài hát #${itemID}`);
      }
    } else if (updateItem === "edit") {
      navigate(`/tracks/edit/${itemID}`);
    } else if (updateItem === "play") {
      window.open(`http://localhost:8000/api/stream/${itemID}/`, "_blank");
    }
  };

  // --- Offcanvas State and Handlers ---
  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);
  const handleToggleOffcanvas = () => setIsOffcanvasOpen(!isOffcanvasOpen);
  const handleCloseOffcanvas = () => setIsOffcanvasOpen(false);
  const handleApplyFilter = () => {
    console.log("Applying filters:", fields);
    setCurrentPage(1);
    handleCloseOffcanvas();
  };
  const handleResetFilter = () => {
    setFields({ title: "", album: "", durationRange: [0, 300] });
    console.log("Filters reset");
    setCurrentPage(1);
  };
  const handleSliderChange = (newValues) => {
    setFields(prevFields => ({ ...prevFields, durationRange: newValues }));
  };

  // --- MultiSelect Handler (Example) ---
  const albums = [
    { value: '1', label: 'Epic Sounds' },
    { value: '2', label: 'Summer Hits' },
  ];
  const handleSelectAlbum = (selectedOptions) => {
    setFields(prevFields => ({ ...prevFields, album: selectedOptions.map(opt => opt.value) }));
  };

  // --- Search Handler ---
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // --- Utility Functions ---
  const formatDuration = (duration_ms) => {
    if (duration_ms === null || duration_ms === undefined) return 'N/A';
    const totalSeconds = Math.floor(Number(duration_ms) / 1000);
    if (isNaN(totalSeconds)) return 'Invalid';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Filtering and Pagination Logic ---
  const filteredTracks = tracks.filter(track => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = track.title?.toLowerCase().includes(searchLower);
    if (!titleMatch) return false;
    if (fields.title && !track.title?.toLowerCase().includes(fields.title.toLowerCase())) return false;
    const durationSeconds = Math.floor(track.duration_ms / 1000);
    if (durationSeconds < fields.durationRange[0] || durationSeconds > fields.durationRange[1]) return false;
    return true;
  });

  const totalTracks = filteredTracks.length;
  const totalPages = Math.ceil(totalTracks / selectedValue);
  const indexOfLastTrack = currentPage * selectedValue;
  const indexOfFirstTrack = indexOfLastTrack - selectedValue;
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);

  // --- Render ---
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <section className="tracks">
      <div className="container">
        <div className="wrapper">
          <div className="content transparent">
            {/* Header Actions */}
            <div className="content_head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div className="left_actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button
                  label="Bộ lọc nâng cao"
                  className="sm"
                  icon={<Icons.TbFilter />}
                  onClick={handleToggleOffcanvas}
                />
                <Input
                  placeholder="Tìm kiếm bài hát..."
                  className="sm table_search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="right_actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <Button
                  label="Thêm bài hát"
                  className="sm"
                  icon={<Icons.TbPlus />}
                  onClick={() => navigate('/tracks/add')}
                />
                <Button
                  label="Làm mới"
                  icon={<Icons.TbRefresh />}
                  className="sm"
                  onClick={() => window.location.reload()}
                />
              </div>
            </div>

            {/* Advanced Filter Offcanvas */}
            <Offcanvas
                isOpen={isOffcanvasOpen}
                onClose={handleCloseOffcanvas}
                title="Tìm kiếm nâng cao"
            >
                <div className="offcanvas-body">
                  <div className="column" style={{ marginBottom: '15px' }}>
                    <Input
                      type="text"
                      placeholder="Nhập tên bài hát"
                      label="Tên bài hát"
                      value={fields.title}
                      onChange={(value) => handleInputChange("title", value)}
                    />
                  </div>
                  <div className="column" style={{ marginBottom: '15px' }}>
                    <RangeSlider
                      label="Thời lượng (giây)"
                      min={0}
                      max={600}
                      step={1}
                      values={fields.durationRange}
                      onValuesChange={handleSliderChange}
                    />
                  </div>
                </div>
                <div className="offcanvas-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                  <Button label="Đặt lại" className="sm secondary" onClick={handleResetFilter} />
                  <Button label="Áp dụng" className="sm" onClick={handleApplyFilter} />
                </div>
            </Offcanvas>

            {/* Tracks Table */}
            <div className="content_body">
              <div className="table_responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tên bài hát</th>
                      <th style={{ textAlign: 'center' }}>Thời lượng</th>
                      <th>Ngày tạo</th>
                      <th style={{ textAlign: 'center' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentTracks.length > 0 ? (
                      currentTracks.map((track, index) => (
                        <tr key={track.id}>
                          <td>{indexOfFirstTrack + index + 1}</td>
                          <td>{track.title}</td>
                          <td style={{ textAlign: 'center' }}>{formatDuration(track.duration_ms)}</td>
                          <td>{new Date(track.created_at).toLocaleDateString()}</td>
                          <td style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <TableAction
                                actionItems={actionItems}
                                onActionItemClick={(item) => handleActionItemClick(item, track.id)}
                            />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center' }}>Không tìm thấy bài hát nào.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Pagination and Row Selector */}
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
                    placeholder={`${selectedValue} Rows`}
                />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManageTrack; 