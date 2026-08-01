import React from 'react';
import { AlertCircle, Database, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Button } from './ui/button';

export default function DatabaseSetupInstructions() {
  const copySQL = () => {
    navigator.clipboard.writeText('Check /supabase_serviced_apartments.sql file');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Database className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle>Database Setup Required</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                The serviced apartments tables haven't been created yet
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Missing Database Tables</AlertTitle>
            <AlertDescription>
              The table 'serviced_apartments' does not exist in your Supabase database.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-sm">Follow these steps to set up your database:</h3>
            
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Open your Supabase project dashboard
                  </p>
                  <a 
                    href="https://app.supabase.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    https://app.supabase.com
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Navigate to the SQL Editor</p>
                  <p className="text-xs text-gray-600">
                    Click on "SQL Editor" in the left sidebar
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Run the SQL file</p>
                  <p className="text-xs text-gray-600 mb-2">
                    Copy the contents of <code className="bg-gray-100 px-1 rounded">/supabase_serviced_apartments.sql</code> and paste it into the SQL Editor
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    File location: <span className="text-emerald-600">/supabase_serviced_apartments.sql</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  4
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Execute the SQL</p>
                  <p className="text-xs text-gray-600">
                    Click "Run" to create all necessary tables with sample data
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
                  5
                </div>
                <div className="flex-1">
                  <p className="text-sm mb-2">Refresh this page</p>
                  <p className="text-xs text-gray-600">
                    Once the SQL has been executed successfully, refresh this page
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">What will be created:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>serviced_apartments - Main units table</li>
                  <li>serviced_apartment_availability - Calendar management</li>
                  <li>serviced_apartment_enquiries - Guest enquiries (with public insert RLS)</li>
                  <li>serviced_apartment_bookings - Booking records</li>
                  <li>serviced_apartment_reviews - Guest reviews</li>
                  <li>Sample data for 6 serviced apartment properties</li>
                  <li><strong>Important:</strong> Row Level Security (RLS) policies for public access</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Important Note:</p>
                <p className="text-xs">If you encounter \"row-level security policy\" errors when submitting enquiries, make sure you have run the complete SQL script. The script includes RLS policies that allow public (anonymous) users to insert enquiries.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              I've Run the SQL - Refresh Page
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('https://app.supabase.com', '_blank')}
            >
              Open Supabase Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}