import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Search, Plus, Sparkles, Download } from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../LoadingSpinner";
import { AdminProjectCreate } from "./AdminProjectCreate";
import { AdminBuyingProjects } from "./AdminBuyingProjects";
import * as XLSX from "xlsx";

interface Project {
  id: string;
  name: string;
  type: string;
  status: string;
  city: string;
  location: string;
  totalPrice: number;
  pricePerSqFt?: number;
  priceNegotiable?: boolean;
  bhk?: string[];
  images: string[];
  lead?: string;
}

interface AdminProjectsProps {
  navigateTo: (page: any, projectId?: string) => void;
}

export function AdminProjects({
  navigateTo,
}: AdminProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<
    Project[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

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
          throw new Error(
            `Failed to fetch projects: ${errorText}`,
          );
        }
        const data = await response.json();
        setProjects(data);
        setFilteredProjects(data);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast.error("Failed to load projects. Please refresh the page.");
        // Set empty array so UI doesn't break
        setProjects([]);
        setFilteredProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.city
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.location
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (p) => p.status === statusFilter,
      );
    }

    // Sort by status: Available -> Upcoming -> Sold Out
    const statusOrder: { [key: string]: number } = {
      "Available": 1,
      "Upcoming": 2,
      "Sold Out": 3
    };
    
    filtered.sort((a, b) => {
      const orderA = statusOrder[a.status] || 999;
      const orderB = statusOrder[b.status] || 999;
      return orderA - orderB;
    });

    setFilteredProjects(filtered);
  }, [projects, searchQuery, statusFilter]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    }
    return `$${(price / 1000).toFixed(0)}K`;
  };

  const exportToExcel = () => {
    try {
      // Prepare data for each sheet
      const allProjects = projects.map((p) => ({
        "Project Name": p.name,
        "Type": p.type,
        "Status": p.status,
        "City": p.city,
        "Location": p.location,
        "Total Price": formatPrice(p.totalPrice),
        "Price per Sq.Ft": p.pricePerSqFt ? `$${p.pricePerSqFt.toLocaleString()}` : "N/A",
        "BHK Options": p.bhk ? p.bhk.join(", ") : "N/A",
        "Price Negotiable": p.priceNegotiable ? "Yes" : "No",
        "Lead/Owner": p.lead || "N/A",
      }));

      const availableProjects = projects
        .filter((p) => p.status === "Available")
        .map((p) => ({
          "Project Name": p.name,
          "Type": p.type,
          "City": p.city,
          "Location": p.location,
          "Total Price": formatPrice(p.totalPrice),
          "Price per Sq.Ft": p.pricePerSqFt ? `$${p.pricePerSqFt.toLocaleString()}` : "N/A",
          "BHK Options": p.bhk ? p.bhk.join(", ") : "N/A",
          "Price Negotiable": p.priceNegotiable ? "Yes" : "No",
          "Lead/Owner": p.lead || "N/A",
        }));

      const soldOutProjects = projects
        .filter((p) => p.status === "Sold Out")
        .map((p) => ({
          "Project Name": p.name,
          "Type": p.type,
          "City": p.city,
          "Location": p.location,
          "Total Price": formatPrice(p.totalPrice),
          "Price per Sq.Ft": p.pricePerSqFt ? `$${p.pricePerSqFt.toLocaleString()}` : "N/A",
          "BHK Options": p.bhk ? p.bhk.join(", ") : "N/A",
          "Lead/Owner": p.lead || "N/A",
        }));

      const upcomingProjects = projects
        .filter((p) => p.status === "Upcoming")
        .map((p) => ({
          "Project Name": p.name,
          "Type": p.type,
          "City": p.city,
          "Location": p.location,
          "Total Price": formatPrice(p.totalPrice),
          "Price per Sq.Ft": p.pricePerSqFt ? `$${p.pricePerSqFt.toLocaleString()}` : "N/A",
          "BHK Options": p.bhk ? p.bhk.join(", ") : "N/A",
          "Price Negotiable": p.priceNegotiable ? "Yes" : "No",
          "Lead/Owner": p.lead || "N/A",
        }));

      // Create workbook
      const wb = XLSX.utils.book_new();

      // Add sheets
      const wsTotal = XLSX.utils.json_to_sheet(allProjects);
      const wsAvailable = XLSX.utils.json_to_sheet(availableProjects);
      const wsSoldOut = XLSX.utils.json_to_sheet(soldOutProjects);
      const wsUpcoming = XLSX.utils.json_to_sheet(upcomingProjects);

      XLSX.utils.book_append_sheet(wb, wsTotal, "Total Projects");
      XLSX.utils.book_append_sheet(wb, wsAvailable, "Available");
      XLSX.utils.book_append_sheet(wb, wsSoldOut, "Sold Out");
      XLSX.utils.book_append_sheet(wb, wsUpcoming, "Upcoming");

      // Generate file name with current date
      const date = new Date().toISOString().split("T")[0];
      const fileName = `PinnacleRealty_Projects_${date}.xlsx`;

      // Save file
      XLSX.writeFile(wb, fileName);

      toast.success("✅ Projects exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export projects. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
        <LoadingSpinner
          message="🏢 Loading project portfolio..."
          color="blue"
          theme="projects"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="mb-2 bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                🏢 Project Management
              </h1>
              <p className="text-gray-600">
                ✨ Manage all your awesome real estate projects
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="selling" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
              <TabsTrigger value="selling" className="text-base">
                🏗️ Selling Projects
              </TabsTrigger>
              <TabsTrigger value="buying" className="text-base">
                🛒 Buying Projects
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selling" className="space-y-6">
              <div className="flex justify-end gap-3">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 shadow-lg"
                    onClick={exportToExcel}
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Export CSV
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg"
                    onClick={() =>
                      navigateTo("admin-project-create", undefined)
                    }
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add New Project
                  </Button>
                </motion.div>
              </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-green-100"
        >
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-green-400" />
            <Input
              placeholder="🔍 Search by name, city, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-green-200 focus:border-green-400"
            />
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatusFilter("all")}
            className={`bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
              statusFilter === "all"
                ? "ring-4 ring-purple-300 ring-offset-2"
                : ""
            }`}
          >
            <div className="mb-1">{projects.length}</div>
            <div className="text-sm text-purple-100">
              🏗️ Total Projects
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatusFilter("Available")}
            className={`bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
              statusFilter === "Available"
                ? "ring-4 ring-green-300 ring-offset-2"
                : ""
            }`}
          >
            <div className="mb-1">
              {
                projects.filter((p) => p.status === "Available")
                  .length
              }
            </div>
            <div className="text-sm text-green-100">
              ✅ Available
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatusFilter("Sold Out")}
            className={`bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
              statusFilter === "Sold Out"
                ? "ring-4 ring-amber-300 ring-offset-2"
                : ""
            }`}
          >
            <div className="mb-1">
              {
                projects.filter((p) => p.status === "Sold Out")
                  .length
              }
            </div>
            <div className="text-sm text-amber-100">
              🎉 Sold Out
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setStatusFilter("Upcoming")}
            className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
              statusFilter === "Upcoming"
                ? "ring-4 ring-blue-300 ring-offset-2"
                : ""
            }`}
          >
            <div className="mb-1">
              {
                projects.filter((p) => p.status === "Upcoming")
                  .length
              }
            </div>
            <div className="text-sm text-blue-100">
              🔜 Upcoming
            </div>
          </motion.div>
        </div>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <div className="text-gray-600">
            Showing {filteredProjects.length} of{" "}
            {projects.length} projects
            {(statusFilter !== "all" || searchQuery) && (
              <span className="ml-2 text-green-600">
                (filtered)
              </span>
            )}
          </div>
          {(statusFilter !== "all" || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-green-600 hover:text-green-700"
            >
              ✨ Clear All Filters
            </Button>
          )}
        </div>

        {/* Project Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -5 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-2xl transition-all border-2 border-transparent hover:border-green-200 bg-white/90 backdrop-blur-sm"
                onClick={() =>
                  navigateTo("admin-project-detail", project.id)
                }
              >
                <ImageWithFallback
                  src={project.images[0]}
                  alt={project.name}
                  className="w-full h-48 object-cover"
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg">{project.name}</h3>
                    <Badge variant="outline">
                      {project.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Type:</span>{" "}
                      {project.type}
                    </div>
                    <div>
                      <span className="font-medium">
                        Location:
                      </span>{" "}
                      {project.location}, {project.city}
                    </div>
                    {project.lead && (
                      <div className="flex items-center gap-1 p-2 -mx-2 rounded bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                        <span>👤</span>
                        <span className="font-medium text-blue-700">Lead:</span>{" "}
                        <span className="text-blue-600">{project.lead}</span>
                      </div>
                    )}
                    {project.pricePerSqFt && project.pricePerSqFt > 0 && (
                      <div>
                        <span className="font-medium">
                          Price per Sq.Ft:
                        </span>{" "}
                        <span className="text-green-600">
                          ${project.pricePerSqFt.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium">
                        Total Price:
                      </span>{" "}
                      <span className="text-green-600">
                        {formatPrice(project.totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full border-green-200 hover:bg-green-50 hover:border-green-400"
                    size="sm"
                  >
                    View Details & Enquiries
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-xl mb-4">
              No projects found
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
            </TabsContent>

            <TabsContent value="buying">
              <AdminBuyingProjects navigateTo={navigateTo} />
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}