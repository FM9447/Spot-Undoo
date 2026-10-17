import { useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';

export default function Login({ onLogin, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock JWT – in a real app you'd call an auth API.
    const mockJwt = btoa(`${email}:${password}`);
    localStorage.setItem('jwt', mockJwt);
    if (onLogin) onLogin();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F4F6F9] max-w-[420px] mx-auto p-4">
      <button onClick={onCancel} className="flex items-center gap-1 text-xs text-gray-600 mb-2">
        <ArrowLeft size={14} /> Back
      </button>
      <h2 className="text-xl font-bold text-center mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-600">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs mb-1 text-gray-600">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg"
        >
          <User size={16} /> Sign In
        </button>
      </form>
    </div>
  );
}
