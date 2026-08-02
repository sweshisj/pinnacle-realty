import React, { useState, useEffect, useRef } from 'react';
import { brand } from "../../config/brand";
import { ArrowLeft, Save, Upload, X, Calendar as CalendarIcon, Plus, Trash2, Image, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  ServicedApartment,
  Availability,
  createServicedApartment,
  updateServicedApartment,
  fetchApartmentAvailability,
  upsertAvailability,
  deleteAvailability
} from '../../utils/supabase/servicedApartmentsOperations';
import { PropertyLocationPicker } from '../PropertyLocationPicker';

interface AdminServicedApartmentEditorProps {
  apartment?: ServicedApartment;
  onBack: () => void;
  onSave: () => void;
}

export default function AdminServicedApartmentEditor({ apartment, onBack, onSave }: AdminServicedApartmentEditorProps) {
  const isEdit = !!apartment;
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<Partial<ServicedApartment>>({
    title: apartment?.title || '',
    type: apartment?.type || 'Studio',
    city: apartment?.city || '',
    location: apartment?.location || '',
    address: apartment?.address || '',
    latitude: apartment?.latitude,
    longitude: apartment?.longitude,
    sleeps: apartment?.sleeps || 2,
    bedrooms: apartment?.bedrooms || 1,
    bathrooms: apartment?.bathrooms || 1,
    size_sqft: apartment?.size_sqft || undefined,
    nightly_price: apartment?.nightly_price || undefined,
    weekly_price: apartment?.weekly_price || undefined,
    monthly_price: apartment?.monthly_price || undefined,
    security_deposit: apartment?.security_deposit || undefined,
    cleaning_fee: apartment?.cleaning_fee || undefined,
    tax_percentage: apartment?.tax_percentage || 18,
    minimum_stay_nights: apartment?.minimum_stay_nights || 1,
    inclusions: apartment?.inclusions || [],
    housekeeping_frequency: apartment?.housekeeping_frequency || 'Daily',
    wifi_speed: apartment?.wifi_speed || '',
    has_kitchen: apartment?.has_kitchen || false,
    has_laundry: apartment?.has_laundry || false,
    has_parking: apartment?.has_parking || false,
    has_gym: apartment?.has_gym || false,
    has_pool: apartment?.has_pool || false,
    has_security: apartment?.has_security || false,
    has_lift: apartment?.has_lift || false,
    has_balcony: apartment?.has_balcony || false,
    has_tv: apartment?.has_tv || false,
    amenities: apartment?.amenities || [],
    check_in_time: apartment?.check_in_time || '14:00',
    check_out_time: apartment?.check_out_time || '11:00',
    cancellation_policy: apartment?.cancellation_policy || 'Moderate',
    smoking_allowed: apartment?.smoking_allowed || false,
    pets_allowed: apartment?.pets_allowed || false,
    parties_allowed: apartment?.parties_allowed || false,
    instant_book: apartment?.instant_book || false,
    kyc_required: apartment?.kyc_required || true,
    gst_invoice_available: apartment?.gst_invoice_available || true,
    main_image: apartment?.main_image || '',
    images: apartment?.images || [],
    floor_plan_image: apartment?.floor_plan_image || '',
    video_url: apartment?.video_url || '',
    is_active: apartment?.is_active ?? true,
    featured: apartment?.featured || false,
    highlights: apartment?.highlights || [],
    description: apartment?.description || ''
  });

  const [availability, setAvailability] = useState<Availability[]>([]);
  const [newInclusionInput, setNewInclusionInput] = useState('');
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [newImageInput, setNewImageInput] = useState('');
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    start_date: undefined as Date | undefined,
    end_date: undefined as Date | undefined,
    status: 'blocked' as 'blocked' | 'booked' | 'pending',
    notes: ''
  });

  useEffect(() => {
    if (apartment?.id) {
      loadAvailability();
    }
  }, [apartment?.id]);

  const loadAvailability = async () => {
    if (!apartment?.id) return;
    const { data } = await fetchApartmentAvailability(apartment.id);
    if (data) {
      setAvailability(data);
    }
  };

  const handleSave = async () => {
    // Validation
    if (!formData.title || !formData.city || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    let result;

    if (isEdit && apartment) {
      result = await updateServicedApartment(apartment.id, formData);
    } else {
      result = await createServicedApartment(formData as Omit<ServicedApartment, 'id' | 'created_at' | 'updated_at'>);
    }

    setSaving(false);

    if (result.error) {
      console.error(`❌ Error ${isEdit ? 'updating' : 'creating'} apartment:`, result.error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} apartment: ${result.error}`);
      return;
    }

    toast.success(`Apartment ${isEdit ? 'updated' : 'created'} successfully`);
    onSave();
  };

  const handleAddInclusion = () => {
    if (newInclusionInput.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...(prev.inclusions || []), newInclusionInput.trim()]
      }));
      setNewInclusionInput('');
    }
  };

  const handleRemoveInclusion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions?.filter((_, i) => i !== index)
    }));
  };

  const handleAddHighlight = () => {
    if (newHighlightInput.trim()) {
      setFormData(prev => ({
        ...prev,
        highlights: [...(prev.highlights || []), newHighlightInput.trim()]
      }));
      setNewHighlightInput('');
    }
  };

  const handleRemoveHighlight = (index: number) => {
    setFormData(prev => ({
      ...prev,
      highlights: prev.highlights?.filter((_, i) => i !== index)
    }));
  };

  const handleAddAmenity = () => {
    if (newAmenityInput.trim()) {
      setFormData(prev => ({
        ...prev,
        amenities: [...(prev.amenities || []), newAmenityInput.trim()]
      }));
      setNewAmenityInput('');
    }
  };

  const handleRemoveAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities?.filter((_, i) => i !== index)
    }));
  };

  const handleAddImage = () => {
    if (newImageInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), newImageInput.trim()]
      }));
      setNewImageInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'gallery' | 'floor_plan') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For floor plan, accept PDF
    if (type === 'floor_plan') {
      if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
        toast.error('Please select a PDF or image file for floor plan');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, floor_plan_image: base64String }));
        toast.success('Floor plan uploaded successfully');
      };
      reader.readAsDataURL(file);
      return;
    }

    // For main and gallery images
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      
      if (type === 'main') {
        setFormData(prev => ({ ...prev, main_image: base64String }));
        toast.success('Main image uploaded successfully');
      } else if (type === 'gallery') {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), base64String]
        }));
        toast.success('Image added to gallery');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddAvailability = async () => {
    if (!newAvailability.start_date || !newAvailability.end_date || !apartment?.id) {
      toast.error('Please select start and end dates');
      return;
    }

    const { error } = await upsertAvailability({
      apartment_id: apartment.id,
      start_date: format(newAvailability.start_date, 'yyyy-MM-dd'),
      end_date: format(newAvailability.end_date, 'yyyy-MM-dd'),
      status: newAvailability.status,
      notes: newAvailability.notes
    });

    if (error) {
      toast.error('Failed to add availability');
      return;
    }

    toast.success('Availability added');
    setAvailabilityDialogOpen(false);
    setNewAvailability({
      start_date: undefined,
      end_date: undefined,
      status: 'blocked',
      notes: ''
    });
    loadAvailability();
  };

  const handleDeleteAvailability = async (id: string) => {
    const { error } = await deleteAvailability(id);
    if (error) {
      toast.error('Failed to delete availability');
      return;
    }
    toast.success('Availability deleted');
    loadAvailability();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="mb-1">{isEdit ? 'Edit' : 'Create'} Unit</h2>
            <p className="text-gray-600 text-sm">
              {isEdit ? `Editing ${apartment.title}` : 'Add a new serviced apartment unit'}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Saving...' : 'Save Unit'}
        </Button>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="location">Location</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="availability">Availability</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="policies">Policies & Amenities</TabsTrigger>
            </TabsList>

            {/* Details Tab */}
            <TabsContent value="details" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Executive Studio in MG Road"
                  />
                </div>

                <div>
                  <Label htmlFor="type">Type *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Studio">Studio</SelectItem>
                      <SelectItem value="1BHK">1BHK</SelectItem>
                      <SelectItem value="2BHK">2BHK</SelectItem>
                      <SelectItem value="3BHK">3BHK</SelectItem>
                      <SelectItem value="4BHK">4BHK</SelectItem>
                      <SelectItem value="Penthouse">Penthouse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={`e.g., ${brand.cities[0]}`}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., MG Road"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Complete address"
                  />
                </div>

                <div>
                  <Label htmlFor="sleeps">Sleeps *</Label>
                  <Input
                    id="sleeps"
                    type="number"
                    value={formData.sleeps}
                    onChange={(e) => setFormData(prev => ({ ...prev, sleeps: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms}
                    onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: parseInt(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="size_sqft">Size (sqft)</Label>
                  <Input
                    id="size_sqft"
                    type="number"
                    value={formData.size_sqft ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, size_sqft: parseInt(e.target.value) || undefined }))}
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    placeholder="Describe the apartment..."
                  />
                </div>

                <div className="col-span-2">
                  <Label className="mb-2 block">Highlights</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newHighlightInput}
                      onChange={(e) => setNewHighlightInput(e.target.value)}
                      placeholder="Add highlight..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddHighlight()}
                    />
                    <Button type="button" onClick={handleAddHighlight}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.highlights?.map((highlight, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        <span>{highlight}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveHighlight(idx);
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Location Tab */}
            <TabsContent value="location" className="space-y-6 mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> After setting the location on the map below, click the <strong>"Save Location"</strong> button to apply the coordinates and address to this apartment.
                  </p>
                </div>
                
                <PropertyLocationPicker
                  value={{
                    address1: formData.address || '',
                    address2: formData.location || '',
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    city: formData.city,
                  }}
                  onChange={(location) => {
                    console.log('📍 Location updated from PropertyLocationPicker:', location);
                    setFormData(prev => ({
                      ...prev,
                      address: location.formattedAddress || location.address1 || '',
                      location: location.address2 || '',
                      // Explicitly set to null if undefined to ensure database update
                      latitude: location.latitude !== undefined ? location.latitude : null,
                      longitude: location.longitude !== undefined ? location.longitude : null,
                      city: location.city || '',
                    }));
                  }}
                />
              </div>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nightly_price">Nightly Price ($)</Label>
                  <Input
                    id="nightly_price"
                    type="number"
                    value={formData.nightly_price ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nightly_price: parseFloat(e.target.value) || undefined }))}
                  />
                </div>

                <div>
                  <Label htmlFor="weekly_price">Weekly Price ($)</Label>
                  <Input
                    id="weekly_price"
                    type="number"
                    value={formData.weekly_price ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weekly_price: parseFloat(e.target.value) || undefined }))}
                  />
                </div>

                <div>
                  <Label htmlFor="monthly_price">Monthly Price ($)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    value={formData.monthly_price ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_price: parseFloat(e.target.value) || undefined }))}
                  />
                </div>

                <div>
                  <Label htmlFor="security_deposit">Security Deposit ($)</Label>
                  <Input
                    id="security_deposit"
                    type="number"
                    value={formData.security_deposit ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, security_deposit: parseFloat(e.target.value) || undefined }))}
                  />
                </div>

                <div>
                  <Label htmlFor="cleaning_fee">Cleaning Fee ($)</Label>
                  <Input
                    id="cleaning_fee"
                    type="number"
                    value={formData.cleaning_fee ?? ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cleaning_fee: parseFloat(e.target.value) || undefined }))}
                  />
                </div>

                <div>
                  <Label htmlFor="tax_percentage">Tax Percentage (%)</Label>
                  <Input
                    id="tax_percentage"
                    type="number"
                    value={formData.tax_percentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, tax_percentage: parseFloat(e.target.value) || 18 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="minimum_stay_nights">Minimum Stay (nights)</Label>
                  <Input
                    id="minimum_stay_nights"
                    type="number"
                    value={formData.minimum_stay_nights}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_stay_nights: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div>
                  <Label htmlFor="housekeeping_frequency">Housekeeping Frequency</Label>
                  <Select 
                    value={formData.housekeeping_frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, housekeeping_frequency: value }))}
                  >
                    <SelectTrigger id="housekeeping_frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="On Request">On Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="wifi_speed">Wi-Fi Speed</Label>
                  <Input
                    id="wifi_speed"
                    value={formData.wifi_speed}
                    onChange={(e) => setFormData(prev => ({ ...prev, wifi_speed: e.target.value }))}
                    placeholder="e.g., 100 Mbps"
                  />
                </div>

                <div className="col-span-2">
                  <Label className="mb-2 block">Price Inclusions</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newInclusionInput}
                      onChange={(e) => setNewInclusionInput(e.target.value)}
                      placeholder="Add inclusion..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddInclusion()}
                    />
                    <Button type="button" onClick={handleAddInclusion}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.inclusions?.map((inclusion, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        <span>{inclusion}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveInclusion(idx);
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Availability Tab */}
            <TabsContent value="availability" className="space-y-6 mt-6">
              {!isEdit ? (
                <div className="text-center py-8 text-gray-500">
                  Please save the unit first to manage availability
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Manage blocked dates, bookings, and pending approvals
                    </p>
                    <Button onClick={() => setAvailabilityDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Block/Booking
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {availability.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No availability blocks added
                      </div>
                    ) : (
                      availability.map(avail => (
                        <div key={avail.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  avail.status === 'booked' ? 'default' :
                                  avail.status === 'pending' ? 'secondary' :
                                  'outline'
                                }
                              >
                                {avail.status}
                              </Badge>
                              <span className="text-sm">
                                {format(new Date(avail.start_date), 'PPP')} - {format(new Date(avail.end_date), 'PPP')}
                              </span>
                            </div>
                            {avail.notes && (
                              <p className="text-xs text-gray-500 mt-1">{avail.notes}</p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAvailability(avail.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-6 mt-6">
              <div className="space-y-6">
                {/* Main Image Upload */}
                <div>
                  <Label className="mb-2 block">Main Image *</Label>
                  <div className="space-y-3">
                    {formData.main_image ? (
                      <div className="relative border rounded-lg overflow-hidden">
                        <img 
                          src={formData.main_image} 
                          alt="Main" 
                          className="w-full h-64 object-cover" 
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setFormData(prev => ({ ...prev, main_image: '' }))}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label htmlFor="main_image_upload" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> main image
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        </div>
                        <input
                          id="main_image_upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'main')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Gallery Images Upload */}
                <div>
                  <Label className="mb-2 block">Gallery Images</Label>
                  <div className="space-y-3">
                    <label htmlFor="gallery_image_upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        <Image className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> gallery image
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB each</p>
                      </div>
                      <input
                        id="gallery_image_upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          handleImageUpload(e, 'gallery');
                          e.target.value = ''; // Reset input to allow same file upload
                        }}
                      />
                    </label>

                    {formData.images && formData.images.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {formData.images.map((img, idx) => (
                          <div key={idx} className="relative group border rounded-lg overflow-hidden">
                            <img src={img} alt="" className="w-full h-32 object-cover" />
                            <Button
                              size="sm"
                              variant="destructive"
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0"
                              onClick={() => handleRemoveImage(idx)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                              Image {idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Floor Plan Upload */}
                <div>
                  <Label className="mb-2 block">Floor Plan (PDF or Image)</Label>
                  <div className="space-y-3">
                    {formData.floor_plan_image ? (
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {formData.floor_plan_image.startsWith('data:application/pdf') ? (
                              <FileText className="w-10 h-10 text-red-500" />
                            ) : (
                              <img 
                                src={formData.floor_plan_image} 
                                alt="Floor Plan" 
                                className="w-20 h-20 object-cover rounded" 
                              />
                            )}
                            <div>
                              <p className="text-sm font-medium">
                                {formData.floor_plan_image.startsWith('data:application/pdf') ? 'PDF Floor Plan' : 'Floor Plan Image'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formData.floor_plan_image.startsWith('data:application/pdf') ? 'PDF Document' : 'Image File'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setFormData(prev => ({ ...prev, floor_plan_image: '' }))}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <label htmlFor="floor_plan_upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> floor plan
                          </p>
                          <p className="text-xs text-gray-500">PDF or Image up to 10MB</p>
                        </div>
                        <input
                          id="floor_plan_upload"
                          type="file"
                          className="hidden"
                          accept="application/pdf,image/*"
                          onChange={(e) => handleImageUpload(e, 'floor_plan')}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Video URL */}
                <div>
                  <Label htmlFor="video_url">Video URL (YouTube, Vimeo, etc.)</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a video URL to embed in the apartment details
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Policies & Amenities Tab */}
            <TabsContent value="policies" className="space-y-6 mt-6">
              <div className="space-y-6">
                <div>
                  <Label className="mb-3 block">Basic Amenities</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_kitchen"
                        checked={formData.has_kitchen}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_kitchen: checked }))}
                      />
                      <Label htmlFor="has_kitchen">Kitchen</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_laundry"
                        checked={formData.has_laundry}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_laundry: checked }))}
                      />
                      <Label htmlFor="has_laundry">Laundry</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_parking"
                        checked={formData.has_parking}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_parking: checked }))}
                      />
                      <Label htmlFor="has_parking">Parking</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_gym"
                        checked={formData.has_gym}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_gym: checked }))}
                      />
                      <Label htmlFor="has_gym">Gym</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_pool"
                        checked={formData.has_pool}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_pool: checked }))}
                      />
                      <Label htmlFor="has_pool">Swimming Pool</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_security"
                        checked={formData.has_security}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_security: checked }))}
                      />
                      <Label htmlFor="has_security">24/7 Security</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_lift"
                        checked={formData.has_lift}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_lift: checked }))}
                      />
                      <Label htmlFor="has_lift">Lift</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_balcony"
                        checked={formData.has_balcony}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_balcony: checked }))}
                      />
                      <Label htmlFor="has_balcony">Balcony</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="has_tv"
                        checked={formData.has_tv}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_tv: checked }))}
                      />
                      <Label htmlFor="has_tv">TV</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Additional Amenities</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newAmenityInput}
                      onChange={(e) => setNewAmenityInput(e.target.value)}
                      placeholder="Add amenity..."
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAmenity()}
                    />
                    <Button type="button" onClick={handleAddAmenity}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.amenities?.map((amenity, idx) => (
                      <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                        <span>{amenity}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveAmenity(idx);
                          }}
                          className="hover:bg-gray-300 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="check_in_time">Check-in Time</Label>
                    <Input
                      id="check_in_time"
                      type="time"
                      value={formData.check_in_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_time: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="check_out_time">Check-out Time</Label>
                    <Input
                      id="check_out_time"
                      type="time"
                      value={formData.check_out_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_time: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="cancellation_policy">Cancellation Policy</Label>
                    <Select 
                      value={formData.cancellation_policy} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, cancellation_policy: value }))}
                    >
                      <SelectTrigger id="cancellation_policy">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Flexible">Flexible</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="Strict">Strict</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Property Policies</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="smoking_allowed"
                        checked={formData.smoking_allowed}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smoking_allowed: checked }))}
                      />
                      <Label htmlFor="smoking_allowed">Smoking Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pets_allowed"
                        checked={formData.pets_allowed}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pets_allowed: checked }))}
                      />
                      <Label htmlFor="pets_allowed">Pets Allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="parties_allowed"
                        checked={formData.parties_allowed}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, parties_allowed: checked }))}
                      />
                      <Label htmlFor="parties_allowed">Parties Allowed</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Booking Settings</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="instant_book"
                        checked={formData.instant_book}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_book: checked }))}
                      />
                      <Label htmlFor="instant_book">Instant Book</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="kyc_required"
                        checked={formData.kyc_required}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, kyc_required: checked }))}
                      />
                      <Label htmlFor="kyc_required">KYC Required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gst_invoice_available"
                        checked={formData.gst_invoice_available}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, gst_invoice_available: checked }))}
                      />
                      <Label htmlFor="gst_invoice_available">GST Invoice Available</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Visibility</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                      />
                      <Label htmlFor="is_active">Active (Visible to public)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="featured"
                        checked={formData.featured}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
                      />
                      <Label htmlFor="featured">Featured (Show at top)</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {newAvailability.start_date ? format(newAvailability.start_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={newAvailability.start_date}
                    onSelect={(date) => setNewAvailability(prev => ({ ...prev, start_date: date }))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="mb-2 block">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {newAvailability.end_date ? format(newAvailability.end_date, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={newAvailability.end_date}
                    onSelect={(date) => setNewAvailability(prev => ({ ...prev, end_date: date }))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={newAvailability.status} 
                onValueChange={(value: 'blocked' | 'booked' | 'pending') => 
                  setNewAvailability(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newAvailability.notes}
                onChange={(e) => setNewAvailability(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                rows={3}
              />
            </div>

            <Button className="w-full" onClick={handleAddAvailability}>
              Add Block
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}