import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Users,
  Building2,
  UserPlus,
  Plus,
  Bell,
  TrendingUp,
  Sparkles,
  Zap,
  Star,
  Calendar,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../LoadingSpinner";
import { AdminAvailabilityCalendar } from "./AdminAvailabilityCalendar";
import { EnquiryManagement } from "./EnquiryManagement";

interface AdminDashboardProps {
  navigateTo: (
    page: any,
    projectId?: string,
    clientId?: string,
    statusFilter?: string,
  ) => void;
}

interface Stats {
  red: number;
  amber: number;
  green: number;
  total: number;
  buyers: number;
  sellers: number;
}

export function AdminDashboard({
  navigateTo,
}: AdminDashboardProps) {
  const [stats, setStats] = useState<Stats>({
    red: 0,
    amber: 0,
    green: 0,
    total: 0,
    buyers: 0,
    sellers: 0,
  });
  const [projectCount, setProjectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAvailabilityView, setShowAvailabilityView] = useState(false);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client stats
        const statsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/stats`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!statsResponse.ok) {
          const errorText = await statsResponse.text();
          throw new Error(
            `Failed to fetch stats: ${errorText}`,
          );
        }
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch project count
        const projectsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          },
        );
        if (!projectsResponse.ok) {
          const errorText = await projectsResponse.text();
          throw new Error(
            `Failed to fetch projects: ${errorText}`,
          );
        }
        const projectsData = await projectsResponse.json();
        setProjectCount(projectsData.length);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <LoadingSpinner
          message="✨ Preparing your command center..."
          color="green"
          theme="dashboard"
          size="lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5,
              }}
            >
              <Sparkles className="h-8 w-8 text-green-600" />
            </motion.div>
            <h1 className="text-3xl bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
          </div>
          <p className="text-gray-600">
            🎉 Welcome back! Here's your business overview.
          </p>
        </motion.div>

        {/* Empty Database Notice */}
        {stats.total === 0 && projectCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">🚀</div>
                  <div className="flex-1">
                    <h3 className="mb-2">
                      Getting Started - Your Dashboard is Ready!
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Your database is currently empty. Let's
                      get started by creating your first
                      project!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          navigateTo("admin-projects")
                        }
                        className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
                      >
                        <Plus className="h-4 w-4" />
                        Create Your First Project
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          className="grid md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() =>
                navigateTo(
                  "admin-clients",
                  undefined,
                  undefined,
                  undefined,
                )
              }
              className="h-auto py-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 justify-start shadow-lg hover:shadow-xl transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <UserPlus className="mr-3 h-6 w-6" />
              </motion.div>
              <div className="text-left">
                <div className="text-lg">Manage Clients</div>
                <div className="text-sm opacity-90">
                  View, add, and edit client information
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => navigateTo("admin-projects")}
              variant="outline"
              className="h-auto py-6 w-full justify-start border-2 border-emerald-300 bg-white hover:bg-emerald-50 shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="mr-3 h-6 w-6 text-emerald-600" />
              <div className="text-left">
                <div className="text-lg">Manage Projects</div>
                <div className="text-sm opacity-90">
                  View, add, and edit projects
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => navigateTo("admin-reminders")}
              variant="outline"
              className="h-auto py-6 w-full justify-start border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 shadow-md hover:shadow-lg transition-all"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 4,
                }}
              >
                <Bell className="mr-3 h-6 w-6 text-amber-600" />
              </motion.div>
              <div className="text-left">
                <div className="text-lg">Call Reminders</div>
                <div className="text-sm opacity-90">
                  Set and track client follow-ups
                </div>
              </div>
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={() => navigateTo("admin-testimonials")}
              variant="outline"
              className="h-auto py-6 w-full justify-start border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 shadow-md hover:shadow-lg transition-all"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Star className="mr-3 h-6 w-6 text-purple-600" />
              </motion.div>
              <div className="text-left">
                <div className="text-lg">Testimonials</div>
                <div className="text-sm opacity-90">
                  Manage client reviews
                </div>
              </div>
            </Button>
          </motion.div>
        </motion.div>

        {/* Client Status Cards */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl">Client Status Overview</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-none bg-gradient-to-br from-red-50 to-rose-100 shadow-lg hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-200 rounded-full blur-3xl opacity-30"></div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between relative z-10">
                    <span>🔴 Red Status</span>
                    <motion.div
                      className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                      }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <motion.div
                    className="text-5xl mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    {stats.red}
                  </motion.div>

                  <Button
                    variant="link"
                    className="mt-3 p-0 h-auto text-red-700 hover:text-red-800 group"
                    onClick={() =>
                      navigateTo(
                        "admin-clients",
                        undefined,
                        undefined,
                        "red",
                      )
                    }
                  >
                    View Details
                    <motion.span
                      className="inline-block ml-1"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                      }}
                    >
                      →
                    </motion.span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-none bg-gradient-to-br from-amber-50 to-yellow-100 shadow-lg hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-200 rounded-full blur-3xl opacity-30"></div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between relative z-10">
                    <span>🟡 Amber Status</span>
                    <motion.div
                      className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <motion.div
                    className="text-5xl mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.4 }}
                  >
                    {stats.amber}
                  </motion.div>

                  <Button
                    variant="link"
                    className="mt-3 p-0 h-auto text-amber-700 hover:text-amber-800 group"
                    onClick={() =>
                      navigateTo(
                        "admin-clients",
                        undefined,
                        undefined,
                        "amber",
                      )
                    }
                  >
                    View Details
                    <motion.span
                      className="inline-block ml-1"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0.3,
                      }}
                    >
                      →
                    </motion.span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              whileHover={{ y: -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card className="border-none bg-gradient-to-br from-green-50 to-emerald-100 shadow-lg hover:shadow-xl transition-all overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full blur-3xl opacity-30"></div>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between relative z-10">
                    <span>🟢 Green Status</span>
                    <motion.div
                      className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                    >
                      <Users className="h-6 w-6 text-white" />
                    </motion.div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <motion.div
                    className="text-5xl mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.5 }}
                  >
                    {stats.green}
                  </motion.div>

                  <Button
                    variant="link"
                    className="mt-3 p-0 h-auto text-green-700 hover:text-green-800 group"
                    onClick={() =>
                      navigateTo(
                        "admin-clients",
                        undefined,
                        undefined,
                        "green",
                      )
                    }
                  >
                    View Details
                    <motion.span
                      className="inline-block ml-1"
                      animate={{ x: [0, 5, 0] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: 0.6,
                      }}
                    >
                      →
                    </motion.span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* General Stats */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-6 w-6 text-amber-600" />
            <h2 className="text-2xl">Business Metrics</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                value: stats.total,
                label: "Total Clients",
                color: "from-violet-400 to-purple-500",
                icon: "👥",
                delay: 0.4,
              },
              {
                value: stats.buyers,
                label: "Buyers",
                color: "from-blue-400 to-cyan-500",
                icon: "🏠",
                delay: 0.5,
              },
              {
                value: stats.sellers,
                label: "Sellers",
                color: "from-pink-400 to-rose-500",
                icon: "💼",
                delay: 0.6,
              },
              {
                value: projectCount,
                label: "Active Projects",
                color: "from-emerald-400 to-teal-500",
                icon: "🏗️",
                delay: 0.7,
              },
            ].map((stat, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ transitionDelay: `${stat.delay}s` }}
              >
                <Card className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden relative group">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}
                  ></div>
                  <CardContent className="p-6 text-center relative z-10">
                    <motion.div
                      className="text-4xl mb-2"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 5,
                      }}
                    >
                      {stat.icon}
                    </motion.div>
                    <motion.div
                      className="text-4xl mb-2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        delay: stat.delay,
                      }}
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-gray-600">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-8"
        >
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Quick Links
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    icon: Users,
                    label: "View All Clients",
                    onClick: () =>
                      navigateTo(
                        "admin-clients",
                        undefined,
                        undefined,
                        undefined,
                      ),
                  },
                  {
                    icon: Building2,
                    label: "View All Projects",
                    onClick: () => navigateTo("admin-projects"),
                  },
                  {
                    icon: Bell,
                    label: "Call Reminders",
                    onClick: () =>
                      navigateTo("admin-reminders"),
                  },
                ].map((link, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="justify-start w-full border-2 transition-all hover:border-green-500 hover:bg-green-50"
                      onClick={link.onClick}
                    >
                      <link.icon className="mr-2 h-5 w-5" />
                      {link.label}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Management Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="border-none shadow-lg bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Serviced Apartments Availability & Enquiries
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Manage apartment availability, unavailable blocks, and booking enquiries. Select an apartment from the Serviced Apartments section to view its availability calendar and enquiries.
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Go to &quot;Serviced Apartments&quot; tab and click &quot;Manage Availability&quot; on an apartment to view its availability calendar and enquiries.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}