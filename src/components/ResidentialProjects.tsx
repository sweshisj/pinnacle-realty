import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Card, CardContent } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import {
  Search,
  Filter,
  ArrowUpDown,
  GitCompare,
  Heart,
  X,
  MapPin,
  Home,
  Calendar,
  Maximize2,
  Sparkles,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

// Default fallback image for projects without images
const DEFAULT_PROJECT_IMAGE =
  "https://images.unsplash.com/photo-1761426114135-b771606bcf4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuZXV0cmFsJTIwcmVhbCUyMGVzdGF0ZSUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2Mjk0NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral";

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

interface ResidentialProjectsProps {
  navigateTo: (page: any, projectId?: string) => void;
  searchParams?: {
    city?: string;
    type?: string;
    budget?: string;
  };
}

export function ResidentialProjects({
  navigateTo,
  searchParams,
}: ResidentialProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Tier 2 navigation
  const [propertyType, setPropertyType] = useState("all");

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedBHK, setSelectedBHK] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState([0, 10000000]);

  // Sort state
  const [sortBy, setSortBy] = useState("name");

  // Compare and Favorites
  const [compareList, setCompareList] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch projects: ${errorText}`);
        }
        const data = await response.json();
        // Filter out serviced apartments
        const residentialProjects = data.filter(
          (p: Project) => p.type !== "Serviced Apartment"
        );
        setProjects(residentialProjects);
        setFilteredProjects(residentialProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
  }, []);

  // Apply search params from homepage
  useEffect(() => {
    if (searchParams) {
      if (searchParams.city) {
        // Use searchQuery for city to enable partial, case-insensitive matching
        setSearchQuery(searchParams.city);
      }
      if (searchParams.type) {
        // Map the type to tier 2 category
        if (searchParams.type === "Apartment") setPropertyType("apartment");
        else if (searchParams.type === "Villa") setPropertyType("villa");
        else if (searchParams.type === "Plot") setPropertyType("plot");
      }
      if (searchParams.budget) {
        const [min, max] = searchParams.budget.split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          setBudgetRange([min, max]);
        }
      }
    }
  }, [searchParams]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...projects];

    // Tier 2 type filter
    if (propertyType !== "all") {
      filtered = filtered.filter((p) => {
        const type = p.type.toLowerCase();
        if (propertyType === "apartment") return type === "apartment";
        if (propertyType === "villa") return type === "villa";
        if (propertyType === "plot") return type === "plot";
        return true;
      });
    }

    // Search
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.city.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (selectedStatus.length > 0) {
      filtered = filtered.filter((p) => selectedStatus.includes(p.status));
    }

    // City filter
    if (selectedCity.length > 0) {
      filtered = filtered.filter((p) => selectedCity.includes(p.city));
    }

    // BHK filter
    if (selectedBHK.length > 0) {
      filtered = filtered.filter((p) =>
        p.bhk.some((bhk) => selectedBHK.includes(bhk)),
      );
    }

    // Budget filter
    filtered = filtered.filter(
      (p) =>
        p.totalPrice >= budgetRange[0] && p.totalPrice <= budgetRange[1],
    );

    // Sort - First by status (Available → Upcoming → Sold Out), then by user selection
    filtered.sort((a, b) => {
      const statusPriority: Record<string, number> = {
        Available: 1,
        Upcoming: 2,
        "Sold Out": 3,
        "sold out": 3,
        "sold-out": 3,
      };

      const aPriority = statusPriority[a.status] || 4;
      const bPriority = statusPriority[b.status] || 4;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      switch (sortBy) {
        case "price-low":
          return a.totalPrice - b.totalPrice;
        case "price-high":
          return b.totalPrice - a.totalPrice;
        case "area":
          return parseInt(a.area) - parseInt(b.area);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProjects(filtered);
  }, [
    projects,
    propertyType,
    searchQuery,
    selectedStatus,
    selectedCity,
    selectedBHK,
    budgetRange,
    sortBy,
  ]);

  const toggleCompare = (projectId: string) => {
    if (compareList.includes(projectId)) {
      setCompareList(compareList.filter((id) => id !== projectId));
    } else {
      if (compareList.length >= 4) {
        toast.error("You can compare up to 4 projects only");
        return;
      }
      setCompareList([...compareList, projectId]);
      toast.success("Added to compare");
    }
  };

  const toggleFavorite = (projectId: string) => {
    let newFavorites;
    if (favorites.includes(projectId)) {
      newFavorites = favorites.filter((id) => id !== projectId);
      toast.success("Removed from favorites");
    } else {
      newFavorites = [...favorites, projectId];
      toast.success("Added to favorites");
    }
    setFavorites(newFavorites);
    localStorage.setItem("favorites", JSON.stringify(newFavorites));
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const uniqueCities = [...new Set(projects.map((p) => p.city))];
  const uniqueStatuses = [...new Set(projects.map((p) => p.status))];
  const allBHKs = ["1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK"];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
        <LoadingSpinner
          message="🏠 Discovering your dream properties..."
          color="blue"
          theme="projects"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mb-4 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏘️ Residential Properties
          </h1>
          <p className="text-gray-600">
            ✨ Find your perfect home - Apartments, Villas & Plots
          </p>
        </motion.div>

        {/* Tier 2: Property Type Tabs */}
        <Tabs value={propertyType} onValueChange={setPropertyType} className="mb-6">
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4 bg-white/80 backdrop-blur-sm border-2 border-green-100 h-auto p-1 rounded-xl">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white px-6 py-3 rounded-lg"
            >
              All Properties
            </TabsTrigger>
            <TabsTrigger
              value="apartment"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white px-6 py-3 rounded-lg"
            >
              🏢 Apartments
            </TabsTrigger>
            <TabsTrigger
              value="villa"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white px-6 py-3 rounded-lg"
            >
              🏡 Villas
            </TabsTrigger>
            <TabsTrigger
              value="plot"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white px-6 py-3 rounded-lg"
            >
              🗺️ Plots
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 mb-6 border-2 border-green-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search */}
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-3 h-5 w-5 text-green-400" />
              <Input
                placeholder="🔍 Search by name, location, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-green-200 focus:border-green-400"
              />
            </div>

            {/* Filters Sheet */}
            <div className="md:col-span-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto">
                  <SheetHeader>
                    <SheetTitle>Filter Projects</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Status */}
                    <div>
                      <h3 className="mb-3">Status</h3>
                      {uniqueStatuses.map((status) => (
                        <div
                          key={status}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedStatus.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatus([...selectedStatus, status]);
                              } else {
                                setSelectedStatus(
                                  selectedStatus.filter((s) => s !== status),
                                );
                              }
                            }}
                          />
                          <label htmlFor={`status-${status}`}>{status}</label>
                        </div>
                      ))}
                    </div>

                    {/* City */}
                    <div>
                      <h3 className="mb-3">City</h3>
                      {uniqueCities.map((city) => (
                        <div
                          key={city}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <Checkbox
                            id={`city-${city}`}
                            checked={selectedCity.includes(city)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCity([...selectedCity, city]);
                              } else {
                                setSelectedCity(
                                  selectedCity.filter((c) => c !== city),
                                );
                              }
                            }}
                          />
                          <label htmlFor={`city-${city}`}>{city}</label>
                        </div>
                      ))}
                    </div>

                    {/* BHK */}
                    <div>
                      <h3 className="mb-3">BHK Configuration</h3>
                      {allBHKs.map((bhk) => (
                        <div
                          key={bhk}
                          className="flex items-center space-x-2 mb-2"
                        >
                          <Checkbox
                            id={`bhk-${bhk}`}
                            checked={selectedBHK.includes(bhk)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBHK([...selectedBHK, bhk]);
                              } else {
                                setSelectedBHK(
                                  selectedBHK.filter((b) => b !== bhk),
                                );
                              }
                            }}
                          />
                          <label htmlFor={`bhk-${bhk}`}>{bhk}</label>
                        </div>
                      ))}
                    </div>

                    {/* Budget Range */}
                    <div>
                      <h3 className="mb-3">Budget Range</h3>
                      <div className="mb-2 text-sm text-gray-600">
                        {formatPrice(budgetRange[0])} -{" "}
                        {formatPrice(budgetRange[1])}
                      </div>
                      <Slider
                        min={0}
                        max={10000000}
                        step={100000}
                        value={budgetRange}
                        onValueChange={setBudgetRange}
                        className="mb-4"
                      />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSelectedStatus([]);
                        setSelectedCity([]);
                        setSelectedBHK([]);
                        setBudgetRange([0, 100000000]);
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Sort */}
            <div className="md:col-span-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="price-low">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high">
                    Price: High to Low
                  </SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compare Button */}
            <div className="md:col-span-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCompare(true)}
                disabled={compareList.length < 2}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Compare ({compareList.length})
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Active Filters */}
        {(selectedStatus.length > 0 ||
          selectedCity.length > 0 ||
          selectedBHK.length > 0 ||
          searchQuery) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {searchQuery && (
              <Badge variant="secondary" className="pr-1">
                Search: {searchQuery}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            )}
            {selectedStatus.map((status) => (
              <Badge key={status} variant="secondary" className="pr-1">
                {status}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() =>
                    setSelectedStatus(
                      selectedStatus.filter((s) => s !== status),
                    )
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedCity.map((city) => (
              <Badge key={city} variant="secondary" className="pr-1">
                {city}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() =>
                    setSelectedCity(selectedCity.filter((c) => c !== city))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedBHK.map((bhk) => (
              <Badge key={bhk} variant="secondary" className="pr-1">
                {bhk}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() =>
                    setSelectedBHK(selectedBHK.filter((b) => b !== bhk))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-gray-600">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>

        {/* Project Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card className="overflow-hidden hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-200 bg-white/90 backdrop-blur-sm">
                <div className="relative">
                  <ImageWithFallback
                    src={
                      project.images.length > 0
                        ? project.images[0]
                        : DEFAULT_PROJECT_IMAGE
                    }
                    alt={project.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => navigateTo("project-detail", project.id)}
                  />

                  {/* Status Ribbon */}
                  <div
                    className={`absolute top-6 right-0 px-4 py-1 text-white text-sm shadow-lg ${
                      project.status === "Available"
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : project.status === "Upcoming"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                    }`}
                    style={{
                      clipPath: "polygon(0 0, 100% 0, 95% 100%, 0% 100%)",
                    }}
                  >
                    {project.status}
                  </div>

                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 right-2 ${
                      favorites.includes(project.id)
                        ? "text-red-500"
                        : "text-white"
                    } hover:text-red-500`}
                    onClick={() => toggleFavorite(project.id)}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={
                        favorites.includes(project.id)
                          ? "currentColor"
                          : "none"
                      }
                    />
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
                    <span className="text-sm">
                      {project.location}, {project.city}
                    </span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-2">
                    <Home className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                      {project.type} • {project.bhk.join(", ")}
                    </span>
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
                      <div className="text-xs text-blue-600 mt-1">
                        Negotiable
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1"
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                        onClick={() =>
                          navigateTo("project-detail", project.id)
                        }
                      >
                        View Details
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleCompare(project.id)}
                        className={
                          compareList.includes(project.id)
                            ? "bg-green-50 border-green-400"
                            : "border-green-200 hover:border-green-400"
                        }
                      >
                        <GitCompare className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl mb-4">
              No projects found matching your criteria
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus([]);
                setSelectedCity([]);
                setSelectedBHK([]);
                setBudgetRange([0, 100000000]);
              }}
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Compare Modal */}
      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto" aria-describedby="compare-description">
          <DialogHeader>
            <DialogTitle>Compare Projects</DialogTitle>
            <DialogDescription id="compare-description">
              Compare features and pricing of selected projects
            </DialogDescription>
          </DialogHeader>

          {compareList.length < 2 ? (
            <div className="py-8 text-center text-gray-500">
              Select at least 2 projects to compare
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b">Feature</th>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <th key={id} className="p-2 border-b">
                          <div className="flex items-start justify-between">
                            <span>{project?.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => toggleCompare(id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border-b">Location</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.location}, {project?.city}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Type</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.type}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Status</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.status}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">BHK</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.bhk.join(", ")}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Area</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.area}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Total Price</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project && formatPrice(project.totalPrice)}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Price per Sq.Ft</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.pricePerSqFt && project.pricePerSqFt > 0
                            ? `$${project.pricePerSqFt.toLocaleString()}`
                            : "-"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Possession</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.possession}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Approval No.</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.rera}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2">Amenities</td>
                    {compareList.map((id) => {
                      const project = projects.find((p) => p.id === id);
                      return (
                        <td key={id} className="p-2">
                          <ul className="list-disc list-inside text-sm">
                            {project?.amenities && Array.isArray(project.amenities)
                              ? project.amenities
                                .slice(0, 5)
                                .map((amenity, i) => (
                                  <li key={i}>{amenity}</li>
                                ))
                              : <li className="text-gray-400">No amenities</li>}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCompare(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}