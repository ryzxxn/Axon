'use client'
import React, { useEffect, useState } from "react";
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

  useEffect(() =>{
    toast('login failed')
  },[error])

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
      router.push("/dashboard");
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
    <div className="w-full h-screen bg flex flex-col flex-1 items-center justify-center">
      <div className="w-full max-w-md rounded-lg shadow-lg p-8 bg-[rgb(255,255,255,.4)] border ">
        <h1 className="text-2xl font-bold text-center text-[#F78787]">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-5 text-gray-600 ">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 outline-none text-black"
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
            className="w-full bg-[#F78787] text-white py-2 px-4 rounded-md shadow border"
          >
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}
