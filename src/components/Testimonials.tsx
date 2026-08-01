import React, { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Star, ChevronLeft, ChevronRight, Video as VideoIcon, User } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { testimonialsService, type Testimonial } from "../utils/testimonials-service";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        console.log("Fetching testimonials from database...");
        const data = await testimonialsService.getAll();
        console.log("Fetched testimonials:", data);
        setTestimonials(data);
      } catch (error) {
        console.error("Failed to fetch testimonials from database:", error);
        // Show empty state if database is not available
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-advance slideshow
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, 8000);

    return () => clearInterval(timer);
  }, [currentIndex, testimonials.length]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const previousSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    if (!url) return "";
    
    // Already an embed URL
    if (url.includes("/embed/")) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    let videoId = "";
    
    // Format: https://www.youtube.com/watch?v=VIDEO_ID
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    }
    // Format: https://youtu.be/VIDEO_ID
    else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    }
    // Format: https://www.youtube.com/embed/VIDEO_ID (already embed)
    else if (url.includes("youtube.com/embed/")) {
      return url;
    }
    
    // Return embed URL if we found a video ID
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // If we couldn't parse it, return the original URL
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <LoadingSpinner
          message="⭐ Loading client success stories..."
          color="purple"
          theme="testimonials"
          size="lg"
        />
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h1 className="text-4xl text-center mb-4">Client Testimonials</h1>
            <p className="text-center text-gray-600 text-lg">
              Hear from our satisfied customers about their experience with Pinnacle Realty
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <Star className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg mb-2">No testimonials available yet</p>
                <p className="text-sm">Check back soon for client reviews</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentTestimonial = testimonials[currentIndex];
  const averageRating =
    testimonials.reduce((acc, t) => acc + t.rating, 0) / testimonials.length;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl text-center mb-4">Client Testimonials</h1>
          <p className="text-center text-gray-600 text-lg">
            Hear from our satisfied customers about their experience with Pinnacle Realty
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Testimonial Slideshow */}
        <div className="mb-12 relative">
          <Card className="overflow-hidden shadow-xl">
            <CardContent className="p-0">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div
                  key={currentIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 },
                  }}
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    {/* Video/Photo Side */}
                    <div className="bg-gradient-to-br from-green-100 to-blue-100 aspect-video md:aspect-auto relative">
                      {currentTestimonial.video_url ? (
                        <div className="absolute inset-0 bg-black">
                          <iframe
                            src={getYouTubeEmbedUrl(currentTestimonial.video_url)}
                            title={`${currentTestimonial.client_name} Testimonial`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      ) : currentTestimonial.client_photo ? (
                        <ImageWithFallback
                          src={currentTestimonial.client_photo}
                          alt={currentTestimonial.client_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <User className="h-32 w-32 text-green-300" />
                        </div>
                      )}
                      {currentTestimonial.video_url && (
                        <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                          <VideoIcon className="h-4 w-4" />
                          Video
                        </div>
                      )}
                    </div>

                    {/* Testimonial Details */}
                    <div className="p-8 md:p-12 flex flex-col justify-center bg-white">
                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-7 w-7 ${
                              star <= currentTestimonial.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Review */}
                      <blockquote className="text-gray-700 text-lg mb-8 leading-relaxed">
                        "{currentTestimonial.review}"
                      </blockquote>

                      {/* Client Info */}
                      <div className="border-t pt-6">
                        <div className="flex items-start gap-4">
                          {currentTestimonial.client_photo && !currentTestimonial.video_url && (
                            <ImageWithFallback
                              src={currentTestimonial.client_photo}
                              alt={currentTestimonial.client_name}
                              className="h-16 w-16 rounded-full object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-xl mb-1">
                              {currentTestimonial.client_name}
                            </h3>
                            {currentTestimonial.occupation && (
                              <p className="text-sm text-gray-500 mb-2">
                                {currentTestimonial.occupation}
                              </p>
                            )}
                            <div className="text-sm text-green-600 mb-1">
                              {currentTestimonial.property_bought}
                            </div>
                            <p className="text-sm text-gray-500">
                              {currentTestimonial.property_location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Navigation Arrows */}
              {testimonials.length > 1 && (
                <>
                  <button
                    onClick={previousSlide}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-800" />
                  </button>
                  <button
                    onClick={nextSlide}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all z-10"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="h-6 w-6 text-gray-800" />
                  </button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Slide Indicators */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentIndex
                      ? "w-8 bg-green-600"
                      : "w-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          {testimonials.length > 1 && (
            <div className="text-center mt-4 text-sm text-gray-500">
              {currentIndex + 1} / {testimonials.length}
            </div>
          )}
        </div>

        {/* All Testimonials Grid */}
        {testimonials.length > 1 && (
          <div className="mb-12">
            <h2 className="text-2xl mb-6 text-center">All Client Reviews</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {testimonials.map((testimonial, index) => (
                <Card
                  key={testimonial.id}
                  className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${
                    currentIndex === index ? "ring-2 ring-green-600 shadow-lg" : ""
                  }`}
                  onClick={() => goToSlide(index)}
                >
                  <CardContent className="p-4">
                    {/* Client Photo */}
                    <div className="mb-3">
                      {testimonial.client_photo ? (
                        <ImageWithFallback
                          src={testimonial.client_photo}
                          alt={testimonial.client_name}
                          className="h-20 w-20 rounded-full object-cover mx-auto"
                        />
                      ) : (
                        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                          <User className="h-10 w-10 text-green-600" />
                        </div>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center justify-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < testimonial.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Name */}
                    <h3 className="text-center mb-1 line-clamp-1">
                      {testimonial.client_name}
                    </h3>

                    {/* Property */}
                    <p className="text-xs text-center text-gray-500 line-clamp-2">
                      {testimonial.property_bought}
                    </p>

                    {/* Video Badge */}
                    {testimonial.video_url && (
                      <div className="flex items-center justify-center gap-1 mt-2 text-xs text-blue-600">
                        <VideoIcon className="h-3 w-3" />
                        <span>Video</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-2xl p-8 md:p-12 shadow-xl">
          <h2 className="text-3xl text-center mb-12">Customer Satisfaction</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-2">{averageRating.toFixed(1)}/5</div>
              <div className="text-green-100">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {Math.round((averageRating / 5) * 100)}%
              </div>
              <div className="text-green-100">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">{testimonials.length}</div>
              <div className="text-green-100">Reviews</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-2">
                {testimonials.filter((t) => t.rating === 5).length}
              </div>
              <div className="text-green-100">5-Star Reviews</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}