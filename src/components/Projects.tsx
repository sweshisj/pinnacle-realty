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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Search,
  Filter,
  GitCompare,
  X,
  ArrowUpDown,
  Maximize2,
  Heart,
  MapPin,
  Home,
  Calendar,
  Sparkles,
} from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingSpinner } from "./LoadingSpinner";

// ---- Interfaces ----
interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string;
  location: string;
  description: string;
  totalPrice: number;
  pricePerSqFt?: number | null;
  priceNegotiable?: boolean;
  bhk: string[];
  area: string;
  possession: string;
  rera: string;
  amenities: string[];
  images: string[];
  badges: string[];
}

interface ProjectsProps {
  navigateTo: (page: any, projectId?: string) => void;
  searchParams?: { city?: string; type?: string; budget?: string };
}

// --- Helpers ---
const PLACEHOLDER_IMAGE = "/assets/sample-property.jpg";
const normalizeStatus = (s?: string) => (s || "").toLowerCase().trim();
const getStatusColor = (status?: string) => {
  const s = normalizeStatus(status);
  if (s === "available") return "bg-green-600";
  if (s === "upcoming") return "bg-yellow-500";
  if (["sold", "sold out", "sold-out"].includes(s)) return "bg-red-600";
  return "bg-gray-500";
};

export function Projects({ navigateTo, searchParams }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string[]>([]);
  const [selectedBHK, setSelectedBHK] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState([0, 10000000]);
  const [sortBy, setSortBy] = useState("name");

  // ✅ Compare + Favorites
  const [compareList, setCompareList] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
          { headers: { Authorization: `Bearer ${publicAnonKey}` } }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch projects: ${errorText}`);
        }
        const data = await response.json();

        // ✅ Convert 0 pricePerSqFt to null
        const sanitizedData = data.map((p: Project) => ({
          ...p,
          pricePerSqFt:
            p.pricePerSqFt && p.pricePerSqFt > 0 ? p.pricePerSqFt : null,
        }));

        setProjects(sanitizedData);
        setFilteredProjects(sanitizedData);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();

    // Load favorites
    const savedFavorites = localStorage.getItem("favorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch {
        // ignore
      }
    }
  }, []);

  // Filtering logic
  useEffect(() => {
    let filtered = [...projects];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.city || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.location || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus.length)
      filtered = filtered.filter((p) => selectedStatus.includes(p.status));
    if (selectedType.length)
      filtered = filtered.filter((p) => selectedType.includes(p.type));
    if (selectedCity.length)
      filtered = filtered.filter((p) => selectedCity.includes(p.city));
    if (selectedBHK.length)
      filtered = filtered.filter(
        (p) =>
          Array.isArray(p.bhk) && p.bhk.some((bhk) => selectedBHK.includes(bhk))
      );

    filtered = filtered.filter(
      (p) =>
        typeof p.totalPrice === "number" &&
        p.totalPrice >= budgetRange[0] &&
        p.totalPrice <= budgetRange[1]
    );

    setFilteredProjects(filtered);
  }, [
    projects,
    searchQuery,
    selectedStatus,
    selectedType,
    selectedCity,
    selectedBHK,
    budgetRange,
    sortBy,
  ]);

  // --- Compare logic ---
  const toggleCompare = (projectId: string) => {
    if (compareList.includes(projectId)) {
      setCompareList(compareList.filter((id) => id !== projectId));
      toast.success("Removed from compare");
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
    if (favorites.includes(projectId)) {
      const updated = favorites.filter((id) => id !== projectId);
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      toast.success("Removed from favorites");
    } else {
      const updated = [...favorites, projectId];
      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));
      toast.success("Added to favorites");
    }
  };

  const uniqueStatuses = Array.from(new Set(projects.map((p) => p.status)));
  const uniqueTypes = Array.from(new Set(projects.map((p) => p.type)));
  const uniqueCities = Array.from(new Set(projects.map((p) => p.city)));
  const allBHKs = Array.from(
    new Set(projects.flatMap((p) => Array.isArray(p.bhk) ? p.bhk : []))
  ).sort();

  const formatPrice = (price: number) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(2)}M`;
    return `$${(price / 1000).toFixed(0)}K`;
  };

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
    <div className="p-4">
      {/* ✅ Compare Button */}
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => {
            if (compareList.length < 2) {
              toast.error("Select at least 2 projects to compare");
              return;
            }
            setShowCompare(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <GitCompare className="mr-2 h-4 w-4" /> Compare ({compareList.length})
        </Button>
      </div>

      {/* --- Projects List --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <Card key={project.id} className="relative overflow-hidden shadow">
            <div
              className={`absolute top-2 right-2 text-white px-2 py-1 text-xs rounded ${getStatusColor(
                project.status
              )}`}
            >
              {project.status}
            </div>
            <ImageWithFallback
              src={project.images?.[0]}
              fallbackSrc={PLACEHOLDER_IMAGE}
              alt={project.name}
              className="w-full h-48 object-cover"
            />
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-1">{project.name}</h3>
              <div className="text-sm text-gray-600 flex items-center gap-1 mb-1">
                <MapPin size={14} />
                {project.location}, {project.city}
              </div>
              <div className="text-sm flex items-center gap-1 mb-1">
                <Home size={14} />
                {project.type} • {project.bhk?.join(", ")}
              </div>
              <div className="text-sm text-gray-500 mb-2">
                {project.area || "-"} sq.ft
              </div>

              <div className="mb-4">
                <div className="text-2xl text-green-600 mb-1">
                  {formatPrice(project.totalPrice)}
                </div>

                {/* ✅ Don’t show if null */}
                {project.pricePerSqFt && project.pricePerSqFt > 0 && (
                  <div className="text-sm text-gray-500">
                    ${project.pricePerSqFt.toLocaleString()}/sq.ft
                  </div>
                )}

                {project.priceNegotiable && (
                  <div className="text-xs text-blue-600 mt-1">Negotiable</div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => toggleCompare(project.id)}
                >
                  {compareList.includes(project.id)
                    ? "Remove from Compare"
                    : "Add to Compare"}
                </Button>

                <Button
                  onClick={() => navigateTo("projectDetails", project.id)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ✅ Compare Dialog */}
      {showCompare && (
        <Dialog open={showCompare} onOpenChange={setShowCompare}>
          <DialogContent className="max-w-5xl">
            <DialogHeader>
              <DialogTitle>Compare Projects</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projects
                .filter((p) => compareList.includes(p.id))
                .map((p) => (
                  <Card key={p.id}>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">{p.name}</h3>
                      <p className="text-sm text-gray-600">{p.city}</p>
                      {p.pricePerSqFt && p.pricePerSqFt > 0 && (
                        <p className="text-sm text-gray-500">
                          ${p.pricePerSqFt.toLocaleString()}/sq.ft
                        </p>
                      )}
                      <p className="text-sm">{formatPrice(p.totalPrice)}</p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );

  // NOTE: original full-page listing UI retained below (unreachable; kept from newest version)
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
            🏘️ Our Premium Projects
          </h1>
          <p className="text-gray-600">✨ Discover exceptional properties across Australia</p>
        </motion.div>

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
                      {uniqueStatuses.map(status => (
                        <div key={status} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedStatus.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatus([...selectedStatus, status]);
                              } else {
                                setSelectedStatus(selectedStatus.filter(s => s !== status));
                              }
                            }}
                          />
                          <label htmlFor={`status-${status}`}>{status}</label>
                        </div>
                      ))}
                    </div>

                    {/* Type */}
                    <div>
                      <h3 className="mb-3">Property Type</h3>
                      {uniqueTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`type-${type}`}
                            checked={selectedType.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedType([...selectedType, type]);
                              } else {
                                setSelectedType(selectedType.filter(t => t !== type));
                              }
                            }}
                          />
                          <label htmlFor={`type-${type}`}>{type}</label>
                        </div>
                      ))}
                    </div>

                    {/* City */}
                    <div>
                      <h3 className="mb-3">City</h3>
                      {uniqueCities.map(city => (
                        <div key={city} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`city-${city}`}
                            checked={selectedCity.includes(city)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCity([...selectedCity, city]);
                              } else {
                                setSelectedCity(selectedCity.filter(c => c !== city));
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
                      {allBHKs.map(bhk => (
                        <div key={bhk} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`bhk-${bhk}`}
                            checked={selectedBHK.includes(bhk)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBHK([...selectedBHK, bhk]);
                              } else {
                                setSelectedBHK(selectedBHK.filter(b => b !== bhk));
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
                        {formatPrice(budgetRange[0])} - {formatPrice(budgetRange[1])}
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
                        setSelectedType([]);
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
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
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
        {(selectedStatus.length > 0 || selectedType.length > 0 || selectedCity.length > 0 || selectedBHK.length > 0 || searchQuery) && (
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
            {selectedStatus.map(status => (
              <Badge key={status} variant="secondary" className="pr-1">
                {status}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => setSelectedStatus(selectedStatus.filter(s => s !== status))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedType.map(type => (
              <Badge key={type} variant="secondary" className="pr-1">
                {type}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => setSelectedType(selectedType.filter(t => t !== type))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedCity.map(city => (
              <Badge key={city} variant="secondary" className="pr-1">
                {city}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => setSelectedCity(selectedCity.filter(c => c !== city))}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            {selectedBHK.map(bhk => (
              <Badge key={bhk} variant="secondary" className="pr-1">
                {bhk}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0"
                  onClick={() => setSelectedBHK(selectedBHK.filter(b => b !== bhk))}
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
                  {/* Status ribbon (fixed) */}
                  <div className={`absolute top-3 left-0 px-3 py-1 rounded-r-md text-white text-xs font-semibold ${getStatusColor(project.status)}`}>
                    {project.status || "Unknown"}
                  </div>

                  <ImageWithFallback
                    src={(project.images && project.images[0]) ? project.images[0] : PLACEHOLDER_IMAGE}
                    alt={project.name}
                    className="w-full h-48 object-cover cursor-pointer"
                    onClick={() => navigateTo("project-detail", project.id)}
                  />
                
                  {/* Favorite Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-2 right-2 ${
                      favorites.includes(project.id) ? "text-red-500" : "text-white"
                    } hover:text-red-500`}
                    onClick={() => toggleFavorite(project.id)}
                  >
                    <Heart className="h-5 w-5" fill={favorites.includes(project.id) ? "currentColor" : "none"} />
                  </Button>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {Array.isArray(project.badges) && project.badges.map((badge) => (
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
                    <span className="text-sm">{project.type} • {Array.isArray(project.bhk) ? project.bhk.join(", ") : ""}</span>
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
                    {project.pricePerSqFt !== undefined && project.pricePerSqFt !== null && project.pricePerSqFt > 0 && (
                      <div className="text-sm text-gray-500">
                        ${project.pricePerSqFt.toLocaleString()}/sq.ft
                      </div>
                    )}
                    {project.priceNegotiable && (
                      <div className="text-xs text-blue-600 mt-1">Negotiable</div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
                      <Button
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 shadow-lg"
                        onClick={() => navigateTo("project-detail", project.id)}
                      >
                        View Details
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleCompare(project.id)}
                        className={compareList.includes(project.id) ? "bg-green-50 border-green-400" : "border-green-200 hover:border-green-400"}
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
            <p className="text-gray-500 text-xl mb-4">No projects found matching your criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus([]);
                setSelectedType([]);
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
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compare Projects</DialogTitle>
            <DialogDescription>
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
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return (
                        <th key={id} className="p-2 border-b">
                          <div className="flex items-start justify-between">
                            <span>{project?.name || "—"}</span>
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
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project ? `${project.location || "—"}, ${project.city || "—"}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Type</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{project?.type || "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Status</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{project?.status || "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">BHK</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{Array.isArray(project?.bhk) ? project?.bhk.join(", ") : "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Area</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{project?.area || "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Total Price</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project && typeof project.totalPrice === "number" ? formatPrice(project.totalPrice) : "—"}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Price per Sq.Ft</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return (
                        <td key={id} className="p-2 border-b">
                          {project?.pricePerSqFt && project.pricePerSqFt > 0 ? `$${project.pricePerSqFt.toLocaleString()}` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Possession</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{project?.possession || "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 border-b">Approval No.</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      return <td key={id} className="p-2 border-b">{project?.rera || "—"}</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-2">Amenities</td>
                    {compareList.map(id => {
                      const project = projects.find(p => p.id === id);
                      const amenitiesArr = Array.isArray(project?.amenities) ? project!.amenities : [];
                      return (
                        <td key={id} className="p-2">
                          <ul className="list-disc list-inside text-sm">
                            {amenitiesArr.length > 0 ? amenitiesArr.slice(0, 5).map((amenity, i) => (
                              <li key={i}>{amenity}</li>
                            )) : <li className="text-gray-500">—</li>}
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
