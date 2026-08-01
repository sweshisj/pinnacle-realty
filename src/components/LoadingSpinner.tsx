import React from "react";
import { motion } from "framer-motion";
import { 
  Loader2, Home, Building2, Users, Phone, Star, 
  MapPin, Calendar, Heart, Bell, FileText, Award 
} from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  color?: string;
  theme?: "default" | "home" | "projects" | "dashboard" | "clients" | "reminders" | "testimonials" | "seller" | "favorites";
}

export function LoadingSpinner({ 
  message = "Loading...", 
  size = "md",
  color = "green",
  theme = "default"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  const colorClasses = {
    green: "text-green-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
    blue: "text-blue-600",
    pink: "text-pink-600",
    red: "text-red-600"
  };

  // Theme-based loading animations
  const renderThemeAnimation = () => {
    switch (theme) {
      case "home":
        return (
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-gradient-to-br from-green-400 to-emerald-600 p-4 rounded-full shadow-xl"
            >
              <Home className={`${sizeClasses[size]} text-white`} />
            </motion.div>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ 
                  scale: [0, 2, 2.5],
                  opacity: [0.7, 0.3, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.7
                }}
              >
                <div className="w-24 h-24 border-4 border-green-400 rounded-full" />
              </motion.div>
            ))}
          </div>
        );

      case "projects":
        return (
          <div className="flex gap-3">
            {[Building2, MapPin, Calendar].map((Icon, i) => (
              <motion.div
                key={i}
                animate={{ 
                  y: [0, -20, 0],
                  rotate: [0, 360]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="bg-gradient-to-br from-blue-400 to-purple-600 p-3 rounded-xl shadow-lg"
              >
                <Icon className="h-8 w-8 text-white" />
              </motion.div>
            ))}
          </div>
        );

      case "dashboard":
        return (
          <div className="relative">
            <motion.div
              className="grid grid-cols-2 gap-2"
            >
              {[Users, Building2, Phone, Award].map((Icon, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: [0, 1, 1],
                    rotate: [-180, 0, 0]
                  }}
                  transition={{ 
                    duration: 0.5,
                    delay: i * 0.1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="bg-gradient-to-br from-green-400 to-teal-600 p-3 rounded-lg shadow-lg"
                >
                  <Icon className="h-6 w-6 text-white" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        );

      case "clients":
        return (
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="relative w-24 h-24"
            >
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `rotate(${i * 90}deg) translateY(-40px)`
                  }}
                >
                  <div className="bg-gradient-to-br from-purple-400 to-pink-600 p-2 rounded-full shadow-lg">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-purple-500 to-pink-600 p-4 rounded-full shadow-xl"
            >
              <Users className="h-8 w-8 text-white" />
            </motion.div>
          </div>
        );

      case "reminders":
        return (
          <div className="relative">
            <motion.div
              animate={{ 
                rotate: [0, -15, 15, -15, 15, 0],
                scale: [1, 1.2, 1, 1.2, 1]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="bg-gradient-to-br from-amber-400 to-orange-600 p-4 rounded-full shadow-xl"
            >
              <Bell className={`${sizeClasses[size]} text-white`} />
            </motion.div>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute -top-2 -right-2"
                animate={{ 
                  scale: [0, 1.5, 0],
                  opacity: [1, 0.5, 0]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.5
                }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full" />
              </motion.div>
            ))}
          </div>
        );

      case "testimonials":
        return (
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  rotate: [0, 180, 360]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              >
                <Star className="h-8 w-8 fill-amber-400 text-amber-500" />
              </motion.div>
            ))}
          </div>
        );

      case "seller":
        return (
          <div className="relative">
            <motion.div
              animate={{ 
                rotate: 360
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="relative w-20 h-20 rounded-full border-4 border-dashed border-blue-500"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-blue-400 to-cyan-600 p-3 rounded-full shadow-xl"
              >
                <FileText className="h-8 w-8 text-white" />
              </motion.div>
            </motion.div>
          </div>
        );

      case "favorites":
        return (
          <div className="relative">
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
              }}
              transition={{ 
                duration: 1,
                repeat: Infinity
              }}
              className="bg-gradient-to-br from-pink-400 to-rose-600 p-4 rounded-full shadow-xl"
            >
              <Heart className={`${sizeClasses[size]} text-white fill-white`} />
            </motion.div>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 left-0"
                style={{
                  transform: `rotate(${i * 90}deg) translateY(-30px)`
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3
                }}
              >
                <Heart className="h-4 w-4 fill-pink-400 text-pink-500" />
              </motion.div>
            ))}
          </div>
        );

      default:
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="mx-auto"
          >
            <Loader2 className={`${sizeClasses[size]} ${colorClasses[color as keyof typeof colorClasses] || colorClasses.green}`} />
          </motion.div>
        );
    }
  };

  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <div className="mb-6 flex justify-center">
        {renderThemeAnimation()}
      </div>
      <motion.p 
        className="text-gray-600 text-lg"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
}
