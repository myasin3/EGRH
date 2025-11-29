


import React, { useState, useRef } from 'react';
import { db } from '../services/mockDatabase';
import { User, UserRole, Permission } from '../types';
import { Button } from '../components/ui/Button';
import { Trash2, UserPlus, Shield, Key, Lock, Settings, Eye, EyeOff, Camera, X, Pencil } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const UserManagement: React.FC = () => {
  const { user, hasPermission, refreshProfile, notify } = useAuth(); // Current logged in admin
  const [users, setUsers] = useState<User[]>(db.getUsers());
  const [showForm, setShowForm] = useState(false);
  const [editingPermissionsUser, setEditingPermissionsUser] = useState<User | null>(null);
  
  // Photo Upload State
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [editingPhotoUser, setEditingPhotoUser] = useState<User | null>(null);

  // Password Management State
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Form (Create/Edit)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.WORKER);
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');

  if (!hasPermission('MANAGE_USERS')) {
     return <div className="p-8 text-center text-red-500">Access Denied. You cannot manage users.</div>;
  }

  const handleOpenAddForm = () => {
      setEditingUser(null);
      setName('');
      setEmail('');
      setRole(UserRole.WORKER);
      setJobTitle('');
      setDepartment('');
      setShowForm(true);
  };

  const handleOpenEditForm = (u: User) => {
      setEditingUser(u);
      setName(u.name);
      setEmail(u.email);
      setRole(u.role);
      setJobTitle(u.jobTitle || '');
      setDepartment(u.department || '');
      setShowForm(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingUser) {
        // Update existing user
        const updatedUser: User = {
            ...editingUser,
            name,
            email,
            role,
            jobTitle,
            department
        };
        db.updateUser(updatedUser);
        notify("User profile updated");
    } else {
        // Create new user
        db.addUser({ 
            name, 
            email, 
            role, 
            jobTitle, 
            department, 
            permissions: [] 
        });
        notify("New user account created");
    }

    setUsers([...db.getUsers()]);
    setShowForm(false);
    setEditingUser(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      db.deleteUser(id);
      const updatedList = db.getUsers();
      setUsers([...updatedList]); 
      notify("User deleted");
    }
  };

  const openPasswordModal = (user: User) => {
      setPasswordModalUser(user);
      setNewPassword('');
  };

  const handleSetPassword = () => {
     if (!passwordModalUser) return;
     if (!newPassword.trim()) {
         notify("Password cannot be empty");
         return;
     }
     db.adminSetUserPassword(passwordModalUser.id, newPassword);
     notify(`Password for ${passwordModalUser.name} has been updated.`);
     setUsers([...db.getUsers()]);
     setPasswordModalUser(null);
     setNewPassword('');
  };

  // Logic to toggle individual permissions
  const togglePermission = (perm: Permission) => {
     if (!editingPermissionsUser) return;
     const currentPerms = editingPermissionsUser.permissions || [];
     let newPerms: Permission[];
     
     if (currentPerms.includes(perm)) {
        newPerms = currentPerms.filter(p => p !== perm);
        // Logic: If removing VIEW, also remove MANAGE if dependent
        if (perm.startsWith('VIEW_')) {
            const managePerm = perm.replace('VIEW_', 'MANAGE_') as Permission;
            newPerms = newPerms.filter(p => p !== managePerm);
        }
     } else {
        newPerms = [...currentPerms, perm];
        // Logic: If adding MANAGE, also add VIEW
        if (perm.startsWith('MANAGE_')) {
            const viewPerm = perm.replace('MANAGE_', 'VIEW_') as Permission;
            if (!newPerms.includes(viewPerm)) {
                newPerms.push(viewPerm);
            }
        }
     }
     setEditingPermissionsUser({ ...editingPermissionsUser, permissions: newPerms });
  };

  const savePermissions = () => {
     if (editingPermissionsUser) {
        db.updateUserPermissions(editingPermissionsUser.id, editingPermissionsUser.permissions);
        setUsers([...db.getUsers()]);
        if (user && editingPermissionsUser.id === user.id) {
            refreshProfile();
        }
        notify("Permissions updated");
        setEditingPermissionsUser(null);
     }
  };
  
  // Photo Upload Logic
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && editingPhotoUser) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
              db.updateUserPhoto(editingPhotoUser.id, base64);
              setUsers([...db.getUsers()]);
              setEditingPhotoUser(null); 
              notify("Profile photo updated");
          };
          reader.readAsDataURL(file);
      }
  };
  
  const triggerPhotoUpload = (u: User) => {
      setEditingPhotoUser(u);
      setTimeout(() => photoInputRef.current?.click(), 100);
  };

  const getRoleBadge = (role: UserRole) => {
    switch(role) {
      case UserRole.ADMIN: return 'bg-purple-100 text-purple-800 border-purple-200';
      case UserRole.SUPERVISOR: return 'bg-blue-100 text-blue-800 border-blue-200';
      case UserRole.TECHNICIAN: return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const PERMISSION_GROUPS = [
      { label: 'Inventory', view: 'VIEW_INVENTORY', manage: 'MANAGE_INVENTORY' },
      { label: 'Logistics', view: 'VIEW_LOGISTICS', manage: 'MANAGE_LOGISTICS' },
      { label: 'Visitor Log', view: 'VIEW_VISITORS', manage: 'MANAGE_VISITORS' },
      { label: 'Tasks / Maintenance', view: 'VIEW_TASKS', manage: 'MANAGE_TASKS' },
      { label: 'Daily Logs (General)', view: 'VIEW_LOGS', manage: 'MANAGE_LOGS' },
      { label: 'Daily Logs (Production)', view: 'ACCESS_OPERATIONS_LOGS', manage: null },
      { label: 'Daily Logs (Tech Ops)', view: 'ACCESS_TECH_OPS_LOGS', manage: null },
      { label: 'Edit Historical Records', view: null, manage: 'EDIT_RECORDS' },
      { label: 'Water Level', view: 'VIEW_WATER_LEVEL', manage: null },
      { label: 'Attendance', view: 'VIEW_ATTENDANCE', manage: null },
      { label: 'Machine Status', view: 'VIEW_MACHINES', manage: null },
      { label: 'Finance', view: 'VIEW_FINANCE', manage: null }, 
      { label: 'Performance Analytics', view: 'VIEW_ANALYTICS', manage: null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 text-sm">Create and manage Evergreen Gulf accounts</p>
        </div>
        <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => setShowPasswords(!showPasswords)}>
                {showPasswords ? <EyeOff className="w-4 h-4 mr-2"/> : <Eye className="w-4 h-4 mr-2"/>}
                {showPasswords ? 'Hide Passwords' : 'Show Passwords'}
            </Button>
            <Button onClick={handleOpenAddForm}>
                Add New User <UserPlus className="w-4 h-4 ml-2" />
            </Button>
        </div>
      </div>
      
      <input 
          type="file" 
          ref={photoInputRef} 
          hidden 
          accept="image/*"
          onChange={handlePhotoSelect}
      />

      {/* Permission Editor Modal */}
      {editingPermissionsUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 animate-fade-in">
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Access Control: {editingPermissionsUser.name}</h3>
                 <p className="text-sm text-gray-500 mb-6">Define "Read" (View) vs "Write" (Manage) permissions.</p>
                 
                 <div className="space-y-4 mb-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                     <table className="w-full text-sm">
                         <thead>
                             <tr className="bg-gray-50">
                                 <th className="text-left p-2">Module</th>
                                 <th className="text-center p-2">View Only</th>
                                 <th className="text-center p-2">Edit / Manage</th>
                             </tr>
                         </thead>
                         <tbody>
                             {PERMISSION_GROUPS.map((group) => (
                                 <tr key={group.label} className="border-b border-gray-100 last:border-0">
                                     <td className="p-3 font-medium text-gray-700">{group.label}</td>
                                     <td className="p-3 text-center">
                                         {group.view && (
                                            <input 
                                                type="checkbox" 
                                                className="h-5 w-5 text-blue-600 rounded border-gray-300"
                                                checked={editingPermissionsUser.permissions.includes(group.view as Permission)}
                                                onChange={() => togglePermission(group.view as Permission)}
                                            />
                                         )}
                                     </td>
                                     <td className="p-3 text-center">
                                         {group.manage && (
                                            <input 
                                                type="checkbox" 
                                                className="h-5 w-5 text-green-600 rounded border-gray-300"
                                                checked={editingPermissionsUser.permissions.includes(group.manage as Permission)}
                                                onChange={() => togglePermission(group.manage as Permission)}
                                            />
                                         )}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                     
                     <div className="mt-4 pt-4 border-t border-gray-100">
                         <p className="text-xs font-bold text-gray-400 uppercase mb-2">Architect / Admin Only</p>
                         <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                             <input 
                                type="checkbox" 
                                className="h-4 w-4 text-purple-600"
                                checked={editingPermissionsUser.permissions.includes('MANAGE_USERS')}
                                onChange={() => togglePermission('MANAGE_USERS')}
                             />
                             <span>Manage Users</span>
                         </label>
                         <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                             <input 
                                type="checkbox" 
                                className="h-4 w-4 text-purple-600"
                                checked={editingPermissionsUser.permissions.includes('MANAGE_SYSTEM')}
                                onChange={() => togglePermission('MANAGE_SYSTEM')}
                             />
                             <span>System Configuration</span>
                         </label>
                     </div>
                 </div>

                 <div className="flex justify-end space-x-3">
                     <Button variant="secondary" onClick={() => setEditingPermissionsUser(null)}>Cancel</Button>
                     <Button onClick={savePermissions}>Save Access Levels</Button>
                 </div>
             </div>
         </div>
      )}

      {/* Set Password Modal */}
      {passwordModalUser && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
             <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 m-4 animate-fade-in">
                 <div className="flex items-center space-x-3 mb-4 text-green-700">
                     <Key className="w-6 h-6" />
                     <h3 className="text-lg font-bold">Change Password</h3>
                 </div>
                 <p className="text-sm text-gray-600 mb-4">
                     Set a new password for <span className="font-bold text-gray-900">{passwordModalUser.name}</span>.
                 </p>
                 
                 <input 
                    type="text" 
                    placeholder="Enter new password"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-6"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus
                 />
                 
                 <div className="flex justify-end space-x-3">
                     <Button variant="secondary" onClick={() => setPasswordModalUser(null)}>Cancel</Button>
                     <Button onClick={handleSetPassword}>Update Password</Button>
                 </div>
             </div>
         </div>
      )}

      {/* Main Create/Edit User Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6 animate-scale-in">
          <h3 className="text-lg font-bold text-gray-900 mb-4">{editingUser ? 'Edit User Profile' : 'Create New User'}</h3>
          <form onSubmit={handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={role}
                  onChange={e => setRole(e.target.value as UserRole)}
                >
                    <option value={UserRole.ADMIN}>Admin / Management</option>
                    <option value={UserRole.SUPERVISOR}>Supervisor</option>
                    <option value={UserRole.TECHNICIAN}>Technician / IT</option>
                    <option value={UserRole.WORKER}>General Worker</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                />
            </div>
            
            <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
                <Button variant="secondary" onClick={() => setShowForm(false)} type="button">Cancel</Button>
                <Button type="submit">Save Profile</Button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role & Access</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {users.map(u => (
                        <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    <div className="relative group cursor-pointer" onClick={() => triggerPhotoUpload(u)}>
                                        {u.photoUrl ? (
                                            <img className="h-10 w-10 rounded-full object-cover border border-gray-200" src={u.photoUrl} alt="" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                                {u.name.charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full transition-all flex items-center justify-center">
                                            <Camera className="w-4 h-4 text-white opacity-0 group-hover:opacity-100"/>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-bold text-gray-900">{u.name}</div>
                                        <div className="text-xs text-gray-500">{u.email}</div>
                                        {showPasswords && (
                                            <div className="text-[10px] text-gray-400 font-mono mt-1">Pass: {u.password}</div>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(u.role)}`}>
                                    {u.role}
                                </span>
                                <div className="mt-1 text-xs text-gray-500">
                                    {/* CRITICAL CHANGE: Only Yasin (u1) can manage permissions */}
                                    {user?.id === 'u1' && (
                                        <button 
                                            onClick={() => setEditingPermissionsUser(u)}
                                            className="text-blue-600 hover:underline flex items-center mt-1"
                                        >
                                            <Shield className="w-3 h-3 mr-1"/> Manage Permissions
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {u.department || '-'}
                                <div className="text-xs text-gray-400">{u.jobTitle}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex justify-end space-x-2">
                                    <button onClick={() => openPasswordModal(u)} className="text-yellow-600 hover:text-yellow-900 p-1 hover:bg-yellow-50 rounded" title="Change Password">
                                        <Lock className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleOpenEditForm(u)} className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded" title="Edit Profile">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {u.id !== 'u1' && (
                                        <button onClick={(e) => handleDelete(u.id, e)} className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded" title="Delete User">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};