import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Calendar as CalendarComponent } from "../ui/calendar";
import {
  Bell,
  Clock,
  Phone,
  Mail,
  User,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  Trash2,
  Edit,
  CalendarDays,
  Sparkles,
  PartyPopper,
  Zap,
} from "lucide-react";
import { projectId, publicAnonKey } from "../../utils/supabase/info";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Reminder {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  reminderDate: string;
  message: string;
  completed: boolean;
  createdAt: string;
  lastAlertTime?: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
}

interface AdminRemindersProps {
  navigateTo: (page: any, projectId?: string, clientId?: string) => void;
}

export function AdminReminders({ navigateTo }: AdminRemindersProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  
  // For date picker
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedHour, setSelectedHour] = useState("09");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    fetchData();
    
    // Check for overdue reminders every minute
    const intervalId = setInterval(() => {
      checkOverdueReminders();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    try {
      const [remindersRes, clientsRes] = await Promise.all([
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        ),
        fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/clients`,
          {
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        ),
      ]);

      if (!remindersRes.ok) {
        const errorText = await remindersRes.text();
        console.error("Reminders response not ok:", remindersRes.status, errorText);
        throw new Error(`Failed to fetch reminders: ${remindersRes.status} ${errorText}`);
      }
      if (!clientsRes.ok) {
        const errorText = await clientsRes.text();
        throw new Error(`Failed to fetch clients: ${errorText}`);
      }

      const remindersData = await remindersRes.json();
      const clientsData = await clientsRes.json();

      setReminders(remindersData);
      setClients(clientsData);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to load reminders: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueReminders = () => {
    const now = new Date();
    const overdueReminders = reminders.filter((reminder) => {
      if (reminder.completed) return false;
      
      const reminderTime = new Date(reminder.reminderDate);
      const hoursSinceReminder = (now.getTime() - reminderTime.getTime()) / (1000 * 60 * 60);
      
      // Check if it's past the reminder time
      if (now < reminderTime) return false;
      
      // If no last alert, show alert
      if (!reminder.lastAlertTime) return true;
      
      // Show alert if it's been more than an hour since last alert
      const lastAlert = new Date(reminder.lastAlertTime);
      const hoursSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60);
      return hoursSinceLastAlert >= 1;
    });

    if (overdueReminders.length > 0) {
      overdueReminders.forEach((reminder) => {
        toast.error(
          `⏰ Reminder: Call ${reminder.clientName} - ${reminder.message}`,
          {
            duration: 10000,
            action: {
              label: "Mark Done",
              onClick: () => markAsCompleted(reminder.id),
            },
          }
        );
        
        // Update last alert time
        updateLastAlertTime(reminder.id);
      });
    }
  };

  const updateLastAlertTime = async (reminderId: string) => {
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders/${reminderId}/alert`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      setReminders(
        reminders.map((r) =>
          r.id === reminderId ? { ...r, lastAlertTime: new Date().toISOString() } : r
        )
      );
    } catch (error) {
      console.error("Failed to update alert time:", error);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    setSubmitting(true);

    try {
      const selectedClient = clients.find((c) => c.id === selectedClientId);
      if (!selectedClient) {
        toast.error("Please select a client");
        return;
      }

      const formattedDate = formatDateTimeForSubmit();

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientId: selectedClientId,
            clientName: selectedClient.name,
            clientPhone: selectedClient.phone,
            clientEmail: selectedClient.email,
            reminderDate: formattedDate,
            message: reminderMessage,
          }),
        }
      );

      if (response.ok) {
        const newReminder = await response.json();
        setReminders([...reminders, newReminder]);
        toast.success("🎉 Reminder added successfully!");
        setAddDialogOpen(false);
        resetForm();
      } else {
        toast.error("Failed to add reminder");
      }
    } catch (error) {
      console.error("Error adding reminder:", error);
      toast.error("Failed to add reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const markAsCompleted = async (reminderId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders/${reminderId}/complete`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        setReminders(
          reminders.map((r) =>
            r.id === reminderId ? { ...r, completed: true } : r
          )
        );
        toast.success("✅ Reminder completed! Great job!");
      }
    } catch (error) {
      console.error("Error marking reminder as completed:", error);
      toast.error("Failed to mark reminder as completed");
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders/${reminderId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        setReminders(reminders.filter((r) => r.id !== reminderId));
        toast.success("Reminder deleted successfully!");
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
      toast.error("Failed to delete reminder");
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setReminderDate("");
    setReminderMessage("");
    setEditingReminder(null);
    setSelectedDate(undefined);
    setSelectedHour("09");
    setSelectedMinute("00");
  };

  const formatDateTimeForSubmit = () => {
    if (!selectedDate) return "";
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T${selectedHour}:${selectedMinute}:00.000Z`;
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    const date = new Date(reminder.reminderDate);
    setSelectedDate(date);
    setSelectedHour(String(date.getHours()).padStart(2, '0'));
    setSelectedMinute(String(date.getMinutes()).padStart(2, '0'));
    setReminderMessage(reminder.message);
    setEditDialogOpen(true);
  };

  const handleUpdateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }
    
    setSubmitting(true);

    try {
      const formattedDate = formatDateTimeForSubmit();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders/${editingReminder.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reminderDate: formattedDate,
            message: reminderMessage,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setReminders(
          reminders.map((r) =>
            r.id === editingReminder.id ? result.reminder : r
          )
        );
        toast.success("🎉 Reminder updated successfully!");
        setEditDialogOpen(false);
        resetForm();
      } else {
        toast.error("Failed to update reminder");
      }
    } catch (error) {
      console.error("Error updating reminder:", error);
      toast.error("Failed to update reminder");
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeStatus = (reminderDate: string, completed: boolean) => {
    if (completed) return "completed";
    
    const now = new Date();
    const reminderTime = new Date(reminderDate);
    
    if (reminderTime > now) return "upcoming";
    
    const hoursPast = (now.getTime() - reminderTime.getTime()) / (1000 * 60 * 60);
    if (hoursPast < 1) return "due";
    
    return "overdue";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 border-none">✓ Completed</Badge>;
      case "upcoming":
        return <Badge variant="outline" className="border-2 border-blue-400 text-blue-600 bg-blue-50">⏱ Upcoming</Badge>;
      case "due":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-amber-500 border-none">🔔 Due Now</Badge>;
      case "overdue":
        return <Badge className="bg-gradient-to-r from-red-500 to-rose-600 border-none animate-pulse">⚠ Overdue</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div 
            className="relative mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-16 h-16 border-4 border-amber-200 border-t-amber-600 rounded-full"></div>
            <motion.div 
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Bell className="h-6 w-6 text-amber-600" />
            </motion.div>
          </motion.div>
          <motion.p 
            className="text-gray-600"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📞 Loading reminders...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);
  const overdueCount = pendingReminders.filter(
    (r) => getTimeStatus(r.reminderDate, r.completed) === "overdue"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          className="mb-8 flex justify-between items-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                animate={{ rotate: [0, -15, 15, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Bell className="h-8 w-8 text-amber-600" />
              </motion.div>
              <h1 className="bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                📞 Call Reminders
              </h1>
            </div>
            <p className="text-gray-600">
              ⚡ Stay on top of your client follow-ups
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all"
              onClick={() => setAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Reminder
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {[
            { value: pendingReminders.length, label: "Pending", icon: Clock, color: "from-blue-400 to-cyan-500", emoji: "⏰" },
            { value: overdueCount, label: "Overdue", icon: AlertCircle, color: "from-red-400 to-rose-500", emoji: "🚨" },
            { value: completedReminders.length, label: "Completed", icon: CheckCircle, color: "from-green-400 to-emerald-500", emoji: "✅" },
            { value: reminders.length, label: "Total", icon: Bell, color: "from-purple-400 to-pink-500", emoji: "📊" },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5, scale: 1.05 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden relative group">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <CardContent className="p-6 text-center relative z-10">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}
                  >
                    <stat.icon className={`h-8 w-8 mx-auto mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`} />
                  </motion.div>
                  <motion.div 
                    className="mb-1 text-3xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 + index * 0.1 }}
                  >
                    {stat.value}
                  </motion.div>
                  <div className="text-sm text-gray-600">
                    {stat.emoji} {stat.label}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs for Pending/Completed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 bg-white shadow-md">
              <TabsTrigger value="pending" className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white transition-all">
                ⏰ Pending
                {pendingReminders.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2"
                  >
                    <Badge className="bg-red-500 hover:bg-red-500 text-white min-w-[20px] h-5">
                      {pendingReminders.length > 99 ? "99+" : pendingReminders.length}
                    </Badge>
                  </motion.div>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white transition-all">
                ✅ Completed
                {completedReminders.length > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2"
                  >
                    <Badge className="bg-green-600 hover:bg-green-600 text-white min-w-[20px] h-5">
                      {completedReminders.length > 99 ? "99+" : completedReminders.length}
                    </Badge>
                  </motion.div>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <AnimatePresence mode="wait">
                {pendingReminders.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="border-none bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 shadow-lg">
                      <CardContent className="p-12 text-center">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <PartyPopper className="h-20 w-20 mx-auto mb-4 text-green-500" />
                        </motion.div>
                        <p className="text-2xl mb-2">All caught up! 🎉</p>
                        <p className="text-gray-600">
                          No pending reminders. Great job staying on top of things!
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  pendingReminders
                    .sort((a, b) => new Date(a.reminderDate).getTime() - new Date(b.reminderDate).getTime())
                    .map((reminder, index) => {
                      const status = getTimeStatus(reminder.reminderDate, reminder.completed);
                      return (
                        <motion.div
                          key={reminder.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card
                            className={`transition-all hover:shadow-xl border-none shadow-lg ${
                              status === "overdue"
                                ? "bg-gradient-to-r from-red-50 to-rose-100 ring-2 ring-red-400"
                                : status === "due"
                                ? "bg-gradient-to-r from-yellow-50 to-amber-100 ring-2 ring-yellow-400"
                                : "bg-white"
                            }`}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-3">
                                    <motion.div 
                                      className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-2xl shadow-lg"
                                      whileHover={{ rotate: 15, scale: 1.1 }}
                                    >
                                      <Phone className="h-6 w-6 text-white" />
                                    </motion.div>
                                    <div>
                                      <h3 className="mb-1">{reminder.clientName}</h3>
                                      {getStatusBadge(status)}
                                    </div>
                                  </div>

                                  <div className="space-y-2 mb-4 bg-white/50 p-4 rounded-xl">
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Clock className="h-4 w-4 text-amber-600" />
                                      <span className="text-sm">
                                        {new Date(reminder.reminderDate).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Phone className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm">{reminder.clientPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-700">
                                      <Mail className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm">{reminder.clientEmail}</span>
                                    </div>
                                  </div>

                                  {reminder.message && (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-xl mb-4 border border-amber-200">
                                      <p className="text-sm text-gray-700">
                                        💬 {reminder.message}
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex gap-2 flex-wrap">
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
                                        onClick={() => markAsCompleted(reminder.id)}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Done
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        variant="outline"
                                        className="border-2 hover:border-blue-500 hover:bg-blue-50"
                                        onClick={() => handleEditReminder(reminder)}
                                      >
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        variant="outline"
                                        className="border-2 hover:border-purple-500 hover:bg-purple-50"
                                        onClick={() => navigateTo("admin-client-detail", undefined, reminder.clientId)}
                                      >
                                        <User className="mr-2 h-4 w-4" />
                                        View Client
                                      </Button>
                                    </motion.div>
                                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                      <Button
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50 border-2 hover:border-red-500"
                                        onClick={() => deleteReminder(reminder.id)}
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                      </Button>
                                    </motion.div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="completed" className="space-y-4">
              <AnimatePresence mode="wait">
                {completedReminders.length === 0 ? (
                  <motion.div
                    key="empty-completed"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="border-none bg-gradient-to-r from-gray-50 to-slate-100 shadow-lg">
                      <CardContent className="p-12 text-center">
                        <Clock className="h-20 w-20 mx-auto mb-4 text-gray-400" />
                        <p className="text-2xl mb-2">No completed reminders yet</p>
                        <p className="text-gray-600">
                          Completed reminders will appear here
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  completedReminders
                    .sort((a, b) => new Date(b.reminderDate).getTime() - new Date(a.reminderDate).getTime())
                    .map((reminder, index) => (
                      <motion.div
                        key={reminder.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-none bg-gradient-to-r from-green-50 to-emerald-100 shadow-md hover:shadow-lg transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <motion.div
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                >
                                  <CheckCircle className="h-6 w-6 text-green-600" />
                                </motion.div>
                                <div>
                                  <p>{reminder.clientName}</p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(reminder.reminderDate).toLocaleString()}
                                  </p>
                                  {reminder.message && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      💬 {reminder.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="hover:bg-green-100"
                                    onClick={() => navigateTo("admin-client-detail", undefined, reminder.clientId)}
                                  >
                                    View Client
                                  </Button>
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => deleteReminder(reminder.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="h-6 w-6 text-amber-600" />
              Add New Reminder
            </DialogTitle>
            <DialogDescription>
              ⚡ Set a reminder to follow up with a client
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddReminder} className="space-y-4">
            <div>
              <Label htmlFor="client" className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-green-600" />
                Select Client *
              </Label>
              <select
                id="client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                className="w-full h-10 px-3 border-2 rounded-lg bg-white focus:border-green-500 transition-all"
              >
                <option value="">Choose a client...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.phone}) - {client.type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Reminder Date & Time *
              </Label>
              <div className="flex gap-2">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-2 hover:border-green-500 transition-all"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Hour
                  </Label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full h-10 px-3 border-2 rounded-lg bg-white mt-1 focus:border-green-500 transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      return (
                        <option key={hour} value={hour}>
                          {hour}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Minute
                  </Label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-full h-10 px-3 border-2 rounded-lg bg-white mt-1 focus:border-green-500 transition-all"
                  >
                    {['00', '15', '30', '45'].map((minute) => (
                      <option key={minute} value={minute}>
                        :{minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedDate && (
                <motion.p 
                  className="text-sm text-gray-600 mt-2 bg-green-50 p-2 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  📅 Scheduled for: {format(selectedDate, "PPP")} at {selectedHour}:{selectedMinute}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="message" className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Message
              </Label>
              <Input
                id="message"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="e.g., Follow up on project interest"
                className="border-2 focus:border-green-500 transition-all"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  resetForm();
                }}
                className="border-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-md"
                disabled={submitting}
              >
                {submitting ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Adding...
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Reminder
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Reminder Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Edit className="h-6 w-6 text-blue-600" />
              Edit Reminder
            </DialogTitle>
            <DialogDescription>
              📝 Update the reminder details
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateReminder} className="space-y-4">
            {editingReminder && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm">
                  <span className="font-medium">Client:</span> {editingReminder.clientName}
                </p>
                <p className="text-sm text-gray-600">{editingReminder.clientPhone}</p>
              </div>
            )}

            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Reminder Date & Time *
              </Label>
              <div className="flex gap-2">
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-2 hover:border-blue-500 transition-all"
                    >
                      <CalendarDays className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date);
                        setDatePickerOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex gap-2 mt-2">
                <div className="flex-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Hour
                  </Label>
                  <select
                    value={selectedHour}
                    onChange={(e) => setSelectedHour(e.target.value)}
                    className="w-full h-10 px-3 border-2 rounded-lg bg-white mt-1 focus:border-blue-500 transition-all"
                  >
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      return (
                        <option key={hour} value={hour}>
                          {hour}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex-1">
                  <Label className="text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Minute
                  </Label>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="w-full h-10 px-3 border-2 rounded-lg bg-white mt-1 focus:border-blue-500 transition-all"
                  >
                    {['00', '15', '30', '45'].map((minute) => (
                      <option key={minute} value={minute}>
                        :{minute}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {selectedDate && (
                <motion.p 
                  className="text-sm text-gray-600 mt-2 bg-blue-50 p-2 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  📅 Scheduled for: {format(selectedDate, "PPP")} at {selectedHour}:{selectedMinute}
                </motion.p>
              )}
            </div>

            <div>
              <Label htmlFor="editMessage" className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Message
              </Label>
              <Input
                id="editMessage"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                placeholder="e.g., Follow up on project interest"
                className="border-2 focus:border-blue-500 transition-all"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
                className="border-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 shadow-md"
                disabled={submitting}
              >
                {submitting ? (
                  <motion.div
                    className="flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    Updating...
                  </motion.div>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Update Reminder
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
