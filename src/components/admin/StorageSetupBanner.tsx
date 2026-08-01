import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { supabase } from "../../utils/supabase/client";

export function StorageSetupBanner() {
  const [isStorageConfigured, setIsStorageConfigured] = useState<
    boolean | null
  >(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    checkStorageConfiguration();
  }, []);

  const checkStorageConfiguration = async () => {
    try {
      // Try to check if the bucket exists and is accessible
      const { data, error } = await supabase.storage
        .from("property-images")
        .list("", { limit: 1 });

      if (error) {
        // Bucket doesn't exist or isn't configured
        setIsStorageConfigured(false);
      } else {
        // Bucket exists and is accessible
        setIsStorageConfigured(true);
      }
    } catch {
      setIsStorageConfigured(false);
    }
  };

  // Don't show if storage is configured or banner is dismissed
  if (isStorageConfigured === null || isStorageConfigured || isDismissed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6 border-amber-500 bg-amber-50">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 flex items-center justify-between">
        <span>⚠️ Storage Not Configured</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsDismissed(true)}
          className="h-6 px-2 text-amber-700 hover:text-amber-900"
        >
          Dismiss
        </Button>
      </AlertTitle>
      <AlertDescription className="text-amber-800 space-y-3">
        <p>
          <strong>Image uploads won't be visible</strong> until you configure
          Supabase Storage.
        </p>
        
        <div className="bg-white/50 p-3 rounded border border-amber-200">
          <p className="text-sm mb-2">
            <strong>Quick Fix (5 minutes):</strong>
          </p>
          <ol className="text-sm space-y-1 ml-4 list-decimal">
            <li>
              Go to{" "}
              <a
                href="https://app.supabase.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-amber-900 inline-flex items-center gap-1"
              >
                Supabase Dashboard
                <ExternalLink className="h-3 w-3" />
              </a>
            </li>
            <li>Click "Storage" → "New bucket"</li>
            <li>
              Name: <code className="bg-white px-1 py-0.5 rounded text-xs">property-images</code>
            </li>
            <li>
              ✅ Enable <strong>"Public bucket"</strong> (Important!)
            </li>
            <li>Click "Create bucket"</li>
            <li>Add policy: "Public Access for Images" (SELECT for all users)</li>
          </ol>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open("/SUPABASE_STORAGE_SETUP.md", "_blank")
            }
            className="bg-white hover:bg-amber-50 border-amber-300"
          >
            📖 View Full Setup Guide
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              checkStorageConfiguration();
            }}
            className="bg-white hover:bg-amber-50 border-amber-300"
          >
            🔄 Check Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
