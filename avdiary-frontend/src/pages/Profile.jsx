import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { User, Camera, Lock, Save } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { authAPI } from '../api';

export default function Profile() {
  const { user, updateUser } = useUser();
  const [name, setName] = useState(user.name || 'Trader');
  const [imagePreview, setImagePreview] = useState(user.image);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch latest profile on mount to be sure context is up‑to‑date
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await authAPI.getProfile();
        if (data.user) {
          updateUser(data.user);
          setName(data.user.name || '');
          setImagePreview(data.user.image);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
      }
    };
    fetchProfile();
  }, []);

  // Compress and resize the selected image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Size limit for the raw file (before compression)
    if (file.size > 15 * 1024 * 1024) {
      toast.error('Image must be less than 15MB');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize to max 300x300 while keeping aspect ratio
        const maxWidth = 300;
        const maxHeight = 300;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality 0.8 – very small size
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImagePreview(compressedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name required');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateProfile({ name: name.trim(), image: imagePreview });
      updateUser({ name: name.trim(), image: imagePreview });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('At least 6 characters');
      return;
    }
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <Toaster position="top-center" toastOptions={{ style: { background: '#111827', color: '#f8fafc', border: '1px solid #1e293b' } }} />
      <h1 className="text-2xl font-bold text-av-text">Profile Settings</h1>

      <form onSubmit={handleUpdateProfile} className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><User size={20} className="text-av-primary" /> Edit Profile</h3>
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">Name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-av" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-av-muted mb-1.5">
            <Camera size={16} className="inline mr-1.5" /> Profile Picture
          </label>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-16 h-16 rounded-full bg-av-bg border-2 border-av-border flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={24} className="text-av-muted" />
                )}
              </div>
            </div>
            <span className="text-xs text-av-muted">Click to upload (max 15MB, will be compressed)</span>
          </div>
          {selectedFile && (
            <p className="text-xs text-av-accent mt-1">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB) → compressed
            </p>
          )}
        </div>
        <button type="submit" disabled={loading} className="btn-av-primary flex items-center gap-2">
          <Save size={18} /> {loading ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <form onSubmit={handleChangePassword} className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2"><Lock size={20} className="text-av-primary" /> Change Password</h3>
        <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input-av" required />
        <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-av" required />
        <input type="password" placeholder="Confirm New Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-av" required />
        <button type="submit" disabled={passwordLoading} className="btn-av-primary flex items-center gap-2">
          <Lock size={18} /> {passwordLoading ? 'Updating…' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}