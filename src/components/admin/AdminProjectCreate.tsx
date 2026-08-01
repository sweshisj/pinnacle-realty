import React, { useState, useMemo, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  ArrowLeft,
  Save,
  Sparkles,
  Building2,
  MapPin,
  DollarSign,
  Home,
  Image,
  FileText,
  Ruler,
  Calendar,
  Shield,
  Star,
  Trash2,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "../ui/badge";
import { Checkbox } from "../ui/checkbox";
import { uploadImage } from "../../utils/supabase/uploadImage";
import {
  getAllBuyers,
  type Buyer,
} from "../../utils/supabase/buyerOperations";
import { PropertyLocationPicker } from "../PropertyLocationPicker";
import { StorageSetupBanner } from "./StorageSetupBanner";

interface AdminProjectCreateProps {
  navigateTo: (page: any) => void;
  preFilledData?: {
    propertyName?: string;
    type?: string;
    location?: string;
    city?: string;
    description?: string;
    buyerId?: string;
    leadId?: string;
    leadName?: string;
  };
}

export function AdminProjectCreate({
  navigateTo,
  preFilledData,
}: AdminProjectCreateProps) {
  const [saving, setSaving] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(true);

  // Form fields
  const [name, setName] = useState(
    preFilledData?.propertyName || "",
  );
  const [type, setType] = useState(
    preFilledData?.type || "Apartment",
  );
  const [status, setStatus] = useState("Available");
  const [city, setCity] = useState(preFilledData?.city || "");
  const [location, setLocation] = useState(
    preFilledData?.location || "",
  );
  const [description, setDescription] = useState(
    preFilledData?.description || "",
  );
  const [totalPrice, setTotalPrice] = useState("");
  const [pricePerSqFt, setPricePerSqFt] = useState("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [bhkOptions, setBhkOptions] = useState<string[]>([]);
  const [minArea, setMinArea] = useState("");
  const [maxArea, setMaxArea] = useState("");
  const [possession, setPossession] = useState("");
  const [rera, setRera] = useState("");
  const [amenities, setAmenities] = useState("");
  const [lead, setLead] = useState(
    preFilledData?.leadName || "none",
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [brochureFiles, setBrochureFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>(
    [],
  );
  const [brochurePreviews, setBrochurePreviews] =
    useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Approval checkboxes
  const [cmdaApproved, setCmdaApproved] = useState(false);
  const [dtcpApproved, setDtcpApproved] = useState(false);
  const [panchayatApproved, setPanchayatApproved] =
    useState(false);
  const [pattaApproved, setPattaApproved] = useState(false);
  const [unapproved, setUnapproved] = useState(false);

  // Location map coordinates
  const [latitude, setLatitude] = useState(-37.8136); // Default to Melbourne
  const [longitude, setLongitude] = useState(144.9631);
  const [mapAddress, setMapAddress] = useState("");

  // Load buyers from Supabase on mount
  useEffect(() => {
    const fetchBuyers = async () => {
      setLoadingBuyers(true);
      const result = await getAllBuyers();
      if (result.success && result.data) {
        setBuyers(result.data);
      } else {
        console.error("Error loading buyers:", result.error);
        toast.error(`Failed to load buyers: ${result.error}`);
      }
      setLoadingBuyers(false);
    };

    fetchBuyers();
  }, []);

  // Check if form is valid (using useMemo for performance)
  const isFormValid = useMemo(() => {
    const valid =
      name.trim() !== "" &&
      city.trim() !== "" &&
      location.trim() !== "" &&
      totalPrice.trim() !== "";
    console.log("Form validation:", {
      name: name.trim() !== "",
      city: city.trim() !== "",
      location: location.trim() !== "",
      totalPrice: totalPrice.trim() !== "",
      isValid: valid,
    });
    return valid;
  }, [name, city, location, totalPrice]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);

    // Create preview URLs
    const previews = files.map((file) =>
      URL.createObjectURL(file),
    );
    setImagePreview(previews);
  };

  const handleBrochureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setBrochureFiles(files);

    // Create preview info (just filenames for PDFs)
    const previews = files.map((file) => file.name);
    setBrochurePreviews(previews);
  };

  const handleDeleteBrochure = (index: number) => {
    const newFiles = brochureFiles.filter((_, i) => i !== index);
    const newPreviews = brochurePreviews.filter((_, i) => i !== index);
    setBrochureFiles(newFiles);
    setBrochurePreviews(newPreviews);
    toast.success("Brochure removed");
  };

  const uploadToSupabase = async (
    file: File,
    folder: string,
  ): Promise<string> => {
    try {
      // Use the server endpoint which has service role permissions to bypass RLS
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/upload`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${publicAnonKey}`,
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with status:", response.status, "Error:", errorText);
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleSave = async () => {
    console.log("handleSave called!");
    console.log("Current form values:", {
      name,
      city,
      location,
      totalPrice,
    });

    // Validation
    if (!name || !city || !location || !totalPrice) {
      console.log("Validation failed: missing required fields");
      toast.error("Please fill in all required fields");
      return;
    }

    console.log("All validations passed, starting save...");
    setSaving(true);

    try {
      // Upload images first
      let uploadedImageUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        toast.info("Uploading images...");
        
        try {
          const uploadPromises = imageFiles.map(file => 
            uploadToSupabase(file, "projects")
          );
          uploadedImageUrls = await Promise.all(uploadPromises);
          toast.success(`${uploadedImageUrls.length} image(s) uploaded successfully!`);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Failed to upload images. Please try again.");
          setSaving(false);
          setUploadingImages(false);
          return;
        } finally {
          setUploadingImages(false);
        }
      }

      // Upload brochures
      let uploadedBrochureUrls: string[] = [];
      if (brochureFiles.length > 0) {
        toast.info(`Uploading ${brochureFiles.length} brochure(s)...`);
        
        try {
          const uploadPromises = brochureFiles.map(file => 
            uploadToSupabase(file, "brochures")
          );
          uploadedBrochureUrls = await Promise.all(uploadPromises);
          toast.success(`${uploadedBrochureUrls.length} brochure(s) uploaded successfully!`);
        } catch (uploadError) {
          console.error("Brochure upload failed:", uploadError);
          toast.error("Failed to upload brochures. Please try again.");
          setSaving(false);
          return;
        }
      }

      const projectData: any = {
        name,
        type,
        status,
        city,
        location,
        description,
        totalPrice: parseInt(totalPrice),
        pricePerSqFt: pricePerSqFt
          ? parseInt(pricePerSqFt)
          : null,
        priceNegotiable,
        bhk:
          type === "Plot"
            ? []
            : bhkOptions.map((b) => `${b} BHK`),
        area:
          minArea && maxArea
            ? `${minArea}-${maxArea} sq.ft`
            : "",
        possession,
        rera,
        amenities: amenities.trim() || "",
        images: uploadedImageUrls,
        brochures: uploadedBrochureUrls,
        brochureUrl: uploadedBrochureUrls.length > 0 ? uploadedBrochureUrls[0] : undefined, // Backward compatibility
        badges: [],
        nearbyPOIs: [],
        coordinates: { lat: latitude, lng: longitude },
        mapAddress: mapAddress || "",
        cmdaApproved,
        dtcpApproved,
        panchayatApproved,
        pattaApproved,
        unapproved,
        lead: lead && lead !== "none" ? lead : null,
      };

      console.log("Sending project data:", projectData);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(projectData),
        },
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (response.ok) {
        // If this project was moved from buying projects, mark the lead for removal
        if (preFilledData?.buyerId && preFilledData?.leadId) {
          localStorage.setItem(
            "leadsToRemoveFromBuying",
            JSON.stringify({
              buyerId: preFilledData.buyerId,
              leadId: preFilledData.leadId,
            }),
          );
        }

        toast.success("🎉 Project created successfully!");
        navigateTo("admin-projects");
      } else {
        let errorMessage = "Failed to create project";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        toast.error(errorMessage);
        console.error("Error response:", errorMessage);
      }
    } catch (error) {
      console.error("Create project error:", error);
      toast.error(`Failed to create project: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigateTo("admin-projects")}
              className="border-2 hover:bg-white hover:border-green-400"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                >
                  <Building2 className="h-8 w-8 text-green-600" />
                </motion.div>
                <h1 className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  ✨ Create New Project
                </h1>
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  <Sparkles className="h-6 w-6 text-yellow-500" />
                </motion.div>
              </div>
              <p className="text-gray-600 mt-1">
                🏗️ Add a stunning new real estate project to
                your portfolio
              </p>
            </div>
          </div>
        </motion.div>

        {/* Storage Setup Warning Banner */}
        <StorageSetupBanner />

        <div className="space-y-6">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, type: "spring" }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-green-200 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-300 to-teal-300 rounded-full opacity-10 -mr-16 -mt-16"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <CardHeader className="bg-gradient-to-r from-green-50 via-teal-50 to-green-50 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-white rounded-lg shadow-md">
                    <Home className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🏡</span> Basic
                    Information
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <Label
                      htmlFor="name"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">🏗️</span>
                      <span>Project Name</span>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="text-red-500"
                      >
                        *
                      </motion.span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Green Valley Residences"
                      className="border-2 border-green-200 focus:border-green-400 transition-all hover:border-green-300 shadow-sm"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="type"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">🏢</span>
                      <span>Property Type</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={setType}
                    >
                      <SelectTrigger className="border-2 border-green-200 hover:border-green-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apartment">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏢</span>{" "}
                            Apartment
                          </div>
                        </SelectItem>
                        <SelectItem value="Villa">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏡</span>{" "}
                            Villa
                          </div>
                        </SelectItem>
                        <SelectItem value="Plot">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏞️</span>{" "}
                            Plot
                          </div>
                        </SelectItem>
                        <SelectItem value="Commercial">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🏪</span>{" "}
                            Commercial
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="description"
                    className="flex items-center gap-2 mb-2"
                  >
                    <span className="text-lg">📝</span>
                    <span>Project Description</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) =>
                      setDescription(e.target.value)
                    }
                    placeholder="Tell us what makes this project special... ✨"
                    rows={3}
                    className="border-2 border-green-200 focus:border-green-400 transition-all hover:border-green-300 shadow-sm resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Be
                    descriptive and engaging!
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location & Status */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-teal-200 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
              <motion.div
                className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-teal-300 to-cyan-300 rounded-full opacity-10 -ml-20 -mb-20"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <CardHeader className="bg-gradient-to-r from-teal-50 via-cyan-50 to-teal-50 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -15 }}
                    className="p-2 bg-white rounded-lg shadow-md"
                  >
                    <MapPin className="h-6 w-6 text-teal-600" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">📍</span>{" "}
                    Location & Status
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid md:grid-cols-3 gap-5">
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="city"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">🏙️</span>
                      <span>City</span>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="text-red-500"
                      >
                        *
                      </motion.span>
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Melbourne"
                      className="border-2 border-teal-200 focus:border-teal-400 transition-all hover:border-teal-300 shadow-sm"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="location"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">🗺️</span>
                      <span>Area/Locality</span>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="text-red-500"
                      >
                        *
                      </motion.span>
                    </Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) =>
                        setLocation(e.target.value)
                      }
                      placeholder="e.g., Andheri West"
                      className="border-2 border-teal-200 focus:border-teal-400 transition-all hover:border-teal-300 shadow-sm"
                    />
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="status"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">⚡</span>
                      <span>Project Status</span>
                    </Label>
                    <Select
                      value={status}
                      onValueChange={setStatus}
                    >
                      <SelectTrigger className="border-2 border-teal-200 hover:border-teal-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">✅</span>{" "}
                            Available
                          </div>
                        </SelectItem>
                        <SelectItem value="Upcoming">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🔜</span>{" "}
                            Upcoming
                          </div>
                        </SelectItem>
                        <SelectItem value="Sold Out">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎉</span>{" "}
                            Sold Out
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>

                {/* Lead Name Dropdown - always show for manual selection */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="lead"
                    className="flex items-center gap-2 mb-2"
                  >
                    <span className="text-lg">👤</span>
                    <span>Lead Name</span>
                    <Badge
                      variant="outline"
                      className="text-xs ml-auto"
                    >
                      {loadingBuyers
                        ? "Loading..."
                        : `${buyers.length} buyers available`}
                    </Badge>
                  </Label>
                  <Select
                    value={lead}
                    onValueChange={setLead}
                    disabled={
                      loadingBuyers ||
                      (preFilledData?.leadName ? true : false)
                    }
                  >
                    <SelectTrigger className="border-2 border-teal-200 hover:border-teal-300">
                      <SelectValue
                        placeholder={
                          loadingBuyers
                            ? "Loading buyers..."
                            : "Select a buyer (optional)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">❌</span>
                          <span>No Lead</span>
                        </div>
                      </SelectItem>
                      {buyers.map((buyer) => (
                        <SelectItem
                          key={buyer.id}
                          value={buyer.name}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">👤</span>
                            <span>{buyer.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>💡</span>{" "}
                    {preFilledData?.leadName
                      ? "Lead from buying projects"
                      : "Select buyer from buying projects (optional)"}
                  </p>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Location Map */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, type: "spring" }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
              <motion.div
                className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full opacity-10 -mr-16 -mt-16"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 25,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -15 }}
                    className="p-2 bg-white rounded-lg shadow-md"
                  >
                    <MapPin className="h-6 w-6 text-purple-600" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">🗺️</span>{" "}
                    Location Map
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <PropertyLocationPicker
                  value={{
                    address1: mapAddress,
                    latitude: latitude,
                    longitude: longitude,
                  }}
                  onChange={(location) => {
                    setMapAddress(
                      location.formattedAddress ||
                        location.address1 ||
                        "",
                    );
                    if (location.latitude)
                      setLatitude(location.latitude);
                    if (location.longitude)
                      setLongitude(location.longitude);
                  }}
                  showBoundaryMode={true}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing & Configuration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-cyan-200 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
              <motion.div
                className="absolute top-0 left-1/2 w-36 h-36 bg-gradient-to-br from-cyan-300 to-blue-300 rounded-full opacity-10"
                animate={{ x: [0, 20, 0], y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
              />
              <CardHeader className="bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="p-2 bg-white rounded-lg shadow-md"
                  >
                    <DollarSign className="h-6 w-6 text-cyan-600" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">💰</span> Pricing
                    & Configuration
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                <div className="grid md:grid-cols-2 gap-5">
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="totalPrice"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">💵</span>
                      <span>Total Price ($)</span>
                      <motion.span
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                        className="text-red-500"
                      >
                        *
                      </motion.span>
                    </Label>
                    <Input
                      id="totalPrice"
                      type="number"
                      value={totalPrice}
                      onChange={(e) =>
                        setTotalPrice(e.target.value)
                      }
                      placeholder="e.g., 12500000"
                      className="border-2 border-cyan-200 focus:border-cyan-400 transition-all hover:border-cyan-300 shadow-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span>💡</span> Enter amount in rupees
                      (e.g., 1.25 Cr = 12500000)
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="pricePerSqFt"
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-lg">💸</span>
                      <span>Price per Sq.Ft ($)</span>
                    </Label>
                    <Input
                      id="pricePerSqFt"
                      type="number"
                      value={pricePerSqFt}
                      onChange={(e) =>
                        setPricePerSqFt(e.target.value)
                      }
                      placeholder="e.g., 8500"
                      className="border-2 border-cyan-200 focus:border-cyan-400 transition-all hover:border-cyan-300 shadow-sm"
                    />
                  </motion.div>
                </div>

                {/* Price Negotiable Checkbox */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border-2 border-cyan-200"
                >
                  <Checkbox
                    id="priceNegotiable"
                    checked={priceNegotiable}
                    onCheckedChange={(checked) =>
                      setPriceNegotiable(checked as boolean)
                    }
                    className="border-2 border-cyan-400"
                  />
                  <Label
                    htmlFor="priceNegotiable"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-lg">🤝</span>
                    <span>Price is Negotiable</span>
                  </Label>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-5">
                  {type !== "Plot" && (
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                      }}
                    >
                      <Label
                        htmlFor="bhkOptions"
                        className="flex items-center gap-2 mb-2"
                      >
                        <span className="text-lg">🛏️</span>
                        <span>BHK Options</span>
                      </Label>
                      <div className="grid grid-cols-3 gap-2 p-3 bg-white rounded-lg border-2 border-cyan-200">
                        {[
                          "0",
                          "1",
                          "2",
                          "3",
                          "4",
                          "5",
                          "6",
                          "7",
                          "8",
                          "9",
                          "10+",
                        ].map((bhk) => (
                          <div
                            key={bhk}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              id={`bhk-${bhk}`}
                              checked={bhkOptions.includes(bhk)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  const newOptions = [
                                    ...bhkOptions,
                                    bhk,
                                  ];
                                  // Sort the options: numbers first in ascending order, then '10+'
                                  setBhkOptions(
                                    newOptions.sort((a, b) => {
                                      if (a === "10+") return 1;
                                      if (b === "10+")
                                        return -1;
                                      return (
                                        parseInt(a) -
                                        parseInt(b)
                                      );
                                    }),
                                  );
                                } else {
                                  setBhkOptions(
                                    bhkOptions.filter(
                                      (b) => b !== bhk,
                                    ),
                                  );
                                }
                              }}
                              className="border-2 border-cyan-400"
                            />
                            <Label
                              htmlFor={`bhk-${bhk}`}
                              className="cursor-pointer text-sm"
                            >
                              {bhk}
                            </Label>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Select applicable BHK options
                      </p>
                    </motion.div>
                  )}

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                    className={
                      type !== "Plot" ? "" : "md:col-span-2"
                    }
                  >
                    <Label className="flex items-center gap-2 mb-2">
                      <Ruler className="h-4 w-4 text-cyan-600" />
                      <span>Area Range (sq.ft)</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        id="minArea"
                        type="number"
                        value={minArea}
                        onChange={(e) =>
                          setMinArea(e.target.value)
                        }
                        placeholder="Min (e.g., 1200)"
                        className="border-2 border-cyan-200 focus:border-cyan-400 transition-all hover:border-cyan-300 shadow-sm"
                      />
                      <Input
                        id="maxArea"
                        type="number"
                        value={maxArea}
                        onChange={(e) =>
                          setMaxArea(e.target.value)
                        }
                        placeholder="Max (e.g., 1800)"
                        className="border-2 border-cyan-200 focus:border-cyan-400 transition-all hover:border-cyan-300 shadow-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Min and Max area in square feet
                    </p>
                  </motion.div>

                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                    }}
                  >
                    <Label
                      htmlFor="possession"
                      className="flex items-center gap-2 mb-2"
                    >
                      <Calendar className="h-4 w-4 text-cyan-600" />
                      <span>Possession Date</span>
                    </Label>
                    <Input
                      id="possession"
                      value={possession}
                      onChange={(e) =>
                        setPossession(e.target.value)
                      }
                      placeholder="e.g., Dec 2025"
                      className="border-2 border-cyan-200 focus:border-cyan-400 transition-all hover:border-cyan-300 shadow-sm"
                    />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Additional Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
              <motion.div
                className="absolute -bottom-10 -right-10 w-48 h-48 bg-gradient-to-tl from-purple-300 to-pink-300 rounded-full opacity-10"
                animate={{ rotate: [0, 360] }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <CardHeader className="bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 relative">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -360 }}
                    transition={{ duration: 0.6 }}
                    className="p-2 bg-white rounded-lg shadow-md"
                  >
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </motion.div>
                  <span className="flex items-center gap-2">
                    <span className="text-2xl">✨</span>{" "}
                    Additional Details
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {/* Approval Checkboxes */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200"
                >
                  <Label className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-purple-600" />
                    <span className="text-lg">
                      🏛️ Approvals
                    </span>
                  </Label>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-2 bg-white rounded-md">
                      <Checkbox
                        id="cmdaApproved"
                        checked={cmdaApproved}
                        disabled={unapproved}
                        onCheckedChange={(checked) =>
                          setCmdaApproved(checked as boolean)
                        }
                        className="border-2 border-purple-400"
                      />
                      <Label
                        htmlFor="cmdaApproved"
                        className="cursor-pointer flex-1"
                      >
                        CMDA Approved
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-md">
                      <Checkbox
                        id="dtcpApproved"
                        checked={dtcpApproved}
                        disabled={unapproved}
                        onCheckedChange={(checked) =>
                          setDtcpApproved(checked as boolean)
                        }
                        className="border-2 border-purple-400"
                      />
                      <Label
                        htmlFor="dtcpApproved"
                        className="cursor-pointer flex-1"
                      >
                        DTCP Approved
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-md">
                      <Checkbox
                        id="panchayatApproved"
                        checked={panchayatApproved}
                        disabled={unapproved}
                        onCheckedChange={(checked) =>
                          setPanchayatApproved(
                            checked as boolean,
                          )
                        }
                        className="border-2 border-purple-400"
                      />
                      <Label
                        htmlFor="panchayatApproved"
                        className="cursor-pointer flex-1"
                      >
                        Panchayat Approved
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-md">
                      <Checkbox
                        id="pattaApproved"
                        checked={pattaApproved}
                        disabled={unapproved}
                        onCheckedChange={(checked) =>
                          setPattaApproved(checked as boolean)
                        }
                        className="border-2 border-purple-400"
                      />
                      <Label
                        htmlFor="pattaApproved"
                        className="cursor-pointer flex-1"
                      >
                        Patta Approved
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-red-50 rounded-md border-2 border-red-200">
                      <Checkbox
                        id="unapproved"
                        checked={unapproved}
                        onCheckedChange={(checked) => {
                          setUnapproved(checked as boolean);
                          if (checked) {
                            setCmdaApproved(false);
                            setDtcpApproved(false);
                            setPanchayatApproved(false);
                            setPattaApproved(false);
                          }
                        }}
                        className="border-2 border-red-400"
                      />
                      <Label
                        htmlFor="unapproved"
                        className="cursor-pointer flex-1 text-red-700"
                      >
                        ⚠️ Unapproved
                      </Label>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="rera"
                    className="flex items-center gap-2 mb-2"
                  >
                    <Shield className="h-4 w-4 text-purple-600" />
                    <span>Approval Number</span>
                    <Badge
                      variant="outline"
                      className="text-xs ml-auto"
                    >
                      Regulatory
                    </Badge>
                  </Label>
                  <Input
                    id="rera"
                    value={rera}
                    onChange={(e) => setRera(e.target.value)}
                    placeholder="e.g., PA-2025-123456"
                    className="border-2 border-purple-200 focus:border-purple-400 transition-all hover:border-purple-300 shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Real Estate Regulatory Authority Number
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="amenities"
                    className="flex items-center gap-2 mb-2"
                  >
                    <Star className="h-4 w-4 text-purple-600" />
                    <span>Amenities & Features</span>
                  </Label>
                  <Textarea
                    id="amenities"
                    value={amenities}
                    onChange={(e) =>
                      setAmenities(e.target.value)
                    }
                    placeholder="e.g., Swimming Pool, Gym, Clubhouse, Garden, Kids Play Area, Security, 24/7 Water Supply, Power Backup, Parking"
                    rows={4}
                    className="border-2 border-purple-200 focus:border-purple-400 transition-all hover:border-purple-300 shadow-sm resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>🏊</span> Enter amenities as a
                    paragraph or comma-separated list
                  </p>
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="images"
                    className="flex items-center gap-2 mb-2"
                  >
                    <Image className="h-4 w-4 text-purple-600" />
                    <span>Project Images</span>
                    <Badge
                      variant="outline"
                      className="text-xs ml-auto"
                    >
                      Visual Gallery
                    </Badge>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                      }}
                      className="text-red-500"
                    ></motion.span>
                  </Label>
                  <Input
                    id="images"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    multiple
                    onChange={handleImageChange}
                    className="border-2 border-purple-200 focus:border-purple-400 transition-all hover:border-purple-300 shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>📸</span> Upload JPEG, JPG, or PNG
                    images (multiple files allowed)
                  </p>
                  {imagePreview.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {imagePreview.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative rounded-lg overflow-hidden border-2 border-purple-200"
                        >
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover"
                          />
                          <div className="absolute top-1 right-1 bg-purple-600 text-white text-xs px-2 py-1 rounded">
                            {index + 1}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                  }}
                >
                  <Label
                    htmlFor="brochureUrl"
                    className="flex items-center gap-2 mb-2"
                  >
                    <FileText className="h-4 w-4 text-purple-600" />
                    <span>Brochure Files</span>
                    <Badge
                      variant="outline"
                      className="text-xs ml-auto"
                    >
                      Multiple PDFs
                    </Badge>
                  </Label>
                  <Input
                    id="brochureUrl"
                    type="file"
                    accept="application/pdf,.doc,.docx"
                    multiple
                    onChange={handleBrochureChange}
                    className="border-2 border-purple-200 focus:border-purple-400 transition-all hover:border-purple-300 shadow-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <span>📄</span> Upload brochure files (select multiple)
                  </p>
                  {brochurePreviews.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {brochurePreviews.map((preview, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200 group"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-purple-600 flex-shrink-0" />
                            <span className="text-sm text-purple-900 truncate">
                              {preview}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            onClick={() => handleDeleteBrochure(index)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex justify-end gap-3 pt-4"
          >
            <Button
              variant="outline"
              onClick={() => navigateTo("admin-projects")}
              disabled={saving}
              className="border-2 hover:bg-gray-50"
            >
              ❌ Cancel
            </Button>
            <div className="relative">
              <Button
                onClick={() => {
                  console.log(
                    "Button clicked! isFormValid:",
                    isFormValid,
                    "saving:",
                    saving,
                  );
                  handleSave();
                }}
                disabled={saving || !isFormValid}
                className="bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 hover:from-green-700 hover:via-teal-700 hover:to-cyan-700 shadow-xl text-white relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <AnimatePresence mode="wait">
                  {saving ? (
                    <motion.span
                      key="saving"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.div>
                      Creating Magic...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="create"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center gap-2"
                    >
                      <Save className="h-4 w-4" />✨ Create
                      Project
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              {!saving && isFormValid && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-green-400 to-cyan-400 opacity-0 rounded-md pointer-events-none"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </div>

            {/* Success state indicator when form is valid */}
            {isFormValid && !saving && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-600"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  ✅
                </motion.div>
              </motion.div>
            )}
          </motion.div>

          {/* Validation Helper */}
          {!isFormValid && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mt-4"
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div className="flex-1">
                  <h4 className="text-amber-900 mb-2">
                    Please complete the following required
                    fields:
                  </h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    {!name.trim() && <li>• 🏗️ Project Name</li>}
                    {!city.trim() && <li>• 🏙️ City</li>}
                    {!location.trim() && (
                      <li>• 🗺️ Area/Locality</li>
                    )}
                    {!totalPrice.trim() && (
                      <li>• 💵 Total Price</li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}