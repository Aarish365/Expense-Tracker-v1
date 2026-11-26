import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Moon, Save, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { userService } from '../services/userService';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/date';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    openingBalance: user?.openingBalance ?? 0,
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        openingBalance: user.openingBalance ?? 0,
      });
    }
  }, [user]);

  const handleProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const response = await userService.updateProfile({
        name: profile.name,
        email: profile.email,
        openingBalance: Number(profile.openingBalance) || 0,
      });
      updateUser(response.data.user);
      showToast('Profile updated');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    setSavingPassword(true);
    try {
      await userService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">Profile & Settings</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile form */}
        <div className="card p-5 sm:p-6 lg:col-span-2">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Personal details</h3>
              <p className="text-xs text-slate-400">Update your name, email and opening balance</p>
            </div>
          </div>

          <form onSubmit={handleProfile} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="profile-name">Full name</label>
                <input
                  id="profile-name"
                  className="input"
                  value={profile.name}
                  onChange={(event) => setProfile({ ...profile, name: event.target.value })}
                  minLength={2}
                  required
                />
              </div>
              <div>
                <label className="label" htmlFor="profile-email">Email address</label>
                <input
                  id="profile-email"
                  type="email"
                  className="input"
                  value={profile.email}
                  onChange={(event) => setProfile({ ...profile, email: event.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="opening-balance">Opening balance (₹)</label>
              <input
                id="opening-balance"
                type="number"
                min="0"
                className="input"
                value={profile.openingBalance}
                onChange={(event) => setProfile({ ...profile, openingBalance: event.target.value })}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Starting money you had before tracking. Total balance = opening balance + income − expenses.
              </p>
            </div>
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        {/* Account summary */}
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white">Account</h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Member since</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {user?.createdAt ? formatDate(user.createdAt) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500 dark:text-slate-400">Opening balance</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-200">
                {formatCurrency(user?.openingBalance || 0)}
              </dd>
            </div>
          </dl>
          <button type="button" onClick={handleLogout} className="btn-secondary mt-6 w-full">
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Change password */}
        <div className="card p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">Change password</h3>
              <p className="text-xs text-slate-400">Use at least 6 characters</p>
            </div>
          </div>

          <form onSubmit={handlePassword} className="space-y-4">
            <div>
              <label className="label" htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                className="input"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                className="input"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                className="input"
                autoComplete="new-password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords({ ...passwords, confirmPassword: event.target.value })}
                minLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-secondary" disabled={savingPassword}>
              {savingPassword ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* Appearance */}
        <div className="card p-5 sm:p-6">
          <h3 className="font-bold text-slate-900 dark:text-white">Appearance</h3>
          <p className="mt-1 text-xs text-slate-400">Choose the look that suits you.</p>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Dark mode</p>
                <p className="text-xs text-slate-400">Currently {theme} mode</p>
              </div>
            </div>
            <button type="button" onClick={toggleTheme} className="btn-secondary !px-3 !py-2">
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
