import React from 'react';

function LoginForm({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-[#282828] p-6 rounded-lg w-96">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Login</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <form className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 rounded bg-[#3E3E3E] text-white"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 rounded bg-[#3E3E3E] text-white"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-500 text-white py-2 rounded-full hover:bg-green-600"
          >
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
