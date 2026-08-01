import React, { useState, useEffect } from 'react';
import {
  Plus,
  RefreshCw,
  Trash2,
  Pause,
  Play,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  fetchICalFeeds,
  createICalFeed,
  updateICalFeed,
  deleteICalFeed,
  syncICalFeed,
  getExportICalUrl,
  ICalFeed,
} from '../../utils/supabase/capacityOperations';

interface IntegrationsManagerProps {
  saId: string;
}

export default function IntegrationsManager({ saId }: IntegrationsManagerProps) {
  const [feeds, setFeeds] = useState<ICalFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Add feed form
  const [feedForm, setFeedForm] = useState({
    name: '',
    platform: 'airbnb' as 'airbnb' | 'booking.com' | 'other',
    ical_url: '',
    color: '#FF5A5F',
    sync_frequency_minutes: 30,
    rooms_per_event: 1,
  });

  // Settings
  const [settings, setSettings] = useState({
    auto_sync_frequency: 30,
    auto_block_at_zero: true,
    default_rooms_per_event: 1,
  });

  useEffect(() => {
    loadFeeds();
  }, [saId]);

  const loadFeeds = async () => {
    setLoading(true);
    const { data, error } = await fetchICalFeeds(saId);
    if (data) {
      setFeeds(data);
    }
    setLoading(false);
  };

  const handleAddFeed = async () => {
    if (!feedForm.name || !feedForm.ical_url) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { data, error } = await createICalFeed({
      sa_id: saId,
      name: feedForm.name,
      platform: feedForm.platform,
      ical_url: feedForm.ical_url,
      color: feedForm.color,
      is_active: true,
      sync_frequency_minutes: feedForm.sync_frequency_minutes,
      rooms_per_event: feedForm.rooms_per_event,
    });

    if (error) {
      toast.error('Failed to add feed');
      return;
    }

    toast.success('Feed added successfully');
    setShowAddDialog(false);
    setFeedForm({
      name: '',
      platform: 'airbnb',
      ical_url: '',
      color: '#FF5A5F',
      sync_frequency_minutes: 30,
      rooms_per_event: 1,
    });
    loadFeeds();

    // Auto-sync the new feed
    if (data) {
      handleSyncFeed(data.id);
    }
  };

  const handleSyncFeed = async (feedId: string) => {
    setSyncing(feedId);
    const result = await syncICalFeed(feedId);
    
    if (result.success) {
      toast.success(`Synced successfully! ${result.eventsCount || 0} events imported.`);
      loadFeeds();
    } else {
      toast.error(`Sync failed: ${result.error}`);
    }
    
    setSyncing(null);
  };

  const handleToggleFeed = async (feed: ICalFeed) => {
    const { error } = await updateICalFeed(feed.id, {
      is_active: !feed.is_active,
    });

    if (error) {
      toast.error('Failed to update feed');
      return;
    }

    toast.success(feed.is_active ? 'Feed paused' : 'Feed activated');
    loadFeeds();
  };

  const handleDeleteFeed = async (feedId: string) => {
    if (!confirm('Are you sure you want to delete this feed? All imported events will be removed.')) {
      return;
    }

    const { error } = await deleteICalFeed(feedId);

    if (error) {
      toast.error('Failed to delete feed');
      return;
    }

    toast.success('Feed deleted');
    loadFeeds();
  };

  const handleCopyExportUrl = () => {
    const url = getExportICalUrl(saId);
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast.success('Export URL copied to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'airbnb':
        return 'bg-red-500';
      case 'booking.com':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'airbnb':
        return 'bg-red-100 text-red-800';
      case 'booking.com':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Calendar Integrations</h2>
          <p className="text-gray-600 text-sm mt-1">
            Import bookings from external platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowSettingsDialog(true)}>
            <Clock className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Feed
          </Button>
        </div>
      </div>

      {/* Export iCal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Calendar</CardTitle>
          <CardDescription>
            Share your unavailable dates with external platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Input
              value={getExportICalUrl(saId)}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <Button
              variant="outline"
              onClick={handleCopyExportUrl}
            >
              {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Use this URL to sync your blocked dates to Airbnb, Booking.com, or other platforms
          </p>
        </CardContent>
      </Card>

      {/* Feeds List */}
      {loading ? (
        <div className="text-center py-12">Loading feeds...</div>
      ) : feeds.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No calendar feeds added yet</p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Feed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feeds.map((feed) => (
            <motion.div
              key={feed.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full mt-1 ${getPlatformColor(feed.platform)}`} />
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{feed.name}</h3>
                          <Badge className={getPlatformBadgeColor(feed.platform)}>
                            {feed.platform}
                          </Badge>
                          {feed.is_active ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-100 text-gray-600">
                              Paused
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs">URL:</span>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {feed.ical_url.substring(0, 50)}...
                            </code>
                          </div>
                          
                          {feed.last_synced_at && (
                            <div className="flex items-center gap-2 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>Last synced: {format(new Date(feed.last_synced_at), 'MMM d, h:mm a')}</span>
                            </div>
                          )}

                          {feed.last_error && (
                            <Alert className="mt-2 bg-red-50 border-red-200">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <AlertDescription className="text-xs text-red-900">
                                {feed.last_error}
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="text-xs text-gray-500 mt-2">
                            Sync every {feed.sync_frequency_minutes} minutes · {feed.rooms_per_event} room(s) per booking
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncFeed(feed.id)}
                        disabled={syncing === feed.id}
                      >
                        <RefreshCw className={`w-4 h-4 ${syncing === feed.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleFeed(feed)}
                      >
                        {feed.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteFeed(feed.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add Feed Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add iCal Feed</DialogTitle>
            <DialogDescription>
              Import bookings from external platforms using their iCal URL
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Feed Name *</Label>
              <Input
                value={feedForm.name}
                onChange={(e) => setFeedForm({ ...feedForm, name: e.target.value })}
                placeholder="e.g., My Airbnb Listing"
              />
            </div>

            <div>
              <Label>Platform *</Label>
              <Select
                value={feedForm.platform}
                onValueChange={(v: any) => {
                  const colors = {
                    airbnb: '#FF5A5F',
                    'booking.com': '#003580',
                    other: '#6B7280',
                  };
                  setFeedForm({ 
                    ...feedForm, 
                    platform: v,
                    color: colors[v as keyof typeof colors],
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airbnb">Airbnb</SelectItem>
                  <SelectItem value="booking.com">Booking.com</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>iCal URL *</Label>
              <Input
                value={feedForm.ical_url}
                onChange={(e) => setFeedForm({ ...feedForm, ical_url: e.target.value })}
                placeholder="https://..."
              />
              <p className="text-xs text-gray-600 mt-1">
                Find this in your platform's calendar settings
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Sync Frequency (minutes)</Label>
                <Select
                  value={feedForm.sync_frequency_minutes.toString()}
                  onValueChange={(v) => setFeedForm({ ...feedForm, sync_frequency_minutes: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">Every 15 minutes</SelectItem>
                    <SelectItem value="30">Every 30 minutes</SelectItem>
                    <SelectItem value="60">Every 60 minutes</SelectItem>
                    <SelectItem value="120">Every 2 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Rooms per Event</Label>
                <Input
                  type="number"
                  min={1}
                  value={feedForm.rooms_per_event}
                  onChange={(e) => setFeedForm({ ...feedForm, rooms_per_event: parseInt(e.target.value) || 1 })}
                />
                <p className="text-xs text-gray-600 mt-1">
                  How many rooms each booking reserves
                </p>
              </div>
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription className="text-sm">
                <strong>How to find your iCal URL:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Airbnb:</strong> Hosting → Calendar → Availability settings → Export calendar</li>
                  <li><strong>Booking.com:</strong> Extranet → Calendar → Sync calendars</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddFeed}>
              Add Feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Integration Settings</DialogTitle>
            <DialogDescription>
              Configure global settings for calendar syncing
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label>Default Sync Frequency</Label>
              <Select
                value={settings.auto_sync_frequency.toString()}
                onValueChange={(v) => setSettings({ ...settings, auto_sync_frequency: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">Every 15 minutes</SelectItem>
                  <SelectItem value="30">Every 30 minutes</SelectItem>
                  <SelectItem value="60">Every 60 minutes</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600 mt-1">
                How often to automatically sync all feeds
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-block when capacity hits 0</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Automatically mark days as unavailable when all rooms are booked
                </p>
              </div>
              <Switch
                checked={settings.auto_block_at_zero}
                onCheckedChange={(checked) => setSettings({ ...settings, auto_block_at_zero: checked })}
              />
            </div>

            <Separator />

            <div>
              <Label>Default Rooms per Event</Label>
              <Input
                type="number"
                min={1}
                value={settings.default_rooms_per_event}
                onChange={(e) => setSettings({ ...settings, default_rooms_per_event: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-gray-600 mt-1">
                Default number of rooms reserved per external booking
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettingsDialog(false)}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
