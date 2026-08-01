import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ServicedApartments } from "./ServicedApartments";
import { EliteNRI } from "./EliteNRI";
import { ResidentialProjects } from "./ResidentialProjects";

interface ProjectsWithTiersProps {
  navigateTo: (page: any, projectId?: string) => void;
  searchParams?: {
    city?: string;
    type?: string;
    budget?: string;
  };
}

export function ProjectsWithTiers({
  navigateTo,
  searchParams,
}: ProjectsWithTiersProps) {
  const [activeTab, setActiveTab] = useState("residential");

  return (
    <div className="min-h-screen">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <TabsList className="w-full md:w-auto bg-transparent border-none h-16 gap-2">
              <TabsTrigger
                value="residential"
                className="data-[state=active]:bg-white data-[state=active]:text-green-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                🏘️ Residential
              </TabsTrigger>
              <TabsTrigger
                value="serviced"
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                🏨 Serviced Apartments
              </TabsTrigger>
              <TabsTrigger
                value="elite-nri"
                className="data-[state=active]:bg-white data-[state=active]:text-amber-600 text-white px-6 py-3 rounded-lg transition-all"
              >
                ✈️ Elite NRI
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="residential" className="mt-0">
          <ResidentialProjects navigateTo={navigateTo} searchParams={searchParams} />
        </TabsContent>

        <TabsContent value="serviced" className="mt-0">
          <ServicedApartments navigateTo={navigateTo} />
        </TabsContent>

        <TabsContent value="elite-nri" className="mt-0">
          <EliteNRI navigateTo={navigateTo} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
