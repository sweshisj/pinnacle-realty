import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Settings, Users, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import AdminCapacityCalendar from './AdminCapacityCalendar';
import IntegrationsManager from './IntegrationsManager';
import { EnquiryManagement } from './EnquiryManagement';
import { ServicedApartment } from '../../utils/supabase/servicedApartmentsOperations';
import { fetchDailyCapacity, DailyCapacity } from '../../utils/supabase/capacityOperations';

interface AdminCapacityManagementProps {
  apartment: ServicedApartment;
  onBack: () => void;
}

export default function AdminCapacityManagement({
  apartment,
  onBack,
}: AdminCapacityManagementProps) {
  const [activeTab, setActiveTab] = useState('availability');
  const [todayCapacity, setTodayCapacity] = useState<DailyCapacity | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  useEffect(() => {
    loadTodayCapacity();
  }, [apartment.id]);

  const loadTodayCapacity = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await fetchDailyCapacity(apartment.id, today);
    if (data) {
      setTodayCapacity(data);
    }
  };

  const handleRefresh = () => {
    loadTodayCapacity();
    setLastSyncTime(new Date());
    toast.success('Data refreshed');
  };

  const roomsTotal = apartment.rooms_total || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Apartments
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl mb-2">
                    {apartment.title}
                  </CardTitle>
                  <p className="text-gray-600">
                    {apartment.location}, {apartment.city}
                  </p>
                </div>
                <Button variant="outline" onClick={handleRefresh}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Key Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-blue-600 mb-1">Total Rooms</div>
                      <div className="text-3xl font-bold text-blue-900">{roomsTotal}</div>
                    </div>
                    <Users className="w-8 h-8 text-blue-600/20" />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${
                  todayCapacity && todayCapacity.capacity_remaining > 0
                    ? 'bg-green-50'
                    : 'bg-red-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-sm mb-1 ${
                        todayCapacity && todayCapacity.capacity_remaining > 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        Available Today
                      </div>
                      <div className={`text-3xl font-bold ${
                        todayCapacity && todayCapacity.capacity_remaining > 0
                          ? 'text-green-900'
                          : 'text-red-900'
                      }`}>
                        {todayCapacity?.capacity_remaining ?? '—'}/{roomsTotal}
                      </div>
                    </div>
                    <Calendar className={`w-8 h-8 ${
                      todayCapacity && todayCapacity.capacity_remaining > 0
                        ? 'text-green-600/20'
                        : 'text-red-600/20'
                    }`} />
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-purple-600 mb-1">Last Sync</div>
                      <div className="text-sm font-medium text-purple-900">
                        {format(lastSyncTime, 'h:mm a')}
                      </div>
                      <div className="text-xs text-purple-700 mt-1">
                        {format(lastSyncTime, 'MMM d, yyyy')}
                      </div>
                    </div>
                    <RefreshCw className="w-8 h-8 text-purple-600/20" />
                  </div>
                </div>
              </div>

              {/* Status Breakdown */}
              {todayCapacity && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium mb-3">Today's Breakdown</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">External:</span>
                      <span className="ml-2 font-medium">{todayCapacity.rooms_from_ical}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Internal:</span>
                      <span className="ml-2 font-medium">{todayCapacity.rooms_from_internal}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Blocked:</span>
                      <span className="ml-2 font-medium">{todayCapacity.rooms_from_partial_blocks}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge
                        className="ml-2"
                        variant={todayCapacity.is_unavailable ? 'destructive' : 'default'}
                      >
                        {todayCapacity.is_unavailable ? 'Unavailable' : 'Available'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white">
              <TabsTrigger value="availability">
                <Calendar className="w-4 h-4 mr-2" />
                Availability
              </TabsTrigger>
              <TabsTrigger value="integrations">
                <Settings className="w-4 h-4 mr-2" />
                Integrations
              </TabsTrigger>
              <TabsTrigger value="enquiries">
                <Users className="w-4 h-4 mr-2" />
                Enquiries
              </TabsTrigger>
            </TabsList>

            <TabsContent value="availability" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <AdminCapacityCalendar
                    saId={apartment.id}
                    roomsTotal={roomsTotal}
                    onOpenIntegrations={() => setActiveTab('integrations')}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-6">
              <IntegrationsManager saId={apartment.id} />
            </TabsContent>

            <TabsContent value="enquiries" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Enquiry Management</CardTitle>
                  <p className="text-sm text-gray-600">
                    Review and manage booking enquiries. Note: Approved enquiries don't consume capacity.
                  </p>
                </CardHeader>
                <CardContent>
                  <EnquiryManagement apartmentId={apartment.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
