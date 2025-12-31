import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, X, User, UserPlus, ArrowLeft } from 'lucide-react';

type ModalType = 'none' | 'login' | 'signup' | 'reset';

// Moved outside Auth to prevent re-render on state changes
const Backdrop = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md"
    >
      {children}
    </motion.div>
  </motion.div>
);

// Form Input Component - moved outside to prevent re-creation
interface FormInputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  required?: boolean;
  showToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  showToggle = false,
  showPassword = false,
  onTogglePassword,
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
    <div className="relative">
      <input
        type={showToggle ? (showPassword ? 'text' : 'password') : type}
        required={required}
        minLength={type === 'password' || showToggle ? 6 : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 pr-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        placeholder={placeholder}
      />
      {showToggle && onTogglePassword && (
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white transition-colors"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  </div>
);

const Auth: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [noticeLang, setNoticeLang] = useState<'en' | 'bn'>('bn');
  const navigate = useNavigate();
  const { login, signup, resetPassword } = useAuth();

  // Check for errors in the URL
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorDescription = params.get('error_description');
    if (errorDescription) {
      setError(decodeURIComponent(errorDescription));
      window.history.replaceState({}, '', window.location.hash);
    }
  }, []);

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setResetSent(false);
  };

  const closeModal = () => {
    setActiveModal('none');
    setError('');
    setSuccessMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
      navigate('/');
    } catch (err: any) {
      if (err.message.includes('Account created')) {
        setSuccessMessage(err.message);
      } else {
        setError(err.message || 'Signup failed');
      }
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        {/* Gradient Orbs */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-600/25 to-purple-600/10 blur-[100px]"
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-fuchsia-600/20 to-pink-600/10 blur-[100px]"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] mb-6"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-slate-400">Secure Authentication</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-black mb-4"
            >
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Welcome to </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Ogrogoti</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-500"
            >
              Choose how you'd like to continue
            </motion.p>
          </div>

          {/* Option Cards */}
          <div className="grid gap-3 md:gap-4 grid-cols-2">
            {/* Login Option */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal('login')}
              className="group relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:border-indigo-500/40 transition-all text-left overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-indigo-500/25">
                  <User size={20} className="text-white md:hidden" />
                  <User size={24} className="text-white hidden md:block" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">Already a User?</h3>
                <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Sign in</p>
              </div>
            </motion.button>

            {/* Signup Option */}
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => openModal('signup')}
              className="group relative p-5 md:p-6 rounded-2xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] backdrop-blur-sm hover:border-purple-500/40 transition-all text-left overflow-hidden"
            >
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="relative z-10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-purple-500/25">
                  <UserPlus size={20} className="text-white md:hidden" />
                  <UserPlus size={24} className="text-white hidden md:block" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">New Here?</h3>
                <p className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Create account</p>
              </div>
            </motion.button>
          </div>

          {/* Back to Landing */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center mt-10"
          >
            <button
              onClick={() => navigate('/welcome')}
              className="inline-flex items-center gap-2 text-slate-600 hover:text-white text-sm transition-colors group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </button>
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Login Modal */}
        {activeModal === 'login' && (
          <Backdrop onClose={closeModal}>
            <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <FormInput label="Password" value={password} onChange={setPassword} placeholder="Your password" showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => openModal('reset')}
                    className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>
            </div>
          </Backdrop>
        )}

        {/* Signup Modal */}
        {activeModal === 'signup' && (
          <Backdrop onClose={closeModal}>
            <div className="bg-slate-900/90 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Important Notices */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-5 space-y-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-indigo-300">
                    {noticeLang === 'en' ? '📌 Important Notes:' : '📌 গুরুত্বপূর্ণ তথ্য:'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setNoticeLang(noticeLang === 'en' ? 'bn' : 'en')}
                    className="text-xs px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors font-medium"
                  >
                    {noticeLang === 'en' ? 'বাংলা' : 'English'}
                  </button>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">1.</span>
                    <span>
                      {noticeLang === 'en'
                        ? <>Use an <strong className="text-white">authentic Email ID</strong> to access features like Reset Password, Seamless Login, Magic Login and more.</>
                        : <>পাসওয়ার্ড রিসেট, সহজ লগইন, ম্যাজিক লগইন ইত্যাদি ফিচার ব্যবহার করতে একটি <strong className="text-white">সত্যিকারের ইমেইল আইডি</strong> ব্যবহার করুন।</>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">2.</span>
                    <span>
                      {noticeLang === 'en'
                        ? <>Choose a <strong className="text-white">memorable password</strong> that you can easily recall.</>
                        : <>একটি <strong className="text-white">মনে রাখার মতো পাসওয়ার্ড</strong> বেছে নিন যা সহজে মনে থাকবে।</>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">3.</span>
                    <span>
                      {noticeLang === 'en'
                        ? <>This password is <strong className="text-white">not connected</strong> to your Main Gmail/email password. It's only for this website.</>
                        : <>এই পাসওয়ার্ড আপনার Main Gmail/ইমেইল পাসওয়ার্ডের সাথে <strong className="text-white">সম্পর্কিত নয়</strong>। এটি শুধুমাত্র এই ওয়েবসাইটের জন্য।</>}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">4.</span>
                    <span>
                      {noticeLang === 'en'
                        ? <>A <strong className="text-white">verification link</strong> will be sent to your email to verify that the email exists and belongs to you.</>
                        : <>ইমেইলটি সত্যিই আপনার কিনা এবং এটি বিদ্যমান কিনা যাচাই করতে আপনার ইমেইলে একটি <strong className="text-white">ভেরিফিকেশন লিংক</strong> পাঠানো হবে।</>}
                    </span>
                  </li>
                </ul>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg mb-4 text-sm">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <FormInput label="Email ID" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
                <FormInput label="Password" value={password} onChange={setPassword} placeholder="At least 6 characters" showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />
                <FormInput label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Re-enter your password" showToggle showPassword={showPassword} onTogglePassword={() => setShowPassword(!showPassword)} />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={20} className="animate-spin" />}
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            </div>
          </Backdrop>
        )}

        {/* Reset Password Modal */}
        {activeModal === 'reset' && (
          <Backdrop onClose={closeModal}>
            <div className="bg-slate-900/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Reset Password</h2>
                <button onClick={closeModal} className="text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              {resetSent ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-center">
                  <p className="font-medium">Check your email!</p>
                  <p className="text-sm mt-1 text-emerald-300/70">We've sent a password reset link.</p>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <FormInput label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loading && <Loader2 size={20} className="animate-spin" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <button
                onClick={() => openModal('login')}
                className="w-full mt-4 text-center text-sm text-slate-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            </div>
          </Backdrop>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;