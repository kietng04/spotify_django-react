import React, { useState, useRef, useEffect } from "react";
import * as Icons from "react-icons/tb";

const MultiSelect = ({
  className,
  label,
  options = [],
  placeholder,
  isSelected = [],
  isMulti = true,
  onChange,
  style
}) => {
  const [selectedIds, setSelectedIds] = useState(Array.isArray(isSelected) ? isSelected : []);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedIds(Array.isArray(isSelected) ? isSelected : []);
  }, [isSelected]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get labels of selected options
  const getSelectedLabels = () => {
    return selectedIds
      .map(id => {
        const option = options.find(opt => opt.value === id || opt.label === id);
        return option ? option.label : id;
      })
      .filter(Boolean);
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle option selection
  const handleSelect = (option) => {
    const value = option.value || option.label;
    
    let newSelectedIds;
    if (isMulti) {
      if (selectedIds.includes(value)) {
        newSelectedIds = selectedIds.filter(id => id !== value);
      } else {
        newSelectedIds = [...selectedIds, value];
      }
    } else {
      newSelectedIds = [value];
      setIsOpen(false);
    }
    
    setSelectedIds(newSelectedIds);
    if (onChange) onChange(newSelectedIds);
  };

  // Remove a selected item
  const removeItem = (e, item) => {
    e.stopPropagation();
    const newSelectedIds = selectedIds.filter(id => id !== item);
    setSelectedIds(newSelectedIds);
    if (onChange) onChange(newSelectedIds);
  };

  // Selected options labels
  const selectedLabels = getSelectedLabels();
  
  return (
    <div className={`input_field ${className || ""}`} style={style}>
      {label && <label>{label}</label>}
      
      <div ref={dropdownRef} className="dropdown">
        <div 
          className={`dropdown_box ${isOpen ? "active" : ""}`} 
          onClick={toggleDropdown}
        >
          <div className="dropdown_box_input">
            {selectedLabels.length === 0 ? (
              <span className="placeholder">{placeholder}</span>
            ) : isMulti ? (
              <div className="tag_container">
                {selectedLabels.map((label, index) => (
                  <span key={index} className="selected_tag">
                    {label}
                    <Icons.TbX 
                      onClick={(e) => removeItem(e, selectedIds[index])} 
                      className="tag_remove"
                    />
                  </span>
                ))}
              </div>
            ) : (
              <span>{selectedLabels[0]}</span>
            )}
          </div>
          <Icons.TbChevronDown className={`dropdown_box_icon ${isOpen ? "active" : ""}`} />
        </div>
        
        {isOpen && (
          <ul className="dropdown_options">
            {options && options.length > 0 ? (
              options.map((option, index) => {
                const value = option.value || option.label;
                const isItemSelected = selectedIds.includes(value);
                
                return (
                  <li
                    key={index}
                    className={`dropdown_option ${isItemSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span>{option.label}</span>
                    {isItemSelected && <Icons.TbCheck className="check_icon" />}
                  </li>
                );
              })
            ) : (
              <li className="dropdown_option disabled">Không có lựa chọn</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
