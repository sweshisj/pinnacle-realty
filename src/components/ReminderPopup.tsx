import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Bell, Phone, Mail, Clock, CheckCircle, X } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";
import { toast } from "sonner";

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

interface ReminderPopupProps {
  isAdmin: boolean;
  navigateTo: (page: any) => void;
  justLoggedIn?: boolean;
}

export function ReminderPopup({ isAdmin, navigateTo, justLoggedIn = false }: ReminderPopupProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<Reminder[]>([]);
  const [currentReminderIndex, setCurrentReminderIndex] = useState(0);
  const [hasShownInitial, setHasShownInitial] = useState(false);

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
    } catch (error) {
      console.error("Failed to update alert time:", error);
    }
  };

  const checkReminders = async (isInitialCheck: boolean = false) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-64143980/reminders`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const reminders = await response.json();
        const now = new Date();
        
        // Filter for overdue and pending reminders
        const overdue = reminders.filter((reminder: Reminder) => {
          if (reminder.completed) return false;
          
          const reminderTime = new Date(reminder.reminderDate);
          if (now < reminderTime) return false;
          
          // If no last alert, show alert
          if (!reminder.lastAlertTime) return true;
          
          // Show alert if it's been more than an hour since last alert
          const lastAlert = new Date(reminder.lastAlertTime);
          const hoursSinceLastAlert = (now.getTime() - lastAlert.getTime()) / (1000 * 60 * 60);
          return hoursSinceLastAlert >= 1;
        });

        const shouldShowPopup = isInitialCheck && overdue.length > 0;
        console.log("🔔 Reminder check:", {
          isInitialCheck,
          hasShownInitial,
          overdueCount: overdue.length,
          willShowPopup: shouldShowPopup
        });

        setPendingReminders(overdue);
        
        if (overdue.length > 0) {
          setCurrentReminderIndex(0);
          
          // Show popup on initial login check if there are overdue reminders
          if (isInitialCheck && !hasShownInitial) {
            console.log("✅ Showing initial reminder popup");
            setPopupOpen(true);
            setHasShownInitial(true);
            
            // Show toast notification
            toast.warning(`🔔 You have ${overdue.length} pending reminder${overdue.length > 1 ? 's' : ''}!`);
            
            // Update last alert time for all shown reminders
            overdue.forEach((reminder: Reminder) => {
              updateLastAlertTime(reminder.id);
            });
          }
        }
      }
    } catch (error) {
      console.error("❌ Error checking reminders:", error);
      // Silently fail - server might not be ready
      setPendingReminders([]);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      // Immediately check reminders when admin logs in
      checkReminders(true); // Pass true to indicate initial check
      // Check every 60 seconds
      const interval = setInterval(() => checkReminders(false), 60000);
      return () => clearInterval(interval);
    } else {
      // Reset when logged out
      setHasShownInitial(false);
      setPendingReminders([]);
      setPopupOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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
        toast.success("✅ Reminder completed!");
        
        // Remove from current list
        const newReminders = pendingReminders.filter(r => r.id !== reminderId);
        setPendingReminders(newReminders);
        
        // If no more reminders, close popup
        if (newReminders.length === 0) {
          setPopupOpen(false);
        } else if (currentReminderIndex >= newReminders.length) {
          // If we're past the end, go to last item
          setCurrentReminderIndex(newReminders.length - 1);
        }
      }
    } catch (error) {
      console.error("Error marking reminder as completed:", error);
      toast.error("Failed to mark reminder as completed");
    }
  };

  const handleViewReminders = () => {
    setPopupOpen(false);
    navigateTo("admin-reminders");
    // The AdminReminders component will default to pending tab
  };

  if (!isAdmin || pendingReminders.length === 0) return null;

  const currentReminder = pendingReminders[currentReminderIndex];

  return (
    <AnimatePresence>
      {popupOpen && currentReminder && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-4 top-20 z-50 max-w-sm w-full"
        >
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 rounded-xl shadow-2xl border-2 border-orange-200 p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 mb-3"
            >
              <motion.div
                animate={{ 
                  rotate: [0, -15, 15, -15, 15, 0],
                  scale: [1, 1.1, 1, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 2
                }}
                className="bg-gradient-to-br from-red-500 to-orange-600 p-2 rounded-full shadow-lg"
              >
                <Bell className="h-4 w-4 text-white" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  ⚠️ Reminder Alert!
                </h3>
                {pendingReminders.length > 1 && (
                  <p className="text-xs text-gray-600">
                    {currentReminderIndex + 1} of {pendingReminders.length} pending
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPopupOpen(false)}
                className="hover:bg-red-100 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-3"
            >
              {/* Client Info */}
              <div className="bg-white p-3 rounded-lg shadow-md border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <motion.div
                    whileHover={{ rotate: 15, scale: 1.1 }}
                    className="bg-gradient-to-br from-green-400 to-emerald-500 p-2 rounded-lg shadow-md"
                  >
                    <Phone className="h-4 w-4 text-white" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{currentReminder.clientName}</h3>
                    <Badge className="bg-gradient-to-r from-red-500 to-rose-600 border-none animate-pulse text-xs">
                      ⚠ Overdue
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-700">
                    <Clock className="h-3 w-3 text-amber-600 flex-shrink-0" />
                    <span className="truncate">
                      {new Date(currentReminder.reminderDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-3 w-3 text-blue-600 flex-shrink-0" />
                    <span className="truncate">{currentReminder.clientPhone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-3 w-3 text-purple-600 flex-shrink-0" />
                    <span className="truncate">{currentReminder.clientEmail}</span>
                  </div>
                </div>

                {currentReminder.message && (
                  <div className="mt-2 bg-gradient-to-r from-amber-50 to-orange-50 p-2 rounded-lg border border-amber-200">
                    <p className="text-xs text-gray-700 line-clamp-2">
                      💬 {currentReminder.message}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg text-xs"
                    onClick={() => markAsCompleted(currentReminder.id)}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                </motion.div>
                <motion.div 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex-1"
                >
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-2 border-purple-500 hover:bg-purple-50 text-xs"
                    onClick={handleViewReminders}
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    View All
                  </Button>
                </motion.div>
              </div>

              {/* Navigation for multiple reminders */}
              {pendingReminders.length > 1 && (
                <div className="flex justify-between items-center pt-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentReminderIndex === 0}
                    onClick={() => setCurrentReminderIndex(prev => prev - 1)}
                    className="text-xs h-7 px-2"
                  >
                    ← Prev
                  </Button>
                  <div className="flex gap-1">
                    {pendingReminders.map((_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 w-1.5 rounded-full transition-all ${
                          index === currentReminderIndex
                            ? "bg-orange-500 w-3"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentReminderIndex === pendingReminders.length - 1}
                    onClick={() => setCurrentReminderIndex(prev => prev + 1)}
                    className="text-xs h-7 px-2"
                  >
                    Next →
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
