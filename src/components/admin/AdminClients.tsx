import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import {
  Search,
  Plus,
  Bell,
  Users,
  UserCheck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  X,
  Sparkles,
} from "lucide-react";
import {
  projectId,
  publicAnonKey,
} from "../../utils/supabase/info";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { LoadingSpinner } from "../LoadingSpinner";

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  location: string;
  projectsInterested?: string[];
  favoriteProjects?: string[];
  projectsOwned?: string[];
  enquiryDate: string;
  sold?: boolean;
  source?: string;
  primaryContact?: string;
}

interface Notification {
  id: string;
  type: string;
  clientId: string;
  clientName: string;
  message: string;
  date: string;
  read: boolean;
}

interface Project {
  id: string;
  name: string;
  location: string;
  city: string;
  type: string;
  images?: string[];
}

interface AdminClientsProps {
  navigateTo: (
    page: any,
    projectId?: string,
    clientId?: string,
    statusFilter?: string,
    searchData?: any,
    projectData?: any,
    clientData?: {
      id: string;
      name: string;
      phone: string;
      email: string;
    },
  ) => void;
  initialStatusFilter?: string | null;
}

export function AdminClients({
  navigateTo,
  initialStatusFilter,
}: AdminClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<
    Notification[]
  >([]);
  const [filteredClients, setFilteredClients] = useState<
    Client[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(
    initialStatusFilter || "all",
  );
  const [sourceFilter, setSourceFilter] =
    useState<string>("all");
  const [activeTab, setActiveTab] = useState("buyers");
  const [duplicateDialogOpen, setDuplicateDialogOpen] =
    useState(false);
  const [duplicateClients, setDuplicateClients] = useState<
    Client[]
  >([]);

  // Notification detail state
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [notificationClient, setNotificationClient] =
    useState<Client | null>(null);
  const [notificationProjects, setNotificationProjects] =
    useState<Project[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, projectsRes, notificationsRes] =
          await Promise.all([
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            ),
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            ),
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-64143980/notifications`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            ),
          ]);

        if (!clientsRes.ok) {
          const errorText = await clientsRes.text();
          throw new Error(
            `Failed to fetch clients: ${errorText}`,
          );
        }
        if (!projectsRes.ok) {
          const errorText = await projectsRes.text();
          throw new Error(
            `Failed to fetch projects: ${errorText}`,
          );
        }
        if (!notificationsRes.ok) {
          const errorText = await notificationsRes.text();
          throw new Error(
            `Failed to fetch notifications: ${errorText}`,
          );
        }

        const clientsData = await clientsRes.json();
        const projectsData = await projectsRes.json();
        const notificationsData = await notificationsRes.json();

        console.log("📊 Fetched data:", {
          clients: clientsData.length,
          projects: projectsData.length,
          notifications: notificationsData.length,
        });
        console.log("🔔 Notifications:", notificationsData);

        setClients(clientsData);
        setProjects(projectsData);
        setNotifications(notificationsData);

        // Check for duplicates (same phone AND same type)
        const phoneTypeMap = new Map<string, Client[]>();
        clientsData.forEach((client: Client) => {
          const key = `${client.phone}-${client.type}`; // Combine phone and type
          const existing = phoneTypeMap.get(key) || [];
          existing.push(client);
          phoneTypeMap.set(key, existing);
        });

        const duplicates: Client[] = [];
        phoneTypeMap.forEach((clientList) => {
          if (clientList.length > 1) {
            duplicates.push(...clientList);
          }
        });

        if (duplicates.length > 0) {
          setDuplicateClients(duplicates);
          setDuplicateDialogOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let filtered = [...clients];

    // Filter by tab
    if (activeTab === "buyers") {
      filtered = filtered.filter(
        (c) => c.type === "buyer" && !c.sold,
      );
    } else if (activeTab === "sellers") {
      filtered = filtered.filter(
        (c) => c.type === "seller" && !c.sold,
      );
    } else if (activeTab === "sold") {
      filtered = filtered.filter((c) => c.sold);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          c.email
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          c.phone.includes(searchQuery),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.status === statusFilter,
      );
    }

    // Source filter
    if (sourceFilter !== "all") {
      filtered = filtered.filter(
        (c) => c.source === sourceFilter,
      );
    }

    setFilteredClients(filtered);
  }, [
    clients,
    searchQuery,
    statusFilter,
    sourceFilter,
    activeTab,
  ]);

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

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "red":
        return "text-red-600";
      case "amber":
        return "text-amber-600";
      case "green":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : projectId;
  };

  const handleCreateReminder = async (client: Client) => {
    try {
      // Calculate time 1 hour from now
      const oneHourFromNow = new Date();
      oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

      const reminderData = {
        clientId: client.id,
        clientName: client.name,
        clientPhone: client.phone,
        clientEmail: client.email,
        reminderDate: oneHourFromNow.toISOString(),
        reminderTime: oneHourFromNow.toTimeString().slice(0, 5), // HH:MM format
        notes: `Follow-up call reminder for ${client.name}`,
        status: "pending",
      };

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(reminderData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create reminder");
      }

      toast.success(
        `⏰ Reminder set for ${oneHourFromNow.toLocaleString()}`,
      );
    } catch (error) {
      console.error("Failed to create reminder:", error);
      toast.error("Failed to create reminder");
    }
  };

  const handleNotificationClick = async (
    notification: Notification,
  ) => {
    setSelectedNotification(notification);

    // Fetch client details
    try {
      const clientRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients/${notification.clientId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );
      const clientData = await clientRes.json();
      setNotificationClient(clientData);

      // Fetch project details if client is a buyer
      if (
        clientData.type === "buyer" &&
        clientData.projectsInterested &&
        clientData.projectsInterested.length > 0
      ) {
        const projectPromises =
          clientData.projectsInterested.map((projId: string) =>
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects/${projId}`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            ).then((res) => res.json()),
          );
        const projectsData = await Promise.all(projectPromises);
        setNotificationProjects(
          projectsData.filter((p) => p && !p.error),
        );
      } else if (
        clientData.type === "seller" &&
        clientData.projectsOwned &&
        clientData.projectsOwned.length > 0
      ) {
        const projectPromises = clientData.projectsOwned.map(
          (projId: string) =>
            fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-64143980/projects/${projId}`,
              {
                headers: {
                  Authorization: `Bearer ${publicAnonKey}`,
                },
              },
            ).then((res) => res.json()),
        );
        const projectsData = await Promise.all(projectPromises);
        setNotificationProjects(
          projectsData.filter((p) => p && !p.error),
        );
      }

      // Mark as read
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.error(
        "Failed to fetch notification details:",
        error,
      );
      toast.error("Failed to load notification details");
    }
  };

  const closeNotificationDetail = () => {
    setSelectedNotification(null);
    setNotificationClient(null);
    setNotificationProjects([]);
  };

  const markNotificationAsRead = async (
    notificationId: string,
  ) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/notifications/${notificationId}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );
      setNotifications(
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n,
        ),
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error,
      );
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        },
      );
      setNotifications(
        notifications.filter((n) => n.id !== notificationId),
      );
      toast.success("Notification deleted");
      closeNotificationDetail();
    } catch (error) {
      console.error("Failed to delete notification:", error);
      toast.error("Failed to delete notification");
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <LoadingSpinner
          message="✨ Gathering your client roster..."
          color="purple"
          theme="clients"
          size="lg"
        />
      </div>
    );
  }

  const buyers = clients.filter(
    (c) => c.type === "buyer" && !c.sold,
  );
  const sellers = clients.filter(
    (c) => c.type === "seller" && !c.sold,
  );
  const soldClients = clients.filter((c) => c.sold);
  const unreadNotifications = notifications.filter(
    (n) => !n.read,
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              👥 Client Management
            </h1>
            <p className="text-gray-600">
              ✨ Manage and track all your amazing clients
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
              onClick={() =>
                navigateTo(
                  "admin-client-detail",
                  undefined,
                  "new",
                )
              }
            >
              <Plus className="mr-2 h-5 w-5" />
              Add New Client
            </Button>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger
              value="buyers"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Buyers
              <Badge variant="secondary">{buyers.length}</Badge>
            </TabsTrigger>
            <TabsTrigger
              value="sellers"
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Sellers
              <Badge variant="secondary">
                {sellers.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="sold"
              className="flex items-center gap-2"
            >
              Sold
              <Badge variant="secondary">
                {soldClients.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="flex items-center gap-2"
            >
              <Bell className="h-4 w-4" />
              Notifications
              {unreadNotifications > 0 && (
                <Badge className="bg-red-500">
                  {unreadNotifications}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Buyers Tab */}
          <TabsContent value="buyers">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-purple-100"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-purple-400" />
                  <Input
                    placeholder="🔍 Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className="pl-10 border-purple-200 focus:border-purple-400"
                  />
                </div>

                <div>
                  <select
                    value={sourceFilter}
                    onChange={(e) =>
                      setSourceFilter(e.target.value)
                    }
                    className="w-full h-10 px-3 border border-purple-200 rounded-lg bg-white focus:border-purple-400 focus:outline-none"
                  >
                    <option value="all">📢 All Sources</option>
                    {Array.from(
                      new Set(
                        buyers
                          .map((c) => c.source)
                          .filter(Boolean),
                      ),
                    ).map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
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
                className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "all"
                    ? "ring-4 ring-blue-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">{buyers.length}</div>
                <div className="text-sm text-blue-100">
                  👥 Total Buyers
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("red")}
                className={`bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "red"
                    ? "ring-4 ring-red-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    buyers.filter((c) => c.status === "red")
                      .length
                  }
                </div>
                <div className="text-sm text-red-100">
                  🔴 Red Status
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("amber")}
                className={`bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "amber"
                    ? "ring-4 ring-amber-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    buyers.filter((c) => c.status === "amber")
                      .length
                  }
                </div>
                <div className="text-sm text-amber-100">
                  🟡 Amber Status
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("green")}
                className={`bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "green"
                    ? "ring-4 ring-green-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    buyers.filter((c) => c.status === "green")
                      .length
                  }
                </div>
                <div className="text-sm text-green-100">
                  🟢 Green Status
                </div>
              </motion.div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-gray-600">
                Showing {filteredClients.length} of{" "}
                {buyers.length} buyers
                {(statusFilter !== "all" ||
                  searchQuery ||
                  sourceFilter !== "all") && (
                  <span className="ml-2 text-purple-600">
                    (filtered)
                  </span>
                )}
              </div>
              {(statusFilter !== "all" ||
                searchQuery ||
                sourceFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                  className="text-purple-600 hover:text-purple-700"
                >
                  ✨ Clear All Filters
                </Button>
              )}
            </div>

            {/* Client Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigateTo(
                      "admin-client-detail",
                      undefined,
                      client.id,
                    )
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">{client.name}</h3>
                        <Badge variant="outline">
                          {client.source
                            ? `From ${client.source}`
                            : "Buyer"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateReminder(client);
                          }}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <div
                          className={`w-4 h-4 rounded-full ${getStatusColor(client.status)}`}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Email:
                        </span>
                        <span className="break-all">
                          {client.email}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Phone:
                        </span>
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Location:
                        </span>
                        <span>{client.location}</span>
                      </div>
                      {client.projectsInterested &&
                        client.projectsInterested.length >
                          0 && (
                          <div className="flex items-start">
                            <span className="w-20 flex-shrink-0">
                              Projects:
                            </span>
                            <span>
                              {client.projectsInterested.length}
                            </span>
                          </div>
                        )}
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Date:
                        </span>
                        <span>{client.enquiryDate}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div
                        className={`text-center ${getStatusTextColor(client.status || "amber")}`}
                      >
                        Status:{" "}
                        {(
                          client.status || "amber"
                        ).toUpperCase()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">
                  No buyers found
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Sellers Tab */}
          <TabsContent value="sellers">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-orange-100"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-orange-400" />
                  <Input
                    placeholder="🔍 Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    className="pl-10 border-orange-200 focus:border-orange-400"
                  />
                </div>

                <div>
                  <select
                    value={sourceFilter}
                    onChange={(e) =>
                      setSourceFilter(e.target.value)
                    }
                    className="w-full h-10 px-3 border border-orange-200 rounded-lg bg-white focus:border-orange-400 focus:outline-none"
                  >
                    <option value="all">📢 All Sources</option>
                    {Array.from(
                      new Set(
                        sellers
                          .map((c) => c.source)
                          .filter(Boolean),
                      ),
                    ).map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
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
                className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "all"
                    ? "ring-4 ring-blue-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">{sellers.length}</div>
                <div className="text-sm text-blue-100">
                  🏢 Total Sellers
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("red")}
                className={`bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "red"
                    ? "ring-4 ring-red-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    sellers.filter((c) => c.status === "red")
                      .length
                  }
                </div>
                <div className="text-sm text-red-100">
                  🔴 Red Status
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("amber")}
                className={`bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "amber"
                    ? "ring-4 ring-amber-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    sellers.filter((c) => c.status === "amber")
                      .length
                  }
                </div>
                <div className="text-sm text-amber-100">
                  🟡 Amber Status
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStatusFilter("green")}
                className={`bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-4 text-center shadow-lg cursor-pointer ${
                  statusFilter === "green"
                    ? "ring-4 ring-green-300 ring-offset-2"
                    : ""
                }`}
              >
                <div className="mb-1">
                  {
                    sellers.filter((c) => c.status === "green")
                      .length
                  }
                </div>
                <div className="text-sm text-green-100">
                  🟢 Green Status
                </div>
              </motion.div>
            </div>

            {/* Results Count */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-gray-600">
                Showing {filteredClients.length} of{" "}
                {sellers.length} sellers
                {(statusFilter !== "all" ||
                  searchQuery ||
                  sourceFilter !== "all") && (
                  <span className="ml-2 text-orange-600">
                    (filtered)
                  </span>
                )}
              </div>
              {(statusFilter !== "all" ||
                searchQuery ||
                sourceFilter !== "all") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                  className="text-orange-600 hover:text-orange-700"
                >
                  ✨ Clear All Filters
                </Button>
              )}
            </div>

            {/* Client Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigateTo(
                      "admin-client-detail",
                      undefined,
                      client.id,
                    )
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">{client.name}</h3>
                        <Badge variant="outline">
                          {client.source
                            ? `From ${client.source}`
                            : "Seller"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreateReminder(client);
                          }}
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                        <div
                          className={`w-4 h-4 rounded-full ${getStatusColor(client.status)}`}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Email:
                        </span>
                        <span className="break-all">
                          {client.email}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Phone:
                        </span>
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Location:
                        </span>
                        <span>{client.location}</span>
                      </div>
                      {client.projectsOwned &&
                        client.projectsOwned.length > 0 && (
                          <div className="flex items-start">
                            <span className="w-20 flex-shrink-0">
                              Projects:
                            </span>
                            <span>
                              {client.projectsOwned.length}
                            </span>
                          </div>
                        )}
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Date:
                        </span>
                        <span>{client.enquiryDate}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div
                        className={`text-center ${getStatusTextColor(client.status || "amber")}`}
                      >
                        Status:{" "}
                        {(
                          client.status || "amber"
                        ).toUpperCase()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500 mb-4">
                  No sellers found
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Sold Tab */}
          <TabsContent value="sold">
            <div className="mb-4 text-gray-600">
              Showing {filteredClients.length} sold clients
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() =>
                    navigateTo(
                      "admin-client-detail",
                      undefined,
                      client.id,
                    )
                  }
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">{client.name}</h3>
                        <Badge
                          variant="outline"
                          className="bg-green-100"
                        >
                          {client.type === "buyer"
                            ? "Buyer"
                            : "Seller"}{" "}
                          - Sold
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Email:
                        </span>
                        <span className="break-all">
                          {client.email}
                        </span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Phone:
                        </span>
                        <span>{client.phone}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Location:
                        </span>
                        <span>{client.location}</span>
                      </div>
                      <div className="flex items-start">
                        <span className="w-20 flex-shrink-0">
                          Date:
                        </span>
                        <span>{client.enquiryDate}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredClients.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-500">No sold clients</p>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notifications List */}
              <div className="space-y-4">
                <h2 className="mb-4">All Notifications</h2>
                {notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    className={`cursor-pointer hover:shadow-lg transition-shadow ${
                      notification.read
                        ? "opacity-60"
                        : notification.type ===
                            "duplicate_client"
                          ? "border-amber-500 bg-amber-50"
                          : "border-green-500"
                    } ${selectedNotification?.id === notification.id ? "ring-2 ring-green-600" : ""}`}
                    onClick={() =>
                      handleNotificationClick(notification)
                    }
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Bell
                              className={`mr-2 h-4 w-4 ${notification.read ? "text-gray-400" : notification.type === "duplicate_client" ? "text-amber-600" : "text-green-600"}`}
                            />
                            <span
                              className={
                                notification.read
                                  ? "text-gray-600"
                                  : ""
                              }
                            >
                              {notification.message}
                            </span>
                            {!notification.read && (
                              <Badge
                                className={
                                  notification.type ===
                                  "duplicate_client"
                                    ? "ml-2 bg-amber-600"
                                    : "ml-2 bg-green-600"
                                }
                              >
                                {notification.type ===
                                "duplicate_client"
                                  ? "Duplicate"
                                  : "New"}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              notification.date,
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {notifications.length === 0 && (
                  <div className="text-center py-16">
                    <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">
                      No notifications
                    </p>
                  </div>
                )}
              </div>

              {/* Notification Detail */}
              <div>
                {selectedNotification && notificationClient ? (
                  <Card className="sticky top-4">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                      <CardTitle>Enquiry Details</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={closeNotificationDetail}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Client Info */}
                      <div className="border-b pb-4">
                        <h3 className="mb-3">
                          Contact Information
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-gray-500" />
                            <span>
                              {notificationClient.name || "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-gray-500" />
                            <span>
                              {notificationClient.email ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>
                              {notificationClient.phone ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span>
                              {notificationClient.location ||
                                "N/A"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>
                              Enquiry:{" "}
                              {notificationClient.enquiryDate ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Badge variant="outline">
                            {notificationClient.type ===
                              "buyer" ||
                            !notificationClient.type
                              ? "Buyer"
                              : "Seller"}
                          </Badge>
                          {notificationClient.source && (
                            <Badge
                              variant="outline"
                              className="ml-2"
                            >
                              From {notificationClient.source}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getStatusColor(notificationClient.status || "amber")}`}
                            ></div>
                            <span className="text-sm">
                              Status:{" "}
                              {(
                                notificationClient.status ||
                                "amber"
                              ).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Projects Info */}
                      {notificationProjects.length > 0 && (
                        <div className="border-b pb-4">
                          <h3 className="mb-3">
                            {notificationClient.type ===
                              "buyer" ||
                            !notificationClient.type
                              ? "Interested Projects"
                              : "Projects Owned"}
                          </h3>
                          <div className="space-y-3">
                            {notificationProjects.map(
                              (project) => (
                                <div
                                  key={project.id}
                                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                  {project.images &&
                                    project.images[0] && (
                                      <img
                                        src={project.images[0]}
                                        alt={project.name}
                                        className="w-16 h-16 object-cover rounded"
                                      />
                                    )}
                                  <div className="flex-1">
                                    <div className="flex items-start gap-2">
                                      <Building2 className="h-4 w-4 text-green-600 mt-0.5" />
                                      <div>
                                        <p className="text-sm">
                                          {project.name}
                                        </p>
                                        <p className="text-xs text-gray-600">
                                          {project.location},{" "}
                                          {project.city}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          {project.type}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => {
                            closeNotificationDetail();
                            navigateTo(
                              "admin-client-detail",
                              undefined,
                              notificationClient.id,
                            );
                          }}
                        >
                          View Full Profile
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() =>
                            deleteNotification(
                              selectedNotification.id,
                            )
                          }
                        >
                          Delete Notification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Bell className="mx-auto h-12 w-12 mb-2 text-gray-400" />
                      <p>
                        Select a notification to view details
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Duplicate Clients Dialog */}
      <Dialog
        open={duplicateDialogOpen}
        onOpenChange={setDuplicateDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Duplicate Clients Detected
            </DialogTitle>
            <DialogDescription>
              The following clients have duplicate phone numbers
              and may be interested in multiple projects. Please
              review and merge if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-4">
              {Object.entries(
                duplicateClients.reduce(
                  (acc, client) => {
                    if (!acc[client.phone])
                      acc[client.phone] = [];
                    acc[client.phone].push(client);
                    return acc;
                  },
                  {} as Record<string, Client[]>,
                ),
              ).map(([phone, clients]) => (
                <div
                  key={phone}
                  className="border rounded-lg p-4 bg-amber-50"
                >
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">
                        {phone}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-amber-100"
                      >
                        {clients.length} Entries
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between bg-white p-3 rounded border cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setDuplicateDialogOpen(false);
                          navigateTo(
                            "admin-client-detail",
                            undefined,
                            client.id,
                          );
                        }}
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {client.email}
                          </div>
                          {client.projectsInterested &&
                            client.projectsInterested.length >
                              0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                Interested:{" "}
                                {client.projectsInterested
                                  .map((projId) =>
                                    getProjectName(projId),
                                  )
                                  .join(", ")}
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>{client.type}</Badge>
                          <Badge variant="outline">
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setDuplicateDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}