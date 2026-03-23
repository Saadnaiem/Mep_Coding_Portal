import React, { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Truck,
  LayoutDashboard,
  FilePlus,
  Clock,
  LogOut,
  AlertTriangle,
  Search,
  Filter,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  FileText,
  Upload,
  UserCheck,
  ShieldAlert,
  Menu,
  X,
  Settings,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  Hash,
  Mail,
  Lock,
  Phone,
  User,
  ArrowRight,
  AtSign,
  ClipboardList,
  Save,
  ShieldCheck,
  Zap,
  Users,
  UserPlus,
  CheckCircle,
  Layers,
  Download,
  Briefcase,
  RotateCcw,
  XCircle,
  Image as ImageIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { MOCK_STEPS, PRODUCT_HIERARCHY } from "./services/mockDb";
import { db } from "./services/database";
import { supabase, sendEmailNotification } from "./services/supabase"; // Import supabase directly for auth
import {
  getDivisionsForManager,
  getCategoryManagerForDivision,
} from "./services/authService";
import {
  Button,
  Card,
  Badge,
  Input,
  Select,
  Stepper,
  Modal,
  FileInput,
} from "./components/UI";
import { NewProductEntry } from "./components/NewProductEntry";
import { NewVendorForm } from "./components/NewVendorForm";
import { StaffManagement } from "./components/StaffManagement";
import { Reports } from "./components/Reports";
import { EcommerceExport } from "./components/EcommerceExport";
import { ExistingProductModification } from "./components/ExistingProductModification";
import { ExistingModificationsReport } from "./components/ExistingModificationsReport";
import { ItemMasterAssignment } from "./components/ItemMasterAssignment";
import {
  RequestStatus,
  ProductRequest,
  UserType,
  EmployeeRole,
  Product,
  StepAction,
  HierarchyNode,
  Vendor,
  ActionType,
} from "./types";
import { ROLE_LABELS, STATUS_MAP, BRAND_AR_MAP } from "./constants";

const EditableField = ({
  label,
  value,
  onChange,
  type = "text",
  options,
  disabled,
}: any) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(String(value || ""));
  }, [value]);

  if (options) {
    return (
      <div className="w-full">
        {label && (
          <p className="text-xs uppercase font-black text-[#0F3D3E] tracking-widest mb-1">
            {label}
          </p>
        )}
        <Select
          options={options}
          value={String(localValue)}
          disabled={disabled}
          onChange={(e) => {
            const val = e.target.value;
            setLocalValue(val);
            onChange(val);
          }}
        />
      </div>
    );
  }

  return (
    <div className="w-full">
      {label && (
        <p className="text-xs uppercase font-black text-[#0F3D3E] tracking-widest mb-1">
          {label}
        </p>
      )}
      <Input
        type={type}
        value={String(localValue)}
        disabled={disabled}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={() => onChange(localValue)}
        className="!py-2 !px-3"
      />
    </div>
  );
};

// SidebarItem helper component - Updated for Luxury Theme
const SidebarItem: React.FC<{
  icon: any;
  label: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}> = ({ icon: Icon, label, active, onClick, collapsed }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`
      w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all duration-300 group
      ${
        active
          ? "bg-[#0F3D3E] text-white shadow-lg shadow-[#0F3D3E]/20"
          : "text-[#0F3D3E]/70 hover:bg-[#0F3D3E] hover:text-white hover:shadow-lg hover:shadow-[#0F3D3E]/10"
      }
      ${collapsed ? "justify-center px-0" : ""}
    `}
  >
    <Icon
      size={20}
      className={`transition-colors duration-300 ${active ? "text-[#C5A065]" : "text-[#C5A065]/60 group-hover:text-[#C5A065]"}`}
    />
    {!collapsed && (
      <span
        className={`text-sm font-bold tracking-wide whitespace-nowrap overflow-hidden font-serif ${active ? "text-white" : "group-hover:text-white"}`}
      >
        {label}
      </span>
    )}
  </button>
);

// --- Helper Components to Prevent Focus Loss ---
const SafeTextArea = ({
  value,
  onChange,
  onBlur,
  disabled,
  placeholder,
  className,
}: any) => {
  const [localValue, setLocalValue] = useState(value || "");
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  return (
    <textarea
      className={className}
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e);
      }}
      onBlur={onBlur}
      disabled={disabled}
    />
  );
};

const SafeInput = ({
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: any) => {
  const [localValue, setLocalValue] = useState(value || "");
  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e);
      }}
      className={className}
    />
  );
};

const App: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication & Session State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  // Initialize Portal Mode based on URL
  const [activePortal, setActivePortal] = useState<UserType>(() => {
    return location.pathname.startsWith("/staff") ? "employee" : "vendor";
  });

  // Sync URL changes to State
  useEffect(() => {
    const isStaffUrl = location.pathname.startsWith("/staff");
    if (isStaffUrl && activePortal !== "employee") {
      setActivePortal("employee");
    } else if (!isStaffUrl && activePortal !== "vendor") {
      setActivePortal("vendor");
    }
  }, [location.pathname]);

  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [currentUserEmployee, setCurrentUserEmployee] = useState<any>(null);
  const [currentVendor, setCurrentVendor] = useState<any>(null);

  // Database State
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [actions, setActions] = useState<StepAction[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [assignedDivisions, setAssignedDivisions] = useState<string[]>([]);
  // Delegation State
  const [activeDelegations, setActiveDelegations] = useState<any[]>([]);
  const [delegatedDivisions, setDelegatedDivisions] = useState<string[]>([]);

  // Email Notification Queue State
  const [pendingEmails, setPendingEmails] = useState<
    { to: string; subject: string; body: string; label: string }[]
  >([]);
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Load data from DB on mount
  useEffect(() => {
    if (!isAuthenticated) return; // Prevent data leak: Only fetch if authenticated

    const fetchData = async () => {
      const reqs = await db.fetchRequests();
      setRequests(reqs);
      // Also fetch all products and actions initially so they are available for viewing
      const prods = await db.fetchProducts();
      setProducts(prods);
      // actions are fetched on demand per request usually, or could be fetched here
    };
    fetchData();
  }, [isAuthenticated]);

  // Load Delegations
  useEffect(() => {
    if (
      isAuthenticated &&
      activePortal === "employee" &&
      currentUserProfile?.id
    ) {
      db.fetchActiveDelegationsForUser(currentUserProfile.id).then(
        async (delegations) => {
          setActiveDelegations(delegations);

          // Resolve Delegated Divisions for Category Managers
          const delegatedDivisionPromises = delegations
            .filter(
              (d) =>
                d.delegator?.role === "category_manager" && d.delegator?.email,
            )
            .map((d) => getDivisionsForManager(d.delegator.email));

          if (delegatedDivisionPromises.length > 0) {
            const results = await Promise.all(delegatedDivisionPromises);
            const allDelegatedDivisions = results.flat();
            setDelegatedDivisions(Array.from(new Set(allDelegatedDivisions)));
          } else {
            setDelegatedDivisions([]);
          }
        },
      );
    } else {
      setActiveDelegations([]);
      setDelegatedDivisions([]);
    }
  }, [isAuthenticated, activePortal, currentUserProfile]);

  // Load Divisions if CM
  useEffect(() => {
    if (
      currentUserProfile?.email &&
      currentUserEmployee?.role === "category_manager"
    ) {
      getDivisionsForManager(currentUserProfile.email).then(
        setAssignedDivisions,
      );
    } else {
      setAssignedDivisions([]);
    }
  }, [currentUserProfile, currentUserEmployee]);

  // Removed simple state sync effect because we now save on action

  // Auth Form State
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    fullName: "",
    companyName: "",
    vendorType: "new", // Default to 'new'
    phone: "",
    username: "",
    contactPerson: "",
    mobile: "",
  });
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);

  // App State
  const [view, setView] = useState<
    | "dashboard"
    | "request_details"
    | "new_request"
    | "employee_inbox"
    | "admin_staff"
    | "preferences"
    | "audit_log"
    | "reports"
    | "vendor_profile"
    | "ecommerce_export"
    | "catalogue_modification"
    | "existing_product_modification"
    | "existing_modifications_report"
  >("dashboard");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Default collapsed as requested

  // Update sidebar on resize - Removed logic to auto-open, only auto-close on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) setIsSidebarOpen(false);
      // Removed auto-open logic
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "all">(
    "all",
  );
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  // Modal State
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Restore Session on Mount
  useEffect(() => {
    const restoreSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // Fetch User Profile
        const profile = await db.fetchProfile(session.user.id);

        if (profile) {
          setCurrentUserProfile(profile);

          const isEmployee = profile.role !== "vendor";
          const isStaffUrl = location.pathname.startsWith("/staff");

          if (isEmployee) {
            // Redirect if on vendor page
            if (!isStaffUrl) {
              navigate("/staff");
            }
            // activePortal syncs via another effect, but force set here to avoid render flicker if needed
            setActivePortal("employee");

            setCurrentUserEmployee({
              id: profile.id,
              role: profile.role,
              full_name: profile.full_name,
            });
          } else {
            // Redirect if on staff page
            if (isStaffUrl) {
              navigate("/");
            }
            setActivePortal("vendor");

            // Vendor Logic
            const vendor = await db.getVendorByContactId(profile.id);
            if (vendor) {
              setCurrentVendor(vendor);
            }
          }

          // Restore View from URL
          const params = new URLSearchParams(location.search);
          const savedView = params.get("view");
          const savedId = params.get("id");
          if (savedView) setView(savedView as any);
          if (savedId) setSelectedRequestId(savedId);

          setIsAuthenticated(true);
        }
      }
    };

    restoreSession();
  }, []);

  // Sync View State to URL
  useEffect(() => {
    if (isAuthenticated) {
      const params = new URLSearchParams(location.search);
      const urlView = params.get("view");
      const urlId = params.get("id");

      const currentId = selectedRequestId || null;

      if (urlView !== view || urlId !== currentId) {
        params.set("view", view);
        if (selectedRequestId) params.set("id", selectedRequestId);
        else params.delete("id");

        navigate(`${location.pathname}?${params.toString()}`, {
          replace: true,
        });
      }
    }
  }, [view, selectedRequestId, isAuthenticated, location.pathname]);
  const [actionType, setActionType] = useState<"approve" | "reject" | "return">(
    "approve",
  );
  const [actionComment, setActionComment] = useState("");

  // Password Change State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChangeError, setPasswordChangeError] = useState("");

  // New Request Wizard State
  const [wizardStep, setWizardStep] = useState(1);
  const [newReqType, setNewReqType] = useState<"new_vendor" | "new_products">(
    "new_products",
  );
  const [newReqCategory, setNewReqCategory] = useState("");
  const [newReqPriority, setNewReqPriority] = useState("Normal Protocol");
  const [newReqProducts, setNewReqProducts] = useState<Product[]>([]);

  // Shared Editable State for Products (used by RequestDetails and Actions)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    null,
  );
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectActionType, setSelectActionType] = useState<
    "approve" | "reject" | "revision_required" | null
  >(null);
  // Using ref for bulk comment to improve performance and prevent focus loss during typing
  const bulkCommentRef = React.useRef("");

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Use products or editableProducts depending on view
    const targetList =
      isEditable && editableProducts.length > 0 ? editableProducts : products;
    if (e.target.checked) {
      setSelectedProductIds(targetList.map((p) => p.id));
    } else {
      setSelectedProductIds([]);
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedProductIds((prev) => [...prev, id]);
    } else {
      setSelectedProductIds((prev) => prev.filter((pId) => pId !== id));
    }
  };

  const applyBulkStatus = async (
    status: "approved" | "rejected" | "revision_required",
    comment?: string,
  ) => {
    if (selectedProductIds.length === 0) return;

    const updates = selectedProductIds.map((id) =>
      db.updateProduct(id, {
        status: status,
        rejection_reason: comment || "",
      }),
    );

    await Promise.all(updates);

    // Refresh local state
    const updatedProducts = products.map((p) =>
      selectedProductIds.includes(p.id)
        ? { ...p, status: status, rejection_reason: comment || "" }
        : p,
    );
    setProducts(updatedProducts);
    setEditableProducts((prev) =>
      prev.map((p) =>
        selectedProductIds.includes(p.id)
          ? { ...p, status: status, rejection_reason: comment || "" }
          : p
      )
    );
    setSelectedProductIds([]); // Clear selection
    setSelectActionType(null);
    if (bulkCommentRef.current) bulkCommentRef.current = ""; // Clear ref
  };

  const [editableProducts, setEditableProducts] = useState<Product[]>([]);

  const handleAddProduct = (newProduct: Product) => {
    setNewReqProducts([
      ...newReqProducts,
      { ...newProduct, request_id: "pending" },
    ]);
  };

  // Load specific data when request selected
  useEffect(() => {
    if (selectedRequestId && view === "request_details") {
      setSelectedProductId(null); // Reset detail view when entering a request
      const loadDetails = async () => {
        // Fetch fresh request details to ensure Vendor Documents are up-to-date
        const freshRequest = await db.fetchRequestById(selectedRequestId);
        if (freshRequest) {
          setRequests((prev) =>
            prev.map((r) => (r.id === freshRequest.id ? freshRequest : r)),
          );
        }

        const p = await db.fetchProducts(selectedRequestId);
        setProducts(p); // Update main products list

        // Initialize editable products
        setEditableProducts(p);

        const a = await db.fetchActions(selectedRequestId);
        setActions(a);
      };
      loadDetails();
    }
  }, [selectedRequestId, view]);

  // Computed State
  const currentRequest = useMemo(
    () => requests.find((r) => r.id === selectedRequestId),
    [selectedRequestId, requests],
  );

  const isRequestActionable = useMemo(() => {
    if (activePortal !== "employee" || !currentRequest) return false;
    if (
      currentRequest.status === "completed" ||
      currentRequest.status === "rejected"
    )
      return false;

    // Super Admin Override: Full authority to act on any request at any step
    if (currentUserEmployee?.role === "super_admin") return true;

    const currentRole = currentUserEmployee?.role || "category_manager";
    const step = MOCK_STEPS[currentRequest.current_step - 1];

    if (!step) return false;

    // Delegation Logic: Effective Roles = Native + Delegated
    const effectiveRoles = [
      currentRole,
      ...activeDelegations.map((d) => d.delegator?.role || ""),
    ];

    // 1. Role Check
    if (!effectiveRoles.includes(step.role_required)) return false;

    // 2. Division Check (for Category Managers)
    if (step.role_required === "category_manager") {
      const effectiveDivisions = [...assignedDivisions, ...delegatedDivisions];
      return effectiveDivisions.some(
        (d) => d?.toLowerCase() === currentRequest.category?.toLowerCase(),
      );
    }

    return true;
  }, [
    activePortal,
    currentRequest,
    currentUserEmployee,
    currentUserProfile,
    assignedDivisions,
    activeDelegations,
    delegatedDivisions,
  ]);

  // Derived State moved up for access
  const isCorrection =
    (currentRequest?.status === "vendor_revision_required" ||
      currentRequest?.status === "rejected") &&
    activePortal === "vendor";
  const isCategoryManagerOwner = useMemo(() => {
    if (currentUserEmployee?.role !== "category_manager") return false;
    // Basic check, might need assignedDivisions if available in scope
    return true;
  }, [currentUserEmployee, currentRequest]);

  const isEditable =
    isCorrection ||
    (isRequestActionable && currentRequest?.current_step === 7) ||
    (isRequestActionable && currentRequest?.current_step === 1) ||
    currentUserEmployee?.role === "super_admin" ||
    isCategoryManagerOwner;

  const canViewHistory = useMemo(() => {
    // Both vendors and employees should see history
    if (!currentRequest) return false;
    if (activePortal === "vendor") {
      return (
        currentRequest.vendor_id === currentVendor?.id ||
        currentRequest.vendor_id === currentUserProfile?.id
      );
    }
    // Employees: Anyone in the approval chain should be able to see details and history, even if not actionable
    // For now, simplify to all employees can view details/history if they have access to the request
    return true;
  }, [activePortal, currentRequest, currentVendor, currentUserProfile]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Vendor Logic: Only show their own requests
      if (activePortal === "vendor") {
        const isOwner =
          (currentVendor && r.vendor_id === currentVendor.id) ||
          r.vendor_id === currentUserProfile?.id;
        if (!isOwner) return false;
      }

      // Employee Logic: Apply Division Visibility Rules
      if (activePortal === "employee") {
        // If Category Manager, strict filter by assigned divisions
        if (currentUserEmployee?.role === "category_manager") {
          // Strict Rule: Only show requests matching assigned divisions
          if (assignedDivisions.length === 0) return false;

          const matchesDivision = assignedDivisions.some(
            (d) => d?.toLowerCase() === r.category?.toLowerCase(),
          );
          if (!matchesDivision) return false;
        }
        // Other roles (Admin, Supply Chain, QC) currently see all requests in Dashboard
      }

      const vendorName = r.vendor?.company_name || "";
      const matchesSearch =
        (r.request_number?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        ) ||
        vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || r.category === categoryFilter;
      const matchesVendor =
        vendorFilter === "all" || vendorName === vendorFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const rDate = new Date(r.created_at).setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
        const to = dateTo ? new Date(dateTo).setHours(0, 0, 0, 0) : null;
        if (from && rDate < from) matchesDate = false;
        if (to && rDate > to) matchesDate = false;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesVendor &&
        matchesDate
      );
    });
  }, [
    requests,
    searchQuery,
    statusFilter,
    dateFrom,
    dateTo,
    categoryFilter,
    vendorFilter,
    activePortal,
    currentUserProfile,
    currentVendor,
    currentUserEmployee,
    assignedDivisions,
  ]);

  const employeeInbox = useMemo(() => {
    if (activePortal !== "employee") return [];

    // Effective Roles = Native + Delegated
    const currentRole = currentUserEmployee?.role || "category_manager";
    const effectiveRoles = [
      currentRole,
      ...activeDelegations.map((d) => d.delegator?.role || ""),
    ];

    // Super Admin sees ALL actionable requests (Total Override)
    if (currentRole === "super_admin") {
      return requests.filter(
        (r) => r.status !== "completed" && r.status !== "rejected",
      );
    }

    return requests.filter((r) => {
      const step = MOCK_STEPS[r.current_step - 1];
      if (!step) return false;

      // Check if ANY of the user's active/delegated roles match the step requirement
      const roleMatch = effectiveRoles.includes(step.role_required);

      // Division Match Logic
      let divisionMatch = true;
      if (step.role_required === "category_manager") {
        // Use combined divisions (Native + Delegated)
        const effectiveDivisions = [
          ...assignedDivisions,
          ...delegatedDivisions,
        ];
        divisionMatch =
          effectiveDivisions.length > 0 &&
          effectiveDivisions.some(
            (d) => d?.toLowerCase() === r.category?.toLowerCase(),
          );
      }

      const basicMatch =
        roleMatch &&
        divisionMatch &&
        r.status !== "completed" &&
        r.status !== "rejected";

      // Apply shared filters to inbox as well
      if (!basicMatch) return false;

      const vendorName = r.vendor?.company_name || "";
      const matchesSearch =
        (r.request_number?.toLowerCase() || "").includes(
          searchQuery.toLowerCase(),
        ) ||
        vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || r.category === categoryFilter;
      const matchesVendor =
        vendorFilter === "all" || vendorName === vendorFilter;

      let matchesDate = true;
      if (dateFrom || dateTo) {
        const rDate = new Date(r.created_at).setHours(0, 0, 0, 0);
        const from = dateFrom ? new Date(dateFrom).setHours(0, 0, 0, 0) : null;
        const to = dateTo ? new Date(dateTo).setHours(0, 0, 0, 0) : null;
        if (from && rDate < from) matchesDate = false;
        if (to && rDate > to) matchesDate = false;
      }

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesVendor &&
        matchesDate
      );
    });
  }, [
    requests,
    activePortal,
    currentUserEmployee,
    currentUserProfile,
    assignedDivisions,
    activeDelegations,
    delegatedDivisions,
    searchQuery,
    statusFilter,
    dateFrom,
    dateTo,
    categoryFilter,
    vendorFilter,
  ]);

  // Derive filter options based on user visibility (not filtered by current search)
  // MOVED TO TOP LEVEL
  const baseVisibleRequests = useMemo(() => {
    return requests.filter((r) => {
      if (activePortal === "vendor") {
        return (
          (currentVendor && r.vendor_id === currentVendor.id) ||
          r.vendor_id === currentUserProfile?.id
        );
      }
      // For Category Managers, only show assigned divisions in options
      if (
        activePortal === "employee" &&
        currentUserEmployee?.role === "category_manager"
      ) {
        if (assignedDivisions.length > 0)
          return assignedDivisions.some(
            (d) => d?.toLowerCase() === r.category?.toLowerCase(),
          );
      }
      return true;
    });
  }, [
    requests,
    activePortal,
    currentUserProfile,
    currentVendor,
    currentUserEmployee,
    assignedDivisions,
  ]);

  const uniqueCategories = useMemo(
    () =>
      Array.from(new Set(baseVisibleRequests.map((r) => r.category)))
        .filter(Boolean)
        .sort(),
    [baseVisibleRequests],
  );
  const uniqueVendors = useMemo(
    () =>
      Array.from(
        new Set(baseVisibleRequests.map((r) => r.vendor?.company_name || "")),
      )
        .filter(Boolean)
        .sort(),
    [baseVisibleRequests],
  );

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsSigningIn(false);
    setRequests([]);
    setProducts([]);
    setActions([]);
    setCurrentUserProfile(null);
    setCurrentUserEmployee(null);
    setCurrentVendor(null);
    setAssignedDivisions([]);
    setView("dashboard");
    setSelectedRequestId(null);
    setSelectedProductId(null);
    setAuthForm({
      email: "",
      password: "",
      fullName: "",
      companyName: "",
      vendorType: "new",
      phone: "",
      username: "",
      contactPerson: "",
      mobile: "",
    });
  };

  // Auth Logic
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    // Check if we are in Staff Portal and trying to Login (Sign In)
    if (activePortal === "employee" && authMode === "signup") {
      setAuthError(
        "Staff registration is not allowed via public portal. Please contact administrator.",
      );
      return;
    }

    try {
      setIsSigningIn(true);
      // Add delay to allow the "Welcome" animation and message to be fully seen
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (authMode === "signup") {
        // ... (Vendor Signup Logic) ...
        const { data, error } = await supabase.auth.signUp({
          email: authForm.email,
          password: authForm.password,
          options: {
            data: {
              full_name: authForm.fullName,
              role: "vendor",
              company_name: authForm.companyName,
              vendor_type: authForm.vendorType, // Pass vendor type to metadata
              contact_person_name: authForm.contactPerson || authForm.fullName,
              mobile_number: authForm.mobile,
            },
          },
        });

        if (error) throw error;

        if (data.session) {
          const profile = await db.fetchProfile(data.user!.id);
          setCurrentUserProfile(profile);
          setActivePortal("vendor");

          // Fetch vendor info
          const vendor = await db.getVendorByContactId(profile.id);
          if (vendor) {
            setCurrentVendor(vendor);
          }

          setIsAuthenticated(true);
        } else {
          // Success but no session = Email Confirmation Required
          setShowEmailConfirmation(true);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authForm.email,
          password: authForm.password,
        });

        if (error) throw error;

        if (data.user) {
          const profile = await db.fetchProfile(data.user.id);
          if (profile) {
            setCurrentUserProfile(profile);
            const isEmployee = profile.role !== "vendor";

            if (isEmployee) {
              setActivePortal("employee");
              navigate("/staff"); // Sync URL
              setCurrentUserEmployee({
                id: profile.id,
                role: profile.role,
                full_name: profile.full_name,
              });
            } else {
              setActivePortal("vendor");
              navigate("/"); // Sync URL

              // Fetch vendor details
              const vendor = await db.getVendorByContactId(profile.id);
              if (vendor) {
                setCurrentVendor(vendor);
              }
            }

            // Redirect E-commerce Admin directly to their view
            if (profile.role === "e_commerce_admin") {
              setView("ecommerce_export");
            }

            if (profile.force_password_change) {
              // Do not set authenticated yet, force password change
              setIsPasswordModalOpen(true);
            } else {
              setIsAuthenticated(true);
            }
          } else {
            setAuthError("Profile not found.");
            setIsSigningIn(false);
          }
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed");
      setIsSigningIn(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordChangeError("");
    if (newPassword.length < 6) {
      setPasswordChangeError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordChangeError("Passwords do not match");
      return;
    }

    try {
      // 1. Update Auth Password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      // 2. Update Profile to clear force_password_change
      // Note: In a real app we'd call a Supabase function or update table directly if RLS allows self-update
      // Simulating update:
      if (currentUserProfile) {
        // NOTE: We assume 'db.updateProfile' or similar exists, or we use Supabase client
        // Since we don't have updateProfile in db service clearly from context, using direct Supabase call
        // But db.ts was recently refactored. I'll stick to Supabase for this atomic op.
        const { error: dbError } = await supabase
          .from("profiles")
          .update({ force_password_change: false })
          .eq("id", currentUserProfile.id);

        if (dbError) console.warn("Failed to update profile flag", dbError);
      }

      setIsPasswordModalOpen(false);
      setIsAuthenticated(true);
      alert("Password updated successfully");
    } catch (err: any) {
      setPasswordChangeError(err.message);
    }
  };

  const processWorkflowAction = async () => {
    if (!currentRequest) return;
    setIsSaving(true);
    let nextStep = currentRequest.current_step;
    let nextStatus: RequestStatus = currentRequest.status;

    if (actionType === "approve") {
      // Logic for Saving Product Changes - If user edited anything
      // This ensures any changes made by the approver are persisted permanently before moving to next step
      if (isEditable && editableProducts.length > 0) {
        try {
          for (const p of editableProducts) {
            const { id, ...rest } = p;
            await db.updateProduct(id, rest);
          }
        } catch (e) {
          console.error("Failed to save product updates during approval", e);
          alert(
            "Warning: Failed to save product updates before approval. Proceeding.",
          );
        }
      }

      if (currentRequest.current_step === MOCK_STEPS.length) {
        // --- FINAL APPROVAL LOGIC ---
        // Determine if Partially Approved or Completed
        // Fetch latest status of products from 'products' state which should be updated by the actions
        const currentProductStatuses = products.filter(
          (p) => p.request_id === currentRequest.id,
        );
        const allApproved = currentProductStatuses.every(
          (p) => p.status === "approved",
        );
        const hasRejections = currentProductStatuses.some(
          (p) => p.status === "rejected",
        );

        if (
          hasRejections &&
          currentProductStatuses.some((p) => p.status === "approved")
        ) {
          nextStatus = "partially_approved";
        } else if (allApproved) {
          nextStatus = "completed";
        } else if (
          currentProductStatuses.every((p) => p.status === "rejected")
        ) {
          nextStatus = "rejected";
        } else {
          // Fallback
          nextStatus = "completed";
        }
      } else {
        // --- INTERMEDIATE STEP LOGIC ---
        nextStep += 1;
        nextStatus = "in_review";

        // REQ: "status of product to be still pending til has fully approval from all approver"
        // Reset 'approved' products to 'pending' in the DB so next approver sees them as pending
        const productsToReset = products.filter(
          (p) => p.status === "approved" && p.request_id === currentRequest.id,
        );

        // We use Promise.all to ensure updates happen in parallel
        await Promise.all(
          productsToReset.map((p) =>
            db.updateProduct(p.id, { status: "pending" }),
          ),
        );
      }
    } else if (actionType === "reject") {
      nextStatus = "rejected";
    } else if (actionType === "return") {
      nextStatus = "vendor_revision_required";
    }

    const newActionPayload = {
      request_id: currentRequest.id,
      step_number: currentRequest.current_step,
      actor_id: currentUserProfile?.id || "unknown",
      action: actionType as any,
      comment: actionComment,
      action_at: new Date().toISOString(),
    };

    // DB Sync
    await db.updateRequest(currentRequest.id, {
      current_step: nextStep,
      status: nextStatus,
      last_action_at: new Date().toISOString(),
    });

    await db.logAction(newActionPayload);

    // Sync to Item Master if totally completed
    if (nextStatus === "completed") {
      const allReqProducts = products.filter(p => p.request_id === currentRequest.id);
      await db.syncToItemMaster(allReqProducts);
    }

    // --- NOTIFICATION LOGIC ---
    // Calculate Summary
    const reqProducts = products.filter(
      (p) => p.request_id === currentRequest.id,
    );
    const uniqueBrands = Array.from(
      new Set(reqProducts.map((p) => p.brand)),
    ).filter(Boolean);
    const total_products = reqProducts.length.toString();
    const brands = uniqueBrands.join(", ") || "N/A";

    // Optimistic UI Update
    const newActionDisplay = {
      ...newActionPayload,
      id: "temp-" + Date.now(),
      actor_name: currentUserProfile?.full_name || "Me",
    };
    setActions([newActionDisplay as any, ...actions]);
    setRequests(
      requests.map((r) =>
        r.id === currentRequest.id
          ? {
              ...r,
              current_step: nextStep,
              status: nextStatus,
              last_action_at: new Date().toISOString(),
            }
          : r,
      ),
    );

    setIsSaving(false);
    setIsActionModalOpen(false);

    // --- TRIGGER EDGE FUNCTION EMAILS ---
    let emailSent = false;
    if (
      actionType === "approve" &&
      (nextStatus === "in_review" ||
        nextStatus === "approved_pending_ecommerce" ||
        nextStatus === "completed")
    ) {
      const nextStepDef = MOCK_STEPS.find((s) => s.step_number === nextStep);
      if (nextStepDef) {
        const employees = await db.fetchEmployeesByRole(
          nextStepDef.role_required,
        );
        for (const emp of employees) {
          if (emp.email) {
            await sendEmailNotification({
              trigger_type: "STEP_APPROVED",
              recipient_email: emp.email,
              recipient_name: emp.full_name || emp.role,
              request_id: currentRequest.request_number,
              dynamic_data: {
                category: currentRequest.category,
                priority: "Normal Protocol",
                vendor_name: currentRequest.vendor?.company_name,
                contact_person: currentRequest.vendor?.contact_person_name,
                vendor_email: currentRequest.vendor?.email_address,
                mobile: currentRequest.vendor?.phone_number,
                total_products: total_products,
                total_brands: uniqueBrands.length.toString(),
                brand_names: brands,
                pending_step: nextStepDef.step_name,
              },
            });
            emailSent = true;
          }
        }
      }

      // Notify vendor that their request passed an approval step
      if (
        (nextStatus === "in_review" ||
          nextStatus === "approved_pending_ecommerce") &&
        currentRequest.vendor?.email_address
      ) {
        const currentStepDef = MOCK_STEPS.find(
          (s) => s.step_number === currentRequest.current_step,
        );
        await sendEmailNotification({
          trigger_type: "VENDOR_STEP_APPROVED",
          recipient_email: currentRequest.vendor.email_address,
          recipient_name: currentRequest.vendor.company_name,
          request_id: currentRequest.request_number,
          dynamic_data: {
            step_passed: currentStepDef?.step_name || "Review Step",
            next_step: nextStepDef?.step_name || "the next step",
            total_products,
            brands,
          },
        });
        emailSent = true;
      }

      if (nextStatus === "completed" && currentRequest.vendor?.email_address) {
        await sendEmailNotification({
          trigger_type: "FINAL_APPROVAL",
          recipient_email: currentRequest.vendor.email_address,
          recipient_name: currentRequest.vendor.company_name,
          request_id: currentRequest.request_number,
          dynamic_data: { total_products, brands },
        });
        emailSent = true;
      }
    } else if (
      actionType === "return" ||
      nextStatus === "vendor_revision_required"
    ) {
      if (currentRequest.vendor?.email_address) {
        await sendEmailNotification({
          trigger_type: "REVISION_REQUIRED",
          recipient_email: currentRequest.vendor.email_address,
          recipient_name: currentRequest.vendor.company_name,
          request_id: currentRequest.request_number,
          dynamic_data: { comment: actionComment, total_products, brands, approver_title: currentUserProfile?.role ? ROLE_LABELS[currentUserProfile.role as keyof typeof ROLE_LABELS] || currentUserProfile.role.replace(/_/g, ' ') : '' },
        });
        emailSent = true;
      }
    } else if (actionType === "reject" || nextStatus === "rejected") {
      if (currentRequest.vendor?.email_address) {
        await sendEmailNotification({
          trigger_type: "REJECTED",
          recipient_email: currentRequest.vendor.email_address,
          recipient_name: currentRequest.vendor.company_name,
          request_id: currentRequest.request_number,
          dynamic_data: { comment: actionComment, total_products, brands, approver_title: currentUserProfile?.role ? ROLE_LABELS[currentUserProfile.role as keyof typeof ROLE_LABELS] || currentUserProfile.role.replace(/_/g, ' ') : '' },
        });
        emailSent = true;
      }
    }

    if (emailSent) {
      alert(
        "Email notification will be sent immediately to the required parties.",
      );
    }
    setView("dashboard");
  };

  const formatKSA = (dateStr: string) => {
    try {
      if (!dateStr) return "-";
      return (
        new Date(dateStr).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Riyadh",
        }) + " (KSA)"
      );
    } catch {
      return dateStr;
    }
  };

  const handleCreateRequest = async () => {
    setIsSaving(true);

    let finalVendorId = currentVendor?.id || currentUserProfile?.id;
    let finalVendorObj = currentVendor;

    if (currentUserProfile?.role === "vendor") {
      // 1. Resolve correct Vendor Record for this user
      const existingDbVendor = await db.getVendorByContactId(
        currentUserProfile.id,
      );

      if (existingDbVendor) {
        finalVendorId = existingDbVendor.id;
        // Update with latest form data if available
        if (currentVendor && Object.keys(currentVendor).length > 0) {
          const { id, ...updates } = currentVendor;
          await db.updateVendor(finalVendorId, updates);
          finalVendorObj = { ...existingDbVendor, ...updates };
        } else {
          finalVendorObj = existingDbVendor;
        }
      } else {
        // 2. Create New Vendor Record if missing
        const newVendorPayload = {
          company_name:
            currentVendor?.company_name ||
            currentUserProfile.company_name ||
            currentUserProfile.full_name ||
            "New Vendor",
          contact_person_id: currentUserProfile.id,
          vendor_type: "new",
          email_address: currentUserProfile.email,
          contact_person_name: currentUserProfile.full_name,
          mobile: currentUserProfile.phone,
          ...(currentVendor || {}),
        };
        // Ensure we don't pass an arbitrary ID
        const { id, ...cleanPayload } = newVendorPayload as any;

        console.log("Creating missing vendor record...", cleanPayload);
        const newVendor = await db.createVendor(cleanPayload);

        if (newVendor) {
          finalVendorId = newVendor.id;
          finalVendorObj = newVendor;
          setCurrentVendor(newVendor);
        } else {
          alert(
            "Failed to create vendor profile (Database Error). Please try again or contact support.",
          );
          setIsSaving(false);
          return;
        }
      }
    } else {
      // For Admins/others, if they haven't selected a vendor, ensure we don't send Profile ID as Vendor ID if it violates FK
      if (!currentVendor?.id) {
        // If Admin is submitting, maybe they are creating a request without a vendor assigned yet?
        // Or they are the creator.
        // If requestPayload.vendor_id is strictly FK to vendors, we valid UUID or NULL.
        // Profile ID is valid UUID but not in vendors table.
        // Better to set to NULL if no vendor selected.
        finalVendorId = null;
      } else {
        finalVendorId = currentVendor.id;
      }
    }

    // Generate ID format: Handled by DB Trigger (HPL-YYYY-MM-SEQ)
    // const now = new Date();
    // const month = String(now.getMonth() + 1).padStart(2, '0');
    // const randomSeq = Math.floor(Math.random() * 900) + 100;
    // const request_number = `HPL-${now.getFullYear()}-${month}-${randomSeq}`;

    const requestPayload = {
      // request_number, // Auto-generated by DB
      request_type: newReqType,
      vendor_id: finalVendorId,
      created_by: currentUserProfile?.id,
      current_step: 1,
      status: "submitted" as RequestStatus,
      priority: (newReqPriority.includes("Urgent")
        ? "urgent"
        : "normal") as any,
      category: newReqCategory,
      last_action_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const savedRequest = await db.createRequest(requestPayload);

    // Use vendor_id for products creation logic:
    // If saving products, we need to ensure they are linked to the Vendor ID, IF the products table requires it.
    // However, table schema usually links Products -> Request -> Vendor.
    // So createProducts(productsToSave) just needs request_id.

    // Bug Fix: When nesting optimistic updates, ensure we don't spread [object Object] if types mismatch.
    // Also, ensure we are fetching the created products back or formatting them correctly.

    if (savedRequest) {
      const productsToSave = newReqProducts.map((p) => {
        const { id, ...rest } = p; // Remove temporary ID
        return {
          ...rest,
          request_id: savedRequest.id,
        };
      });

      await db.createProducts(productsToSave);

      // Optimistic Update: Ensure we fetch the actual products because we need their real IDs
      // generated by the DB for future edits/viewing.
      try {
        const freshProducts = await db.fetchProducts(savedRequest.id);
        if (freshProducts && freshProducts.length > 0) {
          // Add to global state
          setProducts((prev) => [...prev, ...freshProducts]);
        }
      } catch (e) {
        console.error("Error fetching fresh products after save", e);
      }

      // Update local requests list
      const requestWithVendor = {
        ...savedRequest,
        vendor: finalVendorObj || {
          company_name: currentUserProfile?.company_name,
          vendor_type: currentUserProfile?.vendor_type || "new",
        },
      };

      setRequests([requestWithVendor, ...requests]);

      // Notify Category Manager (Step 1)
      try {
        const manager = await getCategoryManagerForDivision(newReqCategory);
        if (manager && manager.email) {
          const uniqueBrands = Array.from(
            new Set(newReqProducts.map((p) => p.brand)),
          ).filter(Boolean);

          // Trigger the Edge Function properly instead of using mailto scheme
          await sendEmailNotification({
            trigger_type: 'VENDOR_SUBMITTED',
            recipient_email: manager.email,
            recipient_name: manager.full_name,
            request_id: savedRequest.request_number || "Pending",
            dynamic_data: {
              category: newReqCategory,
              priority: newReqPriority,
              vendor_name: finalVendorObj?.company_name || currentUserProfile?.company_name || "N/A",
              contact_person: finalVendorObj?.contact_person_name || currentUserProfile?.full_name || "N/A",
              mobile: finalVendorObj?.mobile || currentUserProfile?.phone || "-",
              vendor_email: finalVendorObj?.email_address || currentUserProfile?.email || "-",
              total_products: newReqProducts.length,
              total_brands: uniqueBrands.length,
              brand_names: uniqueBrands.join(", ") || "N/A"
            }
          });
        }
      } catch (e) {
        console.warn("Failed to notify manager", e);
      }

      setTimeout(() => {
        setIsSaving(false);
        setView("dashboard");
        setWizardStep(1);
        setNewReqProducts([]);
      }, 500);
    } else {
      setIsSaving(false);
      alert("Failed to create request");
    }
  };

  const generateVendorRegistrationPDF = async () => {
    try {
      if (!currentVendor || !currentVendor.company_name) {
        alert("Please fill in the vendor details first.");
        return;
      }

      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;

      // --- Fonts ---
      let fontLoaded = false;
      let boldFontLoaded = false;
      try {
        const fontUrl =
          "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf";
        const fontBoldUrl =
          "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf";

        const [response, responseBold] = await Promise.all([
          fetch(fontUrl),
          fetch(fontBoldUrl),
        ]);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++)
            binary += String.fromCharCode(bytes[i]);
          doc.addFileToVFS("Amiri-Regular.ttf", btoa(binary));
          doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
          fontLoaded = true;
        }

        if (responseBold.ok) {
          const buffer = await responseBold.arrayBuffer();
          let binary = "";
          const bytes = new Uint8Array(buffer);
          for (let i = 0; i < bytes.byteLength; i++)
            binary += String.fromCharCode(bytes[i]);
          doc.addFileToVFS("Amiri-Bold.ttf", btoa(binary));
          doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
          boldFontLoaded = true;
        }
      } catch (e) {
        console.error("Font load error", e);
      }

      // --- Logo Helper ---
      let logoImg: HTMLImageElement | null = null;
      try {
        const logoUrl = "/logo.png";
        logoImg = new Image();
        logoImg.src = logoUrl;
        await new Promise((resolve) => {
          logoImg!.onload = resolve;
          logoImg!.onerror = resolve;
        });
        // Validate image actually loaded
        if (!logoImg.complete || logoImg.naturalWidth === 0) {
          logoImg = null;
        }
      } catch (e) {
        console.warn("Logo error", e);
      }

      const addTitle = () => {
        doc.setFont("times", "bold");
        doc.setFontSize(18);
        doc.setTextColor(15, 61, 62);
        doc.text("NEW VENDOR REGISTRATION FORM", 14, 25);

        doc.setDrawColor(197, 160, 101); // Gold
        doc.setLineWidth(0.5);
        doc.line(14, 28, pageWidth - 14, 28);
      };

      // --- Content Generation ---
      addTitle();
      let yPos = 35;

      const checkPageBreak = () => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 35;
        }
      };

      const addSection = (title: string, data: [string, any][]) => {
        checkPageBreak(); // Check before starting section
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10); // Reduced font size for headers
        doc.setTextColor(197, 160, 101); // Gold
        doc.text(title.toUpperCase(), 14, yPos);
        yPos += 4; // Reduced gap

        autoTable(doc, {
          startY: yPos,
          body: data.map(([label, value]) => [label, value || "-"]),
          theme: "grid",
          margin: { top: 35 },
          styles: {
            fontSize: 8, // Compact font
            cellPadding: 2, // Compact padding
            valign: "middle",
            font: fontLoaded ? "Amiri" : "helvetica",
            fontStyle: fontLoaded ? "normal" : "normal",
          },
          headStyles: { fillColor: [15, 61, 62], textColor: 255 },
          columnStyles: {
            0: {
              fontStyle: "bold",
              cellWidth: 60,
              fillColor: [245, 245, 245],
              textColor: [15, 61, 62],
              font: "helvetica",
            },
            1: { cellWidth: "auto", textColor: [50, 50, 50] },
          },
          showHead: false,
          didDrawPage: (data) => {
            // Header handled in post-processing
          },
        });

        // Tighter spacing between sections
        yPos = (doc as any).lastAutoTable.finalY + 8;
      };

      addSection("Company Information", [
        ["Supplier Name (Legal)", currentVendor.company_name],
        ["CR Number", currentVendor.cr_number],
        ["CR Expiry Date", currentVendor.cr_expiry_date],
        ["VAT Number", currentVendor.vat_number],
        ["Category", currentRequest?.category || "-"],
        ["Country", currentVendor.country],
        ["City", currentVendor.city],
        ["Full Address", currentVendor.address],
      ]);

      addSection("Contact Details", [
        ["Contact Person", currentVendor.contact_person_name],
        ["Email Address", currentVendor.email_address],
        ["Mobile Number", currentVendor.mobile_number],
        ["Phone Number", currentVendor.phone_number],
        ["Fax", currentVendor.fax],
      ]);

      addSection("Financial & Banking", [
        [
          "New Vendor Registration Fees",
          currentVendor.new_vendor_registration_fees || "Not Set",
        ],
        ["Invoice Currency", currentVendor.invoice_currency],
        ["Payment Currency", currentVendor.payment_currency],
        ["Payment Terms", currentVendor.payment_terms],
        ["Payment Method", currentVendor.payment_method],
        ["Bank Name", currentVendor.bank_name],
        ["Branch Name", currentVendor.bank_branch],
        ["Branch Address", currentVendor.branch_address],
        ["Swift Code", currentVendor.swift_code],
        ["IBAN Number", currentVendor.iban_number],
        ["Account Number", currentVendor.bank_account_number],
        ["Supplier Name in Bank", currentVendor.supplier_name_in_bank],
      ]);

      addSection("Logistics Info", [
        ["Ship To Address", currentVendor.ship_to],
        ["Bill To Address", currentVendor.bill_to],
      ]);

      // Footer - Compact Declaration Block
      // Calculate required space: 32mm (box) + 5mm (gap) + 10mm (margin safe) approx 50mm
      const requiredSpace = 50;
      const footerStart = doc.internal.pageSize.height - 20; // Footer starts at bottom - 20

      // If we don't have enough space before the footer area, page break
      if (yPos + requiredSpace > footerStart) {
        doc.addPage();
        yPos = 35;
      }

      yPos += 5; // Use minimal gap
      doc.setFillColor(245, 245, 245);
      // Reduced box height 40 -> 32
      doc.roundedRect(14, yPos, pageWidth - 28, 32, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(15, 61, 62);
      doc.text("DECLARATION", 18, yPos + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(
        "I hereby certify that the information provided in this form is true, correct, and complete to the best of my knowledge.",
        18,
        yPos + 14,
      );

      yPos += 24; // Lines inside the box now (at bottom of box)
      doc.setDrawColor(100);
      doc.line(18, yPos, 90, yPos); // Signature Line
      doc.text("Authorized Signature & Stamp", 18, yPos + 4);

      doc.line(pageWidth - 90, yPos, pageWidth - 18, yPos); // Date Line
      doc.text("Date", pageWidth - 90, yPos + 4);

      // --- Post-Processing: Headers & Footers (Logo, Page Numbers, Timestamp) ---
      const pageCount = doc.getNumberOfPages();
      const timestamp = new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        // 1. Logo Logic
        if (logoImg) {
          // All pages (including Page 1): Top Right
          const targetWidth = 50;
          const targetHeight = (logoImg.height * targetWidth) / logoImg.width;
          // Position at top-right with margin matching the document content (14mm)
          doc.addImage(
            logoImg,
            "PNG",
            pageWidth - targetWidth - 14,
            5,
            targetWidth,
            targetHeight,
          );
        }

        // 2. Footer Bar
        const footerY = doc.internal.pageSize.height - 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(150); // Gray

        // Left: Timestamp
        doc.text(`Generated: ${timestamp}`, 14, footerY);

        // Right: Page Number
        const pageText = `Page ${i} of ${pageCount}`;
        const textWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - 14 - textWidth, footerY);
      }

      doc.save(
        `Vendor_Registration_${currentVendor.company_name?.replace(/\s+/g, "_") || "Draft"}.pdf`,
      );
    } catch (err: any) {
      console.error("PDF Export Failed:", err);
      alert(`Failed to export PDF: ${err.message || "Unknown error"}`);
    }
  };

  const generateRequestCSV = async () => {
    if (!currentRequest) return;
    try {
      // Fetch fresh data for the CSV to ensure it matches the detailed requirements
      let requestProducts = products.filter(
        (p) => p.request_id === currentRequest.id,
      );

      // Try fetch fresh
      try {
        const freshProducts = await db.fetchProducts(currentRequest.id);
        if (freshProducts && freshProducts.length > 0) {
          requestProducts = freshProducts;
        }
      } catch (e) {
        console.warn(
          "Could not fetch fresh products for CSV, using local state",
        );
      }

      const rows = requestProducts.map((p, index) => ({
        // MEP Coding Form Structure - REORDERED 2026-03-14 (User Request)

        // 1. Vendor & Site Info (Priority)
        "Vendor Number": p.vendor_no || "",
        // Fallback chain: Request Vendor -> Current Login Vendor -> Product Vendor Name -> N/A
        "Vendor Name":
          currentRequest.vendor?.company_name ||
          currentVendor?.company_name ||
          p.vendor_name ||
          "N/A",
        "Site Name": p.site_name || "",
        "Site Number": p.site_no || "",

        // 2. Product Identification
        "Brand (EN)": p.brand || "",
        Barcode: p.barcode,
        "Item Description (EN)": (p.product_name || "").replace(
          /(\r\n|\n|\r)/gm,
          " ",
        ),
        "Item Description (AR)": (p.product_name_ar || "").replace(
          /(\r\n|\n|\r)/gm,
          " ",
        ),

        // 3. Hierarchy
        Division: p.division || "N/A",
        Department: p.department || "N/A",
        Category: p.category || "N/A",
        "Sub Category": p.sub_category || "N/A",
        Class: p.class_name || "N/A",

        // 4. Pricing & Commercials
        "Cost Price": (p.price_cost || 0).toFixed(2),
        "Retail Price": (p.price_retail || 0).toFixed(2),
        "Margin %":
          p.price_retail && p.price_cost && Number(p.price_retail) > 0
            ? (
                (1 - Number(p.price_cost) / Number(p.price_retail)) *
                100
              ).toFixed(2) + "%"
            : "0.00%",
        "Taxable (Vat)": p.taxable ? "Yes" : "No",

        // 5. Remaining Useful Columns
        "Vendor System Code": p.vendor_system_code || "",
        "Brand (AR)":
          p.brand_ar ||
          (BRAND_AR_MAP
            ? BRAND_AR_MAP[p.brand] || BRAND_AR_MAP[p.brand.toLowerCase()]
            : "") ||
          "",
        Manufacturer: p.manufacturer || "",
        "Country of Origin": p.country_of_origin,

        Buyer: p.buyer || "",
        "Category Manager": p.category_manager || "",

        "Item Group": p.item_group || "",
        "Item Sub Group": p.item_sub_group || "",
        "ERP Item Code": p.erp_item_code || "",

        "Based UOM": p.uom || "Each",
        "Pack Size": p.pack_size || "",
        "Inner Pack Size": p.inner_pack_size || "",
        "Case Count": p.case_count || "",
        "Barcode Type": p.barcode_type_primary || "EAN-13",

        "Min Order Qty": p.min_order_qty || 0,
        "Lead Time": p.lead_time || "",
        "Primary Warehouse": p.primary_warehouse || "",
        "RTV Allowed": p.rtv_allowed ? "Yes" : "No",
        "Lot Indicator": p.lot_indicator ? "Yes" : "No",
        "Shelf Life": p.shelf_life || "",
        "Storage Condition": p.storage_condition || "",

        Currency: p.currency || "SAR",
        "MOH Discount %": (p.moh_discount_percentage || 0) + "%",
        "Invoice Extra Discount %": (p.invoice_extra_discount || 0) + "%",
        "Payment Terms": currentVendor?.payment_terms || "60 Days",
        Bonus: p.bonus || "",
        "New Vendor Reg Fees":
          currentVendor?.new_vendor_registration_fees || "",
        "Product Listing Fees": p.product_listing_fees || "",

        Status: p.purchasing_status || "Active",
        "Request No": currentRequest.request_number,
        "Submission Date": new Date(
          currentRequest.created_at,
        ).toLocaleDateString(),
      }));

      if (rows.length === 0) {
        alert("No products to export.");
        return;
      }

      // Generate CSV Content with BOM for Excel UTF-8 support
      const headers = Object.keys(rows[0]);
      const csvContent =
        "\uFEFF" +
        [
          headers.join(","), // Header Row
          ...rows.map((row) =>
            headers
              .map((header) => {
                const value = (row as any)[header] || "";

                // If it is 'Barcode' and looks like a valid number, attempt to export as raw number
                // to prevent Excel from treating it as text (if desired).
                // However, EAN13 barcodes are often 13 digits, which Excel might display in scientific notation (1.23E+12).
                // To force it as text, we quote it. To force it as number, we unquote it.
                // The user specifically asked "make barcode to be number", so we will NOT quote it if it is numeric.
                if (
                  header === "Barcode" &&
                  !isNaN(Number(value)) &&
                  String(value).trim() !== ""
                ) {
                  // CAUTION: Excel might show 1.23E+12 for long barcodes.
                  // But this is what "make it a number" technically means.
                  return String(value);
                }

                // Default: Escape quotes and wrap in quotes to handle commas/newlines in data
                const escaped = String(value).replace(/"/g, '""');
                return `"${escaped}"`;
              })
              .join(","),
          ),
        ].join("\n");

      // Create Blob and Trigger Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        // Use a name that indicates it's for Coding Form
        link.setAttribute(
          "download",
          `MEP_Coding_Form_Data_${currentRequest.request_number}.csv`,
        );
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("CSV Export Error", err);
      alert("Failed to export CSV.");
    }
  };

  const generateRequestPDF = async () => {
    try {
      console.log("Starting PDF generation...");
      if (!currentRequest) {
        console.error("No current request selected");
        return;
      }

      // Create new PDF document
      const doc = new jsPDF("p", "mm", "a4");
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      // Load Arabic Font (Amiri)
      let isArabicFontLoaded = false;
      let isArabicBoldLoaded = false;
      try {
        const fontUrl =
          "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf";
        const fontBoldUrl =
          "https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Bold.ttf";

        const [response, responseBold] = await Promise.all([
          fetch(fontUrl),
          fetch(fontBoldUrl),
        ]);

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          doc.addFileToVFS("Amiri-Regular.ttf", btoa(binary));
          doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");
          isArabicFontLoaded = true;
          console.log("Arabic font loaded successfully");
        }

        if (responseBold.ok) {
          const buffer = await responseBold.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          doc.addFileToVFS("Amiri-Bold.ttf", btoa(binary));
          doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
          isArabicBoldLoaded = true;
          console.log("Arabic Bold font loaded successfully");
        }
      } catch (e) {
        console.error("Error loading Arabic font:", e);
      }

      // Fetch fresh data for the PDF to ensure it matches the database
      // We can't rely just on 'products' state if it hasn't been refreshed after edits
      let requestProducts = products.filter(
        (p) => p.request_id === currentRequest.id,
      );
      let requestActions = actions.filter(
        (a) => a.request_id === currentRequest.id,
      );

      // Attempt to fetch fresh data if online
      try {
        const freshProducts = await db.fetchProducts(currentRequest.id);
        if (freshProducts && freshProducts.length > 0) {
          requestProducts = freshProducts;
        }
        const freshActions = await db.fetchActions(currentRequest.id);
        if (freshActions && freshActions.length > 0) {
          requestActions = freshActions;
        }
      } catch (err) {
        console.warn(
          "Could not fetch fresh data for PDF, using local state",
          err,
        );
      }

      const uniqueBrands = Array.from(
        new Set(requestProducts.map((p) => p.brand)),
      );

      // Load Logo (Pre-load once)
      let logoImg: HTMLImageElement | null = null;
      try {
        const logoUrl = "/logo.png";
        logoImg = new Image();
        logoImg.src = logoUrl;
        await Promise.race([
          new Promise((resolve, reject) => {
            logoImg!.onload = resolve;
            logoImg!.onerror = () => reject(new Error("Image failed to load"));
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Image load timeout")), 1000),
          ),
        ]);
        // Validate image actually loaded
        if (!logoImg.complete || logoImg.naturalWidth === 0) {
          logoImg = null;
        }
      } catch (e) {
        console.warn("Logo load failed", e);
        logoImg = null;
      }

      // Helper for centered text
      const centerText = (
        text: string,
        y: number,
        fontSize: number = 12,
        font: string = "helvetica",
        style: string = "normal",
        color: string = "#000000",
      ) => {
        doc.setFont(font, style);
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
      };

      // --- PAGE 1: SUMMARY & DETAILS ---

      // Header Text
      centerText(
        "AL HABIB PHARMACY CODING PORTAL",
        45,
        24,
        "times",
        "bold",
        "#0F3D3E",
      );
      centerText(
        "Al Habib Pharmacy Product Request Summary",
        55,
        14,
        "helvetica",
        "bold",
        "#C5A065",
      );
      centerText(
        `Request ID: ${currentRequest.request_number}`,
        65,
        16,
        "helvetica",
        "bold",
        "#1E40AF",
      );

      // Calculate Total Product Listing Fees
      const totalListingFees = requestProducts.reduce((sum, p) => {
        const fee =
          parseFloat((p.product_listing_fees || "0").replace(/[^0-9.]/g, "")) ||
          0;
        return sum + fee;
      }, 0);
      const formattedTotalFees =
        totalListingFees > 0
          ? `${totalListingFees.toLocaleString()} ${requestProducts[0]?.currency || "SAR"}`
          : "0 SAR";

      // Request Meta Data Table
      autoTable(doc, {
        startY: 75,
        head: [["Metric", "Detail", "Metric", "Detail"]],
        body: [
          [
            "Request ID",
            currentRequest.request_number,
            "Created Date",
            formatKSA(currentRequest.created_at),
          ],
          [
            "Status",
            currentRequest.status.replace(/_/g, " ").toUpperCase(),
            "Category",
            currentRequest.category || "-",
          ],
          [
            "Total Products",
            requestProducts.length.toString(),
            "Current Step",
            `${currentRequest.current_step} / 7`,
          ],

          // Vendor & Contact Info
          [
            "Vendor Name",
            currentRequest.vendor?.company_name || "-",
            "Contact Person",
            currentRequest.vendor?.contact_person_name || "-",
          ],
          [
            "Contact Email",
            currentRequest.vendor?.email_address || "-",
            "Contact Mobile",
            currentRequest.vendor?.mobile_number || "-",
          ],
          [
            "New Vendor Reg. Fees",
            currentRequest.vendor?.new_vendor_registration_fees || "-",
            "Total Product Listing Fees",
            formattedTotalFees,
          ],

          // Brands
          [
            "Total Brands",
            uniqueBrands.length.toString(),
            "Brands List",
            uniqueBrands.join(", "),
          ],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [15, 61, 62],
          textColor: 255,
          fontStyle: "bold",
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
          valign: "middle",
          font: isArabicFontLoaded ? "Amiri" : "helvetica",
          fontStyle: isArabicFontLoaded ? "normal" : "normal",
        },
        columnStyles: {
          0: {
            fontStyle: "bold",
            cellWidth: 35,
            fillColor: [248, 250, 250],
            textColor: [15, 61, 62],
          },
          1: { fontStyle: "bold", textColor: [0, 0, 0] }, // Bold Black for Detail Value
          2: {
            fontStyle: "bold",
            cellWidth: 35,
            fillColor: [248, 250, 250],
            textColor: [15, 61, 62],
          },
          3: { fontStyle: "bold", textColor: [0, 0, 0] }, // Bold Black for Detail Value
        },
      });

      // --- PAGE 2: PRODUCT LISTING SUMMARY ---
      // User requested Landscape to fit more text
      doc.addPage("a4", "l");
      const pageWidthLandscape = doc.internal.pageSize.getWidth();

      // Modern Header Bar
      doc.setFillColor(15, 61, 62); // Teal
      doc.rect(0, 15, pageWidthLandscape, 14, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255); // White
      doc.text("PRODUCT LISTING SUMMARY", 15, 24);

      // Gold Accent Line under header
      doc.setDrawColor(197, 160, 101);
      doc.setLineWidth(0.8);
      doc.line(0, 29, pageWidthLandscape, 29);

      const productSummaryBody = requestProducts.map((p) => {
        const margin =
          p.price_cost && p.price_retail && Number(p.price_retail) > 0
            ? (
                (1 - Number(p.price_cost) / Number(p.price_retail)) *
                100
              ).toFixed(2) + "%"
            : "-";

        // Filter out Arabic characters from the name to ensure English display
        let pName =
          p.product_name || p.item_description || p.short_description_en || "-";
        pName = pName
          .replace(
            /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
            "",
          )
          .trim();
        pName = pName.replace(/^[\s\-\.|]+|[\s\-\.|]+$/g, "").trim(); // Clean leading/trailing separators

        return [
          p.brand || "-",
          pName || "-",
          `${p.currency || ""} ${Number(p.price_cost || 0).toFixed(2)}`,
          `${p.currency || ""} ${Number(p.price_retail || 0).toFixed(2)}`,
          margin,
          currentRequest?.status === "rejected"
            ? "Rejected"
            : currentRequest?.status === "completed" ||
                currentRequest?.status === "approved_pending_erp"
              ? "Approved"
              : "Pending",
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "Brand",
            "Product Name",
            "Cost Price",
            "Selling Price",
            "Margin",
            "Status",
          ],
        ],
        body: productSummaryBody,
        theme: "grid",
        headStyles: {
          fillColor: [15, 61, 62],
          textColor: 255,
          fontStyle: "bold",
          font: isArabicBoldLoaded ? "Amiri" : "helvetica",
        },
        bodyStyles: { textColor: [15, 61, 62] },
        styles: {
          fontSize: 10,
          cellPadding: 1.5, // Reduced padding from 4 to 1.5 to decrease row height
          valign: "middle",
          // Use Amiri to safely render mixed content without symbols
          font: isArabicFontLoaded ? "Amiri" : "helvetica",
          fontStyle: "normal",
        },
        columnStyles: {
          0: { fontStyle: "bold", cellWidth: 38 }, // Brand - Reduced slightly to save space
          1: { cellWidth: "auto", fontStyle: "bold" }, // Product Name
          2: {
            halign: "right",
            cellWidth: 30,
            fontStyle: "bold",
            textColor: [225, 29, 72],
          }, // Cost Price
          3: {
            halign: "right",
            cellWidth: 32,
            fontStyle: "bold",
            textColor: [5, 150, 105],
          }, // Selling Price
          4: {
            halign: "center",
            cellWidth: 22,
            fontStyle: "bold",
            textColor: [37, 99, 235],
          }, // Margin
          5: { halign: "center", cellWidth: 20 }, // Status
        },
      });

      // --- PAGE 3: APPROVAL SEQUENCE & HISTORY ---
      // Switch back to Portrait
      doc.addPage("a4", "p");

      // Modern Header Bar
      doc.setFillColor(15, 61, 62); // Teal
      doc.rect(0, 15, pageWidth, 14, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255); // White
      doc.text("APPROVAL SEQUENCE & HISTORY", 15, 24);

      // Gold Accent Line under header
      doc.setDrawColor(197, 160, 101);
      doc.setLineWidth(0.8);
      doc.line(0, 29, pageWidth, 29);

      // Build Comprehensive History
      const sortedActions = [...requestActions].sort(
        (a, b) =>
          new Date(a.action_at).getTime() - new Date(b.action_at).getTime(),
      );

      const fullSequence = MOCK_STEPS.map((step) => {
        // Try strict match on step_number, fallback to role match for legacy data without step_number
        const stepActions = sortedActions.filter(
          (a) =>
            String(a.step_number) === String(step.step_number) ||
            (!a.step_number &&
              a.actor_role === step.role_required &&
              a.action !== "submit"),
        );
        const lastAction =
          stepActions.length > 0 ? stepActions[stepActions.length - 1] : null;

        let derivedStatus = "PENDING";
        let statusColor = [220, 220, 220]; // Gray
        let textColor = [80, 80, 80];

        if (currentRequest.current_step > step.step_number) {
          derivedStatus = "APPROVED"; // Changed from 'COMPLETED' to imply approval
          statusColor = [220, 252, 231]; // Light Green
          textColor = [22, 101, 52]; // Dark Green
        } else if (currentRequest.current_step === step.step_number) {
          derivedStatus =
            currentRequest.status === "in_review"
              ? "IN PROGRESS"
              : currentRequest.status.replace(/_/g, " ").toUpperCase();
          if (derivedStatus === "IN PROGRESS") {
            statusColor = [219, 234, 254]; // Light Blue
            textColor = [30, 64, 175];
          } else if (
            derivedStatus.includes("REJECT") ||
            derivedStatus.includes("RETURN")
          ) {
            statusColor = [254, 226, 226]; // Light Red
            textColor = [153, 27, 27];
          } else {
            statusColor = [255, 237, 213]; // Light Orange
            textColor = [154, 52, 18];
          }
        }

        if (lastAction) {
          const stepRole = step.role_required;
          const actorRole = lastAction.actor_role; // You may need to ensure this is populated in your query
          const isDelegated =
            stepRole &&
            actorRole &&
            stepRole !== actorRole &&
            actorRole !== "super_admin" &&
            actorRole !== "vendor";

          if (lastAction.action === "approve") {
            derivedStatus = "APPROVED";
            statusColor = [220, 252, 231];
            textColor = [22, 101, 52];
          } else if (lastAction.action === "reject") {
            derivedStatus = "REJECTED";
            statusColor = [254, 226, 226];
            textColor = [153, 27, 27];
          } else if (lastAction.action === "return") {
            derivedStatus = "RETURNED";
            statusColor = [255, 237, 213];
            textColor = [154, 52, 18];
          }

          // Append Delegation Note to Comment if detected
          if (isDelegated) {
            // Clone object to avoid mutating state directly in render loop if using state ref
            // Actually this map creates new object, so safe.
            const note = "\n[DELEGATED AUTHORITY]";
            if (!lastAction.comment) lastAction.comment = note;
            else if (!lastAction.comment.includes("DELEGATED"))
              lastAction.comment += note;
          }
        }

        return {
          step: `Step ${step.step_number}`,
          role: step.role_required.replace(/_/g, " ").toUpperCase(),
          statusLabel: derivedStatus,
          _statusColor: statusColor,
          _textColor: textColor,
          actor: lastAction
            ? lastAction.actor_name || "Unknown"
            : derivedStatus === "APPROVED"
              ? "System"
              : "-",
          date: lastAction ? formatKSA(lastAction.action_at) : "-",
          comment: lastAction?.comment || "-",
        };
      });

      autoTable(doc, {
        startY: 40,
        margin: { bottom: 25 }, // Avoid footer overlaps
        head: [
          [
            "Step",
            "Role / Responsibility",
            "Status",
            "Actor",
            "Timestamp",
            "Comments",
          ],
        ],
        body: fullSequence.map((i) => [
          i.step,
          i.role,
          "",
          i.actor,
          i.date,
          i.comment,
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [15, 61, 62],
          textColor: 255,
          fontStyle: "bold",
          minCellHeight: 12,
          valign: "middle",
        },
        styles: {
          fontSize: 8,
          valign: "middle",
          cellPadding: 4,
          lineColor: [230, 230, 230],
          lineWidth: 0.1,
          font: isArabicFontLoaded ? "Amiri" : "helvetica",
          fontStyle: isArabicFontLoaded ? "normal" : "normal",
        },
        // Make the detail field, role/responsibility, actor, timestamp, comments bold
        columnStyles: {
          0: { cellWidth: 15, fontStyle: "bold" }, // Step (Detail Field)
          1: { cellWidth: 40, fontStyle: "bold" }, // Role/Responsibility
          2: { cellWidth: 30, halign: "center" }, // Status (Has custom renderer)
          3: { fontStyle: "bold" }, // Actor
          4: { fontStyle: "bold" }, // Timestamp
          5: {
            cellWidth: "auto",
            fontSize: 7,
            textColor: [50, 50, 50],
            fontStyle: "bold",
          }, // Comments (Darker + Bold)
        },
        didDrawCell: (data) => {
          if (data.section === "body" && data.column.index === 2) {
            const rowData = fullSequence[data.row.index];
            const color = rowData._statusColor as [number, number, number];
            const textCol = rowData._textColor as [number, number, number];

            const pX = data.cell.x + 2;
            const pY = data.cell.y + 3;
            const pW = data.cell.width - 4;
            const pH = data.cell.height - 6;

            doc.setFillColor(...color);
            doc.roundedRect(pX, pY, pW, pH, 1, 1, "F");

            doc.setTextColor(...textCol);
            doc.setFontSize(7);
            doc.setFont("helvetica", "bold");
            doc.text(
              rowData.statusLabel,
              data.cell.x + data.cell.width / 2,
              data.cell.y + data.cell.height / 2 + 1,
              { align: "center", baseline: "middle" },
            );

            doc.setFont("helvetica", "normal"); // Reset
          }
        },
        alternateRowStyles: { fillColor: [250, 250, 250] },
      });

      // --- PAGE 3+: PRODUCT DETAILS (FORM STYLE) ---
      doc.addPage(); // Switch to new page (Portrait)
      let yPos = 20;

      const checkPageBreak = (heightNeeded: number) => {
        // Enforce bottom margin of 25mm to avoid footer overlap
        if (yPos + heightNeeded > pageHeight - 25) {
          doc.addPage();
          yPos = 20;
        }
      };

      requestProducts.forEach((p, index) => {
        // Approx height of product block is ~120mm now (with descriptions)
        checkPageBreak(120);

        // --- Header Section - prominent and English ---
        doc.setFontSize(11); // Standard font size
        if (isArabicBoldLoaded) {
          doc.setFont("Amiri", "bold");
        } else {
          doc.setFont("helvetica", "bold");
        }
        doc.setTextColor(15, 61, 62); // Teal

        // Use English description for title
        let titleName =
          p.product_name || p.item_description || p.short_description_en || "-";
        // Filter Arabic
        titleName = titleName
          .replace(
            /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
            "",
          )
          .trim();
        titleName = titleName.replace(/^[\s\-\.|]+|[\s\-\.|]+$/g, "").trim();

        doc.text(`${index + 1}. ${titleName || "-"}`, 15, yPos + 6);

        // Brand Name Styled Box
        doc.setFillColor(250, 248, 245); // Very light warm gray/gold tint
        doc.setDrawColor(197, 160, 101); // Gold Border
        doc.setLineWidth(0.5);
        // Calculate dynamic width based on brand name length approx
        const brandStr = String(p.brand || "");
        const brandWidth = doc.getTextWidth(brandStr) + 12; // padding
        const finalBrandWidth = Math.max(brandWidth, 40); // Min width

        doc.roundedRect(15, yPos + 9, finalBrandWidth, 10, 2, 2, "FD");

        doc.setFontSize(12);
        doc.setTextColor(15, 61, 62); // Teal
        if (isArabicBoldLoaded) doc.setFont("Amiri", "bold");
        else doc.setFont("helvetica", "bold");

        doc.text(brandStr, 18, yPos + 15.5);

        // Price Top Right
        if (isArabicBoldLoaded) doc.setFont("Amiri", "bold");
        else doc.setFont("helvetica", "bold");

        doc.setFontSize(14);
        doc.setTextColor(15, 61, 62);
        doc.text(
          `${p.currency || ""} ${p.price_retail || "0"}`,
          pageWidth - 15,
          yPos + 6,
          { align: "right" },
        );
        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text("RETAIL PRICE", pageWidth - 15, yPos + 11, { align: "right" });

        yPos += 24; // Compact spacing

        // --- Hierarchy Section ---
        doc.setFontSize(8);
        if (isArabicBoldLoaded) doc.setFont("Amiri", "bold");
        else doc.setFont("helvetica", "bold");

        doc.setTextColor(15, 61, 62);
        doc.text("Product Hierarchy Selection", 22, yPos);
        doc.setDrawColor(15, 61, 62);
        doc.setLineWidth(1);
        doc.line(15, yPos - 1, 20, yPos - 1); // Teal dash

        yPos += 5;
        const boxWidth = (pageWidth - 30 - 8) / 5; // 5 boxes
        const hLabels = [
          "Division",
          "Department",
          "Category",
          "Sub Category",
          "Class",
        ];
        const hValues = [
          p.division,
          p.department,
          p.category,
          p.sub_category,
          p.class_name,
        ];

        hValues.forEach((val, i) => {
          const bx = 15 + (boxWidth + 2) * i;

          // Draw Connector Arrow (except for last item)
          if (i < hLabels.length - 1) {
            const arrowX = bx + boxWidth + 1;
            const arrowY = yPos + 7;
            doc.setDrawColor(200);
            doc.setLineWidth(0.3);
            // Simple chevron >
            doc.line(arrowX - 0.5, arrowY - 1, arrowX + 0.5, arrowY);
            doc.line(arrowX - 0.5, arrowY + 1, arrowX + 0.5, arrowY);
          }

          // Box
          doc.setFillColor(248, 250, 250); // Very light background
          doc.setDrawColor(15, 61, 62); // Teal Border
          doc.setLineWidth(0.1);
          doc.roundedRect(bx, yPos, boxWidth, 14, 1, 1, "FD"); // Fill and Draw

          // Label (Top)
          doc.setFontSize(6);
          doc.setTextColor(100, 100, 100); // Gray
          doc.setFont("helvetica", "bold");
          doc.text(hLabels[i].toUpperCase(), bx + 2, yPos + 4);

          // Value (Bottom)
          doc.setFontSize(8); // Increased size
          doc.setTextColor(0, 0, 0); // Black for visibility

          // Check for Arabic content or fallback to Arabic font if loaded to correspond with user preferences
          const cleanVal = String(val || "-").trim();
          const hasArabic = /[\u0600-\u06FF]/.test(cleanVal);

          if (hasArabic && isArabicFontLoaded) {
            doc.setFont("Amiri", "bold");
          } else {
            doc.setFont("helvetica", "bold");
          }

          // Handle long text wrapping
          const splitVal = doc.splitTextToSize(cleanVal, boxWidth - 3);

          // If text wraps to 2 lines, adjust y slightly
          if (splitVal.length > 1) {
            doc.setFontSize(7); // Shrink slightly for long text
            doc.text(splitVal, bx + 2, yPos + 8);
          } else {
            doc.text(splitVal, bx + 2, yPos + 10);
          }
        });

        yPos += 16;

        // --- Descriptions Block (Full Width) ---
        // English Description
        // Header
        doc.setFillColor(15, 61, 62); // Teal
        doc.rect(15, yPos, pageWidth - 30, 6, "F");
        doc.setFontSize(8); // Header Label Size
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("FULL PRODUCT DESCRIPTION (ENGLISH)", 17, yPos + 4);

        // Body
        doc.setFillColor(248, 250, 250);
        doc.setDrawColor(220, 220, 220);
        doc.rect(15, yPos + 6, pageWidth - 30, 12, "FD"); // Reduced Height

        // Force Helvetica for English Only Description
        doc.setFont("helvetica", "bold"); // Bold for better readability
        doc.setTextColor(0, 0, 0); // Correctly set text color to Black
        doc.setFontSize(10); // Standard value size

        // Use English description for full description
        let descText =
          p.product_name || p.item_description || p.short_description_en || "-";

        // Remove Arabic characters to prevent garbage
        descText = descText
          .replace(
            /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g,
            "",
          )
          .trim();
        // Remove left-over separators
        descText = descText.replace(/^[\s\-\.|]+|[\s\-\.|]+$/g, "").trim();

        const descEnString = doc.splitTextToSize(
          descText || "-",
          pageWidth - 34,
        );
        doc.setFontSize(10); // Standard font size for value
        doc.text(descEnString, 17, yPos + 10); // Adjusted text Y pos

        yPos += 16; // Reduced Spacing

        // Arabic Description
        // Header
        doc.setFillColor(15, 61, 62);
        doc.rect(15, yPos, pageWidth - 30, 6, "F");
        doc.setFontSize(8); // Header Label Size
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("ARABIC DESCRIPTION", 17, yPos + 4);

        // Body
        doc.setFillColor(248, 250, 250);
        doc.rect(15, yPos + 6, pageWidth - 30, 12, "F"); // Reduced Height
        doc.rect(15, yPos + 6, pageWidth - 30, 12, "S");

        doc.setFontSize(10); // Arabic Value Size
        doc.setTextColor(15, 61, 62);

        // Check if Arabic font is loaded, otherwise fallback to helvetica
        const isArabicFontAdded = doc.getFontList().hasOwnProperty("Amiri");
        const safeWidth = pageWidth - 30;

        if (isArabicFontAdded) {
          doc.setFont("Amiri", "normal");
          try {
            const arText = String(p.product_name_ar || "-");
            doc.text(arText, pageWidth - 19, yPos + 10, {
              // Adjusted text Y pos
              align: "right",
              maxWidth: safeWidth - 8,
            });
          } catch (err) {
            // Fallback if formatting fails
            doc.text(
              String(p.product_name_ar || "-"),
              pageWidth - 19,
              yPos + 10,
              { align: "right" },
            );
          }
        } else {
          doc.setFont("helvetica", "normal");
          const descAr = doc.splitTextToSize(
            String(p.product_name_ar || "-"),
            safeWidth - 8,
          );
          doc.text(descAr, pageWidth - 19, yPos + 10, { align: "right" });
        }

        // Reset Font
        doc.setFont("helvetica", "normal");

        yPos += 16;

        // --- Specs Section ---
        doc.setFontSize(8);
        doc.setTextColor(197, 160, 101); // Gold
        doc.text("Pharmacy Listing Specifications", 22, yPos);
        doc.setDrawColor(197, 160, 101);
        doc.line(15, yPos - 1, 20, yPos - 1); // Gold dash

        yPos += 6;
        const colW = (pageWidth - 30) / 3;

        // Helper to draw fields in columns
        const drawField = (
          lbl: string,
          val: any,
          x: number,
          y: number,
          isProminent: boolean = false,
        ) => {
          const boxWidth = colW - 5;
          const isBrand = lbl === "Brand Name";

          // Background box for better readability
          if (isBrand) {
            // No Frame for Brand
          } else {
            doc.setFillColor(
              isProminent ? 240 : 252,
              isProminent ? 255 : 252,
              isProminent ? 245 : 252,
            );
            if (isProminent) {
              // Stronger border for prominent
              doc.setDrawColor(15, 61, 62);
              doc.setLineWidth(0.5);
              doc.roundedRect(x - 2, y - 3, boxWidth, 14, 1, 1, "FD");
            } else {
              // Subtle background for others
              doc.roundedRect(x - 2, y - 3, boxWidth, 12, 1, 1, "F");
            }
          }

          // LABEL (Criteria ID) - Bold and Strong Color
          doc.setFontSize(isProminent || isBrand ? 7 : 6);
          doc.setTextColor(15, 61, 62); // Dark Teal (Stronger than gray)
          doc.setFont("helvetica", "bold");
          doc.text(lbl.toUpperCase(), x, y);

          // VALUE - Black Color
          if (isBrand) {
            doc.setFontSize(14);
            doc.setTextColor(15, 61, 62); // Dark Teal
            doc.setFont("helvetica", "bold");
            doc.text(String(val || "-"), x, y + 7);
          } else {
            doc.setFontSize(isProminent ? 11 : 9);
            doc.setTextColor(0, 0, 0); // Black
            doc.setFont("helvetica", "bold"); // Always bold
            doc.text(String(val || "-"), x, y + 4 + (isProminent ? 1 : 0));
          }

          return y + (isBrand ? 24 : isProminent ? 18 : 15);
        };

        // Column 1
        let cy1 = yPos;
        // cy1 = drawField("Brand Name", p.brand, 15, cy1); // Moved to top
        cy1 = drawField("Barcode", p.barcode, 15, cy1);
        cy1 = drawField("Manufacturer", p.manufacturer, 15, cy1);
        cy1 = drawField("Origin", p.country_of_origin, 15, cy1);
        cy1 = drawField("Vendor System Code", p.vendor_system_code, 15, cy1);
        cy1 = drawField("Item Code", p.erp_item_code, 15, cy1, true);
        cy1 = drawField("Item Group", p.item_group, 15, cy1);
        cy1 = drawField("Item Sub Group", p.item_sub_group, 15, cy1);
        cy1 = drawField("Vendor No", p.vendor_no, 15, cy1);

        // Column 2
        let cy2 = yPos;
        cy2 = drawField(
          "Purchasing Status",
          p.purchasing_status,
          15 + colW,
          cy2,
        );
        cy2 = drawField("Storage", p.storage_condition, 15 + colW, cy2);
        cy2 = drawField("Pack Size", p.pack_size, 15 + colW, cy2);
        cy2 = drawField("UoM", p.uom, 15 + colW, cy2);
        cy2 = drawField(
          "Lot Tracked",
          p.lot_indicator ? "Yes" : "No",
          15 + colW,
          cy2,
        );
        cy2 = drawField(
          "RTV Allowed",
          p.rtv_allowed ? "Yes" : "No",
          15 + colW,
          cy2,
        );
        cy2 = drawField("Case Count", p.case_count, 15 + colW, cy2);
        cy2 = drawField("Inner Pack", p.inner_pack_size, 15 + colW, cy2);
        cy2 = drawField("Warehouse", p.primary_warehouse, 15 + colW, cy2);
        cy2 = drawField("Lead Time", p.lead_time, 15 + colW, cy2);
        cy2 = drawField("Buyer", p.buyer, 15 + colW, cy2);

        // Column 3
        let cy3 = yPos;
        cy3 = drawField(
          "Category Manager",
          p.category_manager,
          15 + colW * 2,
          cy3,
        );
        cy3 = drawField(
          "Product Listing Fees",
          p.product_listing_fees,
          15 + colW * 2,
          cy3,
        );
        cy3 = drawField(
          "Cost Price",
          `${p.currency || ""} ${p.price_cost || "0"}`,
          15 + colW * 2,
          cy3,
        );
        cy3 = drawField(
          "Sales Price",
          `${p.currency || ""} ${p.price_retail || "0"}`,
          15 + colW * 2,
          cy3,
        );

        // Margin Calculation (Same logic as in App)
        const marginValue =
          p.price_cost && p.price_retail && Number(p.price_retail) > 0
            ? (
                (1 - Number(p.price_cost) / Number(p.price_retail)) *
                100
              ).toFixed(2) + "%"
            : "-";

        // Margin Box
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15 + colW * 2, cy3, 25, 10, 1, 1, "F");
        doc.setFontSize(5);
        doc.setTextColor(150);
        doc.text("MARGIN", 17 + colW * 2, cy3 + 3);
        doc.setFontSize(9);
        doc.setTextColor(15, 61, 62);
        doc.text(marginValue, 17 + colW * 2, cy3 + 8);
        cy3 += 14;

        cy3 = drawField(
          "MOH Disc %",
          p.moh_discount_percentage,
          15 + colW * 2,
          cy3,
        );
        cy3 = drawField(
          "Inv. Extra Disc",
          p.invoice_extra_discount,
          15 + colW * 2,
          cy3,
        );
        const status =
          currentRequest?.status === "rejected"
            ? "Rejected"
            : currentRequest?.status === "completed" ||
                currentRequest?.status === "approved_pending_erp"
              ? "Approved"
              : "Pending";
        cy3 = drawField("Status", status, 15 + colW * 2, cy3);
        cy3 = drawField("Site Name", p.site_name, 15 + colW * 2, cy3);
        cy3 = drawField("Min Order Qty", p.min_order_qty, 15 + colW * 2, cy3);
        cy3 = drawField("Currency", p.currency || "SAR", 15 + colW * 2, cy3);

        yPos = Math.max(cy1, cy2, cy3) + 8;

        // Separator
        doc.setDrawColor(230);
        doc.setLineWidth(0.1);
        doc.line(15, yPos - 4, pageWidth - 15, yPos - 4);
      });

      // Old loop removed to avoid duplicates - footer logic consolidated at end of function

      // --- NEW VENDOR REGISTRATION PAGE ---
      // Condition: Check if vendor_type is 'new' OR explicitly requested by type
      // Since we just added the column, it defaults to 'new'.
      // We treat 'new_vendor' request OR 'new' classification as trigger.
      const isNewVendor =
        currentRequest.vendor?.vendor_type === "new" ||
        currentRequest.request_type === "new_vendor";

      if (isNewVendor) {
        doc.addPage();
        const pageW = doc.internal.pageSize.width;
        let nY = 20;

        // Logo - Handled by post-processing loop now
        /*
        try {
            const logoUrl = '/logo.png'; 
            const imgProps = doc.getImageProperties(logoUrl);
            const imgWidth = 40; 
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
            doc.addImage(logoUrl, 'PNG', pageW - 55, nY - 10, imgWidth, imgHeight); 
        } catch(e) { ignore }
        */

        // Title
        // Teal Header Bar
        doc.setFillColor(15, 61, 62);
        doc.rect(0, nY, pageWidth, 14, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);
        doc.text("NEW VENDOR REGISTRATION FORM", 15, nY + 9);

        // Gold Accent
        doc.setDrawColor(197, 160, 101);
        doc.setLineWidth(0.8);
        doc.line(0, nY + 14, pageWidth, nY + 14);

        nY += 25;

        // Fields table
        const v = currentRequest.vendor || ({} as any); // Short alias for vendor data

        const fields = [
          { label: "1. Supplier Name", value: v.company_name },
          { label: "2. CR No.", value: v.cr_number },
          { label: "3. CR Expiry Date", value: v.cr_expiry_date },
          { label: "4. Vat No.", value: v.vat_number },
          { label: "5. Category", value: currentRequest.category },
          { label: "6. Country", value: v.country },
          { label: "7. City", value: v.city },
          { label: "8. Address", value: v.address },
          { label: "9. Contact Person", value: v.contact_person_name },
          { label: "10. Mobile Number", value: v.mobile_number },
          { label: "11. Phone", value: v.phone_number },
          { label: "12. Fax", value: v.fax },
          { label: "13. Email Address", value: v.email_address },
          {
            label: "14. Invoice Currency",
            value: v.invoice_currency || requestProducts[0]?.currency || "SAR",
          },
          { label: "15. Payment Currency", value: v.payment_currency || "SAR" },
          { label: "16. Payment Terms", value: v.payment_terms || "60 Days" },
          {
            label: "17. Payment Method",
            value: v.payment_method || "Bank Transfer",
          },
          {
            label: "18. Ship To",
            value: v.ship_to || "Al Habib Medical Group",
          },
          {
            label: "19. Bill To",
            value: v.bill_to || "Al Habib Medical Group",
          },
          { label: "20. Bank Name", value: v.bank_name },
          { label: "21. Branch", value: v.bank_branch },
          { label: "22. Branch Address", value: v.branch_address },
          { label: "23. Swift Code", value: v.swift_code },
          { label: "24. Bank Account", value: v.bank_account_number },
          { label: "25. IBAN Number", value: v.iban_number },
          {
            label: "26. Supplier Name in Account",
            value: v.supplier_name_in_bank,
          },
        ];

        doc.setFontSize(9);
        doc.setLineWidth(0.1);
        doc.setDrawColor(200);

        const rowHeight = 8;
        const col1W = 60;
        const col2W = 110;

        fields.forEach((field) => {
          // Check page break - Increase bottom margin to 25mm (297 - 25 = 272)
          if (nY > 272) {
            doc.addPage();
            nY = 20;
          }

          doc.setFillColor(245, 245, 245);
          doc.rect(15, nY, col1W, rowHeight, "F");
          doc.rect(15, nY, col1W + col2W, rowHeight, "S"); // Border
          doc.line(15 + col1W, nY, 15 + col1W, nY + rowHeight); // Vertical separator

          doc.setTextColor(50);
          doc.setFont("helvetica", "bold");
          doc.text(field.label, 18, nY + 5.5);

          doc.setTextColor(0);
          doc.setFont("helvetica", "normal");
          doc.text(String(field.value || ""), 15 + col1W + 3, nY + 5.5);

          nY += rowHeight;
        });

        nY += 15;

        // REMOVED: Vendor Stamp Section as per request
        /*
        // Vendor Stamp Section
        if (nY > 250) { 
             doc.addPage(); 
             nY = 20; 
        }

        doc.setFont("helvetica", "bold");
        doc.text("Vendor Stamp & Signature:", 15, nY);
        doc.rect(15, nY + 5, 80, 40); // Box for stamp
        
        // Add footer for this new page
        const lastPage = doc.getNumberOfPages();
        doc.setPage(lastPage); // Focus on this page
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${lastPage} of ${lastPage}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
        doc.text(`Generated on ${new Date().toLocaleString()}`, 14, pageHeight - 10);
        */
      }

      // --- Post-Processing: Headers & Footers (Logo on ALL Pages) ---
      const totalPages = doc.getNumberOfPages();
      const timestamp = new Date().toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Get dimensions for CURRENT page (handles mixed Portrait/Landscape)
        const currentW = doc.internal.pageSize.getWidth();
        const currentH = doc.internal.pageSize.getHeight();

        // 1. Logo Logic
        if (logoImg) {
          if (i === 1) {
            // Page 1: Top Center - Prominent Size
            const p1Width = 70; // Larger width for cover page
            const p1Height = (logoImg.height * p1Width) / logoImg.width;
            doc.addImage(
              logoImg,
              "PNG",
              (currentW - p1Width) / 2,
              5,
              p1Width,
              p1Height,
            );
          } else {
            // Page 2+: Top Right - Smaller to fit in white header space (0-15mm)
            const maxHeight = 10;
            let targetWidth = 40;
            let targetHeight = (logoImg.height * targetWidth) / logoImg.width;

            // Constrain height if needed
            if (targetHeight > maxHeight) {
              targetHeight = maxHeight;
              targetWidth = (logoImg.width * targetHeight) / logoImg.height;
            }

            // Position right-aligned in white space above header
            doc.addImage(
              logoImg,
              "PNG",
              currentW - targetWidth - 10,
              2,
              targetWidth,
              targetHeight,
            );
          }
        }

        // 2. Footer (Enhanced)
        const footerY = currentH - 10;

        // Decorative Line
        doc.setDrawColor(197, 160, 101); // Gold
        doc.setLineWidth(0.5);
        doc.line(15, footerY - 5, currentW - 15, footerY - 5);

        // Left: Branding
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(15, 61, 62); // Teal
        doc.text("AL HABIB PHARMACY CODING PORTAL", 15, footerY - 1);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(197, 160, 101); // Gold
        doc.text("Middle East Pharmacies Company (MEPCO)", 15, footerY + 3);

        // Center: Timestamp
        doc.setFontSize(7);
        doc.setTextColor(150);
        const timeText = `Generated: ${timestamp}`;
        const timeW = doc.getTextWidth(timeText);
        doc.text(timeText, (currentW - timeW) / 2, footerY);

        // Right: Page Number
        doc.setFontSize(8);
        doc.setTextColor(100);
        const pageText = `Page ${i} of ${totalPages}`;
        const pageW = doc.getTextWidth(pageText);
        doc.text(pageText, currentW - 15 - pageW, footerY);
      }

      doc.save(`Request_${currentRequest.request_number}_Report.pdf`);
    } catch (error: any) {
      console.error("PDF Export Error:", error);
      alert(
        "Failed to export PDF. Please check console for details.\n" +
          (error.message || ""),
      );
    }
  };

  const Header = () => (
    <header className="h-20 md:h-60 bg-white border-b border-[#C5A065]/20 flex items-center justify-between px-4 md:px-10 sticky top-0 z-50 shadow-sm/50 backdrop-blur-md bg-white/95">
      <div className="flex items-center gap-3 md:gap-8">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2.5 rounded-xl transition-all duration-300 text-[#0F3D3E] hover:bg-[#0F3D3E] hover:text-white hover:rotate-90 hover:shadow-lg hover:shadow-[#0F3D3E]/20 active:scale-90 ${isSidebarOpen ? "translate-x-2 bg-[#F0F4F4]" : ""}`}
        >
          <Menu size={24} className="md:w-7 md:h-7" />
        </button>
        <div
          className="flex items-center gap-3 md:gap-5 cursor-pointer group"
          onClick={() => setView("dashboard")}
        >
          <div className="w-12 h-12 md:w-72 md:h-56 flex items-center justify-center transition-all duration-500 group-hover:scale-105">
            <img
              src="/logo.png"
              alt="Al Habib Pharmacy Logo"
              className="w-full h-full object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex flex-col justify-center h-full pt-1 md:pt-2">
            <h1 className="font-sans font-bold text-base md:text-4xl tracking-tight text-[#0F3D3E] leading-none mb-1 md:mb-2">
              Al Habib Pharmacy Coding Portal
            </h1>
            <h2 className="font-sans text-xs md:text-xl font-bold text-[#C5A065] tracking-[0.05em]">
              Middle East Pharmacies Company (MEPCO)
            </h2>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-8">
        {/* Portal Switcher Removed - Role Based Access Only */}
        <div className="hidden md:flex flex-col items-end border-r border-gray-100 pr-8 mr-2">
          <span className="text-sm font-sans font-semibold text-[#0F3D3E]">
            {currentUserProfile?.full_name || "Guest"}
          </span>
          <span className="text-[10px] uppercase font-bold text-[#C5A065] tracking-wider">
            {activePortal === "employee"
              ? currentUserProfile?.role
                ? ROLE_LABELS[currentUserProfile.role as EmployeeRole] ||
                  currentUserProfile.role
                : "Staff Member"
              : currentUserProfile?.company_name || "Vendor"}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-xl hover:shadow-red-600/30 hover:scale-105 active:rotate-180 transition-all duration-300 group"
        >
          <span className="hidden md:block text-[10px] font-black uppercase tracking-widest group-active:rotate-180 transition-transform">
            Sign Out
          </span>
          <LogOut
            size={18}
            strokeWidth={2.5}
            className="group-active:rotate-180 transition-transform"
          />
        </button>
      </div>
    </header>
  );

  const VendorProfile = () => {
    const [editVendor, setEditVendor] = useState<Partial<Vendor>>({});
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    useEffect(() => {
      if (currentVendor) setEditVendor(currentVendor);
    }, [currentVendor]);

    const handleSaveProfile = async () => {
      if (!currentVendor?.id) return;
      setIsSavingProfile(true);
      try {
        const success = await db.updateVendor(currentVendor.id, editVendor);
        if (success) {
          setCurrentVendor((prev) => ({ ...prev, ...editVendor }));
          alert("Company profile updated successfully.");
        } else {
          throw new Error("Update failed");
        }
      } catch (e: any) {
        console.error(e);
        alert("Failed to update profile. " + e.message);
      } finally {
        setIsSavingProfile(false);
      }
    };

    return (
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black font-serif text-[#0F3D3E]">
              Company Profile
            </h1>
            <p className="text-[#0F3D3E]/60 mt-2">
              Manage your company details and compliance details.
            </p>
          </div>
          <Button
            className="h-12 px-8 rounded-xl bg-[#0F3D3E] text-white shadow-lg shadow-[#0F3D3E]/20 hover:scale-105 transition-all"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </header>

        <NewVendorForm
          currentVendor={editVendor}
          onChange={(updates) =>
            setEditVendor((prev) => ({ ...prev, ...updates }))
          }
          userRole={currentUserProfile?.role || "vendor"}
        />
      </div>
    );
  };

  const Dashboard = () => {
    const isInbox = view === "employee_inbox";
    const displayRequests = isInbox ? employeeInbox : filteredRequests;
    const title = isInbox ? "Task Inbox" : "Dashboard";
    const subtitle = isInbox
      ? "Requests awaiting your action"
      : "Overview of your product requests";

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">
              {title}
            </h2>
            <p className="text-[#C5A065] text-sm font-bold tracking-wide">
              {subtitle}
            </p>
          </div>
          {activePortal === "vendor" && (
            <div className="flex flex-col md:flex-row gap-2">
              <Button
                onClick={() => setView("new_request")}
                className="w-full md:w-auto px-6 h-10 shadow-lg shadow-[#0F3D3E]/20 hover:scale-105 bg-[#0F3D3E] text-white text-xs"
              >
                <Plus size={16} />
                New Request
              </Button>
              <Button
                onClick={() => setView("existing_product_modification")}
                className="w-full md:w-auto px-6 h-10 shadow-lg hover:scale-105 bg-[#C5A065] text-white border border-[#C5A065] text-xs"
              >
                <LayoutDashboard size={16} />
                Existing Products Mod
              </Button>
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4 sticky top-20 md:top-60 z-20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <label className="text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider mb-1 block opacity-80">
                Search
              </label>
              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-[#C5A065]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search all columns..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#C5A065] focus:outline-none text-[#0F3D3E] placeholder:text-[#0F3D3E]/30"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider mb-1 block opacity-80">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#0F3D3E]"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
                <input
                  type="date"
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-[#0F3D3E]"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider mb-1 block opacity-80">
                Category
              </label>
              <select
                className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#0F3D3E]"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider mb-1 block opacity-80">
                Details
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#0F3D3E]"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="vendor_revision_required">Revision</option>
                </select>
                <select
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#0F3D3E]"
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                >
                  <option value="all">All Partners</option>
                  {uniqueVendors.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          {(searchQuery ||
            statusFilter !== "all" ||
            dateFrom ||
            dateTo ||
            categoryFilter !== "all" ||
            vendorFilter !== "all") && (
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                  setDateFrom("");
                  setDateTo("");
                  setCategoryFilter("all");
                  setVendorFilter("all");
                }}
                className="text-xs text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear Filters
              </button>
            </div>
          )}
        </div>

        <Card
          title={isInbox ? "Your Action Items" : "Request Pipeline"}
          noPadding
          className="border-t-4 border-t-[#C5A065]"
        >
          {/* Mobile View: Cards */}
          <div className="md:hidden flex flex-col divide-y divide-gray-100">
            {displayRequests.length === 0 ? (
              <div className="py-12 text-center text-[#0F3D3E]/40 font-medium italic">
                No requests found.
              </div>
            ) : (
              displayRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 hover:bg-[#F0F4F4]/50 active:bg-[#F0F4F4] transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedRequestId(req.id);
                    setView("request_details");
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#0F3D3E] font-serif text-base">
                          {req.request_number}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                            (req.category || "").toLowerCase().includes("mom")
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : (req.category || "")
                                    .toLowerCase()
                                    .includes("personal")
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : (req.category || "")
                                      .toLowerCase()
                                      .includes("wellness")
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : (req.category || "")
                                        .toLowerCase()
                                        .includes("beauty")
                                    ? "bg-pink-50 text-pink-700 border-pink-200"
                                    : "bg-[#F0F4F4] text-[#0F3D3E] border-gray-200"
                          }`}
                        >
                          {req.category}
                        </span>
                      </div>
                      <p className="text-xs text-[#0F3D3E]/70 font-medium mt-1 line-clamp-1">
                        {req.vendor?.company_name}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-2 items-start">
                      <span
                        className={`
                                    px-4 py-1.5 text-[10px] font-serif font-bold uppercase tracking-widest rounded-full border shadow-sm
                                    ${
                                      req.status === "completed" ||
                                      req.status === "approved_pending_erp"
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                        : req.status === "rejected"
                                          ? "bg-red-50 text-red-800 border-red-600"
                                          : req.status === "partially_approved"
                                            ? "bg-emerald-50 text-[#0F3D3E] border-gray-300"
                                            : "bg-amber-50 text-amber-800 border-amber-600"
                                    }
                                  `}
                      >
                        Overall:{" "}
                        {req.status === "completed" ||
                        req.status === "approved_pending_erp"
                          ? "Approved"
                          : req.status === "rejected"
                            ? "Rejected"
                            : req.status === "partially_approved"
                              ? "Partially Approved"
                              : "Pending"}
                      </span>
                      <Badge
                        status={req.status}
                        currentStep={req.current_step}
                        labelSuffix={
                          req.status === "in_review"
                            ? "Waiting Approval from " +
                              MOCK_STEPS.find(
                                (s) => s.step_number === req.current_step,
                              )
                                ?.step_name.replace(/ Approval$/i, "")
                                .replace(/ Issuance$/i, "")
                            : undefined
                        }
                      />
                      {req.status === "completed" && (
                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wide">
                          ERP Code has been created
                        </span>
                      )}
                      <span className="text-[10px] text-[#0F3D3E]/60 font-bold tracking-wider">
                        {formatKSA(req.created_at)}
                      </span>
                    </div>
                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#C5A065]/10 text-[#C5A065]">
                      <ChevronRight size={16} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0F3D3E] border-b border-[#0F3D3E]">
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest">
                    Request ID
                  </th>
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest">
                    Partner
                  </th>
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest">
                    Category
                  </th>
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest">
                    Status
                  </th>
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest">
                    Submitted
                  </th>
                  <th className="py-5 px-8 text-[11px] font-serif font-bold text-white uppercase tracking-widest text-right">
                    Audit
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center text-[#0F3D3E]/40 font-medium italic"
                    >
                      No requests found.
                    </td>
                  </tr>
                ) : (
                  displayRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-gray-50 hover:bg-[#F0F4F4]/50 transition-colors duration-200"
                    >
                      <td className="py-6 px-8 font-bold text-[#0F3D3E] font-serif">
                        {req.request_number}
                      </td>
                      <td className="py-6 px-8 text-sm font-medium text-[#0F3D3E]/80">
                        {req.vendor?.company_name}
                      </td>
                      <td className="py-6 px-8">
                        <span
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-lg tracking-wide border whitespace-nowrap ${
                            (req.category || "").toLowerCase().includes("mom")
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : (req.category || "")
                                    .toLowerCase()
                                    .includes("personal")
                                ? "bg-orange-50 text-orange-700 border-orange-200"
                                : (req.category || "")
                                      .toLowerCase()
                                      .includes("wellness")
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : (req.category || "")
                                        .toLowerCase()
                                        .includes("beauty")
                                    ? "bg-pink-50 text-pink-700 border-pink-200"
                                    : "bg-[#F0F4F4] text-[#0F3D3E] border-transparent"
                          }`}
                        >
                          {req.category}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex flex-row items-center justify-between gap-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <Badge
                              status={
                                req.status === "submitted"
                                  ? "in_review"
                                  : req.status
                              }
                              currentStep={
                                req.status === "submitted"
                                  ? 1
                                  : req.current_step
                              }
                            />
                            {(req.status === "in_review" ||
                              req.status === "submitted") && (
                              <span className="text-[10px] text-amber-600 font-black uppercase tracking-wide">
                                Waiting:{" "}
                                {req.status === "submitted"
                                  ? "Category Manager"
                                  : MOCK_STEPS.find(
                                      (s) => s.step_number === req.current_step,
                                    )
                                      ?.step_name.replace(/ Approval$/i, "")
                                      .replace(/ Issuance$/i, "")}
                              </span>
                            )}
                            {req.status === "completed" && (
                              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wide">
                                ERP Code has been created
                              </span>
                            )}
                          </div>

                          <span
                            className={`
                            px-4 py-1.5 text-[10px] font-serif font-bold uppercase tracking-widest rounded-full border shadow-sm
                            ${
                              req.status === "completed" ||
                              req.status === "approved_pending_erp"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-900/10"
                                : req.status === "rejected"
                                  ? "bg-red-50 text-red-800 border-red-600 shadow-red-900/10"
                                  : req.status === "partially_approved"
                                    ? "bg-gradient-to-r from-emerald-50 to-red-50 text-[#0F3D3E] border-gray-300"
                                    : "bg-amber-50 text-amber-800 border-amber-600 shadow-amber-900/10"
                            }
                        `}
                          >
                            {req.status === "completed" ||
                            req.status === "approved_pending_erp"
                              ? "Approved"
                              : req.status === "rejected"
                                ? "Rejected"
                                : req.status === "partially_approved"
                                  ? "Partially Approved"
                                  : "Pending"}
                          </span>
                        </div>
                      </td>
                      <td className="py-6 px-8 text-xs font-bold text-[#0F3D3E]/70">
                        {formatKSA(req.created_at)}
                      </td>
                      <td className="py-6 px-8 text-right">
                        <Button
                          variant="ghost"
                          className="hover:bg-[#C5A065]/10 hover:text-[#C5A065]"
                          onClick={() => {
                            setSelectedRequestId(req.id);
                            setView("request_details");
                          }}
                        >
                          <ChevronRight
                            size={24}
                            className="text-[#C5A065]"
                            strokeWidth={3}
                          />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  };

  const NewRequestWizard = () => {
    // Determine if we need the registration step
    const needsRegistration =
      currentVendor?.vendor_type === "new" || newReqType === "new_vendor";
    const totalSteps = needsRegistration ? 3 : 2;

    // Labels
    const steps = ["Request Context"];
    if (needsRegistration) steps.push("Vendor Registration");
    steps.push("Product Hierarchy & Form");

    return (
      <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setView("dashboard")}
            className="p-3 bg-white shadow-sm border-2 border-[#C5A065]/20 rounded-xl text-[#C5A065] hover:text-[#0F3D3E] hover:border-[#0F3D3E] transition-all duration-300"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
          <div>
            <h2 className="text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">
              New Request
            </h2>
            <p className="text-[#C5A065] text-sm font-bold tracking-wide">
              Initiate a new product listing request
            </p>
          </div>
        </div>

        <Stepper
          currentStep={wizardStep}
          totalSteps={totalSteps}
          labels={steps}
        />

        {/* STEP 1: CONTEXT */}
        {wizardStep === 1 && (
          <Card
            title="Listing Framework"
            className="border-t-4 border-t-[#C5A065]"
          >
            <div className="space-y-10 p-4">
              {/* If user didn't register with a type, maybe allow switching here? For now assume locked */}
              <Select
                label="TARGET DIVISION"
                options={PRODUCT_HIERARCHY.map((d) => d.name).filter(
                  (n) => n !== "Grand Total",
                )}
                value={newReqCategory}
                onChange={(e) => setNewReqCategory(e.target.value)}
                className="!py-4"
              />
              <div className="flex justify-end pt-4">
                <Button
                  className="h-14 px-12 rounded-xl text-lg shadow-xl shadow-[#0F3D3E]/10"
                  onClick={() => setWizardStep(2)}
                  disabled={!newReqCategory}
                >
                  Proceed <ArrowRight size={22} strokeWidth={3} />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 2: REGISTRATION (Conditional) */}
        {needsRegistration && wizardStep === 2 && (
          <div className="space-y-6">
            <NewVendorForm
              currentVendor={currentVendor || {}}
              onChange={(updates) =>
                setCurrentVendor((prev) => ({ ...prev, ...updates }))
              }
              userRole="vendor"
            />
            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-gray-100 mt-6 flex-wrap gap-4">
              <Button
                variant="outline"
                className="h-12 px-10 rounded-xl"
                onClick={() => setWizardStep(1)}
              >
                <ArrowLeft size={18} strokeWidth={3} /> Back
              </Button>

              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-xl border-[#C5A065] text-[#C5A065] hover:bg-[#C5A065]/10 font-bold"
                  onClick={generateVendorRegistrationPDF}
                >
                  <FileText size={18} className="mr-2" /> Export Registration
                  PDF
                </Button>
                <Button
                  className="h-12 px-10 rounded-xl bg-[#0F3D3E] text-white"
                  onClick={() => {
                    const requiredFields = [
                      "company_name",
                      "cr_number",
                      "cr_expiry_date",
                      "vat_number",
                      "country",
                      "city",
                      "address",
                      "contact_person_name",
                      "email_address",
                      "mobile_number",
                      "invoice_currency",
                      "payment_currency",
                      "payment_terms",
                      "payment_method",
                      "bank_name",
                      "swift_code",
                      "iban_number",
                      "bank_account_number",
                      "supplier_name_in_bank",
                      "cr_document_url",
                      "vat_certificate_url",
                      "bank_certificate_url",
                      "guarantee_letter_url",
                      "listing_fees_document_url",
                    ];

                    const missing = requiredFields.filter(
                      (field) => !currentVendor || !currentVendor[field],
                    );

                    if (missing.length > 0) {
                      alert(
                        `Please fill in all mandatory fields before proceeding. Missing: ${missing.map((f) => f.replace(/_/g, " ")).join(", ")}`,
                      );
                      return;
                    }

                    setWizardStep(3);
                  }}
                >
                  Next Step{" "}
                  <ArrowRight size={20} className="ml-2" strokeWidth={3} />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 (or 2): PRODUCTS */}
        {((!needsRegistration && wizardStep === 2) ||
          (needsRegistration && wizardStep === 3)) && (
          <div className="space-y-8">
            <NewProductEntry
              onAddProduct={handleAddProduct}
              defaultDivision={newReqCategory}
            />

            <Card
              title={`Request Manifest (${newReqProducts.length} items)`}
              className="border-t-4 border-t-[#C5A065]"
            >
              <div className="space-y-3">
                {newReqProducts.map((p, i) => (
                  <div
                    key={i}
                    className="p-5 bg-white rounded-2xl border border-gray-100 flex items-center justify-between group hover:border-[#C5A065]/50 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-10 h-10 bg-[#F0F4F4] text-[#0F3D3E] border border-gray-200 rounded-xl flex items-center justify-center text-xs font-black font-serif">
                        {i + 1}
                      </div>
                      <div>
                        <p className="font-serif font-bold text-[#0F3D3E] text-lg mb-1">
                          {p.product_name}{" "}
                          <span className="text-[#C5A065] font-sans text-sm">
                            ({p.brand})
                          </span>
                        </p>
                        <p className="text-[10px] text-[#0F3D3E]/70 font-bold uppercase tracking-wider">
                          {p.division} &gt; {p.class_name} | GTIN: {p.barcode}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setNewReqProducts(
                          newReqProducts.filter((_, idx) => idx !== i),
                        )
                      }
                      className="p-3 text-[#0F3D3E]/30 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {newReqProducts.length === 0 && (
                  <div className="py-16 text-center opacity-40">
                    <Layers size={56} className="mx-auto mb-6 text-[#0F3D3E]" />
                    <p className="text-xs font-bold uppercase tracking-widest text-[#0F3D3E]">
                      No products listed in manifest yet.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-lg border border-gray-100">
              <Button
                variant="outline"
                className="h-12 px-10 rounded-xl border-gray-200 text-[#0F3D3E]/60 hover:text-[#0F3D3E] hover:border-[#0F3D3E]"
                onClick={() => setWizardStep(needsRegistration ? 2 : 1)}
              >
                <ArrowLeft size={18} strokeWidth={3} /> Back
              </Button>
              <Button
                className="h-14 px-16 rounded-xl bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90 shadow-lg shadow-[#0F3D3E]/20"
                onClick={handleCreateRequest}
                disabled={newReqProducts.length === 0}
              >
                Submit Request <ArrowRight size={20} strokeWidth={3} />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RequestDetails = () => {
    const isCorrection =
      (currentRequest?.status === "vendor_revision_required" ||
        currentRequest?.status === "rejected") &&
      activePortal === "vendor";
    // Allow editing if it's a correction OR if we are at Step 7 (ERP) OR if it is Category Manager at Step 1 OR Super Admin
    // Update: Allow Category Manager to edit ALWAYS if it is their category, regardless of step
    const isCategoryManagerOwner =
      currentUserEmployee?.role === "category_manager" &&
      (assignedDivisions.some(
        (d) => d?.toLowerCase() === currentRequest?.category?.toLowerCase(),
      ) ||
        delegatedDivisions.some(
          (d) => d?.toLowerCase() === currentRequest?.category?.toLowerCase(),
        ));

    const isEditable =
      isCorrection ||
      (isRequestActionable && currentRequest?.current_step === 7) ||
      (isRequestActionable && currentRequest?.current_step === 1) ||
      currentUserEmployee?.role === "super_admin" ||
      isCategoryManagerOwner;

    const [assignedManagerName, setAssignedManagerName] = useState<
      string | null
    >(null);
    const [editableVendor, setEditableVendor] = useState<Partial<any>>({});
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [uploadingState, setUploadingState] = useState<
      Record<string, boolean>
    >({});

    useEffect(() => {
      // Initialize editable vendor
      if (currentRequest?.vendor) {
        setEditableVendor(currentRequest.vendor);
      }
      // Initialize editable vendor when entering correction mode
      if (isCorrection && currentVendor) {
        setEditableVendor(currentVendor);
      }
    }, [isEditable, currentVendor, currentRequest]);

    const handleVendorUpload = async (file: File | null, fieldName: string) => {
      if (!file || !currentVendor?.id) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `vendor-docs/${fileName}`;

      setUploadingState((prev) => ({ ...prev, [fieldName]: true }));

      try {
        const { error: uploadError } = await supabase.storage
          .from("portal-uploads")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("portal-uploads").getPublicUrl(filePath);

        // Update local state immediately for UI feedback
        setEditableVendor((prev) => ({ ...prev, [fieldName]: publicUrl }));
        // Also update currentVendor (global state) so it persists if we switch tabs/views
        setCurrentVendor((prev) => ({ ...prev, [fieldName]: publicUrl }));
      } catch (error) {
        console.error("Error uploading file:", error);
        alert("Error uploading file");
      } finally {
        setUploadingState((prev) => ({ ...prev, [fieldName]: false }));
      }
    };

    const handleProductImageUpload = async (
      file: File | null,
      index: number,
      productId: string,
    ) => {
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `products/${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const key = `${productId}-img-${index}`;

      setUploadingState((prev) => ({ ...prev, [key]: true }));

      try {
        const { error: uploadError } = await supabase.storage
          .from("portal-uploads")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("portal-uploads").getPublicUrl(fileName);

        setEditableProducts((prev) =>
          prev.map((p) => {
            if (p.id === productId) {
              const newImages = [...(p.images || Array(6).fill(""))];
              // Ensure it has 6 slots
              while (newImages.length < 6) newImages.push("");

              newImages[index] = publicUrl;
              return { ...p, images: newImages };
            }
            return p;
          }),
        );
      } catch (error) {
        console.error("Error uploading product image:", error);
        alert("Error uploading image");
      } finally {
        setUploadingState((prev) => ({ ...prev, [key]: false }));
      }
    };

    const handleRemoveProductImage = (index: number, productId: string) => {
      setEditableProducts((prev) =>
        prev.map((p) => {
          if (p.id === productId) {
            const newImages = [...(p.images || [])];
            newImages[index] = "";
            return { ...p, images: newImages };
          }
          return p;
        }),
      );
    };

    // Using shared 'editableProducts' from Parent (App) state now, so changes persist for Action saving

    const handleProductChange = (id: string, field: string, value: any) => {
      setEditableProducts((prev) =>
        prev.map((p) => {
          if (p.id !== id) return p;

          const next = { ...p, [field]: value };

          // Hierarchy Reset Logic
          if (field === "division") {
            next.department = "";
            next.category = "";
            next.sub_category = "";
            next.class_name = "";
          }
          if (field === "department") {
            next.category = "";
            next.sub_category = "";
            next.class_name = "";
          }
          if (field === "category") {
            next.sub_category = "";
            next.class_name = "";
          }
          if (field === "sub_category") {
            next.class_name = "";
          }

          return next;
        }),
      );
    };

    const handleResubmit = async () => {
      if (!confirm("Submit corrected application?")) return;
      setIsSaving(true);
      try {
        // Update Vendor Details if changed
        if (currentVendor?.id && Object.keys(editableVendor).length > 0) {
          await db.updateVendor(currentVendor.id, editableVendor);
        }

        // Update products only if we have them in editable state
        if (editableProducts.length > 0) {
          for (const p of editableProducts) {
            const { id, ...rest } = p;
            // Fix: Reset status to pending if it was revision_required
            const updates = { ...rest };
            if (p.status === "revision_required") {
              updates.status = "pending";
              updates.rejection_reason = null;
            }
            await db.updateProduct(id, updates);
          }
        }

        await db.updateRequest(currentRequest!.id, { status: "in_review" }); // Reset to review

        await db.logAction({
          request_id: currentRequest!.id,
          actor_id: currentUserProfile.id,
          action: "submit",
          comment: "Corrections submitted",
          step_number: currentRequest!.current_step,
          action_at: new Date().toISOString(),
        });
        const currentStepDef = MOCK_STEPS.find(
          (s) => s.step_number === currentRequest!.current_step,
        );
        if (currentStepDef) {
          try {
            let targetEmployees: any[] = [];
            const actionLogs = await db.fetchActions(currentRequest!.id);
            const returnedLogs = actionLogs
              .filter((l) => l.action === "return")
              .sort(
                (a, b) =>
                  new Date(b.action_at).getTime() -
                  new Date(a.action_at).getTime()
              );

            const latestReturnerId = returnedLogs.length > 0 ? (returnedLogs[0].actor_id || returnedLogs[0].user_id) : null;
            if (latestReturnerId) {
              const targetProfile = await db.fetchProfile(latestReturnerId);
              if (targetProfile) {
                targetEmployees = [targetProfile];
              }
            }

            if (targetEmployees.length === 0) {
              targetEmployees = await db.fetchEmployeesByRole(
                currentStepDef.role_required
              );
            }

            const total_products = editableProducts.length;
            const uniqueBrands = Array.from(
              new Set(editableProducts.map((p) => p.brand).filter(Boolean))
            );
            const brands = uniqueBrands.join(", ");
            const categoryName =
              currentRequest?.category ||
              (editableProducts[0] && editableProducts[0].category) ||
              "N/A";

            for (const emp of targetEmployees) {
              if (emp.email) {
                try {
                  await sendEmailNotification({
                    trigger_type: "VENDOR_SUBMITTED",
                    recipient_email: emp.email,
                    recipient_name: emp.full_name || emp.role,
                    request_id: currentRequest!.request_number,
                    dynamic_data: {
                      is_resubmission: true,
                      category: categoryName,
                      priority:
                        currentRequest?.priority === "urgent"
                          ? "Urgent"
                          : "Normal Protocol",
                      vendor_name: currentVendor?.company_name || "N/A",
                      contact_person: currentVendor?.contact_person || "N/A",
                      mobile: currentVendor?.mobile_number || "-",
                      vendor_email: currentVendor?.email_address || "",
                      total_products: total_products.toString(),
                      total_brands: uniqueBrands.length.toString(),
                      brand_names: brands,
                    },
                  });
                } catch (emailErr) {
                  console.error("Failed to send email", emailErr);
                }
              }
            }
          } catch (err) {
            console.error("Error sending resubmit emails", err);
          }
        } // Reload
        const reqs = await db.fetchRequests();
        setRequests(reqs);
        // Products reloaded by effect when view changes or ID changes

        alert("Corrections submitted! The assigned reviewer has been notified.");
        setView("dashboard");
      } catch (e) {
        console.error(e);
        alert("Error submitting corrections");
      } finally {
        setIsSaving(false);
      }
    };

    const handleSaveVendorDetails = async () => {
      const vendorId = currentRequest?.vendor_id || currentVendor?.id;
      if (!vendorId) return;

      // Validation: Category Manager must ensure Fees are set
      // Merge current DB state with edits to check final value
      const targetVendor =
        activePortal === "vendor" ? currentVendor : currentRequest?.vendor;
      const finalState = { ...targetVendor, ...editableVendor };

      if (currentUserEmployee?.role === "category_manager") {
        if (!finalState.new_vendor_registration_fees) {
          alert(
            "New Vendor Registration Fees are mandatory for Category Managers.",
          );
          return;
        }
      }

      setIsSaving(true);
      try {
        await db.updateVendor(vendorId, editableVendor);

        // Refresh
        if (currentRequest?.id) {
          const freshRequest = await db.fetchRequestById(currentRequest.id);
          if (freshRequest) {
            setRequests((prev) =>
              prev.map((r) => (r.id === freshRequest.id ? freshRequest : r)),
            );
          }
        }
        if (activePortal === "vendor") {
          setCurrentVendor((prev) => ({ ...prev, ...editableVendor }));
        }

        alert("Vendor details updated successfully");
        setIsVendorModalOpen(false);
      } catch (e) {
        console.error(e);
        alert("Failed to update vendor");
      } finally {
        setIsSaving(false);
      }
    };

    const handleSaveChanges = async () => {
      setIsSaving(true);
      try {
        // Update Vendor Details if changed
        if (currentVendor?.id && Object.keys(editableVendor).length > 0) {
          await db.updateVendor(currentVendor.id, editableVendor);
        }

        // Update products only if we have them in editable state
        if (editableProducts.length > 0) {
          // Determine products to save - filter to only those belonging to current request if needed,
          // but editableProducts should already be scoped to current request.
          for (const p of editableProducts) {
            const { id, ...rest } = p;
            // Remove calculated fields if any leaked in (though database service handles some)
            await db.updateProduct(id, rest);
          }
        }

        // Reload Data
        if (currentRequest?.id) {
          const freshRequest = await db.fetchRequestById(currentRequest.id);
          if (freshRequest) {
            setRequests((prev) =>
              prev.map((r) => (r.id === freshRequest.id ? freshRequest : r)),
            );
          }
          const p = await db.fetchProducts(currentRequest.id);
          setProducts(p);
          setEditableProducts(p); // Reset editable state to match DB
        }

        if (activePortal === "vendor" && currentVendor) {
          // Refresh vendor data if needed
        }

        alert("Changes saved successfully!");
      } catch (e) {
        console.error(e);
        alert("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    };

    const renderEditableField = (
      label: string,
      field: keyof Product,
      p: Product,
      type = "text",
      options?: string[],
    ) => {
      const value = p[field];
      // Only allow editing products that require revision when in correction mode
      const isProductEditable =
        isCorrection && p.status === "revision_required"
          ? true
          : isCorrection
            ? false
            : isEditable;

      return (
        <EditableField
          label={label}
          value={value}
          type={type}
          options={options}
          disabled={!isProductEditable}
          onChange={(newValue: any) =>
            handleProductChange(p.id, field as string, newValue)
          }
        />
      );
    };

    useEffect(() => {
      const fetchManager = async () => {
        if (currentRequest?.category) {
          // Always try to fetch manager for the category if available, to display in Details
          const profile: any = await getCategoryManagerForDivision(
            currentRequest.category,
          );
          if (profile) setAssignedManagerName(profile.full_name);
          else setAssignedManagerName(null);
        } else {
          setAssignedManagerName(null);
        }
      };
      fetchManager();
    }, [currentRequest]);

    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        {isCorrection && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl shadow-sm mb-6">
            <div className="flex gap-4">
              <div className="text-amber-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h4 className="font-bold text-amber-800 text-lg">
                  Attention Required
                </h4>
                <p className="text-amber-700 text-sm mt-1">
                  This request has been returned for corrections. Please review
                  the comments and update the highlighted fields.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-8 gap-6 md:gap-0 sticky top-20 md:top-60 z-30 bg-[#fcfdfc] pt-4 -mt-4 transition-all">
          <div className="flex items-center gap-4 md:gap-6 w-full">
            <button
              onClick={() => setView("dashboard")}
              className="p-3 bg-[#0F3D3E] border-2 border-[#0F3D3E] rounded-xl text-white hover:bg-[#0F3D3E]/90 hover:scale-105 transition-all shadow-md"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-4 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2 break-all">
                  {currentRequest?.request_number || "New Request"}
                </h2>
                {currentRequest?.status && (
                  <div
                    className={`
                        px-4 py-1.5 rounded-lg border-2 shadow-sm font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mb-2
                        ${
                          currentRequest.status === "completed" ||
                          currentRequest.status === "approved_pending_erp"
                            ? "bg-emerald-50 border-emerald-600 text-emerald-800"
                            : currentRequest.status === "rejected"
                              ? "bg-red-50 border-red-600 text-red-800"
                              : currentRequest.status === "partially_approved"
                                ? "bg-gradient-to-r from-emerald-50 to-red-50 border-gray-200 text-[#0F3D3E]"
                                : "bg-amber-50 border-amber-600 text-amber-800"
                        } 
                     `}
                  >
                    {(currentRequest.status === "completed" ||
                      currentRequest.status === "approved_pending_erp") && (
                      <CheckCircle size={14} className="text-emerald-600" />
                    )}
                    {currentRequest.status === "rejected" && (
                      <XCircle size={14} className="text-red-600" />
                    )}
                    {currentRequest.status === "partially_approved" && (
                      <ShieldCheck size={14} className="text-amber-600" />
                    )}
                    {[
                      "in_review",
                      "submitted",
                      "pending",
                      "vendor_revision_required",
                      "draft",
                    ].includes(currentRequest.status) && (
                      <Clock size={14} className="text-amber-600" />
                    )}
                    <span>
                      {currentRequest.status === "completed" ||
                      currentRequest.status === "approved_pending_erp"
                        ? "Approved"
                        : currentRequest.status === "rejected"
                          ? "Rejected"
                          : currentRequest.status === "partially_approved"
                            ? "Partially Approved"
                            : currentRequest.status ===
                                "vendor_revision_required"
                              ? "Revision Required"
                              : "Pending Approval"}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Badge
                  status={currentRequest?.status || "draft"}
                  currentStep={currentRequest?.current_step}
                  labelSuffix={
                    currentRequest?.status === "in_review"
                      ? assignedManagerName &&
                        currentRequest?.current_step === 1
                        ? `Waiting Approval from ${assignedManagerName}`
                        : `Waiting Approval from ${MOCK_STEPS.find(
                            (s) =>
                              s.step_number === currentRequest?.current_step,
                          )
                            ?.step_name.replace(/ Approval$/i, "")
                            .replace(/ Issuance$/i, "")}`
                      : undefined
                  }
                />
                <span className="text-[10px] md:text-xs font-bold text-[#C5A065] uppercase tracking-widest">
                  Created {formatKSA(currentRequest?.created_at!)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {isCorrection && (
              <Button
                onClick={handleResubmit}
                className="bg-amber-600 text-white hover:bg-amber-700 h-12 px-6 rounded-xl shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto"
              >
                <Upload size={20} />
                <span className="font-bold tracking-wide">
                  Submit Corrections
                </span>
              </Button>
            )}
            {isEditable && !isCorrection && (
              <Button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-blue-600 text-white hover:bg-blue-700 h-12 px-6 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto"
              >
                {isSaving ? (
                  <span className="animate-spin text-xl">◌</span>
                ) : (
                  <Save size={20} />
                )}
                <span className="font-bold tracking-wide">
                  {isSaving ? "Saving..." : "Save Changes"}
                </span>
              </Button>
            )}
            <Button
              onClick={generateRequestCSV}
              className="bg-emerald-600 text-white hover:bg-emerald-700 h-12 px-6 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto"
            >
              <FileText size={20} />
              <span className="font-bold tracking-wide">Export CSV</span>
            </Button>
            <Button
              onClick={generateRequestPDF}
              className="bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90 h-12 px-6 rounded-xl shadow-lg shadow-[#0F3D3E]/20 flex items-center justify-center gap-2 transition-transform hover:scale-105 w-full sm:w-auto"
            >
              <Download size={20} />
              <span className="font-bold tracking-wide">Export PDF</span>
            </Button>
          </div>
        </div>
        <Card
          title="Onboarding Progress"
          noPadding
          className="border-t-4 border-t-[#C5A065]"
        >
          <div className="p-4 md:p-12 overflow-x-auto">
            <Stepper
              currentStep={
                currentRequest?.status === "completed" ||
                currentRequest?.status === "approved"
                  ? MOCK_STEPS.length + 1
                  : currentRequest?.current_step || 1
              }
              totalSteps={MOCK_STEPS.length}
              labels={MOCK_STEPS.map((s) => s.step_name)}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 p-6 md:p-10 bg-[#f8f9fa] border-t border-gray-100">
            <div className="space-y-6 lg:col-span-9">
              <Card
                title="Product Listing Details"
                className="bg-white shadow-sm border border-gray-100"
              >
                <div className="space-y-6">
                  {!selectedProductId ? (
                    <>
                      {isRequestActionable && selectedProductIds.length > 0 && (
                        <div className="bg-white p-4 mb-4 rounded-xl shadow-lg border-2 border-[#C5A065]/30 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300 sticky top-40 z-20">
                          <div className="flex items-center gap-3">
                            <span className="bg-[#0F3D3E] text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm">
                              {selectedProductIds.length}
                            </span>
                            <p className="font-black text-[#0F3D3E] text-sm uppercase tracking-wide">
                              Selected
                            </p>
                          </div>

                          <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-3 items-center">
                            <div className="flex-1 w-full">
                              <input
                                type="text"
                                placeholder="Add comment regarding decision..."
                                defaultValue={bulkCommentRef.current}
                                onChange={(e) =>
                                  (bulkCommentRef.current = e.target.value)
                                }
                                className="w-full h-10 px-4 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#C5A065] focus:border-[#C5A065] outline-none shadow-inner"
                              />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                              <Button
                                size="sm"
                                onClick={() => setSelectedProductIds([])}
                                className="!bg-red-50 hover:!bg-red-100 !text-red-600 !border-red-200 flex-1 md:flex-none font-bold shadow-sm px-4 bg-none"
                                title="Unselect All"
                              >
                                <X size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline ml-2 font-bold text-red-600">
                                  Clear Selection
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => applyBulkStatus("approved")}
                                className="!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-600 flex-1 md:flex-none font-bold shadow-md shadow-emerald-900/10 px-4 bg-none"
                                title="Approve Selected"
                              >
                                <CheckCircle size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline ml-2">
                                  Approve
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  applyBulkStatus(
                                    "revision_required",
                                    bulkCommentRef.current,
                                  )
                                }
                                className="!bg-amber-500 hover:!bg-amber-600 !text-white !border-amber-500 flex-1 md:flex-none font-bold shadow-md shadow-amber-900/10 px-4 bg-none"
                                title="Request Revision"
                              >
                                <RotateCcw size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline ml-2">
                                  Revision
                                </span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  applyBulkStatus(
                                    "rejected",
                                    bulkCommentRef.current,
                                  )
                                }
                                className="!bg-red-600 hover:!bg-red-700 !text-white !border-red-600 flex-1 md:flex-none font-bold shadow-md shadow-red-900/10 px-4 bg-none"
                                title="Reject Selected"
                              >
                                <XCircle size={18} strokeWidth={2.5} />
                                <span className="hidden sm:inline ml-2">
                                  Reject
                                </span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="bg-[#0F3D3E] border-b border-gray-100 text-[10px] text-white uppercase tracking-widest font-black font-serif">
                              {isRequestActionable && (
                                <th className="p-4 w-10 text-center">
                                  <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={
                                      selectedProductIds.length > 0 &&
                                      selectedProductIds.length ===
                                        (isEditable
                                          ? editableProducts
                                          : products
                                        ).length
                                    }
                                    className="w-4 h-4 rounded border-gray-300 text-[#0F3D3E] focus:ring-[#C5A065]"
                                  />
                                </th>
                              )}
                              <th className="p-4 pl-6">Brand</th>
                              <th className="p-4">Product Name</th>
                              <th className="p-4 text-right">Cost Price</th>
                              <th className="p-4 text-right">Selling Price</th>
                              <th className="p-4 text-center">Margin</th>
                              <th className="p-4 text-center">Status</th>
                              <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {(isEditable && editableProducts.length > 0
                              ? editableProducts
                              : products
                            ).map((p) => {
                              // Generate persistent random color for brand using predefined palette for better readability
                              const brandColor = (() => {
                                const PALETTE = [
                                  "#b91c1c",
                                  "#c2410c",
                                  "#b45309",
                                  "#4d7c0f",
                                  "#15803d",
                                  "#0f766e",
                                  "#0369a1",
                                  "#1d4ed8",
                                  "#4338ca",
                                  "#6d28d9",
                                  "#a21caf",
                                  "#be185d",
                                  "#be123c",
                                  "#e11d48",
                                  "#0891b2",
                                  "#059669",
                                  "#d97706",
                                  "#ea580c",
                                ];
                                let hash = 0;
                                const str = p.brand || "";
                                for (let i = 0; i < str.length; i++) {
                                  hash =
                                    str.charCodeAt(i) + ((hash << 5) - hash);
                                }
                                return PALETTE[Math.abs(hash) % PALETTE.length];
                              })();

                              return (
                                <tr
                                  key={p.id}
                                  className={`transition-all duration-300 group cursor-pointer ${
                                    p.status === "approved"
                                      ? "bg-green-100/90 font-medium hover:bg-green-200"
                                      : p.status === "rejected"
                                        ? "bg-red-100/90 font-medium hover:bg-red-200"
                                        : p.status === "revision_required"
                                          ? "bg-yellow-100/90 font-medium hover:bg-yellow-200"
                                          : "hover:bg-gray-50"
                                  }`}
                                  style={{
                                    borderLeftWidth: p.status === "approved" || p.status === "rejected" || p.status === "revision_required" ? '6px' : '0px',
                                    borderLeftColor: p.status === "approved" ? '#22c55e' : p.status === "rejected" ? '#ef4444' : p.status === "revision_required" ? '#eab308' : 'transparent',
                                  }}
                                  onClick={() => setSelectedProductId(p.id)}
                                >
                                  {isRequestActionable && (
                                    <td
                                      className="p-4 text-center"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedProductIds.includes(
                                          p.id,
                                        )}
                                        onChange={(e) =>
                                          handleCheckboxChange(
                                            p.id,
                                            e.target.checked,
                                          )
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-[#0F3D3E] focus:ring-[#C5A065]"
                                      />
                                    </td>
                                  )}
                                  <td
                                    className="p-4 pl-6 font-black text-base tracking-wide"
                                    style={{ color: brandColor }}
                                  >
                                    {p.brand}
                                  </td>
                                  <td className="p-4 text-[#0F3D3E] font-medium">
                                    {p.product_name}
                                  </td>
                                  <td className="p-4 text-right font-mono font-bold text-rose-600">
                                    {p.currency}{" "}
                                    {Number(p.price_cost).toFixed(2)}
                                  </td>
                                  <td className="p-4 text-right font-mono font-bold text-emerald-600">
                                    {p.currency}{" "}
                                    {Number(p.price_retail).toFixed(2)}
                                  </td>
                                  <td className="p-4 text-center font-bold text-blue-600">
                                    {p.price_cost &&
                                    p.price_retail &&
                                    Number(p.price_retail) > 0
                                      ? (
                                          (1 -
                                            Number(p.price_cost) /
                                              Number(p.price_retail)) *
                                          100
                                        ).toFixed(2) + "%"
                                      : "-"}
                                  </td>
                                  <td className="p-4 text-center">
                                    {(() => {
                                      let status = p.status || "pending";

                                      // Override: Only confirm 'approved' status if workflow is completed or partially approved
                                      // Otherwise, it appears as 'Pending' to represent "Pending current Step Approval"
                                      // Unless the user is editing it (Active Approver)
                                      if (
                                        status === "approved" &&
                                        !isRequestActionable
                                      ) {
                                        const isFinal =
                                          currentRequest?.status ===
                                            "completed" ||
                                          currentRequest?.status ===
                                            "partially_approved" ||
                                          currentRequest?.status ===
                                            "approved_pending_erp";
                                        const hasItemCode =
                                          !!p.erp_item_code &&
                                          p.erp_item_code.trim().length > 0;

                                        if (!isFinal && !hasItemCode) {
                                          status = "pending";
                                        }
                                      }

                                      const statusMap = {
                                        pending: "Pending",
                                        approved: "Approved",
                                        rejected: "Rejected",
                                        revision_required: "Revision Request",
                                      };

                                      let statusColor =
                                        "bg-orange-50 text-orange-700"; // Pending
                                      if (status === "approved")
                                        statusColor =
                                          "bg-green-50 text-green-700";
                                      else if (status === "rejected")
                                        statusColor = "bg-red-50 text-red-700";
                                      else if (status === "revision_required")
                                        statusColor =
                                          "bg-amber-100 text-amber-800";

                                      return (
                                        <span
                                          className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm whitespace-nowrap ${statusColor}`}
                                        >
                                          {statusMap[status] || "Pending"}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="p-4 text-right pr-6">
                                    <Button
                                      size="sm"
                                      className="!px-3 !py-1 !text-[10px] font-bold bg-[#0F3D3E] text-white hover:bg-[#0F3D3E]/90 shadow-sm transition-all hover:scale-105"
                                      onClick={(e: any) => {
                                        e.stopPropagation();
                                        setSelectedProductId(p.id);
                                      }}
                                    >
                                      View{" "}
                                      <ChevronRight
                                        size={12}
                                        className="ml-1"
                                      />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                            {(isEditable && editableProducts.length > 0
                              ? editableProducts
                              : products
                            ).length === 0 && (
                              <tr>
                                <td
                                  colSpan={7}
                                  className="p-8 text-center text-gray-400 font-serif italic"
                                >
                                  No products available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <Button
                          className="h-10 px-4 rounded-xl text-sm font-bold bg-[#0F3D3E] !bg-none text-white hover:bg-[#0F3D3E]/90 hover:text-white border-none shadow-md"
                          onClick={() => setSelectedProductId(null)}
                        >
                          <ArrowLeft
                            size={16}
                            className="mr-2"
                            strokeWidth={3}
                          />{" "}
                          Back to List
                        </Button>
                      </div>
                      {(isEditable && editableProducts.length > 0
                        ? editableProducts
                        : products
                      )
                        .filter((p) => p.id === selectedProductId)
                        .map((p) => (
                          <div
                            key={p.id}
                            className={`p-8 bg-white rounded-2xl border shadow-sm transition-all ${isEditable ? "border-amber-400 ring-4 ring-amber-50" : "border-gray-100 hover:border-[#C5A065]/30"}`}
                          >
                            {/* Header Section */}
                            <div className="flex justify-between items-start mb-8 border-b border-gray-50 pb-6">
                              <div>
                                {/* Brand Name - Increased Size & Prominence */}
                                <div className="mb-3">
                                  <span className="text-base font-black text-white bg-[#0F3D3E] px-4 py-1.5 rounded-lg uppercase tracking-widest shadow-sm">
                                    {p.brand}
                                  </span>
                                </div>
                                {/* Product Name - Decreased Size */}
                                <h4 className="font-serif font-bold text-xl text-[#0F3D3E] leading-tight mb-1">
                                  {p.product_name}
                                </h4>
                                <p
                                  className="font-serif text-base text-[#0F3D3E]/80 mt-1"
                                  dir="rtl"
                                >
                                  {p.product_name_ar}
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-2xl font-black text-[#0F3D3E] block">
                                  {p.currency} {p.price_retail}
                                </span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                  Retail Price
                                </span>
                              </div>
                            </div>

                            {/* Product Hierarchy Selection */}
                            <div className="mb-10">
                              <h5 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-8 h-1 bg-[#0F3D3E] rounded-full"></span>
                                Product Hierarchy Selection
                              </h5>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-[#F0F4F4] p-6 rounded-2xl border border-gray-100">
                                {/* Division */}
                                <div>
                                  <p className="text-xs uppercase font-black text-[#C5A065] tracking-widest mb-2 shadow-sm">
                                    Division
                                  </p>
                                  <EditableField
                                    value={p.division}
                                    onChange={(val: any) =>
                                      handleProductChange(p.id, "division", val)
                                    }
                                    options={PRODUCT_HIERARCHY.map(
                                      (d) => d.name,
                                    ).filter((n) => n !== "Grand Total")}
                                    disabled={!isEditable}
                                  />
                                </div>

                                {/* Department */}
                                <div>
                                  <p className="text-xs uppercase font-black text-[#C5A065] tracking-widest mb-2 shadow-sm">
                                    Department
                                  </p>
                                  <EditableField
                                    value={p.department}
                                    onChange={(val: any) =>
                                      handleProductChange(
                                        p.id,
                                        "department",
                                        val,
                                      )
                                    }
                                    options={
                                      PRODUCT_HIERARCHY.find(
                                        (d) => d.name === p.division,
                                      )?.children?.map((c) => c.name) || []
                                    }
                                    disabled={!isEditable}
                                  />
                                </div>

                                {/* Category */}
                                <div>
                                  <p className="text-xs uppercase font-black text-[#C5A065] tracking-widest mb-2 shadow-sm">
                                    Category
                                  </p>
                                  <EditableField
                                    value={p.category}
                                    onChange={(val: any) =>
                                      handleProductChange(p.id, "category", val)
                                    }
                                    options={
                                      PRODUCT_HIERARCHY.find(
                                        (d) => d.name === p.division,
                                      )
                                        ?.children?.find(
                                          (d) => d.name === p.department,
                                        )
                                        ?.children?.map((c) => c.name) || []
                                    }
                                    disabled={!isEditable}
                                  />
                                </div>

                                {/* Sub Category */}
                                <div>
                                  <p className="text-xs uppercase font-black text-[#C5A065] tracking-widest mb-2 shadow-sm">
                                    Sub Category
                                  </p>
                                  <EditableField
                                    value={p.sub_category}
                                    onChange={(val: any) =>
                                      handleProductChange(
                                        p.id,
                                        "sub_category",
                                        val,
                                      )
                                    }
                                    options={
                                      PRODUCT_HIERARCHY.find(
                                        (d) => d.name === p.division,
                                      )
                                        ?.children?.find(
                                          (d) => d.name === p.department,
                                        )
                                        ?.children?.find(
                                          (c) => c.name === p.category,
                                        )
                                        ?.children?.map((s) => s.name) || []
                                    }
                                    disabled={!isEditable}
                                  />
                                </div>

                                {/* Class */}
                                <div>
                                  <p className="text-xs uppercase font-black text-[#C5A065] tracking-widest mb-2 shadow-sm">
                                    Class
                                  </p>
                                  <EditableField
                                    value={p.class_name}
                                    onChange={(val: any) =>
                                      handleProductChange(
                                        p.id,
                                        "class_name",
                                        val,
                                      )
                                    }
                                    options={
                                      PRODUCT_HIERARCHY.find(
                                        (d) => d.name === p.division,
                                      )
                                        ?.children?.find(
                                          (d) => d.name === p.department,
                                        )
                                        ?.children?.find(
                                          (c) => c.name === p.category,
                                        )
                                        ?.children?.find(
                                          (s) => s.name === p.sub_category,
                                        )
                                        ?.children?.map((cl) => cl.name) || []
                                    }
                                    disabled={!isEditable}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Pharmacy Listing Specifications */}
                            <div>
                              <h5 className="font-serif font-bold text-[#0F3D3E] text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
                                <span className="w-8 h-1 bg-[#C5A065] rounded-full"></span>
                                Pharmacy Listing Specifications
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-[2fr_3fr_3fr] gap-12">
                                {/* Column 1: Basic Information */}
                                <div className="space-y-6 border-r border-gray-50 md:pr-6">
                                  <h6 className="text-sm font-black text-[#C5A065] uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">
                                    Basic Information
                                  </h6>
                                  {renderEditableField(
                                    "Brand Name",
                                    "brand",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "English Description",
                                    "product_name",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Arabic Description",
                                    "product_name_ar",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "GTIN / Barcode",
                                    "barcode",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Manufacturer",
                                    "manufacturer",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Country of Origin",
                                    "country_of_origin",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Vendor System Code",
                                    "vendor_system_code",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Item Code",
                                    "erp_item_code",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Item Group",
                                    "item_group",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Item Sub Group",
                                    "item_sub_group",
                                    p,
                                  )}
                                </div>

                                {/* Column 2: Logistics & Supply */}
                                <div className="space-y-6 border-r border-gray-50 md:pr-6">
                                  <h6 className="text-sm font-black text-[#C5A065] uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">
                                    Logistics & Supply
                                  </h6>
                                  {renderEditableField(
                                    "Purchasing Status",
                                    "purchasing_status",
                                    p,
                                    "text",
                                    ["In-Stock", "Cross Docking", "DSD"],
                                  )}
                                  {renderEditableField(
                                    "Storage Condition",
                                    "storage_condition",
                                    p,
                                    "text",
                                    [
                                      "Room Temp (15-25C)",
                                      "Chilled (2-8C)",
                                      "Frozen (-18C)",
                                    ],
                                  )}
                                  <div className="grid grid-cols-2 gap-4">
                                    {renderEditableField(
                                      "Pack Size",
                                      "pack_size",
                                      p,
                                    )}
                                    {renderEditableField(
                                      "UoM",
                                      "uom",
                                      p,
                                      "text",
                                      ["Each", "Box", "Carton", "Bottle"],
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="w-full">
                                      <p className="text-xs uppercase font-black text-[#0F3D3E] tracking-widest mb-1 shadow-sm">
                                        Lot Tracked
                                      </p>
                                      <Select
                                        options={["Yes", "No"]}
                                        value={p.lot_indicator ? "Yes" : "No"}
                                        onChange={(e) =>
                                          handleProductChange(
                                            p.id,
                                            "lot_indicator",
                                            e.target.value === "Yes",
                                          )
                                        }
                                        disabled={!isEditable}
                                      />
                                    </div>
                                    <div className="w-full">
                                      <p className="text-xs uppercase font-black text-[#0F3D3E] tracking-widest mb-1 shadow-sm">
                                        RTV Allowed
                                      </p>
                                      <Select
                                        options={["Yes", "No"]}
                                        value={p.rtv_allowed ? "Yes" : "No"}
                                        onChange={(e) =>
                                          handleProductChange(
                                            p.id,
                                            "rtv_allowed",
                                            e.target.value === "Yes",
                                          )
                                        }
                                        disabled={!isEditable}
                                      />
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    {renderEditableField(
                                      "Case Count",
                                      "case_count",
                                      p,
                                      "number",
                                    )}
                                    {renderEditableField(
                                      "Inner Pack",
                                      "inner_pack_size",
                                      p,
                                    )}
                                  </div>
                                  {renderEditableField(
                                    "Primary Warehouse",
                                    "primary_warehouse",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Lead Time",
                                    "lead_time",
                                    p,
                                  )}
                                  {renderEditableField("Buyer", "buyer", p)}
                                  {renderEditableField(
                                    "Category Manager",
                                    "category_manager",
                                    p,
                                  )}
                                  {renderEditableField(
                                    "Vendor No",
                                    "vendor_no",
                                    p,
                                  )}
                                </div>

                                {/* Column 3: Commercial Terms */}
                                <div className="space-y-6">
                                  <h6 className="text-sm font-black text-[#C5A065] uppercase tracking-[0.2em] mb-4 border-b border-gray-50 pb-2">
                                    Commercial Terms
                                  </h6>
                                  <div className="grid grid-cols-2 gap-4">
                                    {renderEditableField(
                                      "Cost Price",
                                      "price_cost",
                                      p,
                                      "number",
                                    )}
                                    {renderEditableField(
                                      "Sales Price",
                                      "price_retail",
                                      p,
                                      "number",
                                    )}
                                  </div>
                                  <div className="bg-[#F0F4F4] p-3 rounded-lg border border-gray-100">
                                    <p className="text-[#0F3D3E] text-xs font-bold uppercase mb-1">
                                      Estimated Margin
                                    </p>
                                    <p className="text-xl font-black text-[#0F3D3E]">
                                      {p.price_cost &&
                                      p.price_retail &&
                                      Number(p.price_retail) > 0
                                        ? (
                                            (1 -
                                              Number(p.price_cost) /
                                                Number(p.price_retail)) *
                                            100
                                          ).toFixed(2) + "%"
                                        : "-"}
                                    </p>
                                  </div>
                                  {renderEditableField(
                                    "Currency",
                                    "currency",
                                    p,
                                    "text",
                                    ["SAR", "USD", "EUR"],
                                  )}
                                  {renderEditableField(
                                    "Product Listing Fees",
                                    "product_listing_fees",
                                    p,
                                  )}
                                  <div className="w-full">
                                    <p className="text-xs uppercase font-black text-[#0F3D3E] tracking-widest mb-1 shadow-sm">
                                      Taxable
                                    </p>
                                    <Select
                                      options={["Yes", "No"]}
                                      value={p.taxable ? "Yes" : "No"}
                                      onChange={(e) =>
                                        handleProductChange(
                                          p.id,
                                          "taxable",
                                          e.target.value === "Yes",
                                        )
                                      }
                                      disabled={!isEditable}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    {renderEditableField(
                                      "MOH Disc %",
                                      "moh_discount_percentage",
                                      p,
                                      "number",
                                    )}
                                    {renderEditableField(
                                      "Extra Disc %",
                                      "invoice_extra_discount",
                                      p,
                                      "number",
                                    )}
                                  </div>
                                  {renderEditableField(
                                    "Min Order Qty",
                                    "min_order_qty",
                                    p,
                                    "number",
                                  )}
                                  {renderEditableField(
                                    "Site Name / No",
                                    "site_name",
                                    p,
                                  )}
                                </div>
                              </div>

                              {/* Product Images */}
                              <div className="mt-8 pt-6 border-t border-gray-50">
                                <h6 className="text-[10px] font-black text-[#C5A065] uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <ImageIcon size={14} /> Product Images
                                </h6>
                                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                                  {[0, 1, 2, 3, 4, 5].map((idx) => {
                                    const images =
                                      p.images && p.images.length > 0
                                        ? p.images
                                        : Array(6).fill("");
                                    const img = images[idx];
                                    const loading =
                                      uploadingState[`${p.id}-img-${idx}`];

                                    return (
                                      <div key={idx} className="relative group">
                                        {img ? (
                                          <div className="relative border border-gray-200 rounded-lg overflow-hidden h-24 flex items-center justify-center bg-gray-50">
                                            <img
                                              src={img}
                                              alt={`Product ${idx + 1}`}
                                              className="max-h-full max-w-full object-contain"
                                            />
                                            {isEditable && (
                                              <button
                                                onClick={() =>
                                                  handleRemoveProductImage(
                                                    idx,
                                                    p.id,
                                                  )
                                                }
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                                              >
                                                <X size={10} />
                                              </button>
                                            )}
                                            <a
                                              href={img}
                                              target="_blank"
                                              className="absolute inset-0 z-0"
                                            />
                                          </div>
                                        ) : isEditable ? (
                                          <FileInput
                                            label={`Image ${idx + 1}`}
                                            className="!py-2 !px-1 !text-[10px]"
                                            loading={loading}
                                            onFileSelect={(f) =>
                                              handleProductImageUpload(
                                                f,
                                                idx,
                                                p.id,
                                              )
                                            }
                                            accept="image/*"
                                          />
                                        ) : (
                                          <div className="h-24 border border-dashed border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                                            <span className="text-[10px] text-gray-300 font-bold uppercase">
                                              No Image
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Product Approval Actions */}
                              {(isRequestActionable || p.status) && (
                                <div className="mt-8 pt-8 border-t-2 border-[#0F3D3E]">
                                  <h5 className="font-serif font-black text-[#0F3D3E] text-lg uppercase tracking-widest mb-6 flex items-center gap-2">
                                    Product Approval Decision
                                  </h5>

                                  <div className="bg-[#F8FAFA] p-6 rounded-2xl border border-gray-200 shadow-inner">
                                    <div className="flex flex-col md:flex-row gap-8">
                                      <div className="flex-1 space-y-4">
                                        <p className="text-xs font-black uppercase text-[#0F3D3E] tracking-widest mb-2">
                                          Status
                                        </p>
                                        <div className="flex gap-4">
                                          {(
                                            [
                                              "approved",
                                              "revision_required",
                                              "rejected",
                                            ] as const
                                          ).map((option) => (
                                            <label
                                              key={option}
                                              className={`
                                                      flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex-1 justify-center
                                                      ${
                                                        p.status === option
                                                          ? option ===
                                                            "approved"
                                                            ? "bg-emerald-50 border-emerald-600"
                                                            : option ===
                                                                "revision_required"
                                                              ? "bg-amber-50 border-amber-600"
                                                              : "bg-red-50 border-red-600"
                                                          : "border-gray-200 hover:border-[#0F3D3E]"
                                                      }
                                                   `}
                                            >
                                              <input
                                                type="radio"
                                                name={`status-${p.id}`}
                                                checked={p.status === option}
                                                onChange={() => {
                                                  if (isRequestActionable) {
                                                    // Optimistic update
                                                    const updatedProducts = (
                                                      isEditable
                                                        ? editableProducts
                                                        : products
                                                    ).map((prod) =>
                                                      prod.id === p.id
                                                        ? {
                                                            ...prod,
                                                            status: option,
                                                          }
                                                        : prod,
                                                    );
                                                    setProducts((prev) =>
                                                      prev.map((prod) =>
                                                        prod.id === p.id
                                                          ? {
                                                              ...prod,
                                                              status: option,
                                                            }
                                                          : prod,
                                                      ),
                                                    ); // Update main state too if separated
                                                    // Fix: Also update editableProducts which might be used later in processWorkflowAction
                                                    setEditableProducts(
                                                      (prev) =>
                                                        prev.map((prod) =>
                                                          prod.id === p.id
                                                            ? {
                                                                ...prod,
                                                                status: option,
                                                              }
                                                            : prod,
                                                        ),
                                                    );

                                                    // Async Save
                                                    db.updateProduct(p.id, {
                                                      status: option,
                                                    });
                                                  }
                                                }}
                                                className={`w-4 h-4 ${
                                                  option === "approved"
                                                    ? "accent-emerald-600"
                                                    : option ===
                                                        "revision_required"
                                                      ? "accent-amber-600"
                                                      : "accent-red-600"
                                                }`}
                                                disabled={!isRequestActionable}
                                              />
                                              <span
                                                className={`font-bold uppercase text-xs tracking-wider
                                                           ${option === "approved" ? "text-emerald-800" : ""}
                                                           ${option === "revision_required" ? "text-amber-800" : ""}
                                                           ${option === "rejected" ? "text-red-800" : ""}
                                                       `}
                                              >
                                                {option === "revision_required"
                                                  ? "Revision"
                                                  : option}
                                              </span>
                                            </label>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="flex-[2]">
                                        <p className="text-xs font-black uppercase text-[#0F3D3E] tracking-widest mb-2">
                                          {p.status === "revision_required"
                                            ? "Correction Instructions"
                                            : p.status === "rejected"
                                              ? "Rejection Reason"
                                              : "Comments"}
                                        </p>
                                        <SafeTextArea
                                          className="w-full h-24 p-4 rounded-xl border-2 border-gray-200 text-sm focus:border-[#C5A065] focus:ring-0 transition-colors resize-none disabled:bg-gray-100 disabled:text-gray-500"
                                          placeholder="Add specific comments for this product..."
                                          value={p.rejection_reason || ""}
                                          onChange={() => {}} // Optimized: Don't update parent state on every keystroke to prevent re-renders
                                          onBlur={(e: any) => {
                                            const newReason = e.target.value;
                                            // Update state and DB on blur only
                                            setProducts((prev) =>
                                              prev.map((prod) =>
                                                prod.id === p.id
                                                  ? {
                                                      ...prod,
                                                      rejection_reason:
                                                        newReason,
                                                    }
                                                  : prod,
                                              ),
                                            );
                                            setEditableProducts((prev) =>
                                              prev.map((prod) =>
                                                prod.id === p.id
                                                  ? {
                                                      ...prod,
                                                      rejection_reason:
                                                        newReason,
                                                    }
                                                  : prod,
                                              ),
                                            );

                                            if (isRequestActionable) {
                                              db.updateProduct(p.id, {
                                                rejection_reason: newReason,
                                              });
                                            }
                                          }}
                                          disabled={!isRequestActionable}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </Card>







              {/* Action Buttons only for actionable users */}
              {isRequestActionable && (
                <Card
                  title="Review Actions"
                  className="bg-[#0F3D3E] text-white border-none shadow-xl shadow-[#0F3D3E]/30"
                  noPadding={true}
                >
                  <div className="space-y-2 p-2 sm:p-4">
                    <div className="bg-white/10 p-2 sm:p-3 rounded-lg mb-2 text-sm font-light">
                      <p className="mb-2 font-bold text-[#C5A065]">
                        Review Summary:
                      </p>
                      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs w-full mt-2">
                        <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-white font-bold tracking-wider">
                            Approved:
                          </span>
                          <span className="text-white font-black text-sm">
                            {
                              products.filter(p => p.request_id === currentRequest?.id).filter((p) => p.status === "approved")
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-500 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-white font-bold tracking-wider">
                            Revision:
                          </span>
                          <span className="text-white font-black text-sm">
                            {
                              products.filter(p => p.request_id === currentRequest?.id).filter(
                                (p) => p.status === "revision_required",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-white font-bold tracking-wider">
                            Rejected:
                          </span>
                          <span className="text-white font-black text-sm">
                            {
                              products.filter(p => p.request_id === currentRequest?.id).filter((p) => p.status === "rejected")
                                .length
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2 bg-orange-500 px-3 py-1.5 rounded-lg border border-white/5">
                          <span className="text-white font-bold tracking-wider">
                            Pending:
                          </span>
                          <span className="text-white font-black text-sm">
                            {
                              products.filter(p => p.request_id === currentRequest?.id).filter(
                                (p) => !p.status || p.status === "pending",
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full h-14 bg-white text-[#0F3D3E] hover:bg-[#C5A065] hover:text-white border-none rounded-xl font-bold uppercase tracking-widest transition-colors duration-300"
                      onClick={() => {
                        // Determine action automatically based on products
                        const pendingCount = products.filter(p => p.request_id === currentRequest?.id).filter(
                          (p) => !p.status || p.status === "pending",
                        ).length;
                        if (pendingCount > 0) {
                          alert(
                            `Please set a status for all products before submitting. (${pendingCount} pending)`,
                          );
                          return;
                        }

                        const hasRevision = products.filter(p => p.request_id === currentRequest?.id).some(
                          (p) => p.status === "revision_required",
                        );
                        const allRejected = products.filter(p => p.request_id === currentRequest?.id).every(
                          (p) => p.status === "rejected",
                        );

                        // If any item needs revision, the whole request goes back for revision
                        // If all items are rejected, the request is rejected
                        // Otherwise (all approved, or mix of approved/rejected), we proceed
                        const derivedAction = hasRevision
                          ? "return"
                          : allRejected
                            ? "reject"
                            : "approve";

                        setActionType(derivedAction);
                        setIsActionModalOpen(true);
                      }}
                    >
                      Submit Decision
                    </Button>
                  </div>
                </Card>
              )}
              {/* Vendor Documents Card - Visible to all Staff and Vendors */}
              {currentRequest?.vendor && (
                <>
                  {activePortal === "employee" && (
                    <div className="flex justify-end mb-2">
                      <Button
                        className="bg-[#0F3D3E] text-white"
                        onClick={() => {
                          setEditableVendor(currentRequest.vendor);
                          setIsVendorModalOpen(true);
                        }}
                      >
                        <UserCheck size={16} className="mr-2" /> Edit Vendor
                        Registration Details
                      </Button>
                    </div>
                  )}

                  <Modal
                    isOpen={isVendorModalOpen}
                    onClose={() => setIsVendorModalOpen(false)}
                    title="Edit Vendor Registration Details"
                  >
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                      <NewVendorForm
                        currentVendor={editableVendor}
                        onChange={(updates) =>
                          setEditableVendor((prev) => ({ ...prev, ...updates }))
                        }
                        userRole={currentUserEmployee?.role}
                      />
                    </div>
                    <div className="p-4 border-t flex justify-end gap-2 bg-gray-50">
                      <Button
                        variant="ghost"
                        onClick={() => setIsVendorModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveVendorDetails}
                        className="bg-[#0F3D3E] text-white"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </Modal>

                  <Card
                    title="Vendor Compliance Documents & Attachments"
                    className="bg-white shadow-sm border border-gray-100"
                  >
                    <div className="space-y-4">
                      {[
                        {
                          label: "Commercial Registration (CR)",
                          key: "cr_document_url",
                        },
                        {
                          label: "VAT Certificate",
                          key: "vat_certificate_url",
                        },
                        {
                          label: "Bank Certificate",
                          key: "bank_certificate_url",
                        },
                        {
                          label: "Product Catalog / Portfolio",
                          key: "catalog_url",
                        },
                        {
                          label: "Guarantee Letter",
                          key: "guarantee_letter_url",
                        },
                        {
                          label: "Non-Refundable Listing Fees",
                          key: "listing_fees_document_url",
                        },
                        {
                          label: "Other Supporting Documents",
                          key: "other_documents_url",
                        },
                      ].map((doc) => {
                        const targetVendor =
                          activePortal === "vendor"
                            ? currentVendor
                            : currentRequest?.vendor;
                        const isVendorEditing =
                          activePortal === "vendor" && isEditable;
                        const url =
                          isVendorEditing && editableVendor[doc.key]
                            ? editableVendor[doc.key]
                            : targetVendor?.[doc.key];

                        return (
                          <div
                            key={doc.key}
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-lg border border-gray-100 gap-3"
                          >
                            <div>
                              <p className="font-bold text-[#0F3D3E] text-sm">
                                {doc.label}
                              </p>
                              {/* Status indicator */}
                              {url ? (
                                <p className="text-[10px] text-green-600 font-bold flex items-center gap-1">
                                  <CheckCircle size={10} /> Available
                                </p>
                              ) : (
                                <p className="text-[10px] text-gray-400 font-bold">
                                  Not Uploaded
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              {isVendorEditing ? (
                                <div className="w-full sm:w-auto">
                                  {/* Upload Button for Vendor Correction */}
                                  <FileInput
                                    label=""
                                    className="!py-2 !px-3 !text-xs !bg-white"
                                    loading={uploadingState[doc.key]}
                                    onFileSelect={(f) =>
                                      handleVendorUpload(f, doc.key)
                                    }
                                  />
                                  {url && (
                                    <a
                                      href={url}
                                      target="_blank"
                                      className="text-[10px] text-[#0F3D3E] underline mt-1 block text-right"
                                    >
                                      View Current
                                    </a>
                                  )}
                                </div>
                              ) : (
                                url && (
                                  <a
                                    href={url}
                                    target="_blank"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#0F3D3E] text-white rounded-lg text-xs font-bold hover:bg-[#0F3D3E]/90 transition-colors"
                                  >
                                    <Download size={14} /> Download
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </>
              )}
            </div>
            <div className="space-y-8 lg:col-span-3">
              {/* Decision History is visible to everyone within the context of a Request */}
              <Card
                title="Audit Log & Decision History"
                className="bg-white shadow-sm border border-gray-100"
              >
                <div className="space-y-8 pl-2">
                  {actions.map((a) => (
                    <div
                      key={a.id}
                      className="relative pl-8 border-l pb-2 border-[#C5A065]/30 last:border-0 last:pb-0"
                    >
                      <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-[#C5A065] ring-4 ring-white" />
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs font-black uppercase text-[#0F3D3E] tracking-widest">
                          {a.action} Action
                        </p>
                        <span className="text-[10px] font-bold text-[#C5A065] bg-amber-50 px-2 py-0.5 rounded-full">
                          {new Date(a.action_at).toLocaleString("en-US", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#0F3D3E]/60 font-bold">
                        by{" "}
                        <span className="text-[#0F3D3E]">{a.actor_name}</span>
                        {a.actor_role && (
                          <span className="block mt-0.5 text-[#C5A065] uppercase tracking-wider text-[9px]">
                            {ROLE_LABELS[a.actor_role as EmployeeRole] ||
                              a.actor_role.replace(/_/g, " ")}
                          </span>
                        )}
                        {/* Check for Delegation: Match step requirement vs actual actor */}
                        {(() => {
                          const stepDef = MOCK_STEPS.find(
                            (s) => s.step_number === a.step_number,
                          );
                          const requiredRole = stepDef?.role_required;
                          const isDelegated =
                            requiredRole &&
                            a.actor_role &&
                            requiredRole !== a.actor_role &&
                            a.actor_role !== "super_admin" &&
                            a.actor_role !== "vendor";

                          if (isDelegated) {
                            return (
                              <span className="block mt-0.5 text-purple-600 bg-purple-50 px-2 py-0.5 rounded w-fit font-bold uppercase tracking-wider text-[8px] border border-purple-100">
                                Acting as Delegatee
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </p>
                      {a.comment && (
                        <div className="mt-4 p-5 bg-[#F0F4F4] rounded-tr-2xl rounded-br-2xl rounded-bl-2xl border border-gray-100 text-sm italic text-[#0F3D3E]/80 leading-relaxed font-serif relative">
                          <span className="absolute -top-3 -left-1 text-4xl text-[#C5A065] opacity-30 font-serif">
                            "
                          </span>
                          {a.comment}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  if (!isAuthenticated) {
    if (activePortal === "vendor") {
      return (
        <div className="min-h-screen w-full bg-[#0F3D3E] flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 flex flex-col my-auto">
            <div className="text-center mb-6 shrink-0 mt-4">
              {/* Logo Container: Responsive width for mobile */}
              <div className="inline-flex items-center justify-center w-full max-w-[85%] md:w-[28rem] h-24 md:h-28 bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] mb-8 ring-4 ring-[#C5A065] ring-offset-4 ring-offset-[#0F3D3E] p-4 mx-auto">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tight mb-3 drop-shadow-lg">
                Vendor Portal
              </h1>
              <p className="text-[#C5A065] font-bold uppercase tracking-[0.3em] text-[10px] text-shadow-sm flex items-center justify-center gap-4">
                <span className="w-6 h-[2px] bg-[#C5A065] opacity-50"></span>
                Al Habib Pharmacy
                <span className="w-6 h-[2px] bg-[#C5A065] opacity-50"></span>
              </p>
            </div>
            <Card className="!p-0 border-0 shadow-2xl overflow-hidden rounded-[1.5rem] shrink-0">
              {showEmailConfirmation ? (
                <div className="p-10 text-center space-y-6">
                  <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                    <Mail size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-[#0F3D3E]">
                      Verify Your Email
                    </h3>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                      We've sent a confirmation link to{" "}
                      <span className="font-bold text-[#0F3D3E]">
                        {authForm.email}
                      </span>
                      . Please check your inbox to activate your account.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setShowEmailConfirmation(false);
                      setAuthMode("login");
                    }}
                    className="w-full bg-[#0F3D3E] text-white"
                  >
                    Back to Login
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex border-b border-gray-100 p-1">
                    <button
                      onClick={() => setAuthMode("login")}
                      className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === "login" ? "text-[#0F3D3E] bg-[#F0F4F4] shadow-inner" : "text-gray-400 hover:text-[#0F3D3E]"}`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => setAuthMode("signup")}
                      className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${authMode === "signup" ? "text-[#0F3D3E] bg-[#F0F4F4] shadow-inner" : "text-gray-400 hover:text-[#0F3D3E]"}`}
                    >
                      Register
                    </button>
                  </div>
                  <form onSubmit={handleAuthSubmit} className="p-8 space-y-6">
                    {authError && (
                      <div className="p-3 bg-red-50 border-l-4 border-red-500 text-[10px] font-bold text-red-700 rounded-lg">
                        {authError}
                      </div>
                    )}

                    <div className="space-y-4">
                      {authMode === "signup" && (
                        <>
                          {/* Vendor Type Selection */}
                          <div className="flex flex-col gap-2 mb-2">
                            <label className="text-[10px] font-bold text-[#0F3D3E] uppercase tracking-wider ml-1">
                              Classification
                            </label>
                            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100">
                              <button
                                type="button"
                                onClick={() =>
                                  setAuthForm({
                                    ...authForm,
                                    vendorType: "new",
                                  })
                                }
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${authForm.vendorType === "new" ? "bg-[#0F3D3E] text-white shadow-md" : "text-gray-400 hover:text-[#0F3D3E]"}`}
                              >
                                New Vendor
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setAuthForm({
                                    ...authForm,
                                    vendorType: "existing",
                                  })
                                }
                                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${authForm.vendorType === "existing" ? "bg-[#0F3D3E] text-white shadow-md" : "text-gray-400 hover:text-[#0F3D3E]"}`}
                              >
                                Existing Vendor
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              className="!py-3 !text-xs"
                              label="Account User Name"
                              value={authForm.fullName}
                              onChange={(e) =>
                                setAuthForm({
                                  ...authForm,
                                  fullName: e.target.value,
                                })
                              }
                              required
                            />
                            <Input
                              className="!py-3 !text-xs"
                              label="Company"
                              value={authForm.companyName}
                              onChange={(e) =>
                                setAuthForm({
                                  ...authForm,
                                  companyName: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              className="!py-3 !text-xs"
                              label="Contact Person Name"
                              value={authForm.contactPerson}
                              onChange={(e) =>
                                setAuthForm({
                                  ...authForm,
                                  contactPerson: e.target.value,
                                })
                              }
                              required
                            />
                            <Input
                              className="!py-3 !text-xs"
                              label="Contact Mobile"
                              placeholder="05XXXXXXXX"
                              value={authForm.mobile}
                              onChange={(e) =>
                                setAuthForm({
                                  ...authForm,
                                  mobile: e.target.value,
                                })
                              }
                              required
                            />
                          </div>
                        </>
                      )}
                      <Input
                        className="!py-3 !text-xs"
                        label="Email"
                        type="email"
                        value={authForm.email}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, email: e.target.value })
                        }
                        required
                      />
                      <Input
                        className="!py-3 !text-xs"
                        label="Password"
                        type="password"
                        value={authForm.password}
                        onChange={(e) =>
                          setAuthForm({ ...authForm, password: e.target.value })
                        }
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isSigningIn}
                      className={`w-full h-14 text-sm rounded-xl bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 shadow-xl text-white border-none mt-4 transition-all duration-500 relative overflow-hidden group !disabled:opacity-100 disabled:!opacity-100 ${isSigningIn ? "rotate-180 cursor-default pointer-events-none" : "hover:scale-[1.02] active:scale-[0.98]"}`}
                    >
                      <div
                        className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-300 ${isSigningIn ? "opacity-0" : "opacity-100"}`}
                      >
                        <span className="inline-block transition-transform duration-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                          {authMode === "login"
                            ? "Access Vendor Portal"
                            : "Create Account"}
                        </span>
                        <ArrowRight
                          size={18}
                          strokeWidth={3}
                          className="transition-transform duration-500 ml-2"
                        />
                      </div>

                      <div
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSigningIn ? "opacity-100" : "opacity-0"}`}
                      >
                        <span className="inline-block rotate-180 font-black text-xs md:text-sm tracking-widest text-[#E6D780] uppercase text-center px-1 leading-snug shadow-none drop-shadow-none antialiased decoration-0">
                          Welcome to Al Habib
                          <br />
                          Pharmacy Coding Portal
                        </span>
                      </div>
                    </Button>
                    <div className="pt-4 border-t border-gray-100 text-center">
                      <button
                        type="button"
                        onClick={() => navigate("/staff")}
                        className="w-full px-6 py-4 rounded-xl bg-[#C5A065] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#b08d55] transition-colors shadow-lg"
                      >
                        Access Staff Portal Instead
                      </button>
                    </div>
                  </form>
                </>
              )}
            </Card>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen w-full bg-[#0F3D3E] flex items-center justify-center p-4 font-sans overflow-y-auto">
          <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-700 flex flex-col my-auto">
            <div className="text-center mb-6 shrink-0 mt-4">
              {/* Logo Container: Responsive width for mobile - STYLED SAME AS VENDOR PORTAL */}
              <div className="inline-flex items-center justify-center w-full max-w-[85%] md:w-[28rem] h-24 md:h-28 bg-white rounded-[2rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] mb-8 ring-4 ring-[#C5A065] ring-offset-4 ring-offset-[#0F3D3E] p-4 mx-auto">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-serif font-black text-white tracking-tight mb-3 drop-shadow-lg">
                Staff Portal
              </h1>
              <p className="text-[#C5A065] font-bold uppercase tracking-[0.3em] text-[10px] text-shadow-sm flex items-center justify-center gap-4">
                <span className="w-6 h-[2px] bg-[#C5A065] opacity-50"></span>
                Internal Access Only
                <span className="w-6 h-[2px] bg-[#C5A065] opacity-50"></span>
              </p>
            </div>

            <Card className="!p-0 border-0 shadow-2xl overflow-hidden rounded-[1.5rem] shrink-0">
              <div className="bg-[#F0F4F4] p-4 text-center border-b border-gray-100">
                <p className="text-[10px] uppercase font-black text-[#0F3D3E] tracking-widest">
                  Secure Workspace Access
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="p-8 space-y-6">
                {authError && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-500 text-[10px] font-bold text-red-700 rounded-lg">
                    {authError}
                  </div>
                )}

                <div className="space-y-4">
                  <Input
                    className="!py-3 !text-xs"
                    label="Corporate Email"
                    placeholder="username@habib.com"
                    value={authForm.email}
                    onChange={(e) => {
                      setAuthForm({ ...authForm, email: e.target.value });
                      // Ensure we are in login mode (Staff never sign up here)
                      if (authMode !== "login") setAuthMode("login");
                    }}
                    required
                  />
                  <Input
                    className="!py-3 !text-xs"
                    label="Password"
                    type="password"
                    value={authForm.password}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, password: e.target.value })
                    }
                    placeholder="••••••••"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSigningIn}
                  className={`w-full h-14 text-sm rounded-xl bg-[#0F3D3E] hover:bg-[#0F3D3E]/90 shadow-xl text-white border-none mt-4 transition-all duration-500 relative overflow-hidden group !disabled:opacity-100 disabled:!opacity-100 ${isSigningIn ? "rotate-180 cursor-default pointer-events-none" : "hover:scale-[1.02] active:scale-[0.98]"}`}
                >
                  <div
                    className={`absolute inset-0 flex items-center justify-center gap-2 transition-opacity duration-300 ${isSigningIn ? "opacity-0" : "opacity-100"}`}
                  >
                    <span className="inline-block transition-transform duration-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                      Sign In Securely
                    </span>
                    <ArrowRight
                      size={18}
                      strokeWidth={3}
                      className="transition-transform duration-500 ml-2"
                    />
                  </div>

                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${isSigningIn ? "opacity-100" : "opacity-0"}`}
                  >
                    <span className="inline-block rotate-180 font-black text-xs md:text-sm tracking-widest text-[#E6D780] uppercase text-center px-1 leading-snug shadow-none drop-shadow-none antialiased decoration-0">
                      Welcome to Al Habib
                      <br />
                      Pharmacy Coding Portal
                    </span>
                  </div>
                </Button>

                <div className="pt-4 border-t border-gray-100 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      navigate("/");
                      setAuthMode("login"); // Reset to login when switching back to vendor default
                    }}
                    className="w-full px-6 py-4 rounded-xl bg-[#C5A065] text-white text-sm font-bold uppercase tracking-wider hover:bg-[#b08d55] transition-colors shadow-lg"
                  >
                    Switch to Vendor Portal
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      );
    }
  }

  const Preferences = () => (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">
            Preferences
          </h2>
          <p className="text-[#C5A065] text-sm font-bold tracking-wide">
            Manage your account settings and security
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Security Settings" className="h-fit">
          <div className="space-y-6 pt-2">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="bg-[#0F3D3E] p-3 rounded-full text-white">
                <Lock size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wider">
                  Password Last Changed
                </p>
                <p className="font-bold text-[#0F3D3E]">
                  Just now (Session Active)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-serif font-bold text-[#0F3D3E]">
                Change Password
              </h4>
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
              />
              <Input
                label="Confirm New Password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
              />

              {passwordChangeError && (
                <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg">
                  {passwordChangeError}
                </div>
              )}

              <Button
                className="w-full bg-[#0F3D3E] text-white h-12"
                onClick={handlePasswordChange}
              >
                Update Password
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Profile Information" className="h-fit opacity-60">
          <div className="space-y-4 pt-2">
            <Input
              label="Full Name"
              value={currentUserProfile?.full_name || ""}
              disabled
            />
            <Input
              label="Email Address"
              value={currentUserProfile?.email || ""}
              disabled
            />
            <Input
              label="Role"
              value={currentUserProfile?.role || ""}
              disabled
            />
            <p className="text-[10px] text-gray-400 italic">
              Contact your administrator to update profile details.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );

  const AuditLog = () => {
    // Current user's audit log
    // MOVED LOGIC to render body to avoid React Hook Conditional Execution Error
    let myActions = actions;
    if (activePortal === "vendor") {
      const myRequestIds = requests
        .filter(
          (r) =>
            (currentVendor && r.vendor_id === currentVendor.id) ||
            r.vendor_id === currentUserProfile?.id,
        )
        .map((r) => r.id);
      myActions = actions.filter((a) => myRequestIds.includes(a.request_id));
    }

    return (
      <div className="space-y-10 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-6 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-black text-[#0F3D3E] tracking-tight mb-2">
              Audit Log
            </h2>
            <p className="text-[#C5A065] text-sm font-bold tracking-wide">
              System-wide activity and changes
            </p>
          </div>
        </div>
        <Card title="Recent Activity">
          <div className="space-y-4">
            {myActions.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                No activity recorded yet
              </div>
            ) : (
              myActions.map((a) => (
                <div
                  key={a.id}
                  className="p-4 border border-gray-100 rounded-xl hover:bg-[#F0F4F4] transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[#0F3D3E]">
                        {a.action} Action
                      </p>
                      <p className="text-sm text-gray-500">by {a.actor_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Request ID:{" "}
                        {requests.find((r) => r.id === a.request_id)
                          ?.request_number || "Unknown"}
                      </p>
                    </div>
                    <span className="text-xs font-mono text-gray-400">
                      {formatKSA(a.action_at)}
                    </span>
                  </div>
                  {a.comment && (
                    <div className="mt-2 text-sm italic text-gray-600 bg-white p-2 rounded border border-gray-50">
                      {a.comment}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfdfc] flex flex-col font-sans text-gray-900">
      <Header />
      <div className="flex flex-1 relative">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity top-24"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`
            fixed top-24 bottom-0 left-0 z-40 bg-white border-r border-gray-100 flex flex-col transition-all duration-300 overflow-y-auto
            md:sticky md:top-60 md:h-[calc(100vh-15rem)] md:bottom-auto
            ${isSidebarOpen ? "translate-x-0 w-80 shadow-2xl md:shadow-none" : "-translate-x-full md:translate-x-0 w-80 md:w-24"}
        `}
        >
          <div className="p-4 md:p-6 flex flex-col gap-3">
            {activePortal === "employee" &&
            currentUserEmployee?.role === "e_commerce_admin" ? (
              <>
                <p
                  className={`px-4 text-[10px] font-black text-[#0F3D3E] uppercase tracking-widest ${!isSidebarOpen ? "md:hidden" : ""}`}
                >
                  E-Commerce
                </p>
                <SidebarItem
                  icon={Layers}
                  label="Item Master Assignment"
                  active={view === "item_master"}
                  onClick={() => {
                    setView("item_master");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
                <SidebarItem
                  icon={Download}
                  label="Products Export"
                  active={view === "ecommerce_export"}
                  onClick={() => {
                    setView("ecommerce_export");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
                <SidebarItem
                  icon={FileText}
                  label="Modifications Report"
                  active={view === "existing_modifications_report"}
                  onClick={() => {
                    setView("existing_modifications_report");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
                <SidebarItem
                  icon={Settings}
                  label="Preferences"
                  active={view === "preferences"}
                  onClick={() => {
                    setView("preferences");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
              </>
            ) : (
              <>
                <p
                  className={`px-4 text-[10px] font-black text-[#0F3D3E] uppercase tracking-widest ${!isSidebarOpen ? "md:hidden" : ""}`}
                >
                  General
                </p>
                <SidebarItem
                  icon={LayoutDashboard}
                  label="Main Hub"
                  active={view === "dashboard"}
                  onClick={() => {
                    setView("dashboard");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
                {activePortal === "vendor" && (
                  <SidebarItem
                    icon={Building2}
                    label="Company Profile"
                    active={view === "vendor_profile"}
                    onClick={() => {
                      setView("vendor_profile");
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    collapsed={!isSidebarOpen}
                  />
                )}
                {activePortal === "employee" && (
                  <SidebarItem
                    icon={Briefcase}
                    label="Task Inbox"
                    active={view === "employee_inbox"}
                    onClick={() => {
                      setView("employee_inbox");
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    collapsed={!isSidebarOpen}
                  />
                )}
                {activePortal === "employee" &&
                  currentUserEmployee?.role === "super_admin" && (
                    <>
                      <SidebarItem
                        icon={Users}
                        label="Access Management"
                        active={view === "admin_staff"}
                        onClick={() => {
                          setView("admin_staff");
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        collapsed={!isSidebarOpen}
                      />
                      <SidebarItem
                        icon={FileText}
                        label="Master Reports"
                        active={view === "reports"}
                        onClick={() => {
                          setView("reports");
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        collapsed={!isSidebarOpen}
                      />
                      <SidebarItem
                        icon={Layers}
                        label="Item Master Assignment"
                        active={view === "item_master"}
                        onClick={() => {
                          setView("item_master");
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        collapsed={!isSidebarOpen}
                      />
                      <SidebarItem
                        icon={Download}
                        label="Products Export"
                        active={view === "ecommerce_export"}
                        onClick={() => {
                          setView("ecommerce_export");
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        collapsed={!isSidebarOpen}
                      />
                    </>
                  )}
                {activePortal === "employee" &&
                  (currentUserEmployee?.role === "super_admin" ||
                    currentUserEmployee?.role === "e_commerce_admin") && (
                    <SidebarItem
                      icon={FileText}
                      label="Modifications Report"
                      active={view === "existing_modifications_report"}
                      onClick={() => {
                        setView("existing_modifications_report");
                        if (window.innerWidth < 768) setIsSidebarOpen(false);
                      }}
                      collapsed={!isSidebarOpen}
                    />
                  )}
                {activePortal === "vendor" && (
                  <SidebarItem
                    icon={ClipboardList}
                    label="Audit Log"
                    active={view === "audit_log"}
                    onClick={() => {
                      setView("audit_log");
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    collapsed={!isSidebarOpen}
                  />
                )}
                <SidebarItem
                  icon={Settings}
                  label="Preferences"
                  active={view === "preferences"}
                  onClick={() => {
                    setView("preferences");
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  collapsed={!isSidebarOpen}
                />
              </>
            )}
          </div>
        </aside>
        <main className="flex-1 p-4 md:p-8 lg:p-14 w-full h-auto">
          {view === "dashboard" && Dashboard()}
          {view === "vendor_profile" && <VendorProfile />}
          {view === "request_details" && <RequestDetails />}
          {view === "new_request" && NewRequestWizard()}
          {view === "admin_staff" && <StaffManagement />}
          {view === "reports" && <Reports />}
          {view === "employee_inbox" && Dashboard()}
          {view === "audit_log" && AuditLog()}
          {view === "preferences" && Preferences()}
          {view === "ecommerce_export" && <EcommerceExport />}
          {view === "item_master" && (
            <ItemMasterAssignment
              user={currentUserProfile}
              onClose={() => setView("dashboard")}
            />
          )}
          {view === "existing_product_modification" && (
            <ExistingProductModification
              user={currentUserProfile}
              vendorId={currentVendor?.id}
              onCancel={() => setView("dashboard")}
              onSuccess={() => setView("dashboard")}
            />
          )}
          {view === "existing_modifications_report" && (
            <ExistingModificationsReport />
          )}
        </main>
      </div>
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        title="Audit Review Decision"
      >
        <div className="space-y-6">
          <p className="text-sm font-medium text-gray-600">
            Executing{" "}
            <span className="font-bold font-serif text-[#0F3D3E] uppercase">
              {actionType}
            </span>{" "}
            on this request. Please provide the professional rationale below.
          </p>
          <textarea
            className="w-full p-4 rounded-2xl border border-gray-200 bg-[#F0F4F4]/50 h-32 text-sm outline-none focus:ring-4 focus:ring-[#C5A065]/10 focus:border-[#C5A065]"
            placeholder="Rationale..."
            value={actionComment}
            onChange={(e) => setActionComment(e.target.value)}
          />
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsActionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant={actionType === "approve" ? "primary" : "danger"}
              onClick={processWorkflowAction}
              disabled={!actionComment.trim()}
            >
              Confirm Decision
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => {}}
        title="Change Temporary Password"
      >
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-900 rounded-r-lg text-sm">
            <p className="font-bold flex items-center gap-2">
              <Lock size={16} /> Security Update Required
            </p>
            <p className="mt-1 opacity-90">
              You are using a temporary password. Please set a new, secure
              password to continue accessing the Staff Portal.
            </p>
          </div>

          <div className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New secure password"
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder="Repeat new password"
            />

            <div className="text-xs text-gray-400 pl-1 list-disc">
              <li>At least 6 characters</li>
              <li>Different from temporary password</li>
            </div>
          </div>

          {passwordChangeError && (
            <div className="text-xs font-bold text-red-600 bg-red-50 p-3 rounded-lg">
              {passwordChangeError}
            </div>
          )}

          <Button
            className="w-full h-12 bg-[#0F3D3E] text-white"
            onClick={handlePasswordChange}
          >
            Update Password & Login
          </Button>
        </div>
      </Modal>

      {/* --- NEW EMAIL ACTION MODAL --- */}
    </div>
  );
};

export default App;
