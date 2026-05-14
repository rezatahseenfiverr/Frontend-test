import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaEdit, FaTrash, FaArrowLeft, FaExternalLinkAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminPopupAds = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', imageUrl: '', linkUrl: '', isActive: true });
  const navigate = useNavigate();

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URI}/api/admin/popup-ads`);
      setAds(res.data);
    } catch { toast.error('Failed to load popup ads'); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', imageUrl: '', linkUrl: '', isActive: true }); setShowForm(true); };

  const openEdit = (ad) => { setEditing(ad); setForm({ title: ad.title || '', imageUrl: ad.imageUrl || '', linkUrl: ad.linkUrl || '', isActive: ad.isActive }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.imageUrl) { toast.error('Image URL is required'); return; }
    try {
      if (editing) {
        await axios.put(`${import.meta.env.VITE_API_URI}/api/admin/popup-ads/${editing._id}`, form);
        toast.success('Popup ad updated');
      } else {
        await axios.post(`${import.meta.env.VITE_API_URI}/api/admin/popup-ads`, form);
        toast.success('Popup ad created');
      }
      setShowForm(false); setEditing(null); fetchAds();
    } catch { toast.error('Failed to save popup ad'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this popup ad?')) return;
    try { await axios.delete(`${import.meta.env.VITE_API_URI}/api/admin/popup-ads/${id}`); toast.success('Deleted'); fetchAds(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleActive = async (ad) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URI}/api/admin/popup-ads/${ad._id}`, { isActive: !ad.isActive });
      fetchAds();
    } catch { toast.error('Failed to toggle'); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 sm:ml-64">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-200 transition"><FaArrowLeft className="text-gray-700" /></button>
            <h1 className="text-2xl font-bold text-gray-800">Popup Ads</h1>
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"><FaPlus /> Add Popup</button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Popup' : 'New Popup'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" placeholder="Sale! 50% Off" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
                <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" placeholder="https://..." />
                {form.imageUrl && <img src={form.imageUrl} alt="preview" className="mt-2 h-24 rounded border" onError={(e) => e.target.style.display = 'none'} />}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900" placeholder="/products or https://..." />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-gray-300" />
                Active
              </label>
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Save</button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div></div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <p className="text-gray-500 text-lg">No popup ads yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "Add Popup" to create one</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {ads.map((ad) => (
              <div key={ad._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                <img src={ad.imageUrl} alt={ad.title} className="w-20 h-20 object-cover rounded-lg border" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                <div className="w-20 h-20 bg-gray-100 rounded-lg hidden items-center justify-center text-gray-400 text-xs border">No Img</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{ad.title || '(no title)'}</h3>
                  {ad.linkUrl && <p className="text-xs text-blue-500 truncate flex items-center gap-1"><FaExternalLinkAlt size={10} />{ad.linkUrl}</p>}
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${ad.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{ad.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(ad)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700" title="Toggle active">{ad.isActive ? <FaToggleOn size={20} className="text-green-500" /> : <FaToggleOff size={20} />}</button>
                  <button onClick={() => openEdit(ad)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><FaEdit /></button>
                  <button onClick={() => handleDelete(ad._id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><FaTrash /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPopupAds;
