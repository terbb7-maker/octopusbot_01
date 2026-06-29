export type ProfilesTable = {
  Row: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    default_workspace_id: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id: string;
    email: string;
    name?: string | null;
    avatar_url?: string | null;
    default_workspace_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    email?: string;
    name?: string | null;
    avatar_url?: string | null;
    default_workspace_id?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

export type WorkspacesTable = {
  Row: {
    id: string;
    owner_id: string;
    name: string;
    slug: string;
    status: "active" | "suspended" | "archived";
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    owner_id: string;
    name: string;
    slug: string;
    status?: "active" | "suspended" | "archived";
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    owner_id?: string;
    name?: string;
    slug?: string;
    status?: "active" | "suspended" | "archived";
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};

export type WorkspaceMembersTable = {
  Row: {
    id: string;
    workspace_id: string;
    user_id: string;
    role: "owner" | "admin" | "member" | "viewer";
    status: "active" | "invited" | "removed";
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    workspace_id: string;
    user_id: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "removed";
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: string;
    workspace_id?: string;
    user_id?: string;
    role?: "owner" | "admin" | "member" | "viewer";
    status?: "active" | "invited" | "removed";
    created_at?: string;
    updated_at?: string;
  };
  Relationships: [];
};
