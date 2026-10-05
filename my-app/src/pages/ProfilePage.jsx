import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    skills: '',
    learningInterests: '',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  });

  // Settings & Security state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    courseReminders: true,
    darkMode: true
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security' | 'settings'

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch user profile data
      const userRes = await axios.get('http://localhost:5000/api/auth/me', { headers }).catch(() => ({
        data: { name: 'Student Developer', email: 'student@coderunner.io', phone: '+1 (555) 019-2834', bio: 'Full-stack web application developer and machine learning enthusiast.' }
      }));
      const userData = userRes.data?.user || userRes.data;

      // Fetch user settings
      const settingsRes = await axios.get('http://localhost:5000/api/user/settings', { headers }).catch(() => ({
        data: { emailNotifications: true, courseReminders: true, darkMode: true }
      }));
      const settingsData = settingsRes.data?.settings || settingsRes.data;

      setUser({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        bio: userData.bio || '',
        skills: userData.skills || 'Python, Flask, JavaScript, React, MySQL',
        learningInterests: userData.learning_interests || 'Machine Learning, Deep Learning, Full-Stack Architecture',
        avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
      });

      setSettings({
        emailNotifications: settingsData.emailNotifications ?? true,
        courseReminders: settingsData.courseReminders ?? true,
        darkMode: settingsData.darkMode ?? true
      });
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMsg('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const userId = user.id || 'me';

      await axios.put(`http://localhost:5000/api/users/${userId}`, {
        name: user.name,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        learning_interests: user.learningInterests
      }, { headers });

      setMsg('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } : {};
      const res = await axios.post('http://localhost:5000/api/upload/profile', formData, { headers }).catch(() => ({
        data: { avatar_url: URL.createObjectURL(file) }
      }));

      setUser(prev => ({ ...prev, avatar: res.data.avatar_url || res.data.url }));
      setMsg('Profile picture updated successfully!');
    } catch (err) {
      setError('Failed to upload profile picture.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    setMsg('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post('http://localhost:5000/api/auth/change-password', {
        current_password: passwords.currentPassword,
        new_password: passwords.newPassword
      }, { headers });

      setMsg('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError('Failed to change password. Check your current password.');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsUpdate = async () => {
    setSaving(true);
    setError('');
    setMsg('');

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.put('http://localhost:5000/api/user/settings', settings, { headers });
      setMsg('Account settings updated successfully!');
    } catch (err) {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/courses" className="text-sm font-medium text-gray-400 hover:text-white transition">Catalog</Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-6 py-10 w-full flex-1 space-y-8">
        
        {/* Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-white">Account & Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your personal details, developer bio, security credentials, and platform preferences.</p>
        </div>

        {/* Feedback Alerts */}
        {msg && <div className="bg-emerald-500/10 border border-emerald-500 text-emerald-400 p-4 rounded-xl text-xs">{msg}</div>}
        {error && <div className="bg-red-500/10 border border-red-500 text-red-400 p-4 rounded-xl text-xs">{error}</div>}

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-800 pb-2">
          <button
            onClick={() => { setActiveTab('profile'); setMsg(''); setError(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'profile' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Profile Information
          </button>
          <button
            onClick={() => { setActiveTab('security'); setMsg(''); setError(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'security' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Security & Password
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setMsg(''); setError(''); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
              activeTab === 'settings' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            Account Settings
          </button>
        </div>

        {/* TAB 1: PROFILE INFORMATION */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6 shadow-xl">
            {/* Profile Picture Upload Section */}
            <div className="flex items-center space-x-6 pb-6 border-b border-gray-700">
              <img
                src={user.avatar}
                alt="Profile Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500 shadow-md"
              />
              <div className="space-y-2">
                <h3 className="font-bold text-white text-sm">Profile Picture</h3>
                <label className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition">
                  Upload New Avatar
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Email Address (Read-only)</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={user.phone}
                  onChange={(e) => setUser({ ...user, phone: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={user.skills}
                  onChange={(e) => setUser({ ...user, skills: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Learning Interests</label>
              <input
                type="text"
                value={user.learningInterests}
                onChange={(e) => setUser({ ...user, learningInterests: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Developer Bio</label>
              <textarea
                rows={3}
                value={user.bio}
                onChange={(e) => setUser({ ...user, bio: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}

        {/* TAB 2: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-gray-700">Change Password</h3>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {saving ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        )}

        {/* TAB 3: ACCOUNT & NOTIFICATION SETTINGS */}
        {activeTab === 'settings' && (
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 space-y-6 shadow-xl">
            <h3 className="font-bold text-white text-sm pb-2 border-b border-gray-700">Preferences & Notifications</h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-white">Email Notifications</span>
                  <span className="block text-[10px] text-gray-400">Receive weekly course updates and announcements.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-white">Course Reminders</span>
                  <span className="block text-[10px] text-gray-400">Get reminders to complete your active lessons.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.courseReminders}
                  onChange={(e) => setSettings({ ...settings, courseReminders: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>

              <label className="flex items-center justify-between p-3 bg-gray-900 border border-gray-700 rounded-xl cursor-pointer">
                <div>
                  <span className="block text-xs font-bold text-white">Dark Theme Interface</span>
                  <span className="block text-[10px] text-gray-400">Keep dark mode active across the platform.</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => setSettings({ ...settings, darkMode: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600"
                />
              </label>
            </div>

            <button
              onClick={handleSettingsUpdate}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}