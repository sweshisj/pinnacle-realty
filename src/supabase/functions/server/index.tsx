// Pinnacle Realty Real Estate API Server
// Updated: 2025-11-11 - Testimonials API fixed and cleared of sample data
// Version: 1.2.0 - All testimonials routes active
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Helper function to verify password using Web Crypto API
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Extract salt and hash from stored hash
    // Format: salt:hash (both in hex)
    const [saltHex, hashHex] = storedHash.split(':');
    
    if (!saltHex || !hashHex) {
      // If format doesn't match, assume it's a plain password for backward compatibility
      return password === storedHash;
    }
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const storedHashBytes = new Uint8Array(hashHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    
    // Hash the input password with the same salt
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    
    const hashBytes = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );
    
    const inputHashBytes = new Uint8Array(hashBytes);
    
    // Compare hashes
    if (inputHashBytes.length !== storedHashBytes.length) {
      return false;
    }
    
    for (let i = 0; i < inputHashBytes.length; i++) {
      if (inputHashBytes[i] !== storedHashBytes[i]) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-64143980/health", (c) => {
  return c.json({ 
    status: "ok",
    version: "1.2.0",
    timestamp: new Date().toISOString(),
    endpoints: {
      testimonials: "active",
      admin_testimonials: "active"
    }
  });
});

// Version info endpoint
app.get("/make-server-64143980/version", (c) => {
  return c.json({ 
    version: "1.2.0",
    updated: "2025-11-11",
    features: ["testimonials-api-fixed", "sample-data-removed"]
  });
});

// Debug endpoint to check testimonials setup
app.get("/make-server-64143980/debug/testimonials", async (c) => {
  try {
    const testimonials = await kv.get("testimonials");
    return c.json({
      exists: testimonials !== null && testimonials !== undefined,
      count: Array.isArray(testimonials) ? testimonials.length : 0,
      data: testimonials,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Admin authentication - Secure version with Web Crypto API
app.post("/make-server-64143980/admin/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    
    // Get credentials from environment variables
    const adminUsername = Deno.env.get("ADMIN_USERNAME") || "gcadmin";
    const adminPasswordHash = Deno.env.get("ADMIN_PASSWORD_HASH");
    
    if (!adminPasswordHash) {
      console.error("ADMIN_PASSWORD_HASH environment variable not set");
      // For backward compatibility during setup, allow default password
      if (username === "gcadmin" && password === "gcadmin567") {
        console.warn("Using default credentials - please set ADMIN_PASSWORD_HASH environment variable");
        return c.json({
          success: true,
          token: "admin-authenticated",
          user: { username: adminUsername, role: "admin" },
        });
      }
      return c.json(
        { success: false, error: "Server configuration error. Please set ADMIN_PASSWORD_HASH." },
        500
      );
    }

    // Verify username and password
    if (username === adminUsername) {
      const isPasswordValid = await verifyPassword(password, adminPasswordHash);
      
      if (isPasswordValid) {
        return c.json({
          success: true,
          token: "admin-authenticated",
          user: { username: adminUsername, role: "admin" },
        });
      }
    }

    // Log failed attempts for security monitoring
    console.warn(`Failed login attempt for username: ${username} at ${new Date().toISOString()}`);

    return c.json(
      { success: false, error: "Invalid credentials" },
      401
    );
  } catch (error) {
    console.log("Login error:", error);
    return c.json({ error: "Login failed" }, 500);
  }
});

// Initialize sample data
app.post("/make-server-64143980/init-data", async (c) => {
  try {
    // Check if already initialized
    const existing = await kv.get("initialized");
    if (existing) {
      return c.json({ message: "Data already initialized" });
    }

    // Sample projects
    const projects = [];

    // Sample clients
    const clients = [];

    // Initialize notifications
    const notifications = [];

    // Initialize reminders with sample data based on clients
    const reminders = [];

    // Sample testimonials - removed, admin will add via admin panel
    const testimonials = [];

    // Store all data
    await kv.set("projects", projects);
    await kv.set("clients", clients);
    await kv.set("testimonials", testimonials);
    await kv.set("notifications", notifications);
    await kv.set("reminders", reminders);
    await kv.set("initialized", true);

    return c.json({
      success: true,
      message: "Sample data initialized",
    });
  } catch (error) {
    console.log("Init data error:", error);
    return c.json({ error: "Failed to initialize data" }, 500);
  }
});

// Clear all data (for admin reset)
app.post("/make-server-64143980/clear-data", async (c) => {
  try {
    // Get testimonials to preserve them
    const testimonials = (await kv.get("testimonials")) || [];

    // Clear clients and projects data
    await kv.set("clients", []);
    await kv.set("projects", []);
    await kv.set("notifications", []);
    await kv.set("reminders", []);
    // Keep testimonials
    await kv.set("testimonials", testimonials);

    console.log("✓ All clients and projects data cleared");

    return c.json({
      success: true,
      message:
        "All clients and projects data cleared successfully",
    });
  } catch (error) {
    console.log("Clear data error:", error);
    return c.json({ error: "Failed to clear data" }, 500);
  }
});

// Clear all testimonials (for admin reset)
app.post("/make-server-64143980/clear-testimonials", async (c) => {
  try {
    await kv.set("testimonials", []);
    console.log("✓ All testimonials cleared");

    return c.json({
      success: true,
      message: "All testimonials cleared successfully",
    });
  } catch (error) {
    console.log("Clear testimonials error:", error);
    return c.json({ error: "Failed to clear testimonials" }, 500);
  }
});

// Projects endpoints
app.get("/make-server-64143980/projects", async (c) => {
  try {
    const projects = (await kv.get("projects")) || [];
    console.log("=== GET PROJECTS ===");
    console.log("Returning", projects.length, "projects");
    console.log(
      "Projects:",
      projects.map((p: any) => ({ id: p.id, name: p.name })),
    );
    return c.json(projects);
  } catch (error) {
    console.log("Get projects error:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

app.get("/make-server-64143980/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const projects = (await kv.get("projects")) || [];
    const project = projects.find((p: any) => p.id === id);

    if (!project) {
      return c.json({ error: "Project not found" }, 404);
    }

    return c.json(project);
  } catch (error) {
    console.log("Get project error:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

app.post("/make-server-64143980/projects", async (c) => {
  try {
    const newProject = await c.req.json();
    const projects = (await kv.get("projects")) || [];

    newProject.id = `proj-${Date.now()}`;
    projects.push(newProject);

    await kv.set("projects", projects);
    return c.json(newProject);
  } catch (error) {
    console.log("Create project error:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

app.put("/make-server-64143980/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedProject = await c.req.json();
    const projects = (await kv.get("projects")) || [];

    const index = projects.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return c.json({ error: "Project not found" }, 404);
    }

    projects[index] = {
      ...projects[index],
      ...updatedProject,
      id,
    };
    await kv.set("projects", projects);

    return c.json(projects[index]);
  } catch (error) {
    console.log("Update project error:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

app.delete("/make-server-64143980/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const projects = (await kv.get("projects")) || [];
    const filtered = projects.filter((p: any) => p.id !== id);
    await kv.set("projects", filtered);

    // Also remove this project from all clients' interested/favorite projects
    const clients = (await kv.get("clients")) || [];
    const updatedClients = clients.map((client: any) => {
      const updatedClient = { ...client };

      // Remove from projectsInterested
      if (
        updatedClient.projectsInterested &&
        Array.isArray(updatedClient.projectsInterested)
      ) {
        updatedClient.projectsInterested =
          updatedClient.projectsInterested.filter(
            (pId: string) => pId !== id,
          );
      }

      // Remove from favoriteProjects
      if (
        updatedClient.favoriteProjects &&
        Array.isArray(updatedClient.favoriteProjects)
      ) {
        updatedClient.favoriteProjects =
          updatedClient.favoriteProjects.filter(
            (pId: string) => pId !== id,
          );
      }

      return updatedClient;
    });
    await kv.set("clients", updatedClients);

    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: "Failed to delete project" }, 500);
  }
});

// Clients endpoints
// IMPORTANT: Stats route must come BEFORE :id route to avoid matching "stats" as an ID
app.get("/make-server-64143980/clients/stats", async (c) => {
  try {
    const clients = (await kv.get("clients")) || [];

    // Only count active (non-sold) clients for status metrics
    const activeClients = clients.filter((cl: any) => !cl.sold);

    const stats = {
      red: activeClients.filter(
        (cl: any) => cl.status === "red",
      ).length,
      amber: activeClients.filter(
        (cl: any) => cl.status === "amber",
      ).length,
      green: activeClients.filter(
        (cl: any) => cl.status === "green",
      ).length,
      total: activeClients.length,
      buyers: activeClients.filter(
        (cl: any) => cl.type === "buyer",
      ).length,
      sellers: activeClients.filter(
        (cl: any) => cl.type === "seller",
      ).length,
    };

    return c.json(stats);
  } catch (error) {
    console.log("Get stats error:", error);
    return c.json({ error: "Failed to fetch stats" }, 500);
  }
});

app.get("/make-server-64143980/clients", async (c) => {
  try {
    const clients = (await kv.get("clients")) || [];
    return c.json(clients);
  } catch (error) {
    console.log("Get clients error:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

app.get("/make-server-64143980/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const clients = (await kv.get("clients")) || [];
    const client = clients.find((cl: any) => cl.id === id);

    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }

    return c.json(client);
  } catch (error) {
    console.log("Get client error:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

// Check for duplicate clients by phone AND type
app.post(
  "/make-server-64143980/clients/check-duplicate",
  async (c) => {
    try {
      const { phone, type } = await c.req.json();
      const clients = (await kv.get("clients")) || [];

      const duplicates = clients.filter(
        (cl: any) => cl.phone === phone && cl.type === type,
      );

      return c.json({
        isDuplicate: duplicates.length > 0,
        duplicates,
      });
    } catch (error) {
      console.log("Check duplicate error:", error);
      return c.json(
        { error: "Failed to check duplicate" },
        500,
      );
    }
  },
);

app.post("/make-server-64143980/clients", async (c) => {
  try {
    const newClient = await c.req.json();
    console.log("=== Creating/Updating client ===");
    console.log(
      "Received client data:",
      JSON.stringify(newClient),
    );

    const clients = (await kv.get("clients")) || [];
    const notifications = (await kv.get("notifications")) || [];

    console.log(
      `Found ${clients.length} existing clients in KV store`,
    );

    // For buyers: Check if same phone already submitted enquiry for the SAME project
    if (
      newClient.type === "buyer" &&
      newClient.projectInterested
    ) {
      console.log(
        `Checking for duplicate: phone=${newClient.phone}, project=${newClient.projectInterested}`,
      );

      const samePhoneAndProject = clients.find(
        (cl: any) =>
          cl.phone === newClient.phone &&
          cl.type === "buyer" &&
          cl.projectsInterested &&
          cl.projectsInterested.includes(
            newClient.projectInterested,
          ),
      );

      if (samePhoneAndProject) {
        console.log(
          "REJECTING: Same phone and same project found",
        );
        return c.json(
          {
            error: "Already submitted an enquiry",
            message:
              "You have already submitted an enquiry for this project.",
          },
          400,
        );
      }
    }

    // Check if phone number already exists (for duplicate tracking)
    const existingClientWithPhone = clients.find(
      (cl: any) => cl.phone === newClient.phone,
    );
    console.log(
      `Existing client with phone: ${existingClientWithPhone ? existingClientWithPhone.id : "none"}`,
    );

    if (
      existingClientWithPhone &&
      newClient.type === "buyer" &&
      existingClientWithPhone.type === "buyer"
    ) {
      console.log(
        "UPDATING: Adding new project to existing client",
      );
      console.log(
        `Existing client: ${existingClientWithPhone.name} (${existingClientWithPhone.id})`,
      );

      // Same phone, different project - add to existing client's interested projects
      const index = clients.findIndex(
        (cl: any) => cl.id === existingClientWithPhone.id,
      );
      console.log(`Client index in array: ${index}`);

      // Initialize arrays if they don't exist
      if (!clients[index].projectsInterested) {
        clients[index].projectsInterested = [];
        console.log("Initialized projectsInterested array");
      }
      if (!clients[index].favoriteProjects) {
        clients[index].favoriteProjects = [];
        console.log("Initialized favoriteProjects array");
      }

      const projectToAdd = newClient.projectInterested;
      console.log(`Project to add: ${projectToAdd}`);
      console.log(
        `Current projects: ${JSON.stringify(clients[index].projectsInterested)}`,
      );

      if (
        projectToAdd &&
        !clients[index].projectsInterested.includes(
          projectToAdd,
        )
      ) {
        clients[index].projectsInterested.push(projectToAdd);
        console.log(
          `Successfully added project ${projectToAdd} to client ${clients[index].id}`,
        );
        console.log(
          `Updated projects: ${JSON.stringify(clients[index].projectsInterested)}`,
        );
      } else {
        console.log(
          `Project ${projectToAdd} already in list or invalid`,
        );
      }

      console.log("Saving updated clients to KV store...");
      await kv.set("clients", clients);
      console.log("✓ Clients saved successfully");

      // Create notification for duplicate detection (same phone, same type, different project)
      const duplicateNotification = {
        id: `notif-${Date.now()}`,
        type: "duplicate_client",
        clientId: clients[index].id,
        clientName: clients[index].name,
        message: `${clients[index].name} (${clients[index].phone}) submitted enquiry for another project. Total projects interested: ${clients[index].projectsInterested.length}`,
        date: new Date().toISOString(),
        read: false,
      };
      notifications.push(duplicateNotification);
      await kv.set("notifications", notifications);
      console.log(
        "✓ Duplicate notification created:",
        duplicateNotification,
      );

      const updatedClient = clients[index];
      console.log(
        "Returning updated client:",
        JSON.stringify(updatedClient),
      );

      return c.json(
        {
          success: true,
          message: "Enquiry submitted successfully",
          client: updatedClient,
          isDuplicate: true,
        },
        200,
      );
    }

    // Handle seller duplicates (same phone, same type)
    if (
      existingClientWithPhone &&
      newClient.type === "seller" &&
      existingClientWithPhone.type === "seller"
    ) {
      console.log(
        "DUPLICATE SELLER: Same phone and type detected",
      );
      console.log(
        `Existing seller: ${existingClientWithPhone.name} (${existingClientWithPhone.id})`,
      );

      // Create notification for duplicate seller
      const duplicateNotification = {
        id: `notif-${Date.now()}`,
        type: "duplicate_client",
        clientId: existingClientWithPhone.id,
        clientName: existingClientWithPhone.name,
        message: `Duplicate seller detected: ${existingClientWithPhone.name} (${existingClientWithPhone.phone}) attempted to submit another enquiry`,
        date: new Date().toISOString(),
        read: false,
      };
      notifications.push(duplicateNotification);
      await kv.set("notifications", notifications);
      console.log(
        "✓ Duplicate seller notification created:",
        duplicateNotification,
      );

      return c.json(
        {
          success: true,
          message:
            "You have already submitted a seller enquiry",
          client: existingClientWithPhone,
          isDuplicate: true,
        },
        200,
      );
    }

    // If phone exists but it's a different type (buyer vs seller), allow creating new entry
    // This handles edge case where same person might be both buyer and seller

    console.log("CREATING: New client entry");
    // New client - create new entry
    newClient.id = `client-${Date.now()}`;
    newClient.enquiryDate =
      newClient.enquiryDate ||
      new Date().toISOString().split("T")[0];
    newClient.status = newClient.status || "amber"; // Default to amber status
    newClient.sold = false;
    newClient.favoriteProjects =
      newClient.favoriteProjects || [];

    // Convert single projectInterested to array projectsInterested
    if (newClient.projectInterested) {
      newClient.projectsInterested = [
        newClient.projectInterested,
      ];
      delete newClient.projectInterested;
      console.log(
        `Converted projectInterested to array: ${JSON.stringify(newClient.projectsInterested)}`,
      );
    } else if (!newClient.projectsInterested) {
      newClient.projectsInterested = [];
    }

    clients.push(newClient);
    console.log("Saving new client to KV store...");
    await kv.set("clients", clients);
    console.log(`✓ Created new client ${newClient.id}`);

    // Create notification for new enquiry
    const enquiryNotification = {
      id: `notif-${Date.now()}`,
      type: "new_enquiry",
      clientId: newClient.id,
      clientName: newClient.name,
      message: `New ${newClient.type} enquiry from ${newClient.name} (${newClient.phone})`,
      date: new Date().toISOString(),
      read: false,
    };
    notifications.push(enquiryNotification);
    await kv.set("notifications", notifications);
    console.log(
      "✓ Enquiry notification created:",
      enquiryNotification,
    );

    console.log(
      "Returning new client:",
      JSON.stringify(newClient),
    );

    return c.json(
      {
        success: true,
        message: "Enquiry submitted successfully",
        client: newClient,
      },
      200,
    );
  } catch (error) {
    console.log("❌ Create client error:", error);
    console.error("Full error stack:", error);
    return c.json(
      {
        error: "Failed to create client",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error",
        details: String(error),
      },
      500,
    );
  }
});

app.put("/make-server-64143980/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedClient = await c.req.json();
    const clients = (await kv.get("clients")) || [];
    const notifications = (await kv.get("notifications")) || [];

    const index = clients.findIndex((cl: any) => cl.id === id);
    if (index === -1) {
      return c.json({ error: "Client not found" }, 404);
    }

    const oldClient = clients[index];
    clients[index] = {
      ...clients[index],
      ...updatedClient,
      id,
    };
    await kv.set("clients", clients);

    // Create notification for status change
    if (oldClient.status !== updatedClient.status) {
      const notification = {
        id: `notif-${Date.now()}`,
        type: "status_change",
        clientId: id,
        clientName: clients[index].name,
        message: `${clients[index].name} status changed from ${oldClient.status} to ${updatedClient.status}`,
        date: new Date().toISOString(),
        read: false,
      };
      notifications.push(notification);
      await kv.set("notifications", notifications);
    }

    return c.json(clients[index]);
  } catch (error) {
    console.log("Update client error:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

app.delete("/make-server-64143980/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const clients = (await kv.get("clients")) || [];

    const filtered = clients.filter((cl: any) => cl.id !== id);
    await kv.set("clients", filtered);

    return c.json({ success: true });
  } catch (error) {
    console.log("Delete client error:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// Testimonials endpoints
app.get("/make-server-64143980/testimonials", async (c) => {
  try {
    console.log("GET /testimonials called");
    let testimonials = await kv.get("testimonials");
    console.log("Retrieved testimonials from KV:", testimonials);
    
    if (!testimonials) {
      console.log("No testimonials found, initializing empty array");
      testimonials = [];
      await kv.set("testimonials", testimonials);
    }
    
    return c.json(testimonials);
  } catch (error) {
    console.log("Get testimonials error:", error);
    return c.json(
      { error: "Failed to fetch testimonials" },
      500,
    );
  }
});

// Admin testimonials endpoints
app.get("/make-server-64143980/admin/testimonials", async (c) => {
  try {
    console.log("GET /admin/testimonials called");
    let testimonials = await kv.get("testimonials");
    console.log("Retrieved admin testimonials from KV:", testimonials);
    
    if (!testimonials) {
      console.log("No testimonials found, initializing empty array");
      testimonials = [];
      await kv.set("testimonials", testimonials);
    }
    
    return c.json(testimonials);
  } catch (error) {
    console.log("Get admin testimonials error:", error);
    return c.json(
      { error: "Failed to fetch testimonials" },
      500,
    );
  }
});

app.post("/make-server-64143980/admin/testimonials", async (c) => {
  try {
    console.log("POST /admin/testimonials called");
    const newTestimonial = await c.req.json();
    console.log("New testimonial data:", newTestimonial);
    
    let testimonials = await kv.get("testimonials");
    if (!testimonials) {
      testimonials = [];
    }

    newTestimonial.id = `test-${Date.now()}`;
    newTestimonial.created_at = new Date().toISOString();
    newTestimonial.updated_at = new Date().toISOString();

    testimonials.push(newTestimonial);
    await kv.set("testimonials", testimonials);

    console.log("Testimonial created successfully:", newTestimonial);
    return c.json(newTestimonial);
  } catch (error) {
    console.log("Create testimonial error:", error);
    return c.json({ error: "Failed to create testimonial" }, 500);
  }
});

app.put("/make-server-64143980/admin/testimonials/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedData = await c.req.json();
    const testimonials = (await kv.get("testimonials")) || [];

    const index = testimonials.findIndex((t: any) => t.id === id);
    if (index === -1) {
      return c.json({ error: "Testimonial not found" }, 404);
    }

    testimonials[index] = {
      ...testimonials[index],
      ...updatedData,
      id,
      updated_at: new Date().toISOString(),
    };

    await kv.set("testimonials", testimonials);
    return c.json(testimonials[index]);
  } catch (error) {
    console.log("Update testimonial error:", error);
    return c.json({ error: "Failed to update testimonial" }, 500);
  }
});

app.delete("/make-server-64143980/admin/testimonials/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const testimonials = (await kv.get("testimonials")) || [];

    const filtered = testimonials.filter((t: any) => t.id !== id);
    await kv.set("testimonials", filtered);

    return c.json({ success: true });
  } catch (error) {
    console.log("Delete testimonial error:", error);
    return c.json({ error: "Failed to delete testimonial" }, 500);
  }
});

// Get enquiries for a specific project
app.get(
  "/make-server-64143980/projects/:id/enquiries",
  async (c) => {
    try {
      const projectId = c.req.param("id");
      const clients = (await kv.get("clients")) || [];

      const enquiries = clients.filter(
        (cl: any) =>
          cl.type === "buyer" &&
          cl.projectsInterested &&
          cl.projectsInterested.includes(projectId),
      );

      return c.json(enquiries);
    } catch (error) {
      console.log("Get enquiries error:", error);
      return c.json(
        { error: "Failed to fetch enquiries" },
        500,
      );
    }
  },
);

// Notifications endpoints
app.get("/make-server-64143980/notifications", async (c) => {
  try {
    const notifications = (await kv.get("notifications")) || [];
    return c.json([...notifications].reverse()); // Most recent first
  } catch (error) {
    console.log("Get notifications error:", error);
    return c.json(
      { error: "Failed to fetch notifications" },
      500,
    );
  }
});

app.put(
  "/make-server-64143980/notifications/:id/read",
  async (c) => {
    try {
      const id = c.req.param("id");
      const notifications =
        (await kv.get("notifications")) || [];

      const notification = notifications.find(
        (n: any) => n.id === id,
      );
      if (notification) {
        notification.read = true;
        await kv.set("notifications", notifications);
      }

      return c.json({ success: true });
    } catch (error) {
      console.log("Mark notification read error:", error);
      return c.json(
        { error: "Failed to mark notification as read" },
        500,
      );
    }
  },
);

app.delete(
  "/make-server-64143980/notifications/:id",
  async (c) => {
    try {
      const id = c.req.param("id");
      const notifications =
        (await kv.get("notifications")) || [];

      const filtered = notifications.filter(
        (n: any) => n.id !== id,
      );
      await kv.set("notifications", filtered);

      return c.json({ success: true });
    } catch (error) {
      console.log("Delete notification error:", error);
      return c.json(
        { error: "Failed to delete notification" },
        500,
      );
    }
  },
);

// Reminders endpoints
app.get("/make-server-64143980/reminders", async (c) => {
  try {
    console.log("Fetching reminders from KV store...");
    const reminders = await kv.get("reminders");
    console.log(
      `Found ${reminders ? reminders.length : 0} reminders`,
    );

    if (!reminders) {
      console.log("No reminders found, returning empty array");
      return c.json([]);
    }

    // Create a copy before reversing to avoid mutating the stored array
    const remindersCopy = [...reminders];
    return c.json(remindersCopy.reverse()); // Most recent first
  } catch (error) {
    console.log("Get reminders error:", error);
    console.error("Full error:", error);
    return c.json({ error: "Failed to fetch reminders" }, 500);
  }
});

app.post("/make-server-64143980/reminders", async (c) => {
  try {
    const newReminder = await c.req.json();
    const reminders = (await kv.get("reminders")) || [];

    newReminder.id = `reminder-${Date.now()}`;
    newReminder.createdAt = new Date().toISOString();
    newReminder.completed = false;

    reminders.push(newReminder);
    await kv.set("reminders", reminders);

    return c.json(newReminder);
  } catch (error) {
    console.log("Create reminder error:", error);
    return c.json({ error: "Failed to create reminder" }, 500);
  }
});

app.put("/make-server-64143980/reminders/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updatedData = await c.req.json();
    const reminders = (await kv.get("reminders")) || [];

    const index = reminders.findIndex((r: any) => r.id === id);
    if (index === -1) {
      return c.json({ error: "Reminder not found" }, 404);
    }

    // Update the reminder with new data
    reminders[index] = { ...reminders[index], ...updatedData };
    await kv.set("reminders", reminders);

    return c.json({
      success: true,
      reminder: reminders[index],
    });
  } catch (error) {
    console.log("Update reminder error:", error);
    return c.json({ error: "Failed to update reminder" }, 500);
  }
});

app.put(
  "/make-server-64143980/reminders/:id/complete",
  async (c) => {
    try {
      const id = c.req.param("id");
      const reminders = (await kv.get("reminders")) || [];

      const reminder = reminders.find((r: any) => r.id === id);
      if (reminder) {
        reminder.completed = true;
        await kv.set("reminders", reminders);
      }

      return c.json({ success: true });
    } catch (error) {
      console.log("Complete reminder error:", error);
      return c.json(
        { error: "Failed to complete reminder" },
        500,
      );
    }
  },
);

app.put(
  "/make-server-64143980/reminders/:id/alert",
  async (c) => {
    try {
      const id = c.req.param("id");
      const reminders = (await kv.get("reminders")) || [];

      const reminder = reminders.find((r: any) => r.id === id);
      if (reminder) {
        reminder.lastAlertTime = new Date().toISOString();
        await kv.set("reminders", reminders);
      }

      return c.json({ success: true });
    } catch (error) {
      console.log("Update reminder alert error:", error);
      return c.json(
        { error: "Failed to update reminder alert" },
        500,
      );
    }
  },
);

app.delete("/make-server-64143980/reminders/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const reminders = (await kv.get("reminders")) || [];

    const filtered = reminders.filter((r: any) => r.id !== id);
    await kv.set("reminders", filtered);

    return c.json({ success: true });
  } catch (error) {
    console.log("Delete reminder error:", error);
    return c.json({ error: "Failed to delete reminder" }, 500);
  }
});

// Get buyers interested in seller's projects
app.get(
  "/make-server-64143980/sellers/:id/buyers",
  async (c) => {
    try {
      const sellerId = c.req.param("id");
      const clients = (await kv.get("clients")) || [];
      const seller = clients.find(
        (cl: any) => cl.id === sellerId,
      );

      if (!seller || seller.type !== "seller") {
        return c.json({ error: "Seller not found" }, 404);
      }

      // Find buyers interested in projects owned by this seller
      const sellerProjects = seller.projectsOwned || [];

      if (!sellerProjects || sellerProjects.length === 0) {
        return c.json([]);
      }

      const buyers = clients.filter(
        (cl: any) =>
          cl.type === "buyer" &&
          cl.projectsInterested &&
          cl.projectsInterested.some((proj: string) =>
            sellerProjects.includes(proj),
          ),
      );

      return c.json(buyers);
    } catch (error) {
      console.log("Get seller buyers error:", error);
      return c.json({ error: "Failed to fetch buyers" }, 500);
    }
  },
);

// Get project details with buyers for seller
app.get(
  "/make-server-64143980/sellers/:id/projects",
  async (c) => {
    try {
      const sellerId = c.req.param("id");
      const clients = (await kv.get("clients")) || [];
      const projects = (await kv.get("projects")) || [];
      const seller = clients.find(
        (cl: any) => cl.id === sellerId,
      );

      if (!seller || seller.type !== "seller") {
        return c.json({ error: "Seller not found" }, 404);
      }

      const sellerProjects = seller.projectsOwned || [];

      if (!sellerProjects || sellerProjects.length === 0) {
        return c.json([]);
      }

      // Get project details and interested buyers for each project
      const projectsWithBuyers = sellerProjects.map(
        (projectId: string) => {
          const project = projects.find(
            (p: any) => p.id === projectId,
          );
          const buyers = clients.filter(
            (cl: any) =>
              cl.type === "buyer" &&
              cl.projectsInterested &&
              cl.projectsInterested.includes(projectId) &&
              !cl.sold, // Don't include sold clients
          );

          return {
            projectId,
            projectName: project ? project.name : projectId,
            projectLocation: project ? project.location : "",
            projectImage: project ? project.images[0] : "",
            buyers,
          };
        },
      );

      return c.json(projectsWithBuyers);
    } catch (error) {
      console.log("Get seller projects error:", error);
      return c.json(
        { error: "Failed to fetch seller projects" },
        500,
      );
    }
  },
);

// Submit enquiry from project page or seller form
app.post("/make-server-64143980/enquiries", async (c) => {
  try {
    const enquiry = await c.req.json();
    const clients = (await kv.get("clients")) || [];
    const notifications = (await kv.get("notifications")) || [];

    // Check if client already exists by phone
    const existingClient = clients.find(
      (cl: any) => cl.phone === enquiry.phone,
    );

    if (existingClient) {
      // Update existing client with new project interest
      if (
        enquiry.projectId &&
        existingClient.projectsInterested
      ) {
        if (
          !existingClient.projectsInterested.includes(
            enquiry.projectId,
          )
        ) {
          existingClient.projectsInterested.push(
            enquiry.projectId,
          );
        }
      }
      existingClient.notes =
        (existingClient.notes || "") +
        `\n${new Date().toISOString().split("T")[0]}: ${enquiry.message || "New enquiry"}`;
      await kv.set("clients", clients);

      // Create notification for existing client
      const notification = {
        id: `notif-${Date.now()}`,
        type: "follow_up",
        clientId: existingClient.id,
        clientName: existingClient.name,
        message: `Follow-up enquiry from ${existingClient.name}`,
        date: new Date().toISOString().split("T")[0],
        read: false,
      };
      notifications.push(notification);
      await kv.set("notifications", notifications);
      console.log("notifications-index.ts", notifications);
      return c.json({
        success: true,
        message: "Enquiry added to existing client",
      });
    } else {
      // Create new client
      const newClient: any = {
        id: `client-${Date.now()}`,
        name: enquiry.name,
        email: enquiry.email,
        phone: enquiry.phone,
        type: enquiry.type || "buyer",
        status: "amber",
        location: enquiry.location || "",
        source: enquiry.source || "ad",
        enquiryDate: new Date().toISOString().split("T")[0],
        sold: false,
        notes: enquiry.message || "Enquiry from website",
      };

      if (enquiry.projectId) {
        newClient.projectsInterested = [enquiry.projectId];
        newClient.favoriteProjects = [];
      } else if (enquiry.type === "seller") {
        newClient.projectsOwned = [];
      } else {
        newClient.projectsInterested = [];
        newClient.favoriteProjects = [];
      }

      clients.push(newClient);
      await kv.set("clients", clients);

      // Create notification for new client
      const notification = {
        id: `notif-${Date.now()}`,
        type: "new_enquiry",
        clientId: newClient.id,
        clientName: newClient.name,
        message: `New enquiry from ${newClient.name}`,
        date: new Date().toISOString().split("T")[0],
        read: false,
      };
      notifications.push(notification);
      await kv.set("notifications", notifications);

      return c.json({
        success: true,
        message: "Enquiry submitted successfully",
      });
    }
  } catch (error) {
    console.log("Submit enquiry error:", error);
    return c.json({ error: "Failed to submit enquiry" }, 500);
  }
});

// ============== NRI ENQUIRIES ENDPOINTS ==============

// Get all NRI enquiries
app.get("/make-server-64143980/nri-enquiries", async (c) => {
  try {
    const nriEnquiries = (await kv.get("nri_enquiries")) || [];
    return c.json(nriEnquiries);
  } catch (error) {
    console.log("Get NRI enquiries error:", error);
    return c.json({ error: "Failed to fetch NRI enquiries" }, 500);
  }
});

// Create new NRI enquiry
app.post("/make-server-64143980/nri-enquiries", async (c) => {
  try {
    const enquiryData = await c.req.json();
    const nriEnquiries = (await kv.get("nri_enquiries")) || [];

    const newEnquiry = {
      id: `nri-${Date.now()}`,
      ...enquiryData,
      status: enquiryData.status || "new",
      priority: enquiryData.priority || "medium",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: null,
      decline_reason: null,
      assigned_to: null,
      last_contacted_at: null,
    };

    nriEnquiries.push(newEnquiry);
    await kv.set("nri_enquiries", nriEnquiries);

    console.log(`✓ Created new NRI enquiry ${newEnquiry.id}`);
    return c.json(newEnquiry, 201);
  } catch (error) {
    console.log("Create NRI enquiry error:", error);
    return c.json({ error: "Failed to create NRI enquiry" }, 500);
  }
});

// Update NRI enquiry
app.patch("/make-server-64143980/nri-enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updateData = await c.req.json();
    const nriEnquiries = (await kv.get("nri_enquiries")) || [];

    const index = nriEnquiries.findIndex((e: any) => e.id === id);
    if (index === -1) {
      return c.json({ error: "Enquiry not found" }, 404);
    }

    nriEnquiries[index] = {
      ...nriEnquiries[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    // Update last_contacted_at if status changes to 'contacted'
    if (updateData.status === "contacted" && nriEnquiries[index].last_contacted_at === null) {
      nriEnquiries[index].last_contacted_at = new Date().toISOString();
    }

    await kv.set("nri_enquiries", nriEnquiries);

    console.log(`✓ Updated NRI enquiry ${id}`);
    return c.json(nriEnquiries[index]);
  } catch (error) {
    console.log("Update NRI enquiry error:", error);
    return c.json({ error: "Failed to update NRI enquiry" }, 500);
  }
});

// Delete NRI enquiry
app.delete("/make-server-64143980/nri-enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const nriEnquiries = (await kv.get("nri_enquiries")) || [];

    const filtered = nriEnquiries.filter((e: any) => e.id !== id);
    await kv.set("nri_enquiries", filtered);

    console.log(`✓ Deleted NRI enquiry ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete NRI enquiry error:", error);
    return c.json({ error: "Failed to delete NRI enquiry" }, 500);
  }
});

// ===== SERVICED APARTMENT ENQUIRIES ENDPOINTS =====

// Get all serviced apartment enquiries
app.get("/make-server-64143980/serviced-enquiries", async (c) => {
  try {
    const enquiries = (await kv.get("serviced_apartment_enquiries")) || [];
    return c.json(enquiries);
  } catch (error) {
    console.log("Get serviced apartment enquiries error:", error);
    return c.json({ error: "Failed to fetch serviced apartment enquiries" }, 500);
  }
});

// Create new serviced apartment enquiry
app.post("/make-server-64143980/serviced-enquiries", async (c) => {
  try {
    const enquiryData = await c.req.json();
    const enquiries = (await kv.get("serviced_apartment_enquiries")) || [];

    const newEnquiry = {
      id: `serviced-enq-${Date.now()}`,
      ...enquiryData,
      status: enquiryData.status || "new",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: null,
      decline_reason: null,
      suggested_alternatives: [],
    };

    enquiries.push(newEnquiry);
    await kv.set("serviced_apartment_enquiries", enquiries);

    console.log(`✓ Created new serviced apartment enquiry ${newEnquiry.id}`);
    return c.json(newEnquiry, 201);
  } catch (error) {
    console.log("Create serviced apartment enquiry error:", error);
    return c.json({ error: "Failed to create serviced apartment enquiry" }, 500);
  }
});

// Update serviced apartment enquiry
app.patch("/make-server-64143980/serviced-enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updateData = await c.req.json();
    const enquiries = (await kv.get("serviced_apartment_enquiries")) || [];

    const index = enquiries.findIndex((e: any) => e.id === id);
    if (index === -1) {
      return c.json({ error: "Enquiry not found" }, 404);
    }

    enquiries[index] = {
      ...enquiries[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    await kv.set("serviced_apartment_enquiries", enquiries);

    console.log(`✓ Updated serviced apartment enquiry ${id}`);
    return c.json(enquiries[index]);
  } catch (error) {
    console.log("Update serviced apartment enquiry error:", error);
    return c.json({ error: "Failed to update serviced apartment enquiry" }, 500);
  }
});

// Delete serviced apartment enquiry
app.delete("/make-server-64143980/serviced-enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const enquiries = (await kv.get("serviced_apartment_enquiries")) || [];

    const filtered = enquiries.filter((e: any) => e.id !== id);
    await kv.set("serviced_apartment_enquiries", filtered);

    console.log(`✓ Deleted serviced apartment enquiry ${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete serviced apartment enquiry error:", error);
    return c.json({ error: "Failed to delete serviced apartment enquiry" }, 500);
  }
});

// ========================================
// NEW SERVICED APARTMENTS ENQUIRY SYSTEM
// ========================================

// Enquiries endpoints
app.get("/make-server-64143980/api/enquiries", async (c) => {
  try {
    const sa_id = c.req.query("sa_id");
    const status = c.req.query("status");
    
    const enquiries = (await kv.get("sa_enquiries")) || [];
    
    let filtered = enquiries;
    if (sa_id) {
      filtered = filtered.filter((e: any) => e.sa_id === sa_id);
    }
    if (status) {
      filtered = filtered.filter((e: any) => e.status === status);
    }
    
    return c.json(filtered);
  } catch (error) {
    console.log("Get enquiries error:", error);
    return c.json({ error: "Failed to fetch enquiries" }, 500);
  }
});

app.post("/make-server-64143980/api/enquiries", async (c) => {
  try {
    const newEnquiry = await c.req.json();
    const enquiries = (await kv.get("sa_enquiries")) || [];
    
    newEnquiry.id = `enquiry-${Date.now()}`;
    newEnquiry.status = "requested";
    newEnquiry.created_at = new Date().toISOString();
    newEnquiry.updated_at = new Date().toISOString();
    newEnquiry.adults = newEnquiry.adults || 1;
    newEnquiry.children = newEnquiry.children || 0;
    
    enquiries.push(newEnquiry);
    await kv.set("sa_enquiries", enquiries);
    
    return c.json(newEnquiry);
  } catch (error) {
    console.log("Create enquiry error:", error);
    return c.json({ error: "Failed to create enquiry" }, 500);
  }
});

app.post("/make-server-64143980/api/enquiries/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const { admin_notes } = await c.req.json();
    
    const enquiries = (await kv.get("sa_enquiries")) || [];
    const enquiry = enquiries.find((e: any) => e.id === id);
    
    if (!enquiry) {
      return c.json({ error: "Enquiry not found" }, 404);
    }
    
    enquiry.status = "approved";
    enquiry.updated_at = new Date().toISOString();
    if (admin_notes) {
      enquiry.admin_notes = admin_notes;
    }
    
    await kv.set("sa_enquiries", enquiries);
    
    return c.json(enquiry);
  } catch (error) {
    console.log("Approve enquiry error:", error);
    return c.json({ error: "Failed to approve enquiry" }, 500);
  }
});

app.post("/make-server-64143980/api/enquiries/:id/decline", async (c) => {
  try {
    const id = c.req.param("id");
    const { admin_notes } = await c.req.json();
    
    const enquiries = (await kv.get("sa_enquiries")) || [];
    const enquiry = enquiries.find((e: any) => e.id === id);
    
    if (!enquiry) {
      return c.json({ error: "Enquiry not found" }, 404);
    }
    
    enquiry.status = "declined";
    enquiry.updated_at = new Date().toISOString();
    if (admin_notes) {
      enquiry.admin_notes = admin_notes;
    }
    
    await kv.set("sa_enquiries", enquiries);
    
    return c.json(enquiry);
  } catch (error) {
    console.log("Decline enquiry error:", error);
    return c.json({ error: "Failed to decline enquiry" }, 500);
  }
});

app.patch("/make-server-64143980/api/enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const updates = await c.req.json();
    
    const enquiries = (await kv.get("sa_enquiries")) || [];
    const enquiry = enquiries.find((e: any) => e.id === id);
    
    if (!enquiry) {
      return c.json({ error: "Enquiry not found" }, 404);
    }
    
    Object.assign(enquiry, updates);
    enquiry.updated_at = new Date().toISOString();
    
    await kv.set("sa_enquiries", enquiries);
    
    return c.json(enquiry);
  } catch (error) {
    console.log("Update enquiry error:", error);
    return c.json({ error: "Failed to update enquiry" }, 500);
  }
});

app.delete("/make-server-64143980/api/enquiries/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const enquiries = (await kv.get("sa_enquiries")) || [];
    
    const filtered = enquiries.filter((e: any) => e.id !== id);
    await kv.set("sa_enquiries", filtered);
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete enquiry error:", error);
    return c.json({ error: "Failed to delete enquiry" }, 500);
  }
});

// Availability blocks endpoints
app.get("/make-server-64143980/api/availability-blocks", async (c) => {
  try {
    const sa_id = c.req.query("sa_id");
    
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    if (sa_id) {
      return c.json(blocks.filter((b: any) => b.sa_id === sa_id));
    }
    
    return c.json(blocks);
  } catch (error) {
    console.log("Get availability blocks error:", error);
    return c.json({ error: "Failed to fetch availability blocks" }, 500);
  }
});

app.post("/make-server-64143980/api/availability-blocks", async (c) => {
  try {
    const newBlock = await c.req.json();
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    newBlock.id = `block-${Date.now()}`;
    newBlock.status = "unavailable";
    newBlock.created_at = new Date().toISOString();
    
    blocks.push(newBlock);
    await kv.set("sa_availability_blocks", blocks);
    
    return c.json(newBlock);
  } catch (error) {
    console.log("Create availability block error:", error);
    return c.json({ error: "Failed to create availability block" }, 500);
  }
});

app.delete("/make-server-64143980/api/availability-blocks/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    const filtered = blocks.filter((b: any) => b.id !== id);
    await kv.set("sa_availability_blocks", filtered);
    
    return c.json({ success: true });
  } catch (error) {
    console.log("Delete availability block error:", error);
    return c.json({ error: "Failed to delete availability block" }, 500);
  }
});

// Admin availability endpoint (with counts)
app.get("/make-server-64143980/api/admin/availability", async (c) => {
  try {
    const sa_id = c.req.query("sa_id");
    const from_date = c.req.query("from_date");
    const to_date = c.req.query("to_date");
    
    if (!sa_id || !from_date || !to_date) {
      return c.json({ error: "Missing required parameters" }, 400);
    }
    
    const enquiries = (await kv.get("sa_enquiries")) || [];
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    // Generate date series
    const start = new Date(from_date);
    const end = new Date(to_date);
    const dates = [];
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    
    // Calculate availability for each date
    const result = dates.map((dateStr) => {
      const date = new Date(dateStr);
      
      // Check if date is in any unavailable block
      const is_unavailable = blocks.some((block: any) => {
        if (block.sa_id !== sa_id) return false;
        const blockStart = new Date(block.start_date);
        const blockEnd = new Date(block.end_date);
        return date >= blockStart && date < blockEnd;
      });
      
      // Count approved enquiries overlapping this date
      const approved_count = enquiries.filter((enquiry: any) => {
        if (enquiry.sa_id !== sa_id || enquiry.status !== 'approved') return false;
        const enqStart = new Date(enquiry.start_date);
        const enqEnd = new Date(enquiry.end_date);
        return date >= enqStart && date < enqEnd;
      }).length;
      
      return {
        date: dateStr,
        is_unavailable,
        approved_count
      };
    });
    
    return c.json(result);
  } catch (error) {
    console.log("Get admin availability error:", error);
    return c.json({ error: "Failed to fetch availability" }, 500);
  }
});

// Client availability endpoint (simple)
app.get("/make-server-64143980/api/calendar/client", async (c) => {
  try {
    const sa_id = c.req.query("sa_id");
    const from_date = c.req.query("from_date");
    const to_date = c.req.query("to_date");
    
    if (!sa_id || !from_date || !to_date) {
      return c.json({ error: "Missing required parameters" }, 400);
    }
    
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    // Generate date series
    const start = new Date(from_date);
    const end = new Date(to_date);
    const dates = [];
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }
    
    // Calculate availability for each date
    const result = dates.map((dateStr) => {
      const date = new Date(dateStr);
      
      // Check if date is in any unavailable block
      const is_unavailable = blocks.some((block: any) => {
        if (block.sa_id !== sa_id) return false;
        const blockStart = new Date(block.start_date);
        const blockEnd = new Date(block.end_date);
        return date >= blockStart && date < blockEnd;
      });
      
      return {
        date: dateStr,
        is_unavailable
      };
    });
    
    return c.json(result);
  } catch (error) {
    console.log("Get client availability error:", error);
    return c.json({ error: "Failed to fetch availability" }, 500);
  }
});

// Check if date range is unavailable
app.post("/make-server-64143980/api/check-availability", async (c) => {
  try {
    const { sa_id, start_date, end_date } = await c.req.json();
    
    if (!sa_id || !start_date || !end_date) {
      return c.json({ error: "Missing required parameters" }, 400);
    }
    
    const blocks = (await kv.get("sa_availability_blocks")) || [];
    
    const start = new Date(start_date);
    const end = new Date(end_date);
    
    // Check if any block overlaps with the requested range
    const is_unavailable = blocks.some((block: any) => {
      if (block.sa_id !== sa_id) return false;
      const blockStart = new Date(block.start_date);
      const blockEnd = new Date(block.end_date);
      // Check for overlap: blocks overlap if NOT (block ends before start OR block starts after end)
      return !(blockEnd <= start || blockStart >= end);
    });
    
    return c.json({ is_unavailable });
  } catch (error) {
    console.log("Check availability error:", error);
    return c.json({ error: "Failed to check availability" }, 500);
  }
});

// File upload endpoint - uploads to Supabase Storage
app.post("/make-server-64143980/upload", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Create Supabase client with service role (bypasses RLS)
    const { createClient } = await import("jsr:@supabase/supabase-js@2.49.8");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase configuration");
      return c.json({ error: "Server configuration error" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('property-images')
      .upload(fileName, uint8Array, {
        contentType: file.type,
        cacheControl: '0',
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return c.json({ error: `Upload failed: ${error.message}` }, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('property-images')
      .getPublicUrl(fileName);

    return c.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Upload endpoint error:", error);
    return c.json({ error: `Upload failed: ${String(error)}` }, 500);
  }
});

Deno.serve(app.fetch);