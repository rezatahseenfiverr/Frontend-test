import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const MeasureTypeManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [measureType, setMeasureType] = useState('');
  const [unitName, setUnitName] = useState('');
  const [editingUnit, setEditingUnit] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URI}/api/units`);
      setUnits(response.data);
    } catch (error) {
      console.error('Error fetching units:', error);
    }
    setLoading(false);
  };

  const handleAddUnit = async () => {
    if (!measureType.trim() || !unitName.trim()) {
      alert('Please fill in both measure type and unit name.');
      return;
    }
    try {
      const newUnit = { measureType, unitName };
      const response = await axios.post(`${import.meta.env.VITE_API_URI}/api/units`, newUnit);
      setUnits([...units, response.data]);
      setMeasureType('');
      setUnitName('');
    } catch (error) {
      console.error('Error adding unit:', error);
    }
  };

  const handleUpdateUnit = async () => {
    if (!measureType.trim() || !unitName.trim()) {
      alert('Please fill in both measure type and unit name.');
      return;
    }
    try {
      const updatedUnit = { measureType, unitName };
      const response = await axios.put(`${import.meta.env.VITE_API_URI}/api/units/${editingUnit._id}`, updatedUnit);
      setUnits(units.map(unit => (unit._id === editingUnit._id ? response.data : unit)));
      setMeasureType('');
      setUnitName('');
      setEditingUnit(null);
    } catch (error) {
      console.error('Error updating unit:', error);
    }
  };

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URI}/api/units/${id}`);
      setUnits(units.filter(unit => unit._id !== id));
    } catch (error) {
      console.error('Error deleting unit:', error);
    }
  };

  const startEditing = (unit) => {
    setMeasureType(unit.measureType);
    setUnitName(unit.unitName);
    setEditingUnit(unit);
  };

  const filteredUnits = units.filter((unit) => {
    const query = searchQuery.toLowerCase();
    return (
      unit.measureType.toLowerCase().includes(query) ||
      unit.unitName.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-20 sm:ml-64">
      <div className="w-full max-w-5xl mb-8 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-700 hover:text-gray-900 transition"
            aria-label="Go Back"
          >
            <FaArrowLeft className="text-2xl" />
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold">Measure Type Management</h1>
        </div>
        <div className="flex items-center bg-white rounded-md shadow-sm">
          <FaSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="Search measure types or units..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 w-64 rounded-r-md focus:outline-none bg-white focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => {
            if (editingUnit) handleUpdateUnit();
            else handleAddUnit();
          }}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition ml-4"
        >
          <FaPlus className="mr-2" /> {editingUnit ? 'Update Unit' : 'Add Unit'}
        </button>
      </div>

      <div className="p-4 border-2 border-gray-200 border-dashed rounded-lg dark:border-gray-700 w-full max-w-5xl">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{editingUnit ? 'Edit Unit' : 'Add New Unit'}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Measure Type"
              value={measureType}
              onChange={(e) => setMeasureType(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded"
              required
            />
            <input
              type="text"
              placeholder="Unit Name"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              className="px-4 py-2 border border-gray-300 bg-white rounded"
              required
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Measure Type</th>
                <th className="py-2 px-4 border-b">Unit Name</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    Loading units...
                  </td>
                </tr>
              ) : filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No units found.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit._id} className="text-center">
                    <td className="py-2 px-4 border-b">{unit.measureType}</td>
                    <td className="py-2 px-4 border-b">{unit.unitName}</td>
                    <td className="py-2 px-4 border-b flex justify-center space-x-2">
                      <button
                        className="flex items-center bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => startEditing(unit)}
                      >
                        <FaEdit className="mr-1" /> Edit
                      </button>
                      <button
                        className="flex items-center bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteUnit(unit._id)}
                      >
                        <FaTrash className="mr-1" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MeasureTypeManagement;
