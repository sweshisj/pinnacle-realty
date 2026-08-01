import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { motion } from "framer-motion";

interface SellerFormProps {
  navigateTo: (page: any) => void;
}

export function SellerForm({ navigateTo }: SellerFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+61");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            phone: `${countryCode} ${phone}`,
            location,
            type: "seller",
            notes: `Property Type: ${propertyType}. ${notes}`,
            source: "website",
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          "Thank you! Our team will contact you soon to discuss your property.",
        );
        setName("");
        setEmail("");
        setCountryCode("+61");
        setPhone("");
        setLocation("");
        setPropertyType("");
        setNotes("");
      } else {
        const errorData = await response.json();
        toast.error(
          errorData.message ||
            "Failed to submit. Please try again.",
        );
      }
    } catch (error) {
      console.error("Seller form submission error:", error);
      toast.error("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-yellow-50 to-green-50">
      {/* Hero Section */}
      <section className="relative h-96 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200"
            alt="Sell Property"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-orange-900/60 via-yellow-900/60 to-green-900/60"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center text-white px-4"
        >
          <h1 className="mb-4">💼 Sell Your Property</h1>
          <p className="text-xl">
            ✨ Get the best value for your property with Pinnacle Realty
          </p>
        </motion.div>
      </section>

      {/* Form Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-100 hover:border-orange-300 transition-all shadow-lg">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                  1️⃣
                </div>
                <h3 className="text-xl mb-2">Submit Details</h3>
                <p className="text-gray-600">
                  📝 Fill out the form with your property
                  details and contact information.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-yellow-100 hover:border-yellow-300 transition-all shadow-lg">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                  2️⃣
                </div>
                <h3 className="text-xl mb-2">
                  Property Evaluation
                </h3>
                <p className="text-gray-600">
                  💰 Our experts will evaluate your property and
                  provide a fair market valuation.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-100 hover:border-green-300 transition-all shadow-lg">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                  3️⃣
                </div>
                <h3 className="text-xl mb-2">
                  Marketing & Promotion
                </h3>
                <p className="text-gray-600">
                  📢 We'll market your property to our extensive
                  network of potential buyers.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-2 border-blue-100 hover:border-blue-300 transition-all shadow-lg">
              <CardContent className="p-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4 shadow-lg">
                  4️⃣
                </div>
                <h3 className="text-xl mb-2">Close the Deal</h3>
                <p className="text-gray-600">
                  🤝 We handle all paperwork and legal
                  formalities for a smooth transaction.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-100 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
              <CardTitle>📋 Property Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="your.email@example.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      Phone Number *
                    </Label>
                    <div className="flex gap-2">
                      <Select
                        value={countryCode}
                        onValueChange={setCountryCode}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="+61">🇦🇺 +61</SelectItem>
                          <SelectItem value="+64">🇳🇿 +64</SelectItem>
                          <SelectItem value="+44">🇬🇧 +44</SelectItem>
                          <SelectItem value="+1">🇺🇸 +1</SelectItem>
                          <SelectItem value="+65">🇸🇬 +65</SelectItem>
                          <SelectItem value="+91">🇮🇳 +91</SelectItem>
                          <SelectItem value="+971">🇦🇪 +971</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        placeholder="XXXXX XXXXX"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="location">
                      Property Location *
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      required
                      placeholder="City, Area"
                    />
                  </div>

                  <div>
                    <Label htmlFor="propertyType">
                      Property Type *
                    </Label>
                    <Select
                      value={propertyType}
                      onValueChange={setPropertyType}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apartment">
                          Apartment
                        </SelectItem>
                        <SelectItem value="Villa">
                          Villa
                        </SelectItem>
                        <SelectItem value="Plot">
                          Plot
                        </SelectItem>
                        <SelectItem value="Commercial">
                          Commercial
                        </SelectItem>
                        <SelectItem value="Serviced Apartment">
                          Serviced Apartment
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">
                    Additional Details
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Tell us more about your property (size, age, features, expected price, etc.)"
                    rows={5}
                  />
                </div>

                <div className="flex gap-4 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigateTo("home")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Details"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Why Choose Us */}
        <div className="mt-12">
          <h2 className="text-3xl text-center mb-8">
            Why Choose Pinnacle Realty?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">15+</div>
                <h3 className="text-xl mb-2">
                  Years of Experience
                </h3>
                <p className="text-gray-600">
                  Proven track record in real estate
                  transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">500+</div>
                <h3 className="text-xl mb-2">
                  Properties Sold
                </h3>
                <p className="text-gray-600">
                  Successfully closed deals for satisfied
                  sellers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl mb-4">98%</div>
                <h3 className="text-xl mb-2">
                  Satisfaction Rate
                </h3>
                <p className="text-gray-600">
                  Happy sellers recommend us to their friends
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}