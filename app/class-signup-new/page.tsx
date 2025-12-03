"use client";

// Updated class signup page with dynamic live class loading
// Users select from available live classes created by admins

import { useState, useEffect } from "react";
import toast from "react-hot-toast";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  classId: string;
}

interface LiveClass {
  id: string;
  title: string;
  description: string;
  scheduledAt: string;
  duration: number;
  price: number;
  registrationCount: number;
  availableSpots: number | null;
  isFull: boolean;
}

export default function ClassSignup() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    classId: "",
  });
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LiveClass | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);

  // Fetch live classes on mount
  useEffect(() => {
    fetchLiveClasses();
  }, []);

  // Update selected class when classId changes
  useEffect(() => {
    if (formData.classId) {
      const classData = liveClasses.find((c) => c.id === formData.classId);
      setSelectedClass(classData || null);
    } else {
      setSelectedClass(null);
    }
  }, [formData.classId, liveClasses]);

  const fetchLiveClasses = async () => {
    try {
      const response = await fetch("/api/classes/live");
      const data = await response.json();
      setLiveClasses(data.classes || []);
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      toast.error("Failed to load available classes");
    } finally {
      setIsLoadingClasses(false);
    }
  };

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

    if (!formData.name || !formData.email || !formData.phone || !formData.classId) {
      toast.error("Please fill all fields");
      return;
    }

    if (selectedClass?.isFull) {
      toast.error("This class is full");
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
        description: selectedClass?.title || "Class Registration Fee",
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
              toast.success("Payment successful! Check your email for confirmation.");
              // Reset form
              setFormData({
                name: "",
                email: "",
                phone: "",
                classId: "",
              });
              // Refresh classes to update registration count
              fetchLiveClasses();
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

  return (
    <div className="min-h-screen bg-black text-white py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-red-600">
            Join Our DSA Classes
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Master Data Structures & Algorithms
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Registration Form */}
          <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Registration Form</h2>
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
              </div>

              {/* Class Selection */}
              <div>
                <label htmlFor="classId" className="block text-sm font-medium mb-2">
                  Select Class *
                </label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 bg-black border border-red-600/50 rounded-lg focus:outline-none focus:border-red-600 transition-colors"
                >
                  <option value="">Choose a class...</option>
                  {liveClasses.map((classItem) => (
                    <option
                      key={classItem.id}
                      value={classItem.id}
                      disabled={classItem.isFull}
                    >
                      {classItem.title} - {new Date(classItem.scheduledAt).toLocaleDateString('en-IN')}
                      {classItem.isFull ? " (FULL)" : ""}
                    </option>
                  ))}
                </select>
                {isLoadingClasses && (
                  <p className="text-xs text-gray-400 mt-1">Loading classes...</p>
                )}
                {!isLoadingClasses && liveClasses.length === 0 && (
                  <p className="text-xs text-yellow-400 mt-1">No classes available at the moment</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !formData.classId || selectedClass?.isFull}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors duration-200 text-lg"
              >
                {isLoading
                  ? "Processing..."
                  : selectedClass
                  ? `Pay ₹${selectedClass.price} & Register`
                  : "Select a class to continue"}
              </button>
            </form>
          </div>

          {/* Class Details */}
          <div>
            {selectedClass ? (
              <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8">
                <h2 className="text-2xl font-bold text-white mb-4">Class Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-red-600 mb-2">
                      {selectedClass.title}
                    </h3>
                    <p className="text-gray-300 text-sm">{selectedClass.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-red-600/30">
                    <div>
                      <p className="text-gray-400 text-sm">Date & Time</p>
                      <p className="text-white font-medium">
                        {new Date(selectedClass.scheduledAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Duration</p>
                      <p className="text-white font-medium">{selectedClass.duration} minutes</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Price</p>
                      <p className="text-red-600 font-bold text-2xl">₹{selectedClass.price}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Registered</p>
                      <p className="text-white font-medium">
                        {selectedClass.registrationCount}
                        {selectedClass.availableSpots !== null &&
                          ` / ${selectedClass.registrationCount + selectedClass.availableSpots}`}
                      </p>
                    </div>
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mt-6">
                    <p className="text-yellow-400 text-sm">
                      <strong>⚠️ Important:</strong> After successful payment, you will receive a
                      confirmation email. The class link will be sent to your email{" "}
                      <strong>15 minutes before</strong> the scheduled time.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border-2 border-red-600 rounded-lg p-8 text-center">
                <p className="text-gray-400">Select a class to view details</p>
              </div>
            )}

            {/* Available Classes List */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-white mb-4">Available Classes</h2>
              <div className="space-y-3">
                {liveClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    onClick={() => setFormData({ ...formData, classId: classItem.id })}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      formData.classId === classItem.id
                        ? "border-red-600 bg-red-600/10"
                        : "border-gray-700 bg-gray-900 hover:border-red-600/50"
                    } ${classItem.isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{classItem.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(classItem.scheduledAt).toLocaleDateString('en-IN', {
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">₹{classItem.price}</p>
                        {classItem.isFull && (
                          <span className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-1 inline-block">
                            FULL
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
