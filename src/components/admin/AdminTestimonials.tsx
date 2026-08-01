import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Plus, Edit, Trash2, Star, Video, User, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "../LoadingSpinner";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { testimonialsService, type Testimonial } from "../../utils/testimonials-service";

interface AdminTestimonialsProps {
  navigateTo: (page: string) => void;
}

export function AdminTestimonials({ navigateTo }: AdminTestimonialsProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    client_name: "",
    property_bought: "",
    property_location: "",
    rating: 5,
    review: "",
    occupation: "",
    client_photo: "",
    video_url: "",
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      console.log("Fetching testimonials from admin endpoint...");
      const data = await testimonialsService.getAllAdmin();
      console.log("Fetched testimonials:", data);
      setTestimonials(data);
    } catch (error) {
      console.error("Error fetching testimonials:", error);
      toast.error("Failed to load testimonials. Please try again.");
      // Set empty array on error so UI can still render
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingId) {
        await testimonialsService.update(editingId, formData);
        toast.success("Testimonial updated successfully");
      } else {
        await testimonialsService.create(formData);
        toast.success("Testimonial created successfully");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchTestimonials();
    } catch (error) {
      console.error("Error saving testimonial:", error);
      toast.error("Failed to save testimonial");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      await testimonialsService.delete(testimonialToDelete);
      toast.success("Testimonial deleted successfully");
      setDeleteDialogOpen(false);
      setTestimonialToDelete(null);
      fetchTestimonials();
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      toast.error("Failed to delete testimonial");
    }
  };

  const openEditDialog = (testimonial: Testimonial) => {
    setEditingId(testimonial.id);
    setFormData({
      client_name: testimonial.client_name ?? "",
      property_bought: testimonial.property_bought ?? "",
      property_location: testimonial.property_location ?? "",
      rating: testimonial.rating ?? 5,
      review: testimonial.review ?? "",
      occupation: testimonial.occupation ?? "",
      client_photo: testimonial.client_photo ?? "",
      video_url: testimonial.video_url ?? "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      client_name: "",
      property_bought: "",
      property_location: "",
      rating: 5,
      review: "",
      occupation: "",
      client_photo: "",
      video_url: "",
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const startCreate = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner message="Loading testimonials..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigateTo("admin-dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl">Manage Testimonials</h1>
                <p className="text-sm text-gray-500">
                  Create, edit, and manage client testimonials
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => startCreate()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Testimonial
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? "Edit Testimonial" : "Add New Testimonial"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingId
                      ? "Update the testimonial information below."
                      : "Fill in the details to create a new testimonial."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="client_name">
                      Client Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="client_name"
                      value={formData.client_name}
                      onChange={(e) =>
                        setFormData({ ...formData, client_name: e.target.value })
                      }
                      required
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) =>
                        setFormData({ ...formData, occupation: e.target.value })
                      }
                      placeholder="Software Engineer"
                    />
                  </div>

                  <div>
                    <Label htmlFor="property_bought">
                      Property Bought <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="property_bought"
                      value={formData.property_bought}
                      onChange={(e) =>
                        setFormData({ ...formData, property_bought: e.target.value })
                      }
                      required
                      placeholder="Green Valley Residences - 3BHK Apartment"
                    />
                  </div>

                  <div>
                    <Label htmlFor="property_location">
                      Property Location <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="property_location"
                      value={formData.property_location}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          property_location: e.target.value,
                        })
                      }
                      required
                      placeholder="Melbourne, VIC"
                    />
                  </div>

                  <div>
                    <Label htmlFor="rating">
                      Rating <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= formData.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {formData.rating} star{formData.rating !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="review">
                      Review <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="review"
                      value={formData.review}
                      onChange={(e) =>
                        setFormData({ ...formData, review: e.target.value })
                      }
                      required
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="client_photo">Client Photo URL (Optional)</Label>
                    <Input
                      id="client_photo"
                      value={formData.client_photo}
                      onChange={(e) =>
                        setFormData({ ...formData, client_photo: e.target.value })
                      }
                      placeholder="https://example.com/photo.jpg"
                      type="url"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Upload image to Supabase Storage or provide external URL
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="video_url">Video URL (Optional)</Label>
                    <Input
                      id="video_url"
                      value={formData.video_url}
                      onChange={(e) =>
                        setFormData({ ...formData, video_url: e.target.value })
                      }
                      placeholder="https://www.youtube.com/embed/..."
                      type="url"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      YouTube embed URL format
                    </p>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogOpenChange(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Saving..."
                        : editingId
                        ? "Update"
                        : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Testimonials</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{testimonials.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">
                {testimonials.length > 0
                  ? (
                      testimonials.reduce((acc, t) => acc + t.rating, 0) /
                      testimonials.length
                    ).toFixed(1)
                  : "0.0"}
                <Star className="inline h-6 w-6 ml-2 fill-yellow-400 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">With Videos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl">
                {testimonials.filter((t) => t.video_url).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Testimonials List */}
        {testimonials.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No testimonials yet</p>
                <p className="text-sm">
                  Add your first testimonial to get started
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Client Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0">
                      {testimonial.client_photo ? (
                        <ImageWithFallback
                          src={testimonial.client_photo}
                          alt={testimonial.client_name}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                          <User className="h-8 w-8 text-green-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="mb-1 truncate">
                        {testimonial.client_name}
                      </h3>
                      {testimonial.occupation && (
                        <p className="text-sm text-gray-500 truncate">
                          {testimonial.occupation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= testimonial.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Property Info */}
                  <div className="mb-3">
                    <p className="text-sm mb-1">{testimonial.property_bought}</p>
                    <p className="text-xs text-gray-500">
                      {testimonial.property_location}
                    </p>
                  </div>

                  {/* Review */}
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    "{testimonial.review}"
                  </p>

                  {/* Video Badge */}
                  {testimonial.video_url && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
                      <Video className="h-4 w-4" />
                      <span>Video testimonial</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(testimonial)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setTestimonialToDelete(testimonial.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this testimonial. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}