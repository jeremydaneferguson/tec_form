"use client";

import { useEffect, useState } from "react";
import {
  Users,
  Building2,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  KeyRound,
  RefreshCw,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users"); // "users" | "departments" | "roles"

  // Data states
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Status/Feedback
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  const [searchTerm, setSearchTerm] = useState("");

  // Editing states
  const [editingDeptId, setEditingDeptId] = useState(null);
  const [editDeptForm, setEditDeptForm] = useState({ name: "", code: "", description: "" });

  const [editingRoleId, setEditingRoleId] = useState(null);
  const [editRoleForm, setEditRoleForm] = useState({ name: "", description: "" });

  // Create form states
  const [newUser, setNewUser] = useState({ email: "", role: "", department: "" });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [passwordDrafts, setPasswordDrafts] = useState({});
  const [updatingPasswordId, setUpdatingPasswordId] = useState(null);

  const [newDept, setNewDept] = useState({ name: "", code: "", description: "" });
  const [isCreatingDept, setIsCreatingDept] = useState(false);

  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [isCreatingRole, setIsCreatingRole] = useState(false);

  const notify = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // ----------------------------------------------------
  // Fetch helpers
  // ----------------------------------------------------
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/tec/api/users", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to load users");
      }
    } catch {
      notify("error", "Error connecting to users endpoint");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      setLoadingDepts(true);
      const res = await fetch("/tec/api/departments", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
        if (data.length > 0 && !newUser.department) {
          setNewUser((prev) => ({ ...prev, department: prev.department || data[0].name }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to load departments");
      }
    } catch {
      notify("error", "Error connecting to departments endpoint");
    } finally {
      setLoadingDepts(false);
    }
  };

  const fetchRoles = async () => {
    try {
      setLoadingRoles(true);
      const res = await fetch("/tec/api/roles", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setRoles(data);
        if (data.length > 0 && !newUser.role) {
          setNewUser((prev) => ({ ...prev, role: prev.role || data[0].name }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to load roles");
      }
    } catch {
      notify("error", "Error connecting to roles endpoint");
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
    fetchRoles();
  }, []);

  // ----------------------------------------------------
  // USER Actions
  // ----------------------------------------------------
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.role || !newUser.department) {
      notify("error", "Email, role, and department are required");
      return;
    }

    setIsCreatingUser(true);
    try {
      const res = await fetch("/tec/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        notify("success", `User ${newUser.email} created successfully`);
        setNewUser({
          email: "",
          role: roles[0]?.name || "requestor",
          department: departments[0]?.name || "",
        });
        await fetchUsers();
        await fetchDepartments();
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to create user");
      }
    } catch {
      notify("error", "Network error creating user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateUser = async (id, field, value) => {
    try {
      const res = await fetch("/tec/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
        notify("success", "User updated");
        await fetchDepartments();
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to update user");
      }
    } catch {
      notify("error", "Network error updating user");
    }
  };

  const handleUpdateUserPassword = async (user) => {
    const password = passwordDrafts[user.id] || "";
    if (password.trim().length < 8) {
      notify("error", "Password must be at least 8 characters");
      return;
    }

    setUpdatingPasswordId(user.id);
    try {
      const res = await fetch("/tec/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, password }),
      });

      if (res.ok) {
        setPasswordDrafts((prev) => {
          const next = { ...prev };
          delete next[user.id];
          return next;
        });
        notify("success", `Password updated for ${user.email}`);
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to update password");
      }
    } catch {
      notify("error", "Network error updating password");
    } finally {
      setUpdatingPasswordId(null);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Are you sure you want to delete user ${user.email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/tec/api/users?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });

      if (res.ok) {
        notify("success", `User ${user.email} removed`);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
        await fetchDepartments();
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to delete user");
      }
    } catch {
      notify("error", "Network error deleting user");
    }
  };

  // ----------------------------------------------------
  // DEPARTMENT Actions
  // ----------------------------------------------------
  const handleCreateDept = async (e) => {
    e.preventDefault();
    if (!newDept.name.trim()) {
      notify("error", "Department name is required");
      return;
    }

    setIsCreatingDept(true);
    try {
      const res = await fetch("/tec/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDept),
      });

      if (res.ok) {
        notify("success", `Department "${newDept.name}" created`);
        setNewDept({ name: "", code: "", description: "" });
        await fetchDepartments();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to create department");
      }
    } catch {
      notify("error", "Network error creating department");
    } finally {
      setIsCreatingDept(false);
    }
  };

  const handleStartEditDept = (dept) => {
    setEditingDeptId(dept.id);
    setEditDeptForm({
      name: dept.name,
      code: dept.code || "",
      description: dept.description || "",
    });
  };

  const handleSaveEditDept = async (id) => {
    try {
      const res = await fetch(`/tec/api/departments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDeptForm),
      });

      if (res.ok) {
        notify("success", "Department updated");
        setEditingDeptId(null);
        await fetchDepartments();
        await fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to update department");
      }
    } catch {
      notify("error", "Network error updating department");
    }
  };

  const handleDeleteDept = async (dept) => {
    if (dept.userCount > 0) {
      notify(
        "error",
        `Cannot delete "${dept.name}" because ${dept.userCount} user(s) are assigned to it.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete department "${dept.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/tec/api/departments/${dept.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        notify("success", `Department "${dept.name}" deleted`);
        await fetchDepartments();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to delete department");
      }
    } catch {
      notify("error", "Network error deleting department");
    }
  };

  // ----------------------------------------------------
  // ROLE Actions
  // ----------------------------------------------------
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.name.trim()) {
      notify("error", "Role name is required");
      return;
    }

    setIsCreatingRole(true);
    try {
      const res = await fetch("/tec/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });

      if (res.ok) {
        notify("success", `Role "${newRole.name}" created`);
        setNewRole({ name: "", description: "" });
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to create role");
      }
    } catch {
      notify("error", "Network error creating role");
    } finally {
      setIsCreatingRole(false);
    }
  };

  const handleStartEditRole = (role) => {
    setEditingRoleId(role.id);
    setEditRoleForm({
      name: role.name,
      description: role.description || "",
    });
  };

  const handleSaveEditRole = async (id) => {
    try {
      const res = await fetch(`/tec/api/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editRoleForm),
      });

      if (res.ok) {
        notify("success", "Role updated");
        setEditingRoleId(null);
        await fetchRoles();
        await fetchUsers();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to update role");
      }
    } catch {
      notify("error", "Network error updating role");
    }
  };

  const handleDeleteRole = async (role) => {
    const isProtected = ["admin", "requestor", "approver"].includes(role.name);
    if (isProtected) {
      notify("error", `System role "${role.name}" cannot be deleted`);
      return;
    }

    if (role.userCount > 0) {
      notify(
        "error",
        `Cannot delete "${role.name}" because ${role.userCount} user(s) are assigned to it.`
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/tec/api/roles/${role.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        notify("success", `Role "${role.name}" deleted`);
        await fetchRoles();
      } else {
        const err = await res.json().catch(() => ({}));
        notify("error", err.error || "Failed to delete role");
      }
    } catch {
      notify("error", "Network error deleting role");
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.role && u.role.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q))
    );
  });

  const filteredDepts = departments.filter((d) => {
    const q = searchTerm.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code && d.code.toLowerCase().includes(q)) ||
      (d.description && d.description.toLowerCase().includes(q))
    );
  });

  const filteredRoles = roles.filter((r) => {
    const q = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#d9d5cd] bg-white p-6 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fbebe9] px-3 py-1 text-xs font-semibold text-[#991b1e]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Administration Center
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#1f2a44]">
            Access & Organization Management
          </h1>
          <p className="mt-1 text-sm text-[#6a7388]">
            Manage user accounts, departmental reviewer classifications, and permission roles.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchUsers();
            fetchDepartments();
            fetchRoles();
            notify("success", "Data refreshed");
          }}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-[#d6d2ca] bg-[#f9f8f6] px-3.5 py-2 text-xs font-semibold text-[#2d3750] shadow-sm hover:border-[#991b1e] hover:text-[#991b1e] transition"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh All
        </button>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 text-sm font-medium shadow-sm transition ${
            statusMessage.type === "success"
              ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]"
              : "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#d8d4cc] pb-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("users");
              setSearchTerm("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "users"
                ? "bg-[#991b1e] text-white shadow-sm"
                : "bg-white text-[#546077] border border-[#d6d2ca] hover:text-[#991b1e] hover:bg-[#faf8f5]"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Users</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "users" ? "bg-white/20 text-white" : "bg-[#efeeea] text-[#6a7388]"
              }`}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("departments");
              setSearchTerm("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "departments"
                ? "bg-[#991b1e] text-white shadow-sm"
                : "bg-white text-[#546077] border border-[#d6d2ca] hover:text-[#991b1e] hover:bg-[#faf8f5]"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Departments</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "departments"
                  ? "bg-white/20 text-white"
                  : "bg-[#efeeea] text-[#6a7388]"
              }`}
            >
              {departments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("roles");
              setSearchTerm("");
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              activeTab === "roles"
                ? "bg-[#991b1e] text-white shadow-sm"
                : "bg-white text-[#546077] border border-[#d6d2ca] hover:text-[#991b1e] hover:bg-[#faf8f5]"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Roles</span>
            <span
              className={`ml-1.5 rounded-full px-2 py-0.5 text-xs ${
                activeTab === "roles" ? "bg-white/20 text-white" : "bg-[#efeeea] text-[#6a7388]"
              }`}
            >
              {roles.length}
            </span>
          </button>
        </div>

        {/* Global Tab Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8d98ab]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="w-full rounded-xl border border-[#d6d2ca] bg-white pl-9 pr-3 py-2 text-xs text-[#1f2a44] placeholder-[#8d98ab] focus:border-[#991b1e] focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
          />
        </div>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: USERS                                         */}
      {/* ==================================================== */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* Create User Card */}
          <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1f2a44] flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-[#991b1e]" />
              Add New User
            </h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="name@uwimona.edu.jm"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                >
                  {roles.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Department
                </label>
                <select
                  value={newUser.department}
                  onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                >
                  {departments.map((d) => (
                    <option key={d.id || d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#991b1e] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#801417] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isCreatingUser ? "Adding..." : "Add User"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="overflow-hidden rounded-2xl border border-[#d9d5cd] bg-white shadow-sm">
            <div className="border-b border-[#ece8e2] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1f2a44]">Active Accounts</h3>
                <p className="text-xs text-[#6a7388]">All registered users and departmental assignments</p>
              </div>
              <span className="text-xs font-semibold text-[#546077]">
                Showing {filteredUsers.length} of {users.length}
              </span>
            </div>

            {loadingUsers ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">
                {searchTerm ? "No users match your search query." : "No users registered yet."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#ece8e2] bg-[#f9f8f6] font-semibold text-[#546077]">
                    <tr>
                      <th className="px-5 py-3">User Email</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Password</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2efe9]">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#fbf9f6] transition">
                        <td className="px-5 py-3.5 font-medium text-[#1f2a44]">{user.email}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={user.role}
                            onChange={(e) => handleUpdateUser(user.id, "role", e.target.value)}
                            className="rounded-lg border border-[#d6d2ca] bg-[#faf8f5] px-2.5 py-1 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:outline-none"
                          >
                            {roles.map((r) => (
                              <option key={r.id || r.name} value={r.name}>
                                {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={user.department || ""}
                            onChange={(e) =>
                              handleUpdateUser(user.id, "department", e.target.value)
                            }
                            className="rounded-lg border border-[#d6d2ca] bg-[#faf8f5] px-2.5 py-1 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:outline-none max-w-xs"
                          >
                            {departments.map((d) => (
                              <option key={d.id || d.name} value={d.name}>
                                {d.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex min-w-[220px] items-center gap-2">
                            <input
                              type="password"
                              value={passwordDrafts[user.id] || ""}
                              onChange={(e) =>
                                setPasswordDrafts((prev) => ({
                                  ...prev,
                                  [user.id]: e.target.value,
                                }))
                              }
                              placeholder="New password"
                              className="w-36 rounded-lg border border-[#d6d2ca] bg-[#faf8f5] px-2.5 py-1 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateUserPassword(user)}
                              disabled={updatingPasswordId === user.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#d6d2ca] bg-white px-2.5 py-1 text-xs font-semibold text-[#2d3750] transition hover:border-[#991b1e] hover:text-[#991b1e] disabled:cursor-not-allowed disabled:opacity-50"
                              title="Update password"
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                              {updatingPasswordId === user.id ? "Saving" : "Update"}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user)}
                            className="inline-flex items-center gap-1 rounded-lg border border-transparent p-1.5 text-[#8d98ab] hover:border-[#fecaca] hover:bg-[#fef2f2] hover:text-[#991b1e] transition"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: DEPARTMENTS                                   */}
      {/* ==================================================== */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          {/* Create Department Card */}
          <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1f2a44] flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-[#991b1e]" />
              Add New Department
            </h3>
            <form onSubmit={handleCreateDept} className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={newDept.name}
                  onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                  placeholder="e.g. Health & Wellness"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Code / Slug (Optional)
                </label>
                <input
                  type="text"
                  value={newDept.code}
                  onChange={(e) => setNewDept({ ...newDept, code: e.target.value })}
                  placeholder="e.g. health_wellness"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newDept.description}
                  onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                  placeholder="Brief summary of review area"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingDept}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#991b1e] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#801417] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isCreatingDept ? "Creating..." : "Add Department"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Departments Table */}
          <div className="overflow-hidden rounded-2xl border border-[#d9d5cd] bg-white shadow-sm">
            <div className="border-b border-[#ece8e2] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1f2a44]">Reviewing Departments</h3>
                <p className="text-xs text-[#6a7388]">
                  Defined committee departments with active assigned user counts
                </p>
              </div>
              <span className="text-xs font-semibold text-[#546077]">
                Showing {filteredDepts.length} of {departments.length}
              </span>
            </div>

            {loadingDepts ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">Loading departments...</div>
            ) : filteredDepts.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">
                {searchTerm
                  ? "No departments match your search query."
                  : "No departments defined."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#ece8e2] bg-[#f9f8f6] font-semibold text-[#546077]">
                    <tr>
                      <th className="px-5 py-3">Department Name</th>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Assigned Users</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2efe9]">
                    {filteredDepts.map((dept) => {
                      const isEditing = editingDeptId === dept.id;

                      return (
                        <tr key={dept.id} className="hover:bg-[#fbf9f6] transition">
                          <td className="px-5 py-3.5 font-semibold text-[#1f2a44]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDeptForm.name}
                                onChange={(e) =>
                                  setEditDeptForm({ ...editDeptForm, name: e.target.value })
                                }
                                className="w-full rounded-lg border border-[#991b1e] bg-white px-2 py-1 text-xs focus:outline-none"
                              />
                            ) : (
                              dept.name
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-[11px] text-[#546077]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDeptForm.code}
                                onChange={(e) =>
                                  setEditDeptForm({ ...editDeptForm, code: e.target.value })
                                }
                                className="w-full rounded-lg border border-[#d6d2ca] bg-white px-2 py-1 text-xs focus:outline-none"
                              />
                            ) : (
                              dept.code || "-"
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[#546077]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editDeptForm.description}
                                onChange={(e) =>
                                  setEditDeptForm({ ...editDeptForm, description: e.target.value })
                                }
                                className="w-full rounded-lg border border-[#d6d2ca] bg-white px-2 py-1 text-xs focus:outline-none"
                              />
                            ) : (
                              dept.description || "-"
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-[#f4f2ed] px-2.5 py-0.5 text-xs font-semibold text-[#2d3750]">
                              {dept.userCount || 0} user(s)
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditDept(dept.id)}
                                  className="inline-flex items-center rounded-lg bg-[#166534] p-1.5 text-white hover:bg-[#14532d] transition"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingDeptId(null)}
                                  className="inline-flex items-center rounded-lg border border-[#d6d2ca] bg-white p-1.5 text-[#546077] hover:bg-[#f5f3ef] transition"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditDept(dept)}
                                  className="inline-flex items-center rounded-lg border border-transparent p-1.5 text-[#8d98ab] hover:border-[#d6d2ca] hover:bg-[#f5f3ef] hover:text-[#1f2a44] transition"
                                  title="Edit Department"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDept(dept)}
                                  disabled={dept.userCount > 0}
                                  className="inline-flex items-center rounded-lg border border-transparent p-1.5 text-[#8d98ab] hover:border-[#fecaca] hover:bg-[#fef2f2] hover:text-[#991b1e] transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-[#8d98ab]"
                                  title={
                                    dept.userCount > 0
                                      ? "Cannot delete: users are assigned"
                                      : "Delete Department"
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ROLES                                         */}
      {/* ==================================================== */}
      {activeTab === "roles" && (
        <div className="space-y-6">
          {/* Create Role Card */}
          <div className="rounded-2xl border border-[#d9d5cd] bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#1f2a44] flex items-center gap-2 mb-4">
              <Plus className="h-4 w-4 text-[#991b1e]" />
              Add Custom Role
            </h3>
            <form onSubmit={handleCreateRole} className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g. auditor"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#546077] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="What permissions or access does this role represent?"
                  className="w-full rounded-xl border border-[#d6d2ca] bg-[#faf8f5] px-3 py-2 text-xs text-[#1f2a44] focus:border-[#991b1e] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#991b1e]"
                />
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingRole}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#991b1e] px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-[#801417] disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isCreatingRole ? "Creating..." : "Add Role"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Roles Table */}
          <div className="overflow-hidden rounded-2xl border border-[#d9d5cd] bg-white shadow-sm">
            <div className="border-b border-[#ece8e2] px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1f2a44]">System & Custom Roles</h3>
                <p className="text-xs text-[#6a7388]">
                  Core authorization roles (requestor, approver, admin) and custom roles
                </p>
              </div>
              <span className="text-xs font-semibold text-[#546077]">
                Showing {filteredRoles.length} of {roles.length}
              </span>
            </div>

            {loadingRoles ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">Loading roles...</div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6a7388]">
                {searchTerm ? "No roles match your search query." : "No roles found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#ece8e2] bg-[#f9f8f6] font-semibold text-[#546077]">
                    <tr>
                      <th className="px-5 py-3">Role Identifier</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Description</th>
                      <th className="px-5 py-3">Assigned Users</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f2efe9]">
                    {filteredRoles.map((role) => {
                      const isEditing = editingRoleId === role.id;
                      const isSystemRole = ["admin", "requestor", "approver"].includes(role.name);

                      return (
                        <tr key={role.id} className="hover:bg-[#fbf9f6] transition">
                          <td className="px-5 py-3.5 font-semibold text-[#1f2a44]">
                            {isEditing && !isSystemRole ? (
                              <input
                                type="text"
                                value={editRoleForm.name}
                                onChange={(e) =>
                                  setEditRoleForm({ ...editRoleForm, name: e.target.value })
                                }
                                className="w-full rounded-lg border border-[#991b1e] bg-white px-2 py-1 text-xs focus:outline-none"
                              />
                            ) : (
                              <span className="font-mono text-[12px]">
                                {role.name}
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            {isSystemRole ? (
                              <span className="inline-flex items-center rounded-full bg-[#fbebe9] px-2.5 py-0.5 text-[11px] font-semibold text-[#991b1e]">
                                System Core
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-[#f4f2ed] px-2.5 py-0.5 text-[11px] font-semibold text-[#546077]">
                                Custom
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-[#546077]">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editRoleForm.description}
                                onChange={(e) =>
                                  setEditRoleForm({
                                    ...editRoleForm,
                                    description: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-[#d6d2ca] bg-white px-2 py-1 text-xs focus:outline-none"
                              />
                            ) : (
                              role.description || "-"
                            )}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-[#f4f2ed] px-2.5 py-0.5 text-xs font-semibold text-[#2d3750]">
                              {role.userCount || 0} user(s)
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditRole(role.id)}
                                  className="inline-flex items-center rounded-lg bg-[#166534] p-1.5 text-white hover:bg-[#14532d] transition"
                                  title="Save"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingRoleId(null)}
                                  className="inline-flex items-center rounded-lg border border-[#d6d2ca] bg-white p-1.5 text-[#546077] hover:bg-[#f5f3ef] transition"
                                  title="Cancel"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStartEditRole(role)}
                                  className="inline-flex items-center rounded-lg border border-transparent p-1.5 text-[#8d98ab] hover:border-[#d6d2ca] hover:bg-[#f5f3ef] hover:text-[#1f2a44] transition"
                                  title="Edit Role"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRole(role)}
                                  disabled={isSystemRole || role.userCount > 0}
                                  className="inline-flex items-center rounded-lg border border-transparent p-1.5 text-[#8d98ab] hover:border-[#fecaca] hover:bg-[#fef2f2] hover:text-[#991b1e] transition disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:text-[#8d98ab]"
                                  title={
                                    isSystemRole
                                      ? "System role cannot be deleted"
                                      : role.userCount > 0
                                      ? "Cannot delete: users are assigned"
                                      : "Delete Role"
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
