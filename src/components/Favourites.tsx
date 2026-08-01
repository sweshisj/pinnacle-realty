import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Heart, MapPin, Home, Calendar, Maximize2 } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { LoadingSpinner } from "./LoadingSpinner";

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
  amenities: string[];
  images: string[];
  badges: string[];
}

interface FavouritesProps {
  navigateTo: (page: any, projectId?: string) => void;
}

export function Favourites({ navigateTo }: FavouritesProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // Load favorites from localStorage
        const savedFavorites = localStorage.getItem("favorites");
        if (savedFavorites) {
          const favoriteIds = JSON.parse(savedFavorites);
          setFavorites(favoriteIds);

          // Fetch all projects
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
            {
              headers: {
                "Authorization": `Bearer ${publicAnonKey}`,
              },
            }
          );
          const data = await response.json();
          setProjects(data);

          // Filter favorite projects
          const favProjects = data.filter((p: Project) => favoriteIds.includes(p.id));
          setFavoriteProjects(favProjects);
        } else {
          setFavorites([]);
          setFavoriteProjects([]);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load favorite projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const removeFavorite = (projectId: string) => {
    const newFavorites = favorites.filter(id => id !== projectId);
    setFavorites(newFavorites);
    setFavoriteProjects(favoriteProjects.filter(p => p.id !== projectId));
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
    toast.success("Removed from favorites");
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-rose-50 to-red-50">
        <LoadingSpinner message="💖 Loading your favorite properties..." color="pink" theme="favorites" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
            <h1 className="text-3xl">Your Favorite Projects</h1>
          </div>
          <p className="text-gray-600">
            {favoriteProjects.length > 0 
              ? `You have ${favoriteProjects.length} favorite ${favoriteProjects.length === 1 ? 'project' : 'projects'}`
              : "You haven't added any favorites yet"
            }
          </p>
        </div>

        {favoriteProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="mb-6">
              <Heart className="h-24 w-24 mx-auto text-gray-300" />
            </div>
            <h2 className="text-2xl mb-4 text-gray-700">No Favorites Yet</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Browse through our projects and click the heart icon to save your favorite properties here.
            </p>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => navigateTo("projects")}
            >
              Browse Projects
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favoriteProjects.map((project) => (
              <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <ImageWithFallback
                    src={project.images[0]}
                    alt={project.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => navigateTo("project-detail", project.id)}
                  />
                  
                  {/* Remove Favorite Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 text-red-500 hover:text-red-600 bg-white/80 hover:bg-white"
                    onClick={() => removeFavorite(project.id)}
                  >
                    <Heart className="h-5 w-5" fill="currentColor" />
                  </Button>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {project.badges.map((badge) => (
                      <Badge key={badge} className="bg-green-600">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 
                    className="text-xl mb-2 cursor-pointer hover:text-green-600"
                    onClick={() => navigateTo("project-detail", project.id)}
                  >
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">{project.location}, {project.city}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2">
                    <Home className="h-4 w-4 mr-1" />
                    <span className="text-sm">{project.type} • {project.bhk.join(", ")}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2">
                    <Maximize2 className="h-4 w-4 mr-1" />
                    <span className="text-sm">{project.area}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span className="text-sm">{project.possession}</span>
                  </div>

                  <div className="mb-4">
                    <div className="text-2xl text-green-600 mb-1">
                      {formatPrice(project.totalPrice)}
                    </div>
                    {project.pricePerSqFt && project.pricePerSqFt > 0 && (
                      <div className="text-sm text-gray-500">
                        ${project.pricePerSqFt.toLocaleString()}/sq.ft
                      </div>
                    )}
                    {project.priceNegotiable && (
                      <div className="text-xs text-blue-600 mt-1">Negotiable</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => navigateTo("project-detail", project.id)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFavorite(project.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Heart className="h-4 w-4" fill="currentColor" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
