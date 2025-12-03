"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import SuccessModal from "@/components/SuccessModal";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  classDate: string;
}

export default function ClassSignup() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    classDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.classDate) {
      toast.error("Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Failed to load payment gateway");
        setIsLoading(false);
        return;
      }

      // Create order
      const orderResponse = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!orderResponse.ok) {
        const error = await orderResponse.json();
        toast.error(error.error || "Failed to create order");
        setIsLoading(false);
        return;
      }

      const orderData = await orderResponse.json();

      // Razorpay options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Diss That DSA",
        description: "Class Registration Fee",
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (verifyResponse.ok) {
              setShowSuccessModal(true);
              toast.success("Payment successful!");
              // Reset form
              setFormData({
                name: "",
                email: "",
                phone: "",
                classDate: "",
              });
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            toast.error("Payment verification failed");
          } finally {
            setIsLoading(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#dc2626",
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  };

  // Generate class date options (next 7 days)
  const getClassDateOptions = () => {
    const options = [];
    const today = new Date();

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      date.setHours(18, 0, 0, 0); // Set to 6 PM

      const value = date.toISOString();
      const label = date.toLocaleDateString('en-IN', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      options.push({ value, label });
    }

    return options;
  };

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-red-600">
            Join Our DSA Class
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Master Data Structures & Algorithms
          </p>
          <div className="inline-block bg-red-600/20 border-2 border-red-600 rounded-lg px-6 py-3 mt-4">
            <p className="text-3xl font-bold text-red-600">₹29</p>
            <p className="text-sm text-gray-400">One-time payment</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8 shadow-2xl shadow-red-600/50">
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black border border-red-600/50 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black border border-red-600/50 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="your.email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 bg-black border border-red-600/50 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                placeholder="10-digit mobile number"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter 10-digit mobile number without country code
              </p>
            </div>

            {/* Class Date */}
            <div>
              <label htmlFor="classDate" className="block text-sm font-medium mb-2">
                Select Class Date & Time *
              </label>
              <select
                id="classDate"
                name="classDate"
                value={formData.classDate}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-black border border-red-600/50 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
              >
                <option value="">Choose a date...</option>
                {getClassDateOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Important Note */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 text-sm">
                <strong>⚠️ Important:</strong> After successful payment, you will receive a confirmation email. The class link will be sent to your email <strong>15 minutes before</strong> the scheduled time.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
            >
              {isLoading ? "Processing..." : "Pay ₹29 & Register"}
            </button>

            {/* Security Note */}
            <p className="text-xs text-gray-400 text-center">
              Secure payment powered by Razorpay. Your payment information is encrypted and secure.
            </p>
          </form>
        </div>

        {/* Features */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="font-bold text-red-600 mb-1">Expert Teaching</h3>
            <p className="text-sm text-gray-400">Learn from industry professionals</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💻</div>
            <h3 className="font-bold text-red-600 mb-1">Live Session</h3>
            <p className="text-sm text-gray-400">Interactive online class</p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-red-600 mb-1">Practical Focus</h3>
            <p className="text-sm text-gray-400">Real-world problem solving</p>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        name={formData.name}
        email={formData.email}
        classDate={formData.classDate}
      />
    </div>
  );
}
