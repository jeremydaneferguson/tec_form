"use client";
import { useEffect, useState } from "react";

const ROLES = ["requestor", "approver", "admin"];

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users", { cache: "no-store" });
      if (res.ok) {
        setUsers(await res.json());
        setError("");
      } else {
        const payload = await res.json().catch(() => ({}));
        setError(payload.error || "Failed to fetch users");
      }
    } catch (e) {
      setError("Error fetching users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // User creation form state
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState(ROLES[0]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail.trim().toLowerCase(), role: newRole }),
      });
      if (res.ok) {
        await fetchUsers();
        setNewEmail("");
        setNewRole(ROLES[0]);
      } else {
        const err = await res.json();
        setCreateError(err.error || "Failed to create user");
      }
    } catch {
      setCreateError("Error creating user");
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (id, newRole) => {
    try {
      setUpdatingUserId(id);
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.error || "Failed to update user role");
      }
    } catch {
      setError("Error updating user role");
    } finally {
      setUpdatingUserId("");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>

      <form onSubmit={handleCreateUser} className="mb-6 flex gap-4 items-end">
        <div>
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            className="border p-2 rounded w-64"
            placeholder="user@example.com"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Role</label>
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            className="border p-2 rounded"
          >
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          disabled={creating}
        >
          {creating ? "Creating..." : "Add User"}
        </button>
        {createError && <span className="text-red-500 ml-4">{createError}</span>}
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="min-w-full border">
          <thead>
            <tr>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td className="p-2 border">{user.email}</td>
                <td className="p-2 border">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={updatingUserId === user.id}
                    className="capitalize border p-1 rounded"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
