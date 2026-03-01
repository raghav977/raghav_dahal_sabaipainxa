"use client";

import { useEffect, useState } from "react";
import { getTokenFromLocalStorage, getRefreshTokenFromLocalStorage } from "@/helper/token";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { fetchServices } from "@/app/redux/slices/categorySlice";

const CategoryList = () => {
  const dispatch = useDispatch();
  const { list: categories, loading } = useSelector((state) => state.category);

  // console.log("this si categories",categories);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [editModal, setEditModal] = useState({ open: false, id: null, name: "" });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const API_BASE = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/service`;

  useEffect(() => {
    dispatch(fetchServices());
  }, [dispatch]);

  // Edit category
  const handleEditCategory = async () => {
    if (!editModal.name || !editModal.name.trim()) return;
    setSaving(true);
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${API_BASE}/edit/${editModal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
        },
        body: JSON.stringify({ name: editModal.name }),
      });
      const data = await res.json().catch(() => ({}));
      // Some backend responses may be wrapped. Treat success if HTTP ok or payload indicates success
      const okByPayload = data && (data.status === "success" || data.code === 200 || data?.data || data?.updatedService);
      if (!res.ok && !okByPayload) {
        const msg = data?.message || data?.error || res.statusText || `Failed to update category (status ${res.status})`;
        throw new Error(msg);
      }

      // close modal and refresh
      setEditModal({ open: false, id: null, name: "" });
      window.location.reload();
    } catch (err) {
      console.error("Failed to update category:", err);
      alert(err.message || "Failed to update category");
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async () => {
    if (!deleteModal.id) return;
    setDeleting(true);
    try {
      const token = getTokenFromLocalStorage("token");
      const refreshToken = getRefreshTokenFromLocalStorage("refreshToken");
      const res = await fetch(`${API_BASE}/delete/${deleteModal.id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...(refreshToken ? { "x-refresh-token": refreshToken } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      const okByPayload = data && (data.status === "success" || data.code === 200 || data?.data);
      if (!res.ok && !okByPayload) {
        const msg = data?.message || data?.error || res.statusText || `Failed to delete category (status ${res.status})`;
        throw new Error(msg);
      }
      setDeleteModal({ open: false, id: null });
      window.location.reload();
    } catch (err) {
      console.error("Failed to delete category:", err);
      alert(err.message || "Failed to delete category");
    } finally {
      setDeleting(false);
    }
  };

  const filteredCategories = categories .filter((ct) =>
    selectedCategory ? ct.category_id === Number(selectedCategory) : true
  );


  return (
    <div className="border border-green-100 rounded-xl mt-8 bg-white shadow p-6">
      {/* Filter */}
      <div className="flex flex-col md:flex-row items-center gap-5 mb-6">
        <label className="text-lg font-semibold text-green-700">Search for Category</label>
        <select
          className="border border-green-200 p-2 rounded-xl text-lg focus:ring-2 focus:ring-green-400"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">Select Category</option>
          {categories.map((ct) => (
            <option key={ct.category_id} value={ct.category_id}>
              {ct.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category Table */}
      <table className="w-full border-collapse border border-gray-200">
        <thead>
          <tr className="bg-green-50">
            <th className="border border-gray-200 p-2">Id</th>
            <th className="border border-gray-200 p-2">Name</th>
            <th className="border border-gray-200 p-2">Total Person</th>
            <th className="border border-gray-200 p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.length > 0 ? (
            filteredCategories.map((ct) => (
              <tr key={ct.category_id}>
                <td className="border border-gray-200 p-2">{ct.category_id}</td>
                <td className="border border-gray-200 p-2">{ct.name}</td>
                <td className="border border-gray-200 p-2">{ct.total_person}</td>
                <td className="border border-gray-200 p-2 flex gap-3 justify-center">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    onClick={() => setEditModal({ open: true, id: ct.category_id, name: ct.name })}
                  >
                    <FaEdit /> Edit
                  </button>
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg flex items-center gap-1"
                    onClick={() => setDeleteModal({ open: true, id: ct.category_id })}
                  >
                    <FaTrash /> Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" className="text-center p-4 text-gray-500">
                {loading ? "Loading..." : "No categories found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-green-200">
            <h2 className="text-xl font-bold text-green-700 mb-4">Edit Category</h2>
            <input
              type="text"
              className="w-full border border-green-200 rounded-lg p-2 mb-4 focus:ring-2 focus:ring-green-400"
              value={editModal.name}
              onChange={(e) => setEditModal((prev) => ({ ...prev, name: e.target.value }))}
            />
            <div className="flex justify-end gap-3">
              <button className="px-4 py-2 bg-gray-200 rounded-lg font-medium" onClick={() => setEditModal({ open: false, id: null, name: "" })}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                onClick={handleEditCategory}
                      disabled={saving || !editModal.name.trim()}
              >
                      {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-green-200">
            <h2 className="text-xl font-bold text-red-600 mb-4">Delete Category</h2>
            <p className="mb-6 text-green-700">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-200 rounded-lg font-medium"
                onClick={() => setDeleteModal({ open: false, id: null })}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium"
                onClick={handleDeleteCategory}
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryList;
