import React, { useState, useEffect } from "react";
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
import { Checkbox } from "../ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { ArrowLeft, Save, Trash2, Building2, Users } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Badge } from "../ui/badge";
import { LoadingSpinner } from "../LoadingSpinner";
import { getAllBuyers, type Buyer } from "../../utils/supabase/buyerOperations";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  location: string;
  source?: string;
  primaryContact?: string;
  leadName?: string;
  projectsInterested?: string[];
  favoriteProjects?: string[];
  projectsOwned?: string[];
  customProperty?: string;
  enquiryDate: string;
  registrationDate?: string | null;
  legalDocComplete?: boolean;
  backgroundCheckComplete?: boolean;
  sold?: boolean;
  notes?: string;
}

interface Project {
  id: string;
  name: string;
  location: string;
  type: string;
  city: string;
  images?: string[];
  description?: string;
  totalPrice?: number;
  pricePerSqFt?: number;
  priceNegotiable?: boolean;
}

interface ProjectWithBuyers {
  projectId: string;
  projectName: string;
  projectLocation: string;
  projectImage?: string;
  buyers: Client[];
}

interface AdminClientDetailProps {
  clientId: string;
  navigateTo: (page: any, projectId?: string, clientId?: string, statusFilter?: string) => void;
}

export function AdminClientDetail({
  clientId,
  navigateTo,
}: AdminClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateClient, setDuplicateClient] = useState<Client | null>(null);
  
  // For sellers
  const [sellerProjects, setSellerProjects] = useState<ProjectWithBuyers[]>([]);
  
  // For buyers
  const [interestedProjects, setInterestedProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  
  // For lead names grouped by projects
  const [projectLeads, setProjectLeads] = useState<{projectId: string; projectName: string; leads: {name: string; clientId: string}[]}[]>([]);
  const [availableLeads, setAvailableLeads] = useState<string[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(true);
  
  // For seller's projects owned dropdown - includes both selling projects and property names from buying leads
  const [leadPropertyNames, setLeadPropertyNames] = useState<string[]>([]);
  
  // For seller's projects filter and custom property
  const [projectFilter, setProjectFilter] = useState("");
  const [customProperty, setCustomProperty] = useState("");

  // Fetch all projects
  useEffect(() => {
    const fetchAllProjects = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setAllProjects(data);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      }
    };

    fetchAllProjects();
  }, []);
  
  // Fetch all buyers and extract lead names and property names
  useEffect(() => {
    const fetchBuyersFromSupabase = async () => {
      try {
        setLoadingBuyers(true);
        const result = await getAllBuyers();
        console.log("Fetched buyers from Supabase:", result);
        
        if (result.success && result.data) {
          const buyersData = result.data;
          
          // Extract unique buyer names for Lead Name dropdown
          const uniqueBuyerNames = Array.from(
            new Set(buyersData.map(b => b.name).filter(name => name))
          );
          setAvailableLeads(uniqueBuyerNames);
          
          // Extract all property names from all leads across all buyers
          const allPropertyNames: string[] = [];
          buyersData.forEach(buyer => {
            if (buyer.leads && Array.isArray(buyer.leads)) {
              buyer.leads.forEach(lead => {
                if (lead.propertyName) {
                  allPropertyNames.push(lead.propertyName);
                }
              });
            }
          });
          
          // Remove duplicates from property names
          const uniquePropertyNames = Array.from(new Set(allPropertyNames));
          setLeadPropertyNames(uniquePropertyNames);
          
          console.log("Extracted buyer names:", uniqueBuyerNames);
          console.log("Extracted property names from leads:", uniquePropertyNames);
        } else {
          console.error("Failed to fetch buyers:", result.error);
        }
      } catch (error) {
        console.error("Failed to fetch buyers from Supabase:", error);
      } finally {
        setLoadingBuyers(false);
      }
    };
    
    fetchBuyersFromSupabase();
  }, []);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+61");
  const [phone, setPhone] = useState("");
  const [type, setType] = useState("buyer");
  const [status, setStatus] = useState("amber");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [primaryContact, setPrimaryContact] = useState("");
  const [leadName, setLeadName] = useState("");
  const [projectsInterestedInput, setProjectsInterestedInput] = useState("");
  const [favoriteProjectsInput, setFavoriteProjectsInput] = useState("");
  const [projectsOwned, setProjectsOwned] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [legalDocComplete, setLegalDocComplete] = useState(false);
  const [backgroundCheckComplete, setBackgroundCheckComplete] = useState(false);
  const [sold, setSold] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (clientId === "new") {
      setIsNew(true);
      setLoading(false);
      return;
    }

    const fetchClient = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/${clientId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        const data = await response.json();
        console.log("Fetched client data:", data);
        console.log("Projects interested:", data.projectsInterested);
        setClient(data);

        // Populate form
        setName(data.name || "");
        setEmail(data.email || "");
        // Extract country code and phone number if phone exists
        const phoneStr = data.phone || "";
        const phoneMatch = phoneStr.match(/^(\+\d+)\s*(.+)$/);
        if (phoneMatch) {
          setCountryCode(phoneMatch[1]);
          setPhone(phoneMatch[2]);
        } else {
          setPhone(phoneStr);
        }
        setType(data.type || "buyer");
        setStatus(data.status || "amber");
        setLocation(data.location || "");
        setSource(data.source || "");
        setPrimaryContact(data.primaryContact || "");
        setLeadName(data.leadName || "");
        setProjectsInterestedInput(data.projectsInterested ? data.projectsInterested.join(", ") : "");
        setFavoriteProjectsInput(data.favoriteProjects ? data.favoriteProjects.join(", ") : "");
        setProjectsOwned(data.projectsOwned ? data.projectsOwned.join(", ") : "");
        setCustomProperty(data.customProperty || "");
        setRegistrationDate(data.registrationDate || "");
        setLegalDocComplete(data.legalDocComplete || false);
        setBackgroundCheckComplete(data.backgroundCheckComplete || false);
        setSold(data.sold || false);
        setNotes(data.notes || "");

        // If this is a seller, fetch their projects with buyers
        if (data.type === "seller") {
          fetchSellerProjects(clientId);
        }
        
        // If this is a buyer, fetch the interested projects
        if (data.type === "buyer" && data.projectsInterested && data.projectsInterested.length > 0) {
          console.log("Fetching interested projects for:", data.projectsInterested);
          fetchInterestedProjects(data.projectsInterested);
        } else {
          console.log("No interested projects to fetch", { 
            type: data.type, 
            hasProjectsInterested: !!data.projectsInterested, 
            length: data.projectsInterested?.length 
          });
        }
      } catch (error) {
        console.error("Failed to fetch client:", error);
        toast.error("Failed to load client details");
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [clientId]);

  const fetchSellerProjects = async (sellerId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/sellers/${sellerId}/projects`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );
      const data = await response.json();
      setSellerProjects(data);
    } catch (error) {
      console.error("Failed to fetch seller projects:", error);
    }
  };

  const fetchInterestedProjects = async (projectIds: string[]) => {
    try {
      const projectPromises = projectIds.map(projId =>
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects/${projId}`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        ).then(res => res.json())
      );
      const projects = await Promise.all(projectPromises);
      const validProjects = projects.filter(p => p && !p.error);
      console.log("Fetched interested projects:", validProjects);
      setInterestedProjects(validProjects);
    } catch (error) {
      console.error("Failed to fetch interested projects:", error);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    const clientData: any = {
      name,
      email,
      phone: `${countryCode} ${phone}`,
      type,
      status,
      location,
      source,
      primaryContact,
      leadName,
      registrationDate: registrationDate || null,
      legalDocComplete,
      backgroundCheckComplete,
      sold,
      notes,
    };

    // Add type-specific fields
    if (type === "buyer") {
      // Parse comma-separated project IDs for buyers
      const interestedIds = projectsInterestedInput.split(",").map(p => p.trim()).filter(p => p);
      clientData.projectsInterested = interestedIds;
      
      const favoriteIds = favoriteProjectsInput.split(",").map(p => p.trim()).filter(p => p);
      clientData.favoriteProjects = favoriteIds;
    } else {
      // Parse comma-separated project IDs for sellers
      const projectIds = projectsOwned.split(",").map(p => p.trim()).filter(p => p);
      clientData.projectsOwned = projectIds;
      clientData.customProperty = customProperty;
    }

    try {
      if (isNew) {
        // Check for duplicate phone number before creating
        const duplicateCheckRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/check-duplicate`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phone: `${countryCode} ${phone}` }),
          },
        );
        
        const duplicateData = await duplicateCheckRes.json();
        
        if (duplicateData.isDuplicate && duplicateData.duplicates.length > 0) {
          // Show duplicate alert
          setDuplicateClient(duplicateData.duplicates[0]);
          setDuplicateDialogOpen(true);
          setSaving(false);
          return;
        }
        
        // No duplicate, proceed with creation
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(clientData),
          },
        );

        if (response.ok) {
          toast.success("Client created successfully!");
          navigateTo("admin-clients", undefined, undefined, undefined);
        } else {
          toast.error("Failed to create client");
        }
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/${clientId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(clientData),
          },
        );

        if (response.ok) {
          const updatedClient = await response.json();
          toast.success("Client updated successfully!");
          
          // Update the local state with the new data
          setClient(updatedClient);
          
          // Re-populate form fields with updated data
          setName(updatedClient.name || "");
          setEmail(updatedClient.email || "");
          const phoneStr = updatedClient.phone || "";
          const phoneMatch = phoneStr.match(/^(\+\d+)\s*(.+)$/);
          if (phoneMatch) {
            setCountryCode(phoneMatch[1]);
            setPhone(phoneMatch[2]);
          } else {
            setPhone(phoneStr);
          }
          setType(updatedClient.type || "buyer");
          setStatus(updatedClient.status || "amber");
          setLocation(updatedClient.location || "");
          setSource(updatedClient.source || "");
          setPrimaryContact(updatedClient.primaryContact || "");
          setLeadName(updatedClient.leadName || "");
          setProjectsInterestedInput(updatedClient.projectsInterested ? updatedClient.projectsInterested.join(", ") : "");
          setFavoriteProjectsInput(updatedClient.favoriteProjects ? updatedClient.favoriteProjects.join(", ") : "");
          setProjectsOwned(updatedClient.projectsOwned ? updatedClient.projectsOwned.join(", ") : "");
          setCustomProperty(updatedClient.customProperty || "");
          setRegistrationDate(updatedClient.registrationDate || "");
          setLegalDocComplete(updatedClient.legalDocComplete || false);
          setBackgroundCheckComplete(updatedClient.backgroundCheckComplete || false);
          setSold(updatedClient.sold || false);
          setNotes(updatedClient.notes || "");
          
          // Refresh interested projects if buyer
          if (updatedClient.type === "buyer" && updatedClient.projectsInterested && updatedClient.projectsInterested.length > 0) {
            fetchInterestedProjects(updatedClient.projectsInterested);
          } else {
            setInterestedProjects([]);
          }
          
          // Refresh seller projects if seller
          if (updatedClient.type === "seller") {
            fetchSellerProjects(clientId);
          } else {
            setSellerProjects([]);
          }
        } else {
          toast.error("Failed to update client");
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save client");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/${clientId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );

      if (response.ok) {
        toast.success("Client deleted successfully!");
        navigateTo("admin-clients", undefined, undefined, undefined);
      } else {
        toast.error("Failed to delete client");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete client");
    }
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <LoadingSpinner message="👤 Loading client journey..." color="purple" theme="clients" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => navigateTo("admin-clients", undefined, undefined, undefined)}
            className="mb-4 hover:bg-purple-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clients
          </Button>
        </motion.div>

        {/* Client Name Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-6 border border-purple-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <span className="text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase() || "?"}
                </span>
              </motion.div>
              <div>
                <h1 className="text-3xl mb-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  {name || (isNew ? "✨ Create New Client" : "New Client")}
                </h1>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm border-purple-300">
                    {type === "buyer" ? "🏠 Buyer" : "💼 Seller"}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className={`w-3 h-3 rounded-full ${getStatusColor(status)}`}
                    ></motion.div>
                    <span className="text-sm text-gray-600">
                      Status: {status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {!isNew && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  className="shadow-lg"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Seller: Projects Owned with Interested Buyers */}
        {!isNew && type === "seller" && sellerProjects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl mb-4">Projects Owned</h2>
            <div className="space-y-4">
              {sellerProjects.map((project) => (
                <Card key={project.projectId}>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      {project.projectImage && (
                        <img
                          src={project.projectImage}
                          alt={project.projectName}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-green-600" />
                          {project.projectName}
                        </CardTitle>
                        {project.projectLocation && (
                          <p className="text-sm text-gray-600 mt-1">
                            {project.projectLocation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.buyers.length > 0 ? (
                      <>
                        <p className="text-sm text-gray-600 mb-3">
                          Interested Buyers ({project.buyers.length}):
                        </p>
                        <div className="grid md:grid-cols-2 gap-3">
                          {project.buyers.map((buyer) => (
                            <div
                              key={buyer.id}
                              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => navigateTo("admin-client-detail", undefined, buyer.id)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-medium">{buyer.name}</h4>
                                  <p className="text-sm text-gray-600">{buyer.email}</p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${getStatusColor(buyer.status)}`}></div>
                              </div>
                              <div className="text-sm text-gray-600">
                                <p>Phone: {buyer.phone}</p>
                                <p>Location: {buyer.location}</p>
                                <p>Status: {buyer.status.toUpperCase()}</p>
                                <p>Enquiry: {buyer.enquiryDate}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No interested buyers yet for this project.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Buyer: Interested Projects */}
        {!isNew && type === "buyer" && interestedProjects.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl mb-4">Interested Projects</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {interestedProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden">
                  {project.images && project.images[0] && (
                    <img
                      src={project.images[0]}
                      alt={project.name}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <CardContent className="p-4">
                    <h3 className="text-lg mb-2">{project.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Type:</span> {project.type}
                      </div>
                      <div>
                        <span className="font-medium">Location:</span> {project.location}, {project.city}
                      </div>
                      {project.totalPrice && (
                        <div>
                          <span className="font-medium">Price:</span> $
                          {(project.totalPrice / 10000000).toFixed(2)}Cr
                          {project.pricePerSqFt && project.pricePerSqFt > 0 && ` ($${project.pricePerSqFt.toLocaleString()}/sq.ft)`}
                          {project.priceNegotiable && <span className="text-blue-600 ml-2">• Negotiable</span>}
                        </div>
                      )}
                    </div>
                    {selectedProject?.id === project.id ? (
                      <>
                        <p className="text-sm text-gray-700 mb-3">{project.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setSelectedProject(null)}
                        >
                          Hide Details
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedProject(project)}
                      >
                        View Project Details
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Edit Client Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <h2 className="text-2xl mb-4 flex items-center gap-2">
            {isNew ? "✨ Add New Client" : "✏️ Edit Client Details"}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardTitle className="flex items-center gap-2">
                    <span>👤</span> Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter client name"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@email.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex gap-2">
                    <Select value={countryCode} onValueChange={setCountryCode}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+61">🇦🇺 +61</SelectItem>
                        <SelectItem value="+64">🇳🇿 +64</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+971">🇦🇪 +971</SelectItem>
                        <SelectItem value="+65">🇸🇬 +65</SelectItem>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="XXXXX XXXXX"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="City/Area"
                  />
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Client Type & Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/80 backdrop-blur-sm border-purple-100 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2">
                    <span>🎯</span> Client Type & Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buyer">Buyer</SelectItem>
                      <SelectItem value="seller">Seller</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          Red - Initial Contact
                        </div>
                      </SelectItem>
                      <SelectItem value="amber">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          Amber - In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="green">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          Green - Ready/Completed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {type === "buyer" && (
                  <>
                    <div>
                      <Label>
                        Projects Interested
                      </Label>
                      <Select
                        value={projectsInterestedInput.split(",")[0]?.trim() || ""}
                        onValueChange={(value) => {
                          const currentIds = projectsInterestedInput
                            .split(",")
                            .map(p => p.trim())
                            .filter(p => p);
                          if (!currentIds.includes(value)) {
                            const newValue = currentIds.length > 0 
                              ? `${projectsInterestedInput}, ${value}`
                              : value;
                            setProjectsInterestedInput(newValue);
                          }
                        }}
                      >
                        <SelectTrigger className="border-2 border-purple-200">
                          <SelectValue placeholder="Select projects..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name} ({project.city})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {projectsInterestedInput && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {projectsInterestedInput.split(",").map((id) => {
                            const trimmedId = id.trim();
                            if (!trimmedId) return null;
                            const project = allProjects.find(p => p.id === trimmedId);
                            return (
                              <Badge
                                key={trimmedId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {project ? project.name : trimmedId}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIds = projectsInterestedInput
                                      .split(",")
                                      .map(p => p.trim())
                                      .filter(p => p !== trimmedId);
                                    setProjectsInterestedInput(currentIds.join(", "));
                                  }}
                                  className="ml-1 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Select from the dropdown to add projects
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="leadName">
                        Lead Name
                      </Label>
                      <Select value={leadName} onValueChange={setLeadName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead name..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingBuyers ? (
                            <SelectItem value="loading" disabled>Loading buyers...</SelectItem>
                          ) : availableLeads.length === 0 ? (
                            <SelectItem value="no-leads" disabled>No leads available</SelectItem>
                          ) : (
                            availableLeads.map((lead) => (
                              <SelectItem key={lead} value={lead}>
                                <div className="flex items-center gap-2">
                                  <span>👤</span>
                                  <span>{lead}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Select from buyers in buying projects (Supabase)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="source">
                        Source
                      </Label>
                      <Input
                        id="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g., Advertisement, Reference, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="primaryContact">
                        Primary Point of Contact
                      </Label>
                      <Input
                        id="primaryContact"
                        value={primaryContact}
                        onChange={(e) => setPrimaryContact(e.target.value)}
                        placeholder="Enter primary contact"
                      />
                    </div>
                  </>
                )}

                {type === "seller" && (
                  <>
                    <div>
                      <Label>
                        Projects Owned
                      </Label>
                      
                      {/* Filter Input */}
                      <Input
                        placeholder="🔍 Search projects (e.g., 'ro' for Royal Garden, Rover...)"
                        value={projectFilter}
                        onChange={(e) => setProjectFilter(e.target.value)}
                        className="mb-2 border-orange-200"
                      />
                      
                      <Select
                        value={projectsOwned.split(",")[0]?.trim() || ""}
                        onValueChange={(value) => {
                          const currentIds = projectsOwned
                            .split(",")
                            .map(p => p.trim())
                            .filter(p => p);
                          if (!currentIds.includes(value)) {
                            const newValue = currentIds.length > 0 
                              ? `${projectsOwned}, ${value}`
                              : value;
                            setProjectsOwned(newValue);
                          }
                        }}
                      >
                        <SelectTrigger className="border-2 border-orange-200">
                          <SelectValue placeholder="Select projects..." />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Regular selling projects */}
                          {allProjects.filter(project => 
                            projectFilter === "" || 
                            project.name.toLowerCase().includes(projectFilter.toLowerCase()) ||
                            project.city.toLowerCase().includes(projectFilter.toLowerCase())
                          ).length > 0 && (
                            <>
                              <SelectItem value="header-projects" disabled className="font-semibold opacity-50">
                                🏢 Selling Projects
                              </SelectItem>
                              {allProjects
                                .filter(project => 
                                  projectFilter === "" || 
                                  project.name.toLowerCase().includes(projectFilter.toLowerCase()) ||
                                  project.city.toLowerCase().includes(projectFilter.toLowerCase())
                                )
                                .map((project) => (
                                  <SelectItem key={`project-${project.id}`} value={project.id}>
                                    {project.name} ({project.city})
                                  </SelectItem>
                                ))}
                            </>
                          )}
                          
                          {/* Property names from buying leads */}
                          {leadPropertyNames.filter(propertyName =>
                            projectFilter === "" ||
                            propertyName.toLowerCase().includes(projectFilter.toLowerCase())
                          ).length > 0 && (
                            <>
                              <SelectItem value="header-leads" disabled className="font-semibold opacity-50 mt-2">
                                🏠 Leads from Buying Projects
                              </SelectItem>
                              {leadPropertyNames
                                .filter(propertyName =>
                                  projectFilter === "" ||
                                  propertyName.toLowerCase().includes(projectFilter.toLowerCase())
                                )
                                .map((propertyName) => (
                                  <SelectItem key={`lead-${propertyName}`} value={propertyName}>
                                    {propertyName}
                                  </SelectItem>
                                ))}
                            </>
                          )}
                          
                          {allProjects.filter(project => 
                            projectFilter === "" || 
                            project.name.toLowerCase().includes(projectFilter.toLowerCase()) ||
                            project.city.toLowerCase().includes(projectFilter.toLowerCase())
                          ).length === 0 && 
                          leadPropertyNames.filter(propertyName =>
                            projectFilter === "" ||
                            propertyName.toLowerCase().includes(projectFilter.toLowerCase())
                          ).length === 0 && (
                            <SelectItem value="no-projects" disabled>
                              {projectFilter ? "No matching projects found" : "No projects available"}
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {projectsOwned && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {projectsOwned.split(",").map((id) => {
                            const trimmedId = id.trim();
                            if (!trimmedId) return null;
                            const project = allProjects.find(p => p.id === trimmedId);
                            return (
                              <Badge
                                key={trimmedId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {project ? project.name : trimmedId}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentIds = projectsOwned
                                      .split(",")
                                      .map(p => p.trim())
                                      .filter(p => p !== trimmedId);
                                    setProjectsOwned(currentIds.join(", "));
                                  }}
                                  className="ml-1 hover:text-red-600"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Use the search box to filter, then select from the dropdown to add projects
                      </p>
                    </div>
                    
                    {/* Custom Property Text Area */}
                    <div>
                      <Label htmlFor="customProperty">
                        Cannot Find the Property?
                      </Label>
                      <Textarea
                        id="customProperty"
                        value={customProperty}
                        onChange={(e) => setCustomProperty(e.target.value)}
                        placeholder="If the property is not listed above, describe it here..."
                        rows={3}
                        className="border-orange-200"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use this field if the seller's property is not in the system
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="leadName">
                        Lead Name
                      </Label>
                      <Select value={leadName} onValueChange={setLeadName}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lead name..." />
                        </SelectTrigger>
                        <SelectContent>
                          {loadingBuyers ? (
                            <SelectItem value="loading" disabled>Loading buyers...</SelectItem>
                          ) : availableLeads.length === 0 ? (
                            <SelectItem value="no-leads" disabled>No leads available</SelectItem>
                          ) : (
                            availableLeads.map((lead) => (
                              <SelectItem key={lead} value={lead}>
                                <div className="flex items-center gap-2">
                                  <span>👤</span>
                                  <span>{lead}</span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        💡 Select from buyers in buying projects (Supabase)
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="source">
                        Source
                      </Label>
                      <Input
                        id="source"
                        value={source}
                        onChange={(e) => setSource(e.target.value)}
                        placeholder="e.g., Advertisement, Reference, etc."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="primaryContact">
                        Primary Point of Contact
                      </Label>
                      <Input
                        id="primaryContact"
                        value={primaryContact}
                        onChange={(e) => setPrimaryContact(e.target.value)}
                        placeholder="Enter primary contact"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            </motion.div>
          </div>

          {/* Journey Tracking (Buyers Only) */}
          {type === "buyer" && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Journey Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="registrationDate">
                    Registration Date
                  </Label>
                  <Input
                    id="registrationDate"
                    type="date"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="legalDoc"
                      checked={legalDocComplete}
                      onCheckedChange={(checked) =>
                        setLegalDocComplete(checked as boolean)
                      }
                    />
                    <label htmlFor="legalDoc" className="cursor-pointer text-sm">
                      Legal Documentation Complete
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="backgroundCheck"
                      checked={backgroundCheckComplete}
                      onCheckedChange={(checked) =>
                        setBackgroundCheckComplete(checked as boolean)
                      }
                    />
                    <label htmlFor="backgroundCheck" className="cursor-pointer text-sm">
                      Background Check Complete
                    </label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sold"
                      checked={sold}
                      onCheckedChange={(checked) => setSold(checked as boolean)}
                    />
                    <label htmlFor="sold" className="cursor-pointer text-sm">
                      Property Sold
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                placeholder="Add notes about this client..."
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => navigateTo("admin-clients", undefined, undefined, undefined)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Client"}
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {name}? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Client Alert Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              ⚠️ Duplicate Client Detected
            </DialogTitle>
            <DialogDescription>
              A client with this phone number already exists in the system.
            </DialogDescription>
          </DialogHeader>
          {duplicateClient && (
            <div className="space-y-4 py-4">
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <div>
                        <div className="text-sm text-gray-500">Name</div>
                        <div className="font-semibold">{duplicateClient.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-amber-600" />
                      <div>
                        <div className="text-sm text-gray-500">Type</div>
                        <div className="font-semibold capitalize">{duplicateClient.type}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4">📞</span>
                      <div>
                        <div className="text-sm text-gray-500">Phone</div>
                        <div className="font-semibold">{duplicateClient.phone}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4">✉️</span>
                      <div>
                        <div className="text-sm text-gray-500">Email</div>
                        <div className="font-semibold">{duplicateClient.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={
                        duplicateClient.status === "red" ? "bg-red-500" :
                        duplicateClient.status === "amber" ? "bg-amber-500" :
                        "bg-green-500"
                      }>
                        {duplicateClient.status.toUpperCase()} STATUS
                      </Badge>
                    </div>
                    {duplicateClient.projectsInterested && duplicateClient.projectsInterested.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Interested Projects</div>
                        <div className="flex flex-wrap gap-1">
                          {duplicateClient.projectsInterested.map((projId: string) => (
                            <Badge key={projId} variant="outline" className="text-xs">
                              {projId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                💡 <strong>Tip:</strong> Instead of creating a duplicate, consider updating the existing client record or adding a new project to their interested projects list.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setDuplicateDialogOpen(false);
                if (duplicateClient) {
                  navigateTo("admin-client-detail", undefined, duplicateClient.id, undefined);
                }
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              View Existing Client
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}