import * as Icons from "react-icons/tb";
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Input from "../../components/common/Input.jsx";
import Badge from "../../components/common/Badge.jsx";
import Button from "../../components/common/Button.jsx";
import CheckBox from "../../components/common/CheckBox.jsx";
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
  const [bulkCheck, setBulkCheck] = useState(false);
  const [specificChecks, setSpecificChecks] = useState({});
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState(null);
  
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
        setTracks(data);
      } catch (error) {
        console.error("Lỗi khi lấy danh sách bài hát:", error);
        setError(error.message);
        setTracks([
          {
            id: 1,
            title: "Yagi Wrath",
            uri: "yagi-wrath-293158.mp3",
            duration_ms: 66000,
            track_number: 1,
            album_id: 1,
            created_at: "2025-03-14 15:54:15",
            updated_at: "2025-03-14 15:54:15"
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, []);

  const handleInputChange = (key, value) => {
    setFields({
      ...fields,
      [key]: value,
    });
  };

  const bulkAction = [
    { value: "delete", label: "Xóa" },
    { value: "album", label: "Đổi album" },
  ];

  const bulkActionDropDown = (selectedOption) => {
    setFilter(selectedOption.value);
    setCurrentPage(1);
  };

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleBulkCheckbox = (isCheck) => {
    setBulkCheck(isCheck);
    if (isCheck) {
      const updateChecks = {};
      tracks.forEach((track) => {
        updateChecks[track.id] = true;
      });
      setSpecificChecks(updateChecks);
    } else {
      setSpecificChecks({});
    }
  };

  const handleCheckTrack = (isCheck, id) => {
    setSpecificChecks((prevSpecificChecks) => ({
      ...prevSpecificChecks,
      [id]: isCheck,
    }));
  };

  const showTableRow = (selectedOption) => {
    setSelectedValue(selectedOption.label);
  };

  const actionItems = ["Delete", "edit", "play"];

  const handleActionItemClick = (item, itemID) => {
    var updateItem = item.toLowerCase();
    if (updateItem === "delete") {
      if (confirm(`Bạn có chắc chắn muốn xóa bài hát #${itemID}?`)) {
        alert(`Đã xóa bài hát #${itemID}`);
      }
    } else if (updateItem === "edit") {
      navigate(`/tracks/edit/${itemID}`);
    } else if (updateItem === "play") {
      // Play the track logic
      window.open(`http://localhost:8000/api/stream/${itemID}/`, "_blank");
    }
  };

  const [isOffcanvasOpen, setIsOffcanvasOpen] = useState(false);

  const handleToggleOffcanvas = () => {
    setIsOffcanvasOpen(!isOffcanvasOpen);
  };

  const handleCloseOffcanvas = () => {
    setIsOffcanvasOpen(false);
  };

  const handleSliderChange = (newValues) => {
    setFields({
      ...fields,
      durationRange: newValues,
    });
  };

  const albums = [
    { label: 'Epic Sounds' },
    { label: 'Summer Hits' },
    { label: 'Corporate Music' },
    { label: 'Love Songs' },
    { label: 'Yoga & Meditation' },
  ];

  const handleSelectAlbum = (selectedValues) => {
    setFields({
      ...fields,
      album: selectedValues,
    });
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Format duration from milliseconds to mm:ss
  const formatDuration = (duration_ms) => {
    const totalSeconds = Math.floor(duration_ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filter tracks based on search query
  const filteredTracks = tracks.filter(track => {
    const searchMatches = !searchQuery || 
      track.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!searchMatches) return false;
    
    return true;
  });

  // Calculate pagination
  const indexOfLastTrack = currentPage * Number(selectedValue);
  const indexOfFirstTrack = indexOfLastTrack - Number(selectedValue);
  const currentTracks = filteredTracks.slice(indexOfFirstTrack, indexOfLastTrack);

  return (
    <section className="tracks">
      <div className="container">
        <div className="wrapper">
          <div className="content transparent">
            <div className="content_head">
              <Dropdown
                placeholder="Tác vụ hàng loạt"
                className="sm"
                onClick={bulkActionDropDown}
                options={bulkAction}
              />
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
              <Offcanvas
                isOpen={isOffcanvasOpen}
                onClose={handleCloseOffcanvas}
              >
                <div className="offcanvas-head">
                  <h2>Tìm kiếm nâng cao</h2>
                </div>
                <div className="offcanvas-body">
                  <div className="column">
                    <Input
                      type="text"
                      placeholder="Nhập tên bài hát"
                      label="Tên bài hát"
                      value={fields.title}
                      onChange={(value) => handleInputChange("title", value)}
                    />
                  </div>
                  <div className="column">
                    <MultiSelect
                      options={albums}
                      placeholder="Chọn album"
                      label="Album"
                      isSelected={fields.album}
                      onChange={handleSelectAlbum}
                    />
                  </div>
                  <div className="column">
                    <RangeSlider 
                      label="Thời lượng (giây)" 
                      values={fields.durationRange} 
                      onValuesChange={handleSliderChange} 
                    />
                  </div>
                </div>
                <div className="offcanvas-footer">
                  <Button
                    label="Hủy bỏ"
                    className="sm outline"
                    icon={<Icons.TbX />}
                    onClick={handleCloseOffcanvas}
                  />
                  <Button
                    label="Lọc"
                    className="sm"
                    icon={<Icons.TbFilter />}
                    onClick={handleCloseOffcanvas}
                  />
                </div>
              </Offcanvas>
              <div className="btn_parent">
                <Link to="/tracks/add" className="sm button">
                  <Icons.TbPlus />
                  <span>Thêm bài hát</span>
                </Link>
                <Button
                  label="Làm mới"
                  icon={<Icons.TbRefresh />}
                  className="sm"
                />
              </div>
            </div>
            <div className="content_body">
              {loading ? (
                <div className="loading">Đang tải dữ liệu...</div>
              ) : error ? (
                <div className="error">Lỗi: {error}</div>
              ) : (
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
                        <th>Tên bài hát</th>
                        <th>File</th>
                        <th>Thời lượng</th>
                        <th>Track #</th>
                        <th>Album ID</th>
                        <th>Ngày tạo</th>
                        <th>Cập nhật</th>
                        <th className="td_action">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentTracks.map((track, key) => {
                        return (
                          <tr key={key}>
                            <td className="td_checkbox">
                              <CheckBox
                                onChange={(isCheck) =>
                                  handleCheckTrack(isCheck, track.id)
                                }
                                isChecked={specificChecks[track.id] || false}
                              />
                            </td>
                            <td className="td_id">{track.id}</td>
                            <td>
                              <Link to={`/tracks/edit/${track.id}`}>{track.title}</Link>
                            </td>
                            <td>{track.uri}</td>
                            <td>{formatDuration(track.duration_ms)}</td>
                            <td>{track.track_number}</td>
                            <td>{track.album_id}</td>
                            <td>{new Date(track.created_at).toLocaleDateString()}</td>
                            <td>{new Date(track.updated_at).toLocaleDateString()}</td>
                            <td className="td_action">
                              <TableAction
                                actionItems={actionItems}
                                onActionItemClick={(item) =>
                                  handleActionItemClick(item, track.id)
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <div className="content_footer">
              <Dropdown
                className="top show_rows sm"
                placeholder="Hiển thị"
                selectedValue={selectedValue}
                onClick={showTableRow}
                options={tableRow}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={
                  Math.ceil(filteredTracks.length / Number(selectedValue)) || 1
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

export default ManageTrack;