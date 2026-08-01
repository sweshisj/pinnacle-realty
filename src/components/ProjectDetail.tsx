import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  MapPin,
  Home,
  Calendar,
  Maximize2,
  FileText,
  Download,
  X,
} from "lucide-react";
import {
  projectId as supabaseProjectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";
import { LocationDisplay } from "./LocationDisplay";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string;
  location: string;
  description: string;
  totalPrice: number;
  pricePerSqFt?: number;
  priceNegotiable?: boolean;
  bhk: string[];
  area: string;
  possession: string;
  rera: string;
  amenities: string[] | string;
  images: string[];
  nearbyPOIs: Array<{
    name: string;
    distance: string;
    type: string;
  }>;
  coordinates: { lat: number; lng: number };
  mapAddress?: string;
  brochureUrl: string;
  badges: string[];
}

interface ProjectDetailProps {
  projectId: string;
  navigateTo: (page: any) => void;
}

export function ProjectDetail({
  projectId,
  navigateTo,
}: ProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [enquiryOpen, setEnquiryOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+61");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(
          `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch project: ${errorText}`,
          );
        }
        const data = await response.json();
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/clients`,
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
            type: "buyer",
            projectInterested: project?.id,
            location: "NA",
            source: "website",
          }),
        },
      );

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const responseText = await response.text();
      console.log("Server response text:", responseText);

      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        console.error(
          "Response text that failed to parse:",
          responseText,
        );
        toast.error(
          "Server returned invalid response. Please try again.",
        );
        return;
      }

      if (response.ok) {
        console.log("✓ Success response received");
        if (data.isDuplicate) {
          console.log(
            "✓ Duplicate client - project added to existing record",
          );
          toast.success(
            "Your enquiry has been recorded! This project has been added to your interested projects. Our team will contact you soon.",
          );
        } else {
          console.log("✓ New client created");
          toast.success(
            "Enquiry submitted successfully! Our team will contact you soon.",
          );
        }
        setEnquiryOpen(false);
        setName("");
        setEmail("");
        setPhone("");
      } else {
        console.error("❌ Error response:", data);
        if (data.error === "Already submitted an enquiry") {
          toast.error(
            "You have already submitted an enquiry for this project.",
          );
        } else {
          toast.error(
            data.message ||
              data.error ||
              "Failed to submit enquiry. Please try again.",
          );
        }
      }
    } catch (error) {
      console.error("Enquiry submission error:", error);
      toast.error(
        "Failed to submit enquiry. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const handleDownloadBrochure = () => {
    if (!project?.brochureUrl) {
      toast.error("Brochure not available for this project");
      return;
    }

    // Create a temporary anchor element and trigger download
    const link = document.createElement("a");
    link.href = project.brochureUrl;
    link.download = `${project.name}_brochure.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Opening brochure...");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <LoadingSpinner
          message="🏗️ Fetching project details..."
          color="blue"
          theme="projects"
        />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">
            Project not found
          </p>
          <Button onClick={() => navigateTo("projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigateTo("home")}
                className="cursor-pointer"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => navigateTo("projects")}
                className="cursor-pointer"
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>{project.name}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {project.badges.map((badge) => (
              <Badge key={badge} className="bg-green-600">
                {badge}
              </Badge>
            ))}
            <Badge variant="outline">{project.status}</Badge>
          </div>
          <h1 className="text-4xl mb-3">{project.name}</h1>
          <div className="flex items-center text-gray-600 mb-2">
            <MapPin className="h-5 w-5 mr-2" />
            <span className="text-lg">
              {project.location}, {project.city}
            </span>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <ImageWithFallback
                src={project.images[selectedImage]}
                alt={project.name}
                className="w-full h-96 object-cover rounded-lg cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />
            </div>
            <div className="grid grid-cols-3 md:grid-cols-1 gap-4">
              {project.images
                .slice(0, 3)
                .map((image, index) => (
                  <ImageWithFallback
                    key={index}
                    src={image}
                    alt={`${project.name} ${index + 1}`}
                    className={`w-full h-28 object-cover rounded-lg cursor-pointer ${
                      selectedImage === index
                        ? "ring-2 ring-green-600"
                        : ""
                    }`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Type
                    </div>
                    <div className="flex items-center">
                      <Home className="h-4 w-4 mr-1" />
                      {project.type}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Configuration
                    </div>
                    <div>{project.bhk.join(", ")}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Area
                    </div>
                    <div className="flex items-center">
                      <Maximize2 className="h-4 w-4 mr-1" />
                      {project.area}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Possession
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {project.possession}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                {typeof project.amenities === "string" ? (
                  <p className="text-gray-600 leading-relaxed">
                    {project.amenities}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {project.amenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center"
                      >
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-2">
                      Total Price
                    </div>
                    <div className="text-3xl text-green-600">
                      {formatPrice(project.totalPrice)}
                    </div>
                    {project.priceNegotiable && (
                      <div className="text-sm text-blue-600 mt-2">
                        🤝 Negotiable
                      </div>
                    )}
                  </div>
                  {project.pricePerSqFt && project.pricePerSqFt > 0 && (
                    <div>
                      <div className="text-sm text-gray-500 mb-2">
                        Price per Sq.Ft
                      </div>
                      <div className="text-3xl text-green-600">
                        ${project.pricePerSqFt.toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>


            {/* Location - Show if address or coordinates exist */}
            {(project.mapAddress || (project.coordinates && project.coordinates.lat !== 0 && project.coordinates.lng !== 0)) && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <LocationDisplay
                    address={project.mapAddress}
                    coordinates={project.coordinates}
                  />
                </CardContent>
              </Card>
            )}

            {/* Legal Info */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">
                      Approval No.
                    </div>
                    <div>{project.rera}</div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDownloadBrochure}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Brochure
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interested?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => setEnquiryOpen(true)}
                  >
                    Submit Enquiry
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadBrochure}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Brochure
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500 mb-2">
                      Need Help?
                    </div>
                    <div className="text-lg mb-3">
                      Call us at
                    </div>
                    <div className="text-2xl text-green-600 mb-4">
                      +61 400 123 456
                    </div>
                    <div className="text-sm text-gray-500">
                      Mon-Sat: 9 AM - 7 PM
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      >
        <DialogContent className="max-w-4xl">
          <div className="relative">
            <ImageWithFallback
              src={project.images[selectedImage]}
              alt={project.name}
              className="w-full h-auto max-h-[70vh] object-contain"
            />
            <div className="flex justify-center gap-2 mt-4">
              {project.images.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    selectedImage === index
                      ? "bg-green-600"
                      : "bg-gray-300"
                  }`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enquiry Form */}
      <Dialog open={enquiryOpen} onOpenChange={setEnquiryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Enquiry</DialogTitle>
            <DialogDescription>
              Fill in your details and we'll get back to you
              shortly
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEnquiry} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="flex gap-2">
                <Select
                  value={countryCode}
                  onValueChange={setCountryCode}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="+61">🇦🇺 +61</SelectItem>
                    <SelectItem value="+64">🇳🇿 +64</SelectItem>
                    <SelectItem value="+1">🇺🇸 +1</SelectItem>
                    <SelectItem value="+44">🇬🇧 +44</SelectItem>
                    <SelectItem value="+971">
                      🇦🇪 +971
                    </SelectItem>
                    <SelectItem value="+65">🇸🇬 +65</SelectItem>
                    <SelectItem value="+91">🇮🇳 +91</SelectItem>
                    <SelectItem value="+86">🇨🇳 +86</SelectItem>
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

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnquiryOpen(false)}
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
                  : "Submit Enquiry"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}