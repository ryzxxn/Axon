'use client'
import React, { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axiosInstance from "../utils/axiosInstance";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
  
    try {
      // Login endpoint
      const response = await axiosInstance.post(
        `/api/login`, 
        formData
      );
  
      toast.success('Login successful!');
      setSuccess("Login successful! Redirecting...");
      setFormData({ email: "", password: "" });
      router.push("/home");
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        toast.error(err.response.data.detail);
        setError(err.response.data.detail); // Show error message from the backend
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  return (
    <div className="w-full h-screen bg flex flex-col flex-1 items-center justify-center bg-black">
      <div className="w-full max-w-md bg-transparent rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-white">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-5 text-white ">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 px-4 rounded-md shadow"
          >
            Sign Up
          </button>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}
