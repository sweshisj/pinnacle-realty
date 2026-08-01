import React, { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { ArrowLeft, Edit, Trash2, ArrowRight, Plus, Save, X, Upload, ImageIcon, AlertCircle, RefreshCw } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { uploadImage } from "../../utils/supabase/uploadImage";
import { testStorageBucket } from "../../utils/supabase/testStorage";
import {
  getAllBuyers,
  createBuyer,
  updateBuyer,
  deleteBuyer,
  addLeadToBuyer,
  updateLead,
  deleteLeadFromBuyer,
  initializeBuyersTable,
  migrateLocalStorageToBuyers,
  type Buyer,
  type Lead,
} from "../../utils/supabase/buyerOperations";

interface AdminBuyingProjectsProps {
  navigateTo: (page: any, projectId?: string, clientId?: string, statusFilter?: string, searchData?: any, projectData?: any) => void;
  onLeadMovedToSelling?: (buyerId: string, leadId: string) => void;
}

export function AdminBuyingProjects({ navigateTo, onLeadMovedToSelling }: AdminBuyingProjectsProps) {
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Dialog states
  const [buyerDialogOpen, setBuyerDialogOpen] = useState(false);
  const [editingBuyer, setEditingBuyer] = useState<Buyer | null>(null);
  const [buyerName, setBuyerName] = useState("");
  
  const [leadDialogOpen, setLeadDialogOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editingLeadBuyerId, setEditingLeadBuyerId] = useState("");
  const [leadPropertyName, setLeadPropertyName] = useState("");
  const [leadType, setLeadType] = useState("Apartment");
  const [leadLocation, setLeadLocation] = useState("");
  const [leadCity, setLeadCity] = useState("");
  const [leadImageUrl, setLeadImageUrl] = useState("");
  const [leadContactName, setLeadContactName] = useState("");
  const [leadContactCountryCode, setLeadContactCountryCode] = useState("+61");
  const [leadContactPhone, setLeadContactPhone] = useState("");
  const [leadContactEmail, setLeadContactEmail] = useState("");
  const [leadDescription, setLeadDescription] = useState("");
  const [leadStatus, setLeadStatus] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storageReady, setStorageReady] = useState<boolean | null>(null);
  const [storageError, setStorageError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load buyers from Supabase
  const loadBuyers = async () => {
    setRefreshing(true);
    const result = await getAllBuyers();
    if (result.success && result.data) {
      setBuyers(result.data);
      
      // Update selected buyer if it exists
      if (selectedBuyer) {
        const updatedSelectedBuyer = result.data.find(b => b.id === selectedBuyer.id);
        if (updatedSelectedBuyer) {
          setSelectedBuyer(updatedSelectedBuyer);
        }
      }
    } else {
      console.error('Error loading buyers:', result.error);
      toast.error(`Failed to load buyers: ${result.error}`);
    }
    setRefreshing(false);
    setLoading(false);
  };

  // Initialize table and load buyers on mount
  useEffect(() => {
    const initialize = async () => {
      // Initialize table
      await initializeBuyersTable();
      
      // Check if we should migrate from localStorage
      const stored = localStorage.getItem('buyersData');
      if (stored) {
        const localBuyers = JSON.parse(stored);
        if (localBuyers.length > 0) {
          const confirm = window.confirm(
            `Found ${localBuyers.length} buyer(s) in localStorage. Would you like to migrate them to Supabase database?`
          );
          if (confirm) {
            const result = await migrateLocalStorageToBuyers();
            if (result.success) {
              toast.success(`✅ Migrated ${result.count} buyer(s) to Supabase!`);
              localStorage.removeItem('buyersData');
            } else {
              toast.error(`Migration failed: ${result.error}`);
            }
          }
        }
      }
      
      // Load buyers from Supabase
      await loadBuyers();
    };

    initialize();
  }, []);

  // Test Supabase Storage on component mount
  useEffect(() => {
    const checkStorage = async () => {
      const result = await testStorageBucket();
      setStorageReady(result.success);
      if (!result.success) {
        setStorageError(result.message);
        console.error('Storage bucket check failed:', result);
      }
    };
    checkStorage();
  }, []);

  // Check for leads that should be removed after successful project creation
  useEffect(() => {
    const leadsToRemove = localStorage.getItem('leadsToRemoveFromBuying');
    if (leadsToRemove) {
      try {
        const { buyerId, leadId } = JSON.parse(leadsToRemove);
        console.log('🔄 Removing lead from buying projects:', { buyerId, leadId });
        
        // Remove the lead from Supabase
        const removeLead = async () => {
          const result = await deleteLeadFromBuyer(buyerId, leadId);
          if (result.success) {
            console.log(`✅ Lead removed from Supabase`);
            toast.success("✅ Lead successfully moved to selling projects!");
            // Reload buyers to get updated data
            await loadBuyers();
          } else {
            console.error('❌ Error removing lead:', result.error);
            toast.error(`Failed to remove lead: ${result.error}`);
          }
        };
        
        removeLead();
        
        // Clear the localStorage item
        localStorage.removeItem('leadsToRemoveFromBuying');
      } catch (error) {
        console.error('❌ Error removing lead:', error);
      }
    }
  }, []);

  const handleEditBuyer = (buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    if (buyer) {
      setEditingBuyer(buyer);
      setBuyerName(buyer.name);
      setBuyerDialogOpen(true);
    }
  };

  const handleAddBuyer = () => {
    setEditingBuyer(null);
    setBuyerName("");
    setBuyerDialogOpen(true);
  };

  const handleSaveBuyer = async () => {
    if (!buyerName.trim()) {
      toast.error("Please enter buyer name");
      return;
    }

    if (editingBuyer) {
      // Update existing buyer
      const result = await updateBuyer(editingBuyer.id, { name: buyerName });
      if (result.success) {
        toast.success("✏️ Buyer updated successfully!");
        await loadBuyers();
      } else {
        toast.error(`Failed to update buyer: ${result.error}`);
      }
    } else {
      // Add new buyer
      const newBuyer: Buyer = {
        id: Date.now().toString(),
        name: buyerName,
        leads: [],
      };
      const result = await createBuyer(newBuyer);
      if (result.success) {
        toast.success("✨ New buyer added successfully!");
        await loadBuyers();
      } else {
        toast.error(`Failed to create buyer: ${result.error}`);
      }
    }

    setBuyerDialogOpen(false);
    setBuyerName("");
    setEditingBuyer(null);
  };

  const handleAddLead = (buyerId: string) => {
    setEditingLead(null);
    setEditingLeadBuyerId(buyerId);
    setLeadPropertyName("");
    setLeadType("Apartment");
    setLeadLocation("");
    setLeadCity("");
    setLeadImageUrl("");
    setLeadContactName("");
    setLeadContactCountryCode("+61");
    setLeadContactPhone("");
    setLeadContactEmail("");
    setLeadDescription("");
    setLeadStatus("");
    setImageFile(null);
    setImagePreview("");
    setLeadDialogOpen(true);
  };

  const handleEditLead = (buyerId: string, lead: Lead) => {
    setEditingLead(lead);
    setEditingLeadBuyerId(buyerId);
    setLeadPropertyName(lead.propertyName);
    setLeadType(lead.type);
    setLeadLocation(lead.location);
    setLeadCity(lead.city);
    setLeadImageUrl(lead.imageUrl);
    setLeadContactName(lead.contactName);
    setLeadContactCountryCode(lead.contactPhone.startsWith('+') ? lead.contactPhone.split(' ')[0] : "+61");
    setLeadContactPhone(lead.contactPhone.startsWith('+') ? lead.contactPhone.split(' ').slice(1).join(' ') : lead.contactPhone);
    setLeadContactEmail(lead.contactEmail);
    setLeadDescription(lead.description);
    setLeadStatus(lead.status);
    setImageFile(null);
    setImagePreview(lead.imageUrl);
    setLeadDialogOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setLeadImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteLead = async (buyerId: string, leadId: string) => {
    const result = await deleteLeadFromBuyer(buyerId, leadId);
    if (result.success) {
      toast.success("🗑️ Lead deleted successfully!");
      await loadBuyers();
    } else {
      toast.error(`Failed to delete lead: ${result.error}`);
    }
  };

  const handleSaveLead = async () => {
    if (!leadPropertyName.trim() || !leadLocation.trim() || !leadCity.trim() || !leadContactName.trim() || !leadContactPhone.trim()) {
      toast.error("Please fill in required fields");
      return;
    }

    // Combine country code and phone number
    const formattedPhone = `${leadContactCountryCode} ${leadContactPhone.trim()}`;

    // Check if storage is ready before attempting upload
    if (imageFile && storageReady === false) {
      toast.error("Supabase Storage is not configured. Please set up the storage bucket first.");
      return;
    }

    let finalImageUrl = leadImageUrl;

    // Upload image if a new file is selected
    if (imageFile) {
      console.log('Starting image upload...', { fileName: imageFile.name, fileSize: imageFile.size });
      setUploadingImage(true);
      try {
        finalImageUrl = await uploadImage(imageFile);
        console.log('Image uploaded successfully:', finalImageUrl);
        toast.success("📸 Image uploaded successfully!");
      } catch (error: any) {
        console.error("Error uploading image:", error);
        toast.error(`Failed to upload image: ${error.message || 'Unknown error'}. Check console for details.`);
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    console.log('Saving lead with image URL:', finalImageUrl);

    if (editingLead && editingLeadBuyerId) {
      // Update existing lead
      const result = await updateLead(editingLeadBuyerId, editingLead.id, {
        propertyName: leadPropertyName,
        type: leadType,
        location: leadLocation,
        city: leadCity,
        imageUrl: finalImageUrl,
        contactName: leadContactName,
        contactPhone: formattedPhone,
        contactEmail: leadContactEmail,
        description: leadDescription,
        status: leadStatus,
      });
      
      if (result.success) {
        toast.success("✏️ Lead updated successfully!");
        await loadBuyers();
      } else {
        toast.error(`Failed to update lead: ${result.error}`);
        return;
      }
    } else if (editingLeadBuyerId) {
      // Create new lead
      const newLead: Lead = {
        id: Date.now().toString(),
        propertyName: leadPropertyName,
        type: leadType,
        location: leadLocation,
        city: leadCity,
        imageUrl: finalImageUrl,
        contactName: leadContactName,
        contactPhone: formattedPhone,
        contactEmail: leadContactEmail,
        description: leadDescription,
        status: leadStatus,
      };

      const result = await addLeadToBuyer(editingLeadBuyerId, newLead);
      if (result.success) {
        toast.success("✨ Lead created successfully!");
        await loadBuyers();
      } else {
        toast.error(`Failed to create lead: ${result.error}`);
        return;
      }
    }

    // Reset and close
    setLeadDialogOpen(false);
    setEditingLead(null);
    setEditingLeadBuyerId("");
    setLeadPropertyName("");
    setLeadType("Apartment");
    setLeadLocation("");
    setLeadCity("");
    setLeadImageUrl("");
    setLeadContactName("");
    setLeadContactCountryCode("+61");
    setLeadContactPhone("");
    setLeadContactEmail("");
    setLeadDescription("");
    setLeadStatus("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleDeleteBuyer = async (buyerId: string) => {
    const result = await deleteBuyer(buyerId);
    if (result.success) {
      toast.success("🗑️ Buyer removed successfully!");
      if (selectedBuyer?.id === buyerId) {
        setSelectedBuyer(null);
      }
      await loadBuyers();
    } else {
      toast.error(`Failed to delete buyer: ${result.error}`);
    }
  };

  const handleMoveToSelling = (buyerId: string, lead: Lead) => {
    // Find the buyer name
    const buyer = buyers.find(b => b.id === buyerId);
    const buyerName = buyer?.name || "";
    
    // Pass lead data to the create project page, including buyerId, leadId, and buyer name
    const projectData = {
      propertyName: lead.propertyName,
      type: lead.type,
      location: lead.location,
      city: lead.city,
      description: lead.description,
      buyerId: buyerId,
      leadId: lead.id,
      leadName: buyerName,
    };
    
    // Don't remove lead yet - it will be removed after successful project creation
    
    // Navigate to create page with pre-filled data
    toast.success("🚀 Moving lead to selling projects...");
    navigateTo("admin-project-create", undefined, undefined, undefined, undefined, projectData);
  };

  const getTypeEmoji = (type: string) => {
    switch (type) {
      case "Apartment": return "🏢";
      case "Villa": return "🏡";
      case "Plot": return "🏞️";
      case "Serviced Apartment": return "🏨";
      case "Commercial": return "🏪";
      default: return "🏠";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-xl text-gray-600">Loading buyers from Supabase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigateTo("admin-projects")}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Selling Projects
            </Button>
            <Button
              variant="outline"
              onClick={loadBuyers}
              disabled={refreshing}
              className="border-2 border-purple-300 hover:bg-purple-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
              🛒 Buying Projects
            </h1>
            <p className="text-gray-600">
              ✨ Manage buying leads and convert them to selling projects (Powered by Supabase)
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Buyers List */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-2 border-purple-200 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span> Buyers
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {buyers.reduce((sum, b) => sum + b.leads.length, 0)} leads
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {buyers.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-3">📭</div>
                      <p className="text-gray-500 mb-2">No buyers yet</p>
                      <p className="text-xs text-gray-400">Click "Add New Buyer" to get started</p>
                    </div>
                  )}
                  {buyers.map((buyer, index) => (
                    <motion.div
                      key={buyer.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedBuyer(buyer)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedBuyer?.id === buyer.id
                          ? "bg-gradient-to-r from-purple-100 to-pink-100 border-purple-400 shadow-lg"
                          : "bg-white border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="text-2xl">
                            👤
                          </div>
                          <span className="font-medium">{buyer.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {buyer.leads.length} leads
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditBuyer(buyer.id);
                          }}
                          className="flex-1 text-xs border border-blue-200 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBuyer(buyer.id);
                          }}
                          className="flex-1 text-xs border border-red-200 hover:bg-red-50 text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Add New Buyer Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: buyers.length * 0.1 + 0.1 }}
                  >
                    <Button
                      onClick={handleAddBuyer}
                      variant="outline"
                      className="w-full border-2 border-dashed border-purple-300 hover:border-purple-500 hover:bg-purple-50 transition-all"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      ➕ Add New Buyer
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leads Section */}
          <div className="lg:col-span-2">
            {selectedBuyer ? (
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mb-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl mb-1">
                        Leads for {selectedBuyer.name}
                      </h2>
                      <p className="text-gray-600">
                        {selectedBuyer.leads.length} active{" "}
                        {selectedBuyer.leads.length === 1 ? "lead" : "leads"}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleAddLead(selectedBuyer.id)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      ➕ Add New Lead
                    </Button>
                  </div>
                </motion.div>

                <div className="space-y-6">
                  {selectedBuyer.leads.map((lead, index) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="overflow-hidden bg-white/90 backdrop-blur-sm border-2 border-purple-100 shadow-lg hover:shadow-xl transition-all">
                        <div className="grid md:grid-cols-3 gap-0">
                          {/* Image */}
                          <div className="relative">
                            <ImageWithFallback
                              src={lead.imageUrl}
                              alt={lead.type}
                              className="w-full h-full object-cover min-h-[200px]"
                            />
                            <Badge className="absolute top-3 left-3 bg-white/95 text-purple-700 border-2 border-purple-300">
                              {getTypeEmoji(lead.type)} {lead.type}
                            </Badge>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                              <h3 className="text-white font-medium truncate">
                                {lead.propertyName}
                              </h3>
                              <p className="text-white/80 text-xs truncate">
                                📍 {lead.location}, {lead.city}
                              </p>
                            </div>
                          </div>

                          {/* Content */}
                          <div className="md:col-span-2 p-6">
                            <div className="mb-4">
                              <h3 className="text-xl mb-2 flex items-center gap-2">
                                📞 Contact Information
                              </h3>
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-gray-500">Name:</span>{" "}
                                  <span className="font-medium">{lead.contactName}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Phone:</span>{" "}
                                  <span className="font-medium">{lead.contactPhone}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">Email:</span>{" "}
                                  <span className="font-medium">{lead.contactEmail}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mb-4">
                              <h4 className="text-sm text-gray-500 mb-1">
                                📝 Description
                              </h4>
                              <p className="text-sm text-gray-700">
                                {lead.description}
                              </p>
                            </div>

                            <div className="mb-4">
                              <h4 className="text-sm text-gray-500 mb-1">
                                📊 Status
                              </h4>
                              <Badge variant="outline" className="text-xs">
                                {lead.status}
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  className="flex-1 border-2 border-blue-200 hover:bg-blue-50"
                                  onClick={() => handleEditLead(selectedBuyer.id, lead)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  ✏️ Edit
                                </Button>
                                <Button
                                  variant="outline"
                                  className="border-2 border-red-200 hover:bg-red-50 text-red-600"
                                  onClick={() => handleDeleteLead(selectedBuyer.id, lead.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <Button
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                onClick={() => handleMoveToSelling(selectedBuyer.id, lead)}
                              >
                                <ArrowRight className="mr-2 h-4 w-4" />
                                Move to Selling Projects 🚀
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-white/90 backdrop-blur-sm border-2 border-gray-200 shadow-lg">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <div className="text-6xl mb-4">👈</div>
                    <p className="text-xl text-gray-500 mb-2">
                      Select a buyer to view their leads
                    </p>
                    <p className="text-sm text-gray-400">
                      Click on a buyer name from the list
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Buyer Dialog */}
        <Dialog open={buyerDialogOpen} onOpenChange={setBuyerDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingBuyer ? "✏️ Edit Buyer" : "➕ Add New Buyer"}
              </DialogTitle>
              <DialogDescription>
                {editingBuyer 
                  ? "Update buyer information"
                  : "Add a new buyer to track their leads"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="buyer-name" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">👤</span>
                  <span>Buyer Name</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="buyer-name"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="e.g., John Doe"
                  className="border-2 border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBuyerDialogOpen(false);
                  setBuyerName("");
                  setEditingBuyer(null);
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveBuyer}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {editingBuyer ? "💾 Update" : "✨ Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Dialog */}
        <Dialog open={leadDialogOpen} onOpenChange={setLeadDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingLead ? "✏️ Edit Lead" : "➕ Add New Lead"}
              </DialogTitle>
              <DialogDescription>
                {editingLead 
                  ? "Update lead information"
                  : "Add a new lead to track for this buyer"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="lead-property-name" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏡</span>
                  <span>Property Name</span>
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="lead-property-name"
                  value={leadPropertyName}
                  onChange={(e) => setLeadPropertyName(e.target.value)}
                  placeholder="e.g., Green Valley Apartments"
                  className="border-2 border-purple-200 focus:border-purple-400"
                />
              </div>

              <div>
                <Label htmlFor="lead-type" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🏢</span>
                  <span>Property Type</span>
                </Label>
                <Select value={leadType} onValueChange={setLeadType}>
                  <SelectTrigger className="border-2 border-purple-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartment">🏢 Apartment</SelectItem>
                    <SelectItem value="Villa">🏡 Villa</SelectItem>
                    <SelectItem value="Plot">🏞️ Plot</SelectItem>
                    <SelectItem value="Serviced Apartment">🏨 Serviced Apartment</SelectItem>
                    <SelectItem value="Commercial">🏪 Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🖼️</span>
                  <span>Property Image</span>
                </Label>
                
                {/* Storage Warning */}
                {storageReady === false && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Storage Not Configured</AlertTitle>
                    <AlertDescription className="text-xs">
                      {storageError}
                      <br />
                      <span className="font-semibold mt-1 block">
                        Please follow the setup instructions in SUPABASE_STORAGE_SETUP.md
                      </span>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="lead-image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-purple-200 hover:bg-purple-50"
                      disabled={storageReady === false}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {imageFile || imagePreview ? "Change Image" : "Upload Image"}
                    </Button>
                    {(imageFile || imagePreview) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="border-2 border-red-200 hover:bg-red-50 text-red-600"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative w-full h-40 rounded-lg overflow-hidden border-2 border-purple-200">
                      <ImageWithFallback
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                        <ImageIcon className="mr-1 h-3 w-3" />
                        Preview
                      </Badge>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, GIF. Max size: 5MB
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead-location" className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📍</span>
                    <span>Area/Locality</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lead-location"
                    value={leadLocation}
                    onChange={(e) => setLeadLocation(e.target.value)}
                    placeholder="e.g., Anna Nagar West"
                    className="border-2 border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-city" className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏙️</span>
                    <span>City</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lead-city"
                    value={leadCity}
                    onChange={(e) => setLeadCity(e.target.value)}
                    placeholder="e.g., Sydney"
                    className="border-2 border-purple-200 focus:border-purple-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lead-contact-name" className="flex items-center gap-2 mb-2">
                    <span className="text-lg">👤</span>
                    <span>Contact Name</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lead-contact-name"
                    value={leadContactName}
                    onChange={(e) => setLeadContactName(e.target.value)}
                    placeholder="e.g., Rajesh Kumar"
                    className="border-2 border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-contact-phone" className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📞</span>
                    <span>Contact Phone</span>
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select value={leadContactCountryCode} onValueChange={setLeadContactCountryCode}>
                      <SelectTrigger className="w-[130px] border-2 border-purple-200">
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
                      id="lead-contact-phone"
                      value={leadContactPhone}
                      onChange={(e) => setLeadContactPhone(e.target.value)}
                      placeholder="98765 43210"
                      className="flex-1 border-2 border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="lead-contact-email" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📧</span>
                  <span>Contact Email</span>
                </Label>
                <Input
                  id="lead-contact-email"
                  value={leadContactEmail}
                  onChange={(e) => setLeadContactEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="border-2 border-purple-200 focus:border-purple-400"
                />
              </div>

              <div>
                <Label htmlFor="lead-description" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <span>Description</span>
                </Label>
                <Textarea
                  id="lead-description"
                  value={leadDescription}
                  onChange={(e) => setLeadDescription(e.target.value)}
                  placeholder="Property details..."
                  rows={3}
                  className="border-2 border-purple-200 focus:border-purple-400 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="lead-status" className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📊</span>
                  <span>Status</span>
                </Label>
                <Input
                  id="lead-status"
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value)}
                  placeholder="e.g., Scheduled site visit"
                  className="border-2 border-purple-200 focus:border-purple-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setLeadDialogOpen(false);
                  setEditingLead(null);
                  setEditingLeadBuyerId("");
                  setImageFile(null);
                  setImagePreview("");
                }}
                disabled={uploadingImage}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSaveLead}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingLead ? "💾 Update Lead" : "✨ Create Lead"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}