import React, { useState, useEffect } from "react";
import ServicedApartmentsListing from "./ServicedApartmentsListing";
import ServicedApartmentDetail from "./ServicedApartmentDetail";
import DatabaseSetupInstructions from "./DatabaseSetupInstructions";
import { ServicedApartment, fetchServicedApartments } from "../utils/supabase/servicedApartmentsOperations";

interface ServicedApartmentsProps {
  navigateTo: (page: any, projectId?: string) => void;
  searchParams?: {
    city?: string;
    type?: string;
    budget?: string;
  };
}

export function ServicedApartments({ navigateTo, searchParams }: ServicedApartmentsProps) {
  const [selectedApartment, setSelectedApartment] = useState<ServicedApartment | null>(null);
  const [dbError, setDbError] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    const { data, error } = await fetchServicedApartments();
    if (error && error.code === 'PGRST205') {
      setDbError(true);
    }
    setLoading(false);
  };

  if (loading) {
    return null; // Or a loading spinner
  }

  if (dbError) {
    return <DatabaseSetupInstructions />;
  }

  if (selectedApartment) {
    return (
      <ServicedApartmentDetail
        apartment={selectedApartment}
        onBack={() => setSelectedApartment(null)}
      />
    );
  }

  return (
    <ServicedApartmentsListing
      onSelectApartment={setSelectedApartment}
      searchParams={searchParams}
    />
  );
}