import React, { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = (name, value) => {
    let errorMsg = '';
    if (name === 'name') {
      if (value.trim().length < 3) errorMsg = 'Name must be at least 3 characters.';
    }
    if (name === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+.[^\s@]+$/;
        const isValidEmail = emailRegex.test(email);
      if (!emailRegex.test(value)) errorMsg = 'Please enter a valid email address.';
    }
    if (name === 'message') {
      if (value.trim().length < 10) errorMsg = 'Message must be at least 10 characters.';
    }
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    validate(name, value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const hasErrors = Object.values(errors).some(err => err !== '') || 
                      Object.values(formData).some(val => val === '');
                      
    if (hasErrors) {
      alert("Please fix the validation flags before submitting.");
      return;
    }

    setSubmitted(true);
    setFormData({ name: '', email: '', message: '' });
  };

  return (
    <div className="max-w-md mx-auto w-full">
      <h2 className="text-3xl font-bold mb-6 text-center">Contact Portal</h2>
      {submitted && (
        <div className="p-4 mb-6 bg-green-100 text-green-800 rounded-lg text-center">
          Message sent successfully!
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-center">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-center"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1 text-center">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-center">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-center"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1 text-center">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-center">Message</label>
          <textarea
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-center"
          />
          {errors.message && <p className="text-red-500 text-xs mt-1 text-center">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
        >
          Submit Safely
        </button>
      </form>
    </div>
  );
}