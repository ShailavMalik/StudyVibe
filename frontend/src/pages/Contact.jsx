/**
 * @fileoverview Contact Page Component
 * Displays a contact form where users can send messages to StudyVibe
 * Sends emails to admin and user confirmation upon submission
 *
 * Features:
 * - Form validation for name, email, and message
 * - Loading state during submission
 * - Success/error notifications
 * - Responsive design with Tailwind CSS
 *
 * @component
 */

import React, { useState } from "react";
import Footer from "../components/Reusable/Footer";
import Sidebar from "../components/Reusable/Sidebar";
import { api } from "../services/api";

/**
 * Contact Component
 * Renders contact form page with email submission functionality
 *
 * @returns {JSX.Element} Contact page with form
 */
const Contact = () => {
  // Form state
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  // UI state
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  /**
   * Handle input field changes
   * Updates form state as user types
   *
   * @param {Event} e - Input change event
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  /**
   * Handle form submission
   * Validates input and sends to backend API
   * Shows success/error messages
   *
   * @param {Event} e - Form submit event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill in all fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (form.message.trim().length < 10) {
      setError("Message must be at least 10 characters long");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Send to backend
      const response = await api.post("/api/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });

      // Show success state
      setSuccessMessage(response.data.message);
      setSubmitted(true);
      setForm({ name: "", email: "", message: "" });

      // Reset form after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
        setSuccessMessage("");
      }, 5000);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Failed to send message. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="flex flex-1">
        <Sidebar />

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Card container */}
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-purple-100">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-10 text-center">
                <h2 className="text-4xl font-bold text-white mb-2">
                  📬 Get In Touch
                </h2>
                <p className="text-blue-100">
                  We'd love to hear from you! Send us your feedback or
                  questions.
                </p>
              </div>

              {/* Form Content */}
              <div className="p-8">
                {
                  submitted ?
                    // Success message
                    <div className="text-center py-8 animate-fade-in">
                      <div className="mb-4 text-5xl animate-bounce">✅</div>
                      <h3 className="text-xl font-bold text-green-600 mb-2">
                        Message Sent Successfully!
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {successMessage ||
                          "Thank you for contacting us. We'll get back to you within 24 hours."}
                      </p>
                      <div className="text-sm text-gray-500">
                        A confirmation email has been sent to{" "}
                        <span className="font-semibold text-gray-700">
                          {form.email}
                        </span>
                      </div>
                    </div>
                    // Contact form
                  : <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Error message */}
                      {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-shake">
                          <span className="text-xl mt-0.5">⚠️</span>
                          <div>
                            <p className="font-semibold text-red-700 text-sm">
                              Error
                            </p>
                            <p className="text-red-600 text-sm">{error}</p>
                          </div>
                        </div>
                      )}

                      {/* Name field */}
                      <div className="form-group">
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200 hover:border-gray-400"
                        />
                      </div>

                      {/* Email field */}
                      <div className="form-group">
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200 hover:border-gray-400"
                        />
                      </div>

                      {/* Message field */}
                      <div className="form-group">
                        <label
                          htmlFor="message"
                          className="block text-sm font-semibold text-gray-700 mb-2">
                          Your Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Tell us what's on your mind... (minimum 10 characters)"
                          rows={5}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200 hover:border-gray-400 resize-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {form.message.length} / 1000 characters
                        </p>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition duration-300 transform hover:scale-105 active:scale-95 ${
                          loading ?
                            "bg-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
                        }`}>
                        {loading ?
                          <span className="flex items-center justify-center gap-2">
                            <svg
                              className="animate-spin h-5 w-5"
                              viewBox="0 0 24 24">
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            Sending...
                          </span>
                        : <span className="flex items-center justify-center gap-2">
                            <span>Send Message</span>
                            <span>📤</span>
                          </span>
                        }
                      </button>

                      {/* Helper text */}
                      <p className="text-xs text-gray-500 text-center mt-4">
                        ✓ We'll respond within 24 hours | ✓ Your email is secure
                      </p>
                    </form>

                }
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;
