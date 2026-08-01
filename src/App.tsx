import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import { Home } from "./components/Home";
import { ResidentialProjects } from "./components/ResidentialProjects";
import { ServicedApartments } from "./components/ServicedApartments";
import { ProjectDetail } from "./components/ProjectDetail";
import { SellerForm } from "./components/SellerForm";
import { AboutUs } from "./components/AboutUs";
import { Testimonials } from "./components/Testimonials";
import { Favourites } from "./components/Favourites";
import { AdminLogin } from "./components/admin/AdminLogin";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { AdminClients } from "./components/admin/AdminClients";
import { AdminProjects } from "./components/admin/AdminProjects";
import { AdminClientDetail } from "./components/admin/AdminClientDetail";
import { AdminProjectDetail } from "./components/admin/AdminProjectDetail";
import { AdminReminders } from "./components/admin/AdminReminders";
import { AdminProjectCreate } from "./components/admin/AdminProjectCreate";
import { AdminTestimonials } from "./components/admin/AdminTestimonials";
import AdminServicedApartments from "./components/admin/AdminServicedApartments";
import { Navbar } from "./components/Navbar";
import { Toaster } from "./components/ui/sonner";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ReminderPopup } from "./components/ReminderPopup";
import { projectId, publicAnonKey } from "./utils/supabase/info";

type Page = 
  | "home" 
  | "residential"
  | "serviced-apartments"
  | "project-detail" 
  | "seller" 
  | "about" 
  | "testimonials"
  | "favourites"
  | "admin-login"
  | "admin-dashboard"
  | "admin-clients"
  | "admin-projects"
  | "admin-client-detail"
  | "admin-project-detail"
  | "admin-reminders"
  | "admin-project-create"
  | "admin-testimonials"
  | "admin-serviced-apartments";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [clientStatusFilter, setClientStatusFilter] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dataInitialized, setDataInitialized] = useState(false);
  const [searchParams, setSearchParams] = useState<{city?: string; type?: string; budget?: string}>({});
  const [justLoggedIn, setJustLoggedIn] = useState(false);
  const [projectsRefreshKey, setProjectsRefreshKey] = useState(0);
  const [adminProjectsRefreshKey, setAdminProjectsRefreshKey] = useState(0);
  const [preFilledProjectData, setPreFilledProjectData] = useState<any>(null);
  const [reminderClientData, setReminderClientData] = useState<{id: string; name: string; phone: string; email: string} | null>(null);

  // Map routes to pages
  const routeToPageMap: { [key: string]: Page } = {
    "/": "home",
    "/home": "home",
    "/residential": "residential",
    "/serviced-apartments": "serviced-apartments",
    "/project": "project-detail",
    "/seller": "seller",
    "/about": "about",
    "/testimonials": "testimonials",
    "/favourites": "favourites",
    "/admin/login": "admin-login",
    "/admin/dashboard": "admin-dashboard",
    "/admin/clients": "admin-clients",
    "/admin/projects": "admin-projects",
    "/admin/client": "admin-client-detail",
    "/admin/project": "admin-project-detail",
    "/admin/reminders": "admin-reminders",
    "/admin/project/create": "admin-project-create",
    "/admin/testimonials": "admin-testimonials",
    "/admin/serviced-apartments": "admin-serviced-apartments",
  };

  // Initialize sample data on first load
  useEffect(() => {
    const initData = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-64143980/init-data`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${publicAnonKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        
        if (!response.ok) {
          console.warn("Failed to initialize data - KV store may need setup:", response.status);
          setDataInitialized(true);
          return;
        }
        
        await response.json();
        setDataInitialized(true);
      } catch (error) {
        console.error("Failed to initialize data:", error);
        console.warn("The app will continue, but you may need to set up the KV store table.");
        setDataInitialized(true);
      }
    };

    initData();
  }, []);

  // Update currentPage based on URL
  useEffect(() => {
    const basePath = location.pathname;
    
    // Extract ID from URL if present
    const urlParams = new URLSearchParams(location.search);
    const projectIdParam = urlParams.get("projectId");
    const clientIdParam = urlParams.get("clientId");
    
    if (projectIdParam) setSelectedProjectId(projectIdParam);
    if (clientIdParam) setSelectedClientId(clientIdParam);
    
    // Find matching route
    if (basePath in routeToPageMap) {
      setCurrentPage(routeToPageMap[basePath]);
    } else {
      setCurrentPage("home");
    }
  }, [location.pathname, location.search]);

  const navigateTo = (page: Page, projectId?: string, clientId?: string, statusFilter?: string, searchData?: {city?: string; type?: string; budget?: string}, projectData?: any, clientData?: {id: string; name: string; phone: string; email: string}) => {
    // Build URL based on page and parameters
    let url = "/";
    const params = new URLSearchParams();

    switch (page) {
      case "home":
        url = "/home";
        break;
      case "residential":
        url = "/residential";
        if (searchData?.city) params.append("city", searchData.city);
        if (searchData?.type) params.append("type", searchData.type);
        if (searchData?.budget) params.append("budget", searchData.budget);
        break;
      case "serviced-apartments":
        url = "/serviced-apartments";
        if (searchData?.city) params.append("city", searchData.city);
        if (searchData?.budget) params.append("budget", searchData.budget);
        break;
      case "project-detail":
        url = `/project-detail`;
        if (projectId) params.append("projectId", projectId);
        break;
      case "seller":
        url = "/seller";
        break;
      case "about":
        url = "/about";
        break;
      case "testimonials":
        url = "/testimonials";
        break;
      case "favourites":
        url = "/favourites";
        break;
      case "admin-login":
        url = "/admin/login";
        break;
      case "admin-dashboard":
        url = "/admin/dashboard";
        break;
      case "admin-clients":
        url = "/admin/clients";
        if (statusFilter !== undefined) params.append("status", statusFilter);
        break;
      case "admin-projects":
        url = "/admin/projects";
        break;
      case "admin-client-detail":
        url = "/admin/client-detail";
        if (clientId) params.append("clientId", clientId);
        break;
      case "admin-project-detail":
        url = "/admin/project-detail";
        if (projectId) params.append("projectId", projectId);
        break;
      case "admin-reminders":
        url = "/admin/reminders";
        if (clientData?.id) params.append("clientId", clientData.id);
        break;
      case "admin-project-create":
        url = "/admin/project-create";
        break;
      case "admin-testimonials":
        url = "/admin/testimonials";
        break;
      case "admin-serviced-apartments":
        url = "/admin/serviced-apartments";
        break;
    }

    // Append query parameters if any
    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Set state variables for backward compatibility
    setCurrentPage(page);
    if (projectId) setSelectedProjectId(projectId);
    if (clientId) setSelectedClientId(clientId);
    if (clientData) {
      setReminderClientData(clientData);
    } else if (page === "admin-reminders") {
      setReminderClientData(null);
    }
    if (statusFilter !== undefined) {
      setClientStatusFilter(statusFilter);
    } else if (page === "admin-clients") {
      setClientStatusFilter(null);
    }
    if (searchData) {
      setSearchParams(searchData);
    } else if (page === "residential") {
      setSearchParams({});
    }
    if (projectData) {
      setPreFilledProjectData(projectData);
    } else if (page === "admin-project-create") {
      setPreFilledProjectData(null);
    }

    // Force refresh projects data when navigating to these pages
    if (page === "residential") {
      setProjectsRefreshKey(prev => prev + 1);
    } else if (page === "admin-projects") {
      setAdminProjectsRefreshKey(prev => prev + 1);
    }

    // Navigate to URL with React Router
    navigate(fullUrl);
    window.scrollTo(0, 0);
  };

  const handleAdminLogin = () => {
    setIsAdmin(true);
    setJustLoggedIn(true);
    navigateTo("admin-dashboard");
    // Reset justLoggedIn after reminders have had time to load
    setTimeout(() => setJustLoggedIn(false), 5000);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setJustLoggedIn(false);
    navigateTo("home");
  };

  if (!dataInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <LoadingSpinner message="🏡 Welcome to Pinnacle Realty! Setting up your experience..." color="green" theme="home" size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        currentPage={currentPage} 
        navigateTo={navigateTo} 
        isAdmin={isAdmin}
        onLogout={handleAdminLogout}
      />
      
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home navigateTo={navigateTo} />} />
          <Route path="/home" element={<Home navigateTo={navigateTo} />} />
          <Route path="/residential" element={<ResidentialProjects key={projectsRefreshKey} navigateTo={navigateTo} searchParams={searchParams} />} />
          <Route path="/serviced-apartments" element={<ServicedApartments key={projectsRefreshKey} navigateTo={navigateTo} searchParams={searchParams} />} />
          <Route path="/project-detail" element={selectedProjectId ? <ProjectDetail projectId={selectedProjectId} navigateTo={navigateTo} /> : <Navigate to="/home" />} />
          <Route path="/seller" element={<SellerForm navigateTo={navigateTo} />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/testimonials" element={<Testimonials />} />
          <Route path="/favourites" element={<Favourites navigateTo={navigateTo} />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin onLogin={handleAdminLogin} />} />
          <Route path="/admin/dashboard" element={isAdmin ? <AdminDashboard navigateTo={navigateTo} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/clients" element={isAdmin ? <AdminClients navigateTo={navigateTo} initialStatusFilter={clientStatusFilter} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/projects" element={isAdmin ? <AdminProjects key={adminProjectsRefreshKey} navigateTo={navigateTo} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/client-detail" element={isAdmin && selectedClientId ? <AdminClientDetail clientId={selectedClientId} navigateTo={navigateTo} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/project-detail" element={isAdmin && selectedProjectId ? <AdminProjectDetail projectId={selectedProjectId} navigateTo={navigateTo} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/reminders" element={isAdmin ? <AdminReminders navigateTo={navigateTo} preSelectedClient={reminderClientData} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/project-create" element={isAdmin ? <AdminProjectCreate navigateTo={navigateTo} preFilledData={preFilledProjectData} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/testimonials" element={isAdmin ? <AdminTestimonials navigateTo={(p: string) => navigateTo(p as Page)} /> : <Navigate to="/admin/login" />} />
          <Route path="/admin/serviced-apartments" element={isAdmin ? <AdminServicedApartments navigateTo={navigateTo} /> : <Navigate to="/admin/login" />} />
          
          {/* Catch-all - redirect to home */}
          <Route path="*" element={<Navigate to="/home" />} />
        </Routes>
      </main>

      {/* Reminder Popup for Admin */}
      <ReminderPopup isAdmin={isAdmin} navigateTo={navigateTo} justLoggedIn={justLoggedIn} />

      <Toaster />
    </div>
  );
}