import React, { useState, useEffect } from "react";
import * as Icons from "react-icons/tb";
// Import common components used in ManageUser
import Input from "../../components/common/Input.jsx";
import Badge from "../../components/common/Badge.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import SelectOption from "../../components/common/SelectOption.jsx";

const ManageOrders = () => {
  console.log("ManageOrders component mounted");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedValue, setSelectedValue] = useState(10); // Default items per page
  const [searchQuery, setSearchQuery] = useState("");

  const [tableRow, setTableRow] = useState([
    { value: 5, label: "5" },
    { value: 10, label: "10" },
    { value: 20, label: "20" },
  ]);

  useEffect(() => {
    const fetchPayments = async () => {
      const token = localStorage.getItem('adminAuthToken');
      if (!token) {
        console.error("Authentication token not found. Cannot fetch payments.");
        setError("User not authenticated for admin panel."); 
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log("Fetching premium payments from API..."); 

        // Use the new backend endpoint
        const response = await fetch("http://localhost:8000/api/premium-payments/", {
          method: "GET",
          headers: {
            'Authorization': `Token ${token}`,
          }
        });
        console.log("API Response Status:", response.status);

        if (response.status === 401 || response.status === 403) {
          console.error("Authorization failed (401/403).");
          setError("Authorization failed. Please log in again or check permissions.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          console.error("API error:", response.status, response.statusText);
          const errorData = await response.text(); 
          console.error("API Error Body:", errorData);
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        console.log("Payment Data Received:", data);
        setPayments(data || []); // Ensure data is an array
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError(err.message);
      } finally {
        setLoading(false);
        console.log("Finished fetching payments."); 
      }
    };

    fetchPayments();
  }, []); // Fetch only once on mount

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const showTableRow = (selectedOption) => {
    setSelectedValue(selectedOption.label);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Filter payments based on search query (order ID or username)
  const filteredPayments = payments.filter((payment) => 
    !searchQuery ||
    payment.order_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    payment.user?.toLowerCase().includes(searchQuery.toLowerCase()) 
  );

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page on search
  };

  const indexOfLastPayment = currentPage * Number(selectedValue);
  const indexOfFirstPayment = indexOfLastPayment - Number(selectedValue);
  const currentPayments = filteredPayments.slice(indexOfFirstPayment, indexOfLastPayment);

  return (
    <div>
      {/* Header section - similar to ManageUser */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Payment Orders</h1>
        {/* Optional: Add button if needed later
        <Button
          text="Add Order"
          icon={<Icons.TbCirclePlus size={18} />}
          className="btn-primary"
          onClick={() => navigate('/orders/add')} // Adjust route if needed
        />
        */}
      </div>

      {/* Filters and Search - similar to ManageUser */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <SelectOption
            options={tableRow}
            placeholder="Rows"
            defaultValue={tableRow.find(option => option.value === selectedValue)}
            onChange={showTableRow}
            width={70}
          />
          {/* Optional: Bulk Actions Dropdown if needed later 
          <Dropdown
            options={bulkAction}
            onChange={bulkActionDropDown}
            defaultSelect="Bulk Action"
          />
          */}
        </div>
        <Input
          inputStyle="search"
          placeholder="Search Order ID or User..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          icon={<Icons.TbSearch size={18} />}
        />
      </div>

      {/* Table section - adapt columns for PremiumPayment */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Removed Checkbox column for simplicity 
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                <CheckBox id="bulk-check" onChange={handleBulkCheckbox} />
              </th>
              */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
              </th>
              {/* Removed Action column for simplicity 
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : currentPayments.length > 0 ? (
              currentPayments.map((payment) => (
                <tr key={payment.id}>
                  {/* Removed Checkbox column 
                  <td className="px-6 py-4 whitespace-nowrap">
                    <CheckBox
                      id={`check-${payment.id}`}
                      checked={specificChecks[payment.id] || false}
                      onChange={(isChecked) => handleCheckUser(isChecked, payment.id)}
                    />
                  </td>
                  */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.order_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.user} {/* Display username directly */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.purchase_date}
                  </td>
                  {/* Removed Action column 
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <TableAction 
                      items={actionItems} 
                      onItemClick={(item) => handleActionItemClick(item, payment.id)}
                    />
                  </td>
                  */}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No payment orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination - similar to ManageUser */}
      {!loading && !error && filteredPayments.length > 0 && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredPayments.length / Number(selectedValue))}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default ManageOrders; 