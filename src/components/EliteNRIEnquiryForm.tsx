import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { createNRIEnquiry } from "../utils/supabase/nriOperations";

export function EliteNRIEnquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    currentLocation: "",
    investmentCity: "",
    investmentBudget: "",
    propertyType: "",
    timeline: "",
    purpose: "",
    requirements: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    setIsSubmitting(true);

    try {
      await createNRIEnquiry({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        current_location: formData.currentLocation || null,
        investment_city: formData.investmentCity || null,
        investment_budget: formData.investmentBudget || null,
        property_type: formData.propertyType || null,
        timeline: formData.timeline || null,
        purpose: formData.purpose || null,
        requirements: formData.requirements || null,
        source: "website",
        status: "new",
        priority: "medium"
      });

      toast.success("✨ Thank you for your enquiry! Our NRI team will contact you shortly.");
      setFormData({
        name: "",
        email: "",
        phone: "",
        currentLocation: "",
        investmentCity: "",
        investmentBudget: "",
        propertyType: "",
        timeline: "",
        purpose: "",
        requirements: "",
      });
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit your enquiry. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-4xl mx-auto"
    >
      <Card className="border-2 border-amber-200 shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
          <CardTitle className="text-3xl text-center bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            NRI Investment Enquiry
          </CardTitle>
          <CardDescription className="text-center text-lg">
            Let us help you build your legacy in Australia. Fill out the form below and our dedicated NRI relationship manager will contact you.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="border-b pb-2">Personal Information</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="required">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+61-400-123-456 or +1-555-0123"
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="currentLocation">Current Location</Label>
                  <Input
                    type="text"
                    id="currentLocation"
                    name="currentLocation"
                    value={formData.currentLocation}
                    onChange={handleInputChange}
                    placeholder="e.g., San Francisco, USA"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Investment Details */}
            <div className="space-y-4">
              <h3 className="border-b pb-2">Investment Details</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="investmentCity">Investment City in Australia</Label>
                  <Input
                    type="text"
                    id="investmentCity"
                    name="investmentCity"
                    value={formData.investmentCity}
                    onChange={handleInputChange}
                    placeholder="e.g., Sydney, Melbourne"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="investmentBudget">Investment Budget</Label>
                  <Select
                    value={formData.investmentBudget}
                    onValueChange={(value) => handleSelectChange("investmentBudget", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Below $500K">Below $500K</SelectItem>
                      <SelectItem value="$500K - $1M">$500K - $1M</SelectItem>
                      <SelectItem value="$1M - $2M">$1M - $2M</SelectItem>
                      <SelectItem value="$2M - $3M">$2M - $3M</SelectItem>
                      <SelectItem value="$3M - $5M">$3M - $5M</SelectItem>
                      <SelectItem value="Above $5M">Above $5M</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="propertyType">Property Type</Label>
                  <Select
                    value={formData.propertyType}
                    onValueChange={(value) => handleSelectChange("propertyType", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential - Apartment">Residential - Apartment</SelectItem>
                      <SelectItem value="Residential - Villa">Residential - Villa</SelectItem>
                      <SelectItem value="Residential - Plot">Residential - Plot</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Agricultural Land">Agricultural Land</SelectItem>
                      <SelectItem value="Serviced Apartment">Serviced Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeline">Investment Timeline</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) => handleSelectChange("timeline", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="When are you planning to invest?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Immediate (Within 1 month)">Immediate (Within 1 month)</SelectItem>
                      <SelectItem value="1-3 months">1-3 months</SelectItem>
                      <SelectItem value="3-6 months">3-6 months</SelectItem>
                      <SelectItem value="6-12 months">6-12 months</SelectItem>
                      <SelectItem value="Just exploring">Just exploring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="purpose">Investment Purpose</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => handleSelectChange("purpose", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="What's your investment purpose?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Investment">Investment / ROI</SelectItem>
                    <SelectItem value="Retirement Home">Retirement Home</SelectItem>
                    <SelectItem value="Second Home">Second Home / Vacation Home</SelectItem>
                    <SelectItem value="Family Residence">Family Residence</SelectItem>
                    <SelectItem value="Rental Income">Rental Income</SelectItem>
                    <SelectItem value="Multiple Purposes">Multiple Purposes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="border-b pb-2">Additional Information</h3>
              
              <div>
                <Label htmlFor="requirements">Your Requirements / Questions</Label>
                <Textarea
                  id="requirements"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleInputChange}
                  placeholder="Tell us about your specific requirements, preferences, or any questions you have..."
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-center pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-12"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Submit Enquiry
                  </>
                )}
              </Button>
            </div>

            <p className="text-sm text-center text-gray-500 pt-4">
              Your information is secure with us. We'll only use it to contact you regarding your property investment enquiry.
            </p>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}