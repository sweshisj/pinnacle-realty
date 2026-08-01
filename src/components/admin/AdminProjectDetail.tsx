import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Checkbox } from "../ui/checkbox";
import {
  projectId as supabaseProjectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { LoadingSpinner } from "../LoadingSpinner";
import { uploadImage } from "../../utils/supabase/uploadImage";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { motion } from "framer-motion";
import { PropertyLocationPicker } from "../PropertyLocationPicker";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string;
  location: string;
  description: string;
  pricePerSqFt: number;
  totalPrice: number;
  priceNegotiable: boolean;
  bhk: string[];
  area: string;
  possession: string;
  rera: string;
  cmdaApproved: boolean;
  dtcpApproved: boolean;
  panchayatApproved: boolean;
  pattaApproved: boolean;
  unapproved: boolean;
  amenities: string[] | string;
  images: string[];
  brochures?: string[]; // Support multiple brochures
  brochureUrl?: string; // Keep for backward compatibility
  lead?: string;
  coordinates?: { lat: number; lng: number };
  mapAddress?: string;
}

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  enquiryDate: string;
}

interface AdminProjectDetailProps {
  projectId: string;
  navigateTo: (
    page: any,
    projectId?: string,
    clientId?: string,
  ) => void;
}

export function AdminProjectDetail({
  projectId,
  navigateTo,
}: AdminProjectDetailProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [buyers, setBuyers] = useState<
    { id: string; name: string }[]
  >([]); // Available buyers for dropdown

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPricePerSqFt, setEditPricePerSqFt] = useState("");
  const [editTotalPrice, setEditTotalPrice] = useState("");
  const [editPriceNegotiable, setEditPriceNegotiable] =
    useState(false);
  const [editBhkOptions, setEditBhkOptions] = useState<
    string[]
  >([]);
  const [editMinArea, setEditMinArea] = useState("");
  const [editMaxArea, setEditMaxArea] = useState("");
  const [editPossession, setEditPossession] = useState("");
  const [editRera, setEditRera] = useState("");
  const [editCmdaApproved, setEditCmdaApproved] =
    useState(false);
  const [editDtcpApproved, setEditDtcpApproved] =
    useState(false);
  const [editPanchayatApproved, setEditPanchayatApproved] =
    useState(false);
  const [editPattaApproved, setEditPattaApproved] =
    useState(false);
  const [editUnapproved, setEditUnapproved] = useState(false);
  const [editAmenities, setEditAmenities] = useState("");
  const [editLead, setEditLead] = useState("");
  const [editBrochureFiles, setEditBrochureFiles] = useState<File[]>([]);
  const [editBrochurePreviews, setEditBrochurePreviews] = useState<string[]>([]);
  const [existingBrochures, setExistingBrochures] = useState<string[]>([]);
  const [editImageFiles, setEditImageFiles] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] =
    useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editLatitude, setEditLatitude] = useState(13.0827);
  const [editLongitude, setEditLongitude] = useState(80.2707);
  const [editMapAddress, setEditMapAddress] = useState("");
  const [hasLocationSet, setHasLocationSet] = useState(false);
  const [showLocationMap, setShowLocationMap] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project details
        const projectResponse = await fetch(
          `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!projectResponse.ok) {
          const errorText = await projectResponse.text();
          throw new Error(
            `Failed to fetch project: ${errorText}`,
          );
        }
        const projectData = await projectResponse.json();
        setProject(projectData);

        // Initialize edit form with project data
        setEditName(projectData.name);
        setEditType(projectData.type);
        setEditStatus(projectData.status);
        setEditCity(projectData.city);
        setEditLocation(projectData.location);
        setEditDescription(projectData.description);
        setEditPricePerSqFt(
          projectData.pricePerSqFt?.toString() || "",
        );
        setEditTotalPrice(
          projectData.totalPrice?.toString() || "",
        );
        setEditPriceNegotiable(
          projectData.priceNegotiable || false,
        );
        setEditBhkOptions(projectData.bhk || []);
        setEditMinArea(projectData.area.split("-")[0] || "");
        setEditMaxArea(projectData.area.split("-")[1] || "");
        setEditPossession(projectData.possession);
        setEditRera(projectData.rera);
        setEditCmdaApproved(projectData.cmdaApproved || false);
        setEditDtcpApproved(projectData.dtcpApproved || false);
        setEditPanchayatApproved(
          projectData.panchayatApproved || false,
        );
        setEditPattaApproved(
          projectData.pattaApproved || false,
        );
        setEditUnapproved(projectData.unapproved || false);
        setEditAmenities(
          typeof projectData.amenities === "string"
            ? projectData.amenities
            : projectData.amenities.join(", "),
        );
        setEditLead(projectData.lead || "");
        setExistingImages(projectData.images || []);
        setEditLatitude(
          projectData.coordinates?.lat || 13.0827,
        );
        setEditLongitude(
          projectData.coordinates?.lng || 80.2707,
        );
        setEditMapAddress(projectData.mapAddress || "");
        // Initialize brochures from array or single URL (backward compatibility)
        const brochuresArray = projectData.brochures || (projectData.brochureUrl ? [projectData.brochureUrl] : []);
        setExistingBrochures(brochuresArray);
        const hasCoords = Boolean(projectData.coordinates?.lat && projectData.coordinates?.lng);
        setHasLocationSet(hasCoords);
        setShowLocationMap(hasCoords);

        // Fetch enquiries for this project
        const enquiriesResponse = await fetch(
          `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}/enquiries`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!enquiriesResponse.ok) {
          const errorText = await enquiriesResponse.text();
          throw new Error(
            `Failed to fetch enquiries: ${errorText}`,
          );
        }
        const enquiriesData = await enquiriesResponse.json();
        setEnquiries(enquiriesData);

        // Fetch available buyers from localStorage (Buying Projects page data)
        try {
          const buyersDataStr =
            localStorage.getItem("buyersData");
          if (buyersDataStr) {
            const buyersData = JSON.parse(buyersDataStr);
            const buyersList = buyersData.map((buyer: any) => ({
              id: buyer.id,
              name: buyer.name,
            }));
            setBuyers(buyersList);
          } else {
            setBuyers([]);
          }
        } catch (error) {
          console.error(
            "Error loading buyers from localStorage:",
            error,
          );
          setBuyers([]);
        }
      } catch (error) {
        console.log(projectId);
        console.error(
          "Failed to fetch project details:",
          error,
        );
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const getLeadName = (leadId: string | undefined) => {
    if (!leadId) return "";
    const buyer = buyers.find((b) => b.id === leadId);
    return buyer ? buyer.name : leadId; // Fallback to ID if name not found
  };

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setEditImageFiles(files);

    // Create preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setEditImagePreviews(previews);
  };

  const handleDeleteExistingImage = (index: number) => {
    const newImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newImages);
    toast.success("Image marked for deletion");
  };

  const handleDeleteNewImage = (index: number) => {
    const newFiles = editImageFiles.filter((_, i) => i !== index);
    const newPreviews = editImagePreviews.filter((_, i) => i !== index);
    setEditImageFiles(newFiles);
    setEditImagePreviews(newPreviews);
    toast.success("Image removed");
  };

  const handleBrochureChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    setEditBrochureFiles(files);

    // Create preview info (just filename for PDFs)
    const previews = files.map((file) => file.name);
    setEditBrochurePreviews(previews);
  };

  const handleDeleteExistingBrochure = (index: number) => {
    const newBrochures = existingBrochures.filter((_, i) => i !== index);
    setExistingBrochures(newBrochures);
    toast.success("Brochure marked for deletion");
  };

  const handleDeleteNewBrochure = (index: number) => {
    const newFiles = editBrochureFiles.filter((_, i) => i !== index);
    const newPreviews = editBrochurePreviews.filter((_, i) => i !== index);
    setEditBrochureFiles(newFiles);
    setEditBrochurePreviews(newPreviews);
    toast.success("Brochure removed");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "red":
        return "bg-red-500";
      case "amber":
        return "bg-amber-500";
      case "green":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "red":
        return "bg-red-100 text-red-800";
      case "amber":
        return "bg-amber-100 text-amber-800";
      case "green":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (project) {
      // Reset form to original values
      setEditName(project.name);
      setEditType(project.type);
      setEditStatus(project.status);
      setEditCity(project.city);
      setEditLocation(project.location);
      setEditDescription(project.description);
      setEditPricePerSqFt(
        project.pricePerSqFt?.toString() || "",
      );
      setEditTotalPrice(project.totalPrice?.toString() || "");
      setEditPriceNegotiable(project.priceNegotiable || false);
      setEditBhkOptions(project.bhk || []);
      setEditMinArea(project.area.split("-")[0] || "");
      setEditMaxArea(project.area.split("-")[1] || "");
      setEditPossession(project.possession);
      setEditRera(project.rera);
      setEditCmdaApproved(project.cmdaApproved || false);
      setEditDtcpApproved(project.dtcpApproved || false);
      setEditPanchayatApproved(
        project.panchayatApproved || false,
      );
      setEditPattaApproved(project.pattaApproved || false);
      setEditUnapproved(project.unapproved || false);
      setEditAmenities(
        typeof project.amenities === "string"
          ? project.amenities
          : project.amenities.join(", "),
      );
      setEditImageFiles([]);
      setEditImagePreviews([]);
      setExistingImages(project.images || []);
      setEditBrochureFiles([]);
      setEditBrochurePreviews([]);
      // Reset brochures from array or single URL (backward compatibility)
      const brochuresArray = project.brochures || (project.brochureUrl ? [project.brochureUrl] : []);
      setExistingBrochures(brochuresArray);
      setEditLatitude(project.coordinates?.lat || 13.0827);
      setEditLongitude(project.coordinates?.lng || 80.2707);
      setEditMapAddress(project.mapAddress || "");
      const hasCoords = Boolean(project.coordinates?.lat && project.coordinates?.lng);
      setHasLocationSet(hasCoords);
      setShowLocationMap(hasCoords);
    }
    setIsEditing(false);
  };

  const uploadSingleFile = async (
    file: File,
    folder: string,
  ): Promise<string> => {
    try {
      // Use the server endpoint which has service role permissions to bypass RLS
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/upload`,
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

  const handleSaveEdit = async () => {
    if (
      !editName ||
      !editCity ||
      !editLocation ||
      !editTotalPrice
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);

    try {
      const updatedProject: any = {
        name: editName,
        type: editType,
        status: editStatus,
        city: editCity,
        location: editLocation,
        description: editDescription,
        pricePerSqFt: editPricePerSqFt
          ? parseInt(editPricePerSqFt)
          : null,
        totalPrice: parseInt(editTotalPrice),
        priceNegotiable: editPriceNegotiable,
        bhk: editBhkOptions,
        area: `${editMinArea}-${editMaxArea}`,
        possession: editPossession,
        rera: editRera,
        cmdaApproved: editCmdaApproved,
        dtcpApproved: editDtcpApproved,
        panchayatApproved: editPanchayatApproved,
        pattaApproved: editPattaApproved,
        unapproved: editUnapproved,
        amenities: editAmenities.trim() || "",
        lead: editLead || null,
        coordinates: (showLocationMap && hasLocationSet) ? { lat: editLatitude, lng: editLongitude } : null,
        mapAddress: editMapAddress || "",
      };

      // Handle multiple image uploads
      const allImages = [...existingImages]; // Start with existing images
      
      if (editImageFiles.length > 0) {
        // Upload all new images
        toast.info(`Uploading ${editImageFiles.length} image(s)...`);
        try {
          const uploadPromises = editImageFiles.map((file) =>
            uploadSingleFile(file, "projects")
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          allImages.push(...uploadedUrls);
          toast.success(`${uploadedUrls.length} image(s) uploaded successfully!`);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          toast.error("Failed to upload images. Please try again.");
          setSaving(false);
          return;
        }
      }
      
      updatedProject.images = allImages;

      // Handle multiple brochure uploads
      const allBrochures = [...existingBrochures]; // Start with existing brochures
      
      if (editBrochureFiles.length > 0) {
        // Upload all new brochures
        toast.info(`Uploading ${editBrochureFiles.length} brochure(s)...`);
        try {
          const uploadPromises = editBrochureFiles.map((file) =>
            uploadSingleFile(file, "brochures")
          );
          const uploadedUrls = await Promise.all(uploadPromises);
          allBrochures.push(...uploadedUrls);
          toast.success(`${uploadedUrls.length} brochure(s) uploaded successfully!`);
        } catch (uploadError) {
          console.error("Brochure upload failed:", uploadError);
          toast.error("Failed to upload brochures. Please try again.");
          setSaving(false);
          return;
        }
      }
      
      updatedProject.brochures = allBrochures;
      // Keep brochureUrl for backward compatibility (use first brochure if available)
      updatedProject.brochureUrl = allBrochures.length > 0 ? allBrochures[0] : undefined;

      console.log(
        "Updating project with data:",
        updatedProject,
      );

      const response = await fetch(
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedProject),
        },
      );

      console.log("Response status:", response.status);
      const responseText = await response.text();
      console.log("Response text:", responseText);

      if (response.ok) {
        toast.success("🎉 Project updated successfully!");

        // Update local project state
        const updatedProjectData = JSON.parse(responseText);
        setProject(updatedProjectData);
        setIsEditing(false);
        setEditImageFiles([]);
        setEditImagePreviews([]);
        setExistingImages(updatedProjectData.images || []);
        setEditBrochureFiles([]);
        setEditBrochurePreviews([]);
        const brochuresArray = updatedProjectData.brochures || (updatedProjectData.brochureUrl ? [updatedProjectData.brochureUrl] : []);
        setExistingBrochures(brochuresArray);
      } else {
        let errorMessage = "Failed to update project";
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
      console.error("Update project error:", error);
      toast.error(`Failed to update project: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      console.log("=== DELETE PROJECT ===");
      console.log("Project ID:", projectId);
      console.log(
        "URL:",
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}`,
      );

      const response = await fetch(
        `https://${supabaseProjectId}.supabase.co/functions/v1/make-server-64143980/projects/${projectId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (response.ok) {
        toast.success("🗑️ Project deleted successfully!");
        navigateTo("admin-projects");
      } else {
        const errorText = await response.text();
        toast.error(`Failed to delete project: ${errorText}`);
      }
    } catch (error) {
      console.error("Delete project error:", error);
      toast.error(`Failed to delete project: ${error.message}`);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
        <LoadingSpinner
          message="🏗️ Loading project insights..."
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
          <Button onClick={() => navigateTo("admin-projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigateTo("admin-projects")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Projects
          </Button>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl mb-2">{project.name}</h1>
              <p className="text-gray-600">
                {project.location}, {project.city}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2"
              >
                {project.status}
              </Badge>
              {!isEditing ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={handleEdit}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      ✏️ Edit Project
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => setDeleteDialogOpen(true)}
                      variant="destructive"
                      className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      🗑️ Delete Project
                    </Button>
                  </motion.div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving
                      ? "💾 Saving..."
                      : "💾 Save Changes"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    variant="outline"
                    className="border-2"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Project Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Images Gallery */}
            <Card
              className={
                isEditing
                  ? "border-2 border-blue-300 shadow-xl"
                  : ""
              }
            >
              <CardHeader
                className={
                  isEditing
                    ? "bg-gradient-to-r from-blue-50 to-purple-50"
                    : ""
                }
              >
                <CardTitle className="flex items-center gap-2">
                  🖼️ Project Images
                  {isEditing && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      ✏️ Editing
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div>
                    <Label className="mb-2 block">Current Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {existingImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={`${project.name} - Image ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          {isEditing && (
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteExistingImage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Images Preview */}
                {editImagePreviews.length > 0 && (
                  <div>
                    <Label className="mb-2 block">New Images (Not Saved Yet)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {editImagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`New upload ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteNewImage(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Images */}
                {isEditing && (
                  <div>
                    <Label htmlFor="image-upload" className="flex items-center gap-2 mb-2">
                      📸 Add More Images
                    </Label>
                    <Input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="border-2 border-blue-200 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 You can select multiple images at once. Click Save Changes to upload them.
                    </p>
                  </div>
                )}

                {/* Show message when not editing and no images */}
                {!isEditing && existingImages.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No images available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Overview */}
            <Card
              className={
                isEditing
                  ? "border-2 border-blue-300 shadow-xl"
                  : ""
              }
            >
              <CardHeader
                className={
                  isEditing
                    ? "bg-gradient-to-r from-blue-50 to-purple-50"
                    : ""
                }
              >
                <CardTitle className="flex items-center gap-2">
                  Project Overview
                  {isEditing && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      ✏️ Editing
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    {/* Edit Mode */}
                    <div>
                      <Label
                        htmlFor="edit-name"
                        className="flex items-center gap-2"
                      >
                        🏗️ Project Name{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) =>
                          setEditName(e.target.value)
                        }
                        className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-description">
                        📝 Description
                      </Label>
                      <Textarea
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) =>
                          setEditDescription(e.target.value)
                        }
                        rows={3}
                        className="mt-1 border-2 border-blue-200 focus:border-blue-400 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-city">
                          🏙️ City{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </Label>
                        <Input
                          id="edit-city"
                          value={editCity}
                          onChange={(e) =>
                            setEditCity(e.target.value)
                          }
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-location">
                          🗺️ Location{" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </Label>
                        <Input
                          id="edit-location"
                          value={editLocation}
                          onChange={(e) =>
                            setEditLocation(e.target.value)
                          }
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-type">
                          🏢 Type
                        </Label>
                        <Select
                          value={editType}
                          onValueChange={setEditType}
                        >
                          <SelectTrigger className="mt-1 border-2 border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Apartment">
                              🏢 Apartment
                            </SelectItem>
                            <SelectItem value="Villa">
                              🏡 Villa
                            </SelectItem>
                            <SelectItem value="Plot">
                              🏞️ Plot
                            </SelectItem>
                            <SelectItem value="Commercial">
                              🏪 Commercial
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="edit-status">
                          ⚡ Status
                        </Label>
                        <Select
                          value={editStatus}
                          onValueChange={setEditStatus}
                        >
                          <SelectTrigger className="mt-1 border-2 border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Available">
                              ✅ Available
                            </SelectItem>
                            <SelectItem value="Upcoming">
                              🔜 Upcoming
                            </SelectItem>
                            <SelectItem value="Sold Out">
                              🎉 Sold Out
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {editType !== "Plot" && (
                        <div>
                          <Label htmlFor="edit-bhk">
                            🛏️ BHK Options
                          </Label>
                          <Input
                            id="edit-bhk"
                            value={editBhkOptions.join(", ")}
                            onChange={(e) =>
                              setEditBhkOptions(
                                e.target.value
                                  .split(",")
                                  .map((b) => b.trim()),
                              )
                            }
                            placeholder="2 BHK, 3 BHK"
                            className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                          />
                        </div>
                      )}
                    </div>

                    {/* Lead Field */}
                    <div>
                      <Label htmlFor="edit-lead">
                        👤 Lead Name
                      </Label>
                      <Select
                        value={editLead || "none"}
                        onValueChange={(value) =>
                          setEditLead(
                            value === "none" ? "" : value,
                          )
                        }
                      >
                        <SelectTrigger className="mt-1 border-2 border-blue-200">
                          <SelectValue placeholder="Select lead (optional)">
                            {editLead
                              ? getLeadName(editLead)
                              : "Select lead (optional)"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            None
                          </SelectItem>
                          {buyers.map((buyer) => (
                            <SelectItem
                              key={buyer.id}
                              value={buyer.id}
                            >
                              {buyer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Select a buyer/lead from the buying
                        projects page
                      </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-area">
                          📏 Area
                        </Label>
                        <Input
                          id="edit-area"
                          value={`${editMinArea}-${editMaxArea}`}
                          onChange={(e) => {
                            const [min, max] =
                              e.target.value.split("-");
                            setEditMinArea(min.trim());
                            setEditMaxArea(max.trim());
                          }}
                          placeholder="1200-1800 sq.ft"
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-possession">
                          📅 Possession
                        </Label>
                        <Input
                          id="edit-possession"
                          value={editPossession}
                          onChange={(e) =>
                            setEditPossession(e.target.value)
                          }
                          placeholder="Dec 2025"
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-rera">
                          🛡️ Approval No.
                        </Label>
                        <Input
                          id="edit-rera"
                          value={editRera}
                          onChange={(e) =>
                            setEditRera(e.target.value)
                          }
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="edit-price-per-sqft">
                          💵 Price per Sq.Ft ($)
                        </Label>
                        <Input
                          id="edit-price-per-sqft"
                          type="number"
                          value={editPricePerSqFt}
                          onChange={(e) =>
                            setEditPricePerSqFt(e.target.value)
                          }
                          placeholder="e.g., 5000"
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-total-price">
                          💸 Total Price ($){" "}
                          <span className="text-red-500">
                            *
                          </span>
                        </Label>
                        <Input
                          id="edit-total-price"
                          type="number"
                          value={editTotalPrice}
                          onChange={(e) =>
                            setEditTotalPrice(e.target.value)
                          }
                          placeholder="e.g., 12500000"
                          className="mt-1 border-2 border-blue-200 focus:border-blue-400"
                        />
                      </div>

                      <div>
                        <Label className="flex items-center gap-2">
                          💰 Price Negotiable
                        </Label>
                        <div className="flex items-center h-10 mt-1">
                          <Checkbox
                            id="edit-price-negotiable"
                            checked={editPriceNegotiable}
                            onCheckedChange={(checked) =>
                              setEditPriceNegotiable(
                                checked as boolean,
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-price-negotiable"
                            className="text-sm cursor-pointer"
                          >
                            {editPriceNegotiable ? "Yes" : "No"}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 mb-2">
                        🏛️ Approvals
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="flex items-center">
                          <Checkbox
                            id="edit-cmda"
                            checked={editCmdaApproved}
                            disabled={editUnapproved}
                            onCheckedChange={(checked) =>
                              setEditCmdaApproved(
                                checked as boolean,
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-cmda"
                            className="text-sm cursor-pointer"
                          >
                            CMDA
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="edit-dtcp"
                            checked={editDtcpApproved}
                            disabled={editUnapproved}
                            onCheckedChange={(checked) =>
                              setEditDtcpApproved(
                                checked as boolean,
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-dtcp"
                            className="text-sm cursor-pointer"
                          >
                            DTCP
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="edit-panchayat"
                            checked={editPanchayatApproved}
                            disabled={editUnapproved}
                            onCheckedChange={(checked) =>
                              setEditPanchayatApproved(
                                checked as boolean,
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-panchayat"
                            className="text-sm cursor-pointer"
                          >
                            Panchayat
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="edit-patta"
                            checked={editPattaApproved}
                            disabled={editUnapproved}
                            onCheckedChange={(checked) =>
                              setEditPattaApproved(
                                checked as boolean,
                              )
                            }
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-patta"
                            className="text-sm cursor-pointer"
                          >
                            Patta
                          </label>
                        </div>
                        <div className="flex items-center">
                          <Checkbox
                            id="edit-unapproved"
                            checked={editUnapproved}
                            onCheckedChange={(checked) => {
                              const isChecked =
                                checked as boolean;
                              setEditUnapproved(isChecked);
                              if (isChecked) {
                                // Uncheck all other approvals
                                setEditCmdaApproved(false);
                                setEditDtcpApproved(false);
                                setEditPanchayatApproved(false);
                                setEditPattaApproved(false);
                              }
                            }}
                            className="mr-2"
                          />
                          <label
                            htmlFor="edit-unapproved"
                            className="text-sm cursor-pointer text-orange-600"
                          >
                            Unapproved
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* View Mode */}
                    <p className="text-gray-600 mb-6">
                      {project.description}
                    </p>

                    {/* Lead Display - Simple */}
                    {project.lead && (
                      <div className="mb-6">
                        <div className="text-sm text-gray-500 mb-1">
                          Lead Name
                        </div>
                        <div className="font-medium">
                          {getLeadName(project.lead)}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Type
                        </div>
                        <div>{project.type}</div>
                      </div>
                      {project.type !== "Plot" &&
                        project.bhk &&
                        project.bhk.length > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              BHK
                            </div>
                            <div>{project.bhk.join(", ")}</div>
                          </div>
                        )}
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Area
                        </div>
                        <div>{project.area}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Possession
                        </div>
                        <div>{project.possession}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Approval No.
                        </div>
                        <div>{project.rera}</div>
                      </div>
                      {project.pricePerSqFt &&
                        project.pricePerSqFt > 0 && (
                          <div>
                            <div className="text-sm text-gray-500 mb-1">
                              Price per Sq.Ft
                            </div>
                            <div className="text-green-600">
                              $
                              {project.pricePerSqFt.toLocaleString()}
                            </div>
                          </div>
                        )}
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Total Price
                        </div>
                        <div className="text-green-600 flex items-center gap-2">
                          {formatPrice(project.totalPrice)}
                          {project.priceNegotiable && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              Negotiable
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">
                          Approvals
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {project.cmdaApproved && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              CMDA
                            </Badge>
                          )}
                          {project.dtcpApproved && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              DTCP
                            </Badge>
                          )}
                          {project.panchayatApproved && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              Panchayat
                            </Badge>
                          )}
                          {project.pattaApproved && (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
                              Patta
                            </Badge>
                          )}
                          {project.unapproved && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-orange-100 text-orange-700"
                            >
                              Unapproved
                            </Badge>
                          )}
                          {!project.cmdaApproved &&
                            !project.dtcpApproved &&
                            !project.panchayatApproved &&
                            !project.pattaApproved &&
                            !project.unapproved && (
                              <span className="text-gray-400 text-sm">
                                None
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card
              className={
                isEditing
                  ? "border-2 border-blue-300 shadow-xl"
                  : ""
              }
            >
              <CardHeader
                className={
                  isEditing
                    ? "bg-gradient-to-r from-blue-50 to-purple-50"
                    : ""
                }
              >
                <CardTitle className="flex items-center gap-2">
                  Amenities
                  {isEditing && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      ✏️ Editing
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div>
                    <Label htmlFor="edit-amenities">
                      ⭐ Amenities & Features
                    </Label>
                    <Textarea
                      id="edit-amenities"
                      value={editAmenities}
                      onChange={(e) =>
                        setEditAmenities(e.target.value)
                      }
                      placeholder="Swimming Pool, Gym, Clubhouse, Garden, Kids Play Area, Security, 24/7 Water Supply"
                      rows={4}
                      className="mt-1 border-2 border-blue-200 focus:border-blue-400 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      🏊 Enter amenities as a paragraph or
                      comma-separated list
                    </p>
                  </div>
                ) : typeof project.amenities === "string" ? (
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

            {/* Location Map */}
            {isEditing && (
              <Card className="border-2 border-blue-300 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    🗺️ Location & Address
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      ✏️ Editing
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Location Map Toggle */}
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <Label className="text-base">Location Map Display</Label>
                    <RadioGroup
                      value={showLocationMap ? "show" : "hide"}
                      onValueChange={(value) => {
                        setShowLocationMap(value === "show");
                        // If switching to hide, clear coordinates
                        if (value === "hide") {
                          setHasLocationSet(false);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="show" id="show-map" />
                        <Label htmlFor="show-map" className="cursor-pointer">
                          🗺️ Show Location Map - Search and pin location on map (visible to clients)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hide" id="hide-map" />
                        <Label htmlFor="hide-map" className="cursor-pointer">
                          📝 Hide Location Map - Only address text (no map shown to clients)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <PropertyLocationPicker
                    value={{
                      address1: editMapAddress,
                      latitude: editLatitude,
                      longitude: editLongitude,
                    }}
                    onChange={(location) => {
                      // Update the mapAddress from location data
                      // Priority: formattedAddress > manual address construction > address1
                      const manualAddress = [
                        location.address1,
                        location.address2,
                        location.city,
                        location.state,
                        location.postalCode,
                        location.country
                      ].filter(Boolean).join(', ');
                      
                      setEditMapAddress(
                        location.formattedAddress ||
                          manualAddress ||
                          location.address1 ||
                          "",
                      );
                      // Check if location is being removed (latitude/longitude are undefined)
                      if (location.latitude == null || location.longitude == null) {
                        // Location removed - set to defaults but mark as not set
                        setEditLatitude(13.0827);
                        setEditLongitude(80.2707);
                        setHasLocationSet(false);
                      } else {
                        // Location set - update coordinates and mark as set
                        setEditLatitude(location.latitude);
                        setEditLongitude(location.longitude);
                        setHasLocationSet(true);
                      }
                    }}
                    showMap={showLocationMap}
                  />
                </CardContent>
              </Card>
            )}

            {/* Brochures */}
            {isEditing && (
              <Card className="border-2 border-blue-300 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    📄 Project Brochures
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      ✏️ Editing
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Existing Brochures */}
                  {existingBrochures.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Current Brochures</Label>
                      <div className="space-y-2">
                        {existingBrochures.map((brochureUrl, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-2xl">📄</span>
                              <a
                                href={brochureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline truncate"
                              >
                                Brochure {index + 1}
                              </a>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              onClick={() => handleDeleteExistingBrochure(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New Brochures Preview */}
                  {editBrochurePreviews.length > 0 && (
                    <div>
                      <Label className="mb-2 block">New Brochures (Not Saved Yet)</Label>
                      <div className="space-y-2">
                        {editBrochurePreviews.map((preview, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 group">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-2xl">📄</span>
                              <span className="text-sm text-gray-700 truncate">
                                {preview}
                              </span>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                              onClick={() => handleDeleteNewBrochure(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload New Brochures */}
                  <div>
                    <Label htmlFor="brochure-upload" className="flex items-center gap-2 mb-2">
                      📄 Add More Brochures
                    </Label>
                    <Input
                      id="brochure-upload"
                      type="file"
                      accept="application/pdf,.doc,.docx"
                      multiple
                      onChange={handleBrochureChange}
                      className="border-2 border-blue-200 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 You can select multiple brochure files at once. Click Save Changes to upload them.
                    </p>
                  </div>

                  {/* Show message when not editing and no brochures */}
                  {!isEditing && existingBrochures.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No brochures available
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enquiries Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Enquiries</span>
                  <Badge>{enquiries.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enquiries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No enquiries yet
                  </div>
                ) : (
                  <div className="space-y-4">
                    {enquiries.map((enquiry) => (
                      <Card
                        key={enquiry.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() =>
                          navigateTo(
                            "admin-client-detail",
                            undefined,
                            enquiry.id,
                          )
                        }
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">
                              {enquiry.name}
                            </h4>
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(
                                enquiry.status,
                              )}`}
                            ></div>
                          </div>

                          <div className="space-y-1 text-sm text-gray-600 mb-3">
                            <div className="break-all">
                              {enquiry.email}
                            </div>
                            <div>{enquiry.phone}</div>
                            <div className="text-xs text-gray-400">
                              {enquiry.enquiryDate}
                            </div>
                          </div>

                          <Badge
                            className={getStatusBadgeColor(
                              enquiry.status,
                            )}
                            variant="secondary"
                          >
                            {enquiry.status.toUpperCase()}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Enquiry Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-sm">Red</span>
                  </div>
                  <span className="font-medium">
                    {
                      enquiries.filter(
                        (e) => e.status === "red",
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                    <span className="text-sm">Amber</span>
                  </div>
                  <span className="font-medium">
                    {
                      enquiries.filter(
                        (e) => e.status === "amber",
                      ).length
                    }
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-sm">Green</span>
                  </div>
                  <span className="font-medium">
                    {
                      enquiries.filter(
                        (e) => e.status === "green",
                      ).length
                    }
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>🗑️ Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{project?.name}"?
              This action cannot be undone and will remove all
              project data and enquiries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}