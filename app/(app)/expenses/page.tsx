"use client";

import { useMemo, useState } from "react";
import { 
  Fuel, Wrench, Banknote, Receipt, Plus, Download, Calendar as CalendarIcon,
  ChevronDown, MoreHorizontal, FileText, BarChart3, Calculator, Wallet, CreditCard,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useExpenseStore, useFleetStore, useDriverStore, useTripStore } from "@/lib/store";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend
} from "recharts";

const expenseSchema = z.object({
  category: z.enum(["fuel", "repair", "toll", "cash_advance", "other"]),
  vehicleId: z.string().optional(),
  driverId: z.string().optional(),
  amount: z.coerce.number().positive(),
  liters: z.coerce.number().optional(),
  date: z.string(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  paymentMethod: z.string().optional(),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

const COLORS = ["#3B82F6", "#F59E0B", "#EAB308", "#8B5CF6", "#6366F1", "#64748B"];

const getPaymentMethodFallback = (e: any) => {
  if (e.paymentMethod) {
    if (e.paymentMethod === "fuel_card") return "Fuel Card";
    return e.paymentMethod.charAt(0).toUpperCase() + e.paymentMethod.slice(1);
  }
  if (e.category === "fuel") return "Fuel Card";
  if (e.category === "toll" || e.category === "cash_advance") return "Cash";
  if (e.category === "repair") return "Card";
  return "Cash";
};

export default function ExpensesPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const trips = useTripStore((s) => s.trips);

  const [tab, setTab] = useState<string>("overview");
  const [open, setOpen] = useState(false);

  // Filter states
  const [selectedVehicle, setSelectedVehicle] = useState<string>("all-vehicles");
  const [selectedCategory, setSelectedCategory] = useState<string>("all-categories");
  const [selectedPayment, setSelectedPayment] = useState<string>("all-payment");

  // Pagination states
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { 
      category: "fuel", 
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "fuel_card"
    },
  });

  const onSubmit = (d: ExpenseForm) => {
    addExpense({ ...d, date: new Date(d.date).toISOString() });
    toast.success("Expense recorded");
    reset({
      category: "fuel",
      date: new Date().toISOString().split("T")[0],
      paymentMethod: "fuel_card",
      amount: undefined,
      liters: undefined,
      vendor: "",
      notes: ""
    });
    setOpen(false);
  };

  // Reset pagination on tab/filter change
  useMemo(() => {
    setCurrentPage(1);
  }, [tab, selectedVehicle, selectedCategory, selectedPayment, pageSize]);

  // Derived filtered dataset
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // 1. Tab filtering
      if (tab === "fuel" && e.category !== "fuel") return false;
      if (tab === "expenses" && e.category === "fuel") return false;

      // 2. Vehicle filtering
      if (selectedVehicle !== "all-vehicles" && e.vehicleId !== selectedVehicle) return false;

      // 3. Category filtering (only relevant if not on fuel tab)
      if (tab !== "fuel" && selectedCategory !== "all-categories" && e.category !== selectedCategory) return false;

      // 4. Payment method filtering
      if (selectedPayment !== "all-payment") {
        const method = getPaymentMethodFallback(e).toLowerCase().replace(" ", "_");
        if (method !== selectedPayment) return false;
      }

      return true;
    });
  }, [expenses, tab, selectedVehicle, selectedCategory, selectedPayment]);

  // Dynamic KPI Card Values
  const kpiMetrics = useMemo(() => {
    const fuelExpenses = filteredExpenses.filter(e => e.category === "fuel");
    const totalFuelCost = fuelExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalExpenses = filteredExpenses.filter(e => e.category !== "fuel").reduce((sum, e) => sum + e.amount, 0);
    const totalCost = totalFuelCost + totalExpenses;

    const relevantTrips = selectedVehicle !== "all-vehicles"
      ? trips.filter(t => t.vehicleId === selectedVehicle)
      : trips;
    const totalDistance = relevantTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 0);
    const avgCostPerKm = totalDistance > 0 ? totalCost / totalDistance : 0;

    const totalTransactions = filteredExpenses.length;

    return {
      totalFuelCost,
      totalExpenses,
      totalCost,
      avgCostPerKm,
      totalTransactions
    };
  }, [filteredExpenses, trips, selectedVehicle]);

  // Recharts Trend Data (Fuel vs Expenses Trend)
  const trendData = useMemo(() => {
    const dateMap: { [date: string]: { fuel: number; expenses: number } } = {};
    const sortedFiltered = [...filteredExpenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedFiltered.forEach(e => {
      const d = new Date(e.date);
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!dateMap[formattedDate]) {
        dateMap[formattedDate] = { fuel: 0, expenses: 0 };
      }
      if (e.category === "fuel") {
        dateMap[formattedDate].fuel += e.amount;
      } else {
        dateMap[formattedDate].expenses += e.amount;
      }
    });

    const data = Object.keys(dateMap).map(date => ({
      date,
      fuel: dateMap[date].fuel,
      expenses: dateMap[date].expenses
    }));

    return data.length > 0 ? data : [{ date: "No data", fuel: 0, expenses: 0 }];
  }, [filteredExpenses]);

  // Recharts Donut Data (Expenses by Category / Fuel by Vehicle)
  const categoryData = useMemo(() => {
    const categoryMap: { [key: string]: number } = {};
    let total = 0;

    filteredExpenses.forEach(e => {
      let key = "";
      if (tab === "fuel") {
        const v = vehicles.find(veh => veh.id === e.vehicleId);
        key = v ? v.plate : "Unassigned";
      } else {
        if (e.category === "fuel") key = "Fuel Cost";
        else if (e.category === "repair") key = "Repairs & Maintenance";
        else if (e.category === "toll") key = "Toll Fees";
        else if (e.category === "cash_advance") key = "Driver Allowance";
        else key = "Others";
      }
      categoryMap[key] = (categoryMap[key] || 0) + e.amount;
      total += e.amount;
    });

    return Object.keys(categoryMap).map((name, index) => {
      const value = categoryMap[name];
      const percent = total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "0%";
      return {
        name,
        value,
        percent,
        color: COLORS[index % COLORS.length]
      };
    });
  }, [filteredExpenses, tab, vehicles]);

  // Top Vehicles by Cost
  const topVehicles = useMemo(() => {
    const vehicleCostMap: { [id: string]: number } = {};
    filteredExpenses.forEach(e => {
      if (e.vehicleId) {
        vehicleCostMap[e.vehicleId] = (vehicleCostMap[e.vehicleId] || 0) + e.amount;
      }
    });

    const sortedVehicles = Object.keys(vehicleCostMap)
      .map(id => {
        const v = vehicles.find(veh => veh.id === id);
        const amount = vehicleCostMap[id];
        return {
          id,
          plate: v ? v.plate : "Unknown",
          desc: v ? `${v.brand} ${v.model}` : "Unknown Vehicle",
          amt: amount
        };
      })
      .sort((a, b) => b.amt - a.amt);

    const totalCost = sortedVehicles.reduce((sum, v) => sum + v.amt, 0);

    return sortedVehicles.slice(0, 5).map(v => {
      const percent = totalCost > 0 ? (v.amt / totalCost) * 100 : 0;
      return {
        plate: v.plate,
        desc: v.desc,
        amt: formatCurrency(v.amt),
        pct: `${percent.toFixed(1)}%`,
        percentBar: `w-[${Math.round(percent)}%]`
      };
    });
  }, [filteredExpenses, vehicles]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const paymentMap: { [method: string]: number } = {};
    let total = 0;
    
    filteredExpenses.forEach(e => {
      const method = getPaymentMethodFallback(e);
      paymentMap[method] = (paymentMap[method] || 0) + e.amount;
      total += e.amount;
    });

    return Object.keys(paymentMap).map(method => {
      const amount = paymentMap[method];
      const percent = total > 0 ? (amount / total) * 100 : 0;
      return {
        method,
        amount,
        pct: `${percent.toFixed(1)}%`
      };
    }).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Summary Card Metrics
  const summaryMetrics = useMemo(() => {
    const openingBalance = 2500000;
    const closingBalance = openingBalance - kpiMetrics.totalCost;
    return {
      openingBalance,
      closingBalance
    };
  }, [kpiMetrics.totalCost]);

  // Sorting & Pagination
  const sortedTransactions = useMemo(() => {
    return [...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredExpenses]);

  const totalCount = sortedTransactions.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy dark:text-white">Fuel & Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage all fuel transactions and other operating expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-brand-border shadow-sm font-medium">
            Active Period
            <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
          </Button>
          <Button variant="outline" className="border-brand-border shadow-sm font-medium">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white shadow-sm border-0 font-medium tracking-wide">
                <Plus className="w-4 h-4 mr-2" />
                Add Expense
                <ChevronDown className="w-4 h-4 ml-2 opacity-70" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
              <SheetHeader><SheetTitle>New Expense</SheetTitle></SheetHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <div><Label>Category</Label>
                  <Select value={watch("category")} onValueChange={(v: any) => {
                    setValue("category", v);
                    if (v === "fuel") {
                      setValue("paymentMethod", "fuel_card");
                    } else {
                      setValue("paymentMethod", "cash");
                    }
                  }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fuel">Fuel</SelectItem>
                      <SelectItem value="repair">Repair</SelectItem>
                      <SelectItem value="toll">Toll</SelectItem>
                      <SelectItem value="cash_advance">Cash Advance</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Vehicle</Label>
                  <Select onValueChange={(v) => setValue("vehicleId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Driver (optional)</Label>
                  <Select onValueChange={(v) => setValue("driverId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
                    <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Payment Method</Label>
                  <Select value={watch("paymentMethod")} onValueChange={(v: any) => setValue("paymentMethod", v)}>
                    <SelectTrigger><SelectValue placeholder="Select payment method" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="fuel_card">Fuel Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (₱)</Label><Input type="number" step="0.01" {...register("amount")} />{errors.amount && <p className="text-xs text-red-600 mt-1">Required</p>}</div>
                  <div><Label>Liters (Optional)</Label><Input type="number" step="0.01" {...register("liters")} /></div>
                </div>
                <div><Label>Date</Label><Input type="date" {...register("date")} /></div>
                <div><Label>Vendor</Label><Input {...register("vendor")} /></div>
                <div><Label>Notes</Label><Input {...register("notes")} /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" className="bg-brand-teal hover:bg-brand-teal/90 text-white">Save</Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* 5 KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 shrink-0">
        <KpiBlock 
          title="Total Fuel Cost" 
          value={formatCurrency(kpiMetrics.totalFuelCost)} 
          trend="Fuel Transactions" trendColor="text-green-500 font-semibold" 
          icon={Fuel} iconBg="bg-green-100/50 dark:bg-green-950/30" iconColor="text-green-600 dark:text-green-400" 
        />
        <KpiBlock 
          title="Total Expenses" 
          value={formatCurrency(kpiMetrics.totalExpenses)} 
          trend="Other Operating" trendColor="text-blue-500 font-semibold" 
          icon={Receipt} iconBg="bg-blue-100/50 dark:bg-blue-950/30" iconColor="text-blue-600 dark:text-blue-400" 
        />
        <KpiBlock 
          title="Total Cost" 
          value={formatCurrency(kpiMetrics.totalCost)} 
          trend="Combined Spending" trendColor="text-purple-500 font-semibold" 
          icon={FileText} iconBg="bg-purple-100/50 dark:bg-purple-950/30" iconColor="text-purple-600 dark:text-purple-400" 
        />
        <KpiBlock 
          title="Avg. Cost / KM" 
          value={formatCurrency(kpiMetrics.avgCostPerKm)} 
          trend="Total Fleet Distance" trendColor="text-orange-500 font-semibold" 
          icon={BarChart3} iconBg="bg-orange-100/50 dark:bg-orange-950/30" iconColor="text-orange-600 dark:text-orange-400" 
        />
        <KpiBlock 
          title="Total Transactions" 
          value={kpiMetrics.totalTransactions.toString()} 
          trend="Records count" trendColor="text-emerald-500 font-semibold" 
          icon={CreditCard} iconBg="bg-emerald-100/50 dark:bg-emerald-950/30" iconColor="text-emerald-600 dark:text-emerald-400" 
        />
      </div>

      {/* Main Tabs */}
      <div className="border-b border-brand-border dark:border-white/10 pt-2 shrink-0">
        <div className="flex gap-6 -mb-px px-1">
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'overview' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy dark:hover:text-white'}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'fuel' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy dark:hover:text-white'}`}
            onClick={() => setTab('fuel')}
          >
            Fuel Transactions
          </button>
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'expenses' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy dark:hover:text-white'}`}
            onClick={() => setTab('expenses')}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
          <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-vehicles">All Vehicles</SelectItem>
            {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}
          </SelectContent>
        </Select>

        {tab !== "fuel" && (
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              <SelectItem value="repair">Repair</SelectItem>
              <SelectItem value="toll">Toll</SelectItem>
              <SelectItem value="cash_advance">Cash Advance</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        )}

        <Select value={selectedPayment} onValueChange={setSelectedPayment}>
          <SelectTrigger className="w-[200px] h-9 text-sm"><SelectValue placeholder="All Payment Methods" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all-payment">All Payment Methods</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="fuel_card">Fuel Card</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex-1" />
        
        <Button variant="outline" 
          className="bg-white border-brand-border h-9 text-sm shadow-sm"
          onClick={() => {
            setSelectedVehicle("all-vehicles");
            setSelectedCategory("all-categories");
            setSelectedPayment("all-payment");
          }}
        >
          <Filter className="w-4 h-4 mr-2" />
          Clear Filters
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 items-start">
        {/* Left / Main Content */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 xl:space-y-6">
          <div className="grid md:grid-cols-2 gap-4 xl:gap-6">
            {/* Trend Chart */}
            <Card className="shadow-sm border-brand-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold">
                  {tab === "fuel" ? "Fuel Cost Trend" : tab === "expenses" ? "Expenses Trend" : "Fuel vs Expenses Trend"}
                </CardTitle>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                  {tab !== "expenses" && (
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Fuel Cost</div>
                  )}
                  {tab !== "fuel" && (
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Expenses</div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `₱${v}`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => `₱${val.toLocaleString()}`}
                      />
                      {tab !== "expenses" && (
                        <Line type="monotone" dataKey="fuel" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#22C55E' }} activeDot={{ r: 6 }} />
                      )}
                      {tab !== "fuel" && (
                        <Line type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart */}
            <Card className="shadow-sm border-brand-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-[15px] font-semibold">
                  {tab === "fuel" ? "Fuel Consumption by Vehicle" : "Expenses by Category"}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center p-4">
                <div className="w-[180px] h-[180px] relative shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₱${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">Total</span>
                    <span className="font-bold text-[13px] text-brand-navy dark:text-white truncate max-w-[110px]">
                      {formatCurrency(kpiMetrics.totalCost)}
                    </span>
                  </div>
                </div>
                
                {/* Custom Legend */}
                <div className="flex-1 pl-4 space-y-3 max-h-[180px] overflow-y-auto">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] xl:text-xs">
                      <div className="flex items-center justify-between gap-1 w-full min-w-0 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium text-brand-navy dark:text-white shrink-0">{cat.percent}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transactions Table */}
          <Card className="shadow-sm border-brand-border overflow-hidden">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[15px] font-semibold">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs xl:text-sm text-brand-navy dark:text-slate-200 min-w-[900px]">
                <thead className="text-left text-muted-foreground border-b border-brand-border dark:border-white/10 font-medium text-[11px] xl:text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Date & Time</th>
                    <th className="py-3 px-4 font-semibold">Type</th>
                    <th className="py-3 px-4 font-semibold">Vehicle / Driver</th>
                    <th className="py-3 px-4 font-semibold">Description / Vendor</th>
                    <th className="py-3 px-4 font-semibold">Category</th>
                    <th className="py-3 px-4 font-semibold">Payment Method</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-center">Receipt</th>
                    <th className="py-3 px-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {paginatedTransactions.map((e) => {
                    const vehicle = vehicles.find((v) => v.id === e.vehicleId);
                    const driver = drivers.find((d) => d.id === e.driverId);
                    const dateObj = new Date(e.date);
                    const d1 = dateObj.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                    const d2 = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                    const isFuel = e.category === "fuel";
                    const type = isFuel ? "Fuel" : "Expense";
                    const typeCol = isFuel
                      ? "text-green-600 bg-green-100/50 border border-green-200 dark:text-green-400 dark:bg-green-950/30 dark:border-green-900/50"
                      : "text-blue-600 bg-blue-100/50 border border-blue-200 dark:text-blue-400 dark:bg-blue-950/30 dark:border-blue-900/50";

                    let catName: string = e.category;
                    let catCol = "text-gray-600 bg-gray-100/50 dark:text-gray-400 dark:bg-gray-950/30";
                    if (e.category === "fuel") {
                      catName = "Fuel";
                      catCol = "text-green-600 bg-green-100/50 dark:text-green-400 dark:bg-green-950/30";
                    } else if (e.category === "repair") {
                      catName = "Repair";
                      catCol = "text-blue-600 bg-blue-100/50 dark:text-blue-400 dark:bg-blue-950/30";
                    } else if (e.category === "toll") {
                      catName = "Toll Fees";
                      catCol = "text-orange-600 bg-orange-100/50 dark:text-orange-400 dark:bg-orange-950/30";
                    } else if (e.category === "cash_advance") {
                      catName = "Driver Allowance";
                      catCol = "text-yellow-600 bg-yellow-100/50 dark:text-yellow-400 dark:bg-yellow-950/30";
                    } else {
                      catName = "Other";
                    }

                    const pay = getPaymentMethodFallback(e);
                    let payCol = "text-teal-600 bg-teal-100/50 dark:text-teal-400 dark:bg-teal-950/30";
                    if (pay === "Fuel Card") {
                      payCol = "text-purple-600 bg-purple-100/50 dark:text-purple-400 dark:bg-purple-950/30";
                    } else if (pay === "Card") {
                      payCol = "text-blue-600 bg-blue-100/50 dark:text-blue-400 dark:bg-blue-950/30";
                    }

                    return (
                      <TableRow 
                        key={e.id}
                        d1={d1} d2={d2}
                        type={type} typeCol={typeCol}
                        v1={vehicle ? vehicle.plate : "Unassigned"} v2={driver ? driver.name : "No Driver"}
                        desc1={e.vendor || "N/A"} desc2={e.notes || catName}
                        cat={catName} catCol={catCol}
                        pay={pay} payCol={payCol}
                        amt={formatCurrency(e.amount)}
                      />
                    );
                  })}
                  {paginatedTransactions.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-muted-foreground">
                        No transactions found for the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="p-4 border-t border-brand-border/60 dark:border-white/10 flex items-center justify-between text-[13px] text-muted-foreground bg-gray-50/30 dark:bg-white/[0.02]">
                <span>
                  Showing {Math.min(totalCount, (currentPage - 1) * pageSize + 1)} to {Math.min(totalCount, currentPage * pageSize)} of {totalCount} transactions
                </span>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2.5 shadow-sm text-xs font-medium"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    &lt;
                  </Button>
                  
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button 
                      key={i}
                      variant={currentPage === i + 1 ? "default" : "ghost"} 
                      size="sm" 
                      className={`h-8 w-8 p-0 text-xs font-medium ${currentPage === i + 1 ? "bg-brand-teal text-white" : ""}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2.5 shadow-sm text-xs font-medium"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    &gt;
                  </Button>
                  
                  <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(Number(v))}>
                    <SelectTrigger className="h-8 ml-2 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 / page</SelectItem>
                      <SelectItem value="10">10 / page</SelectItem>
                      <SelectItem value="20">20 / page</SelectItem>
                      <SelectItem value="50">50 / page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 xl:space-y-6">
          {/* Summary Card */}
          <Card className="shadow-sm border-brand-border">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[14px] font-bold tracking-tight">Summary (Demo Period)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Opening Balance</span>
                <span className="font-semibold text-brand-navy dark:text-white">{formatCurrency(summaryMetrics.openingBalance)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Fuel Cost</span>
                <span className="font-semibold text-brand-navy dark:text-white">{formatCurrency(kpiMetrics.totalFuelCost)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Expenses</span>
                <span className="font-semibold text-brand-navy dark:text-white">{formatCurrency(kpiMetrics.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Cost</span>
                <span className="font-semibold text-brand-navy dark:text-white">{formatCurrency(kpiMetrics.totalCost)}</span>
              </div>
              <div className="border-t border-dashed border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center font-bold text-[14px]">
                <span className="text-brand-navy dark:text-white">Closing Balance</span>
                <span className="text-green-600 dark:text-emerald-400">{formatCurrency(summaryMetrics.closingBalance)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Vehicles Card */}
          <Card className="shadow-sm border-brand-border">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[14px] font-bold tracking-tight">
                {tab === "fuel" ? "Top Vehicles by Fuel Cost" : "Top Vehicles by Spending"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs xl:text-[13px]">
              {topVehicles.map((vehicle, idx) => (
                <TopVehicle 
                  key={idx}
                  row={vehicle.plate} 
                  desc={vehicle.desc} 
                  amt={vehicle.amt} 
                  pct={vehicle.pct} 
                  percentBar={vehicle.percentBar} 
                />
              ))}
              {topVehicles.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  No vehicle data available.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="shadow-sm border-brand-border">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[14px] font-bold tracking-tight">Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs xl:text-[13px]">
              {paymentBreakdown.map((pm: any, idx: number) => {
                const isCash = pm.method === "Cash";
                const isFuelCard = pm.method === "Fuel Card";
                
                let iconBg = "bg-gray-100 dark:bg-white/10";
                let iconColor = "text-gray-600 dark:text-gray-300";
                let iconBorder = "border-gray-200 dark:border-white/10";
                let Icon = CreditCard;

                if (isCash) {
                  iconBg = "bg-teal-50 dark:bg-teal-900/20";
                  iconColor = "text-teal-600 dark:text-teal-400";
                  iconBorder = "border-teal-100 dark:border-teal-900/30";
                  Icon = Banknote;
                } else if (isFuelCard) {
                  iconBg = "bg-purple-50 dark:bg-purple-900/20";
                  iconColor = "text-purple-600 dark:text-purple-400";
                  iconBorder = "border-purple-100 dark:border-purple-900/30";
                  Icon = Wallet;
                }

                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md ${iconBg} ${iconColor} flex items-center justify-center border ${iconBorder} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-brand-navy dark:text-white">{pm.method}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-brand-navy dark:text-white tabular-nums">
                        {formatCurrency(pm.amount)} 
                        <span className="text-muted-foreground font-medium text-[11px] ml-1">({pm.pct})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {paymentBreakdown.length === 0 && (
                <div className="text-muted-foreground text-center py-4">
                  No payment breakdown available.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Subcomponents
function KpiBlock({ title, value, trend, trendColor, icon: Icon, iconBg, iconColor }: any) {
  return (
    <Card className="shadow-sm border-brand-border dark:border-white/10 p-4 lg:p-5 flex flex-col gap-3 bg-white dark:bg-card transition-colors relative overflow-hidden">
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5 lg:w-5 lg:h-5" />
        </div>
      </div>
      <div className="relative z-10 space-y-1 mt-1">
        <div className="text-xs font-semibold text-brand-navy/60 dark:text-white/60">{title}</div>
        <div className="text-[18px] md:text-[20px] lg:text-[22px] font-bold text-brand-navy dark:text-white tracking-tight whitespace-nowrap">{value}</div>
        <div className="text-[10px] xl:text-[11px] text-muted-foreground whitespace-nowrap">
          Context: <span className={`ml-0.5 ${trendColor}`}>{trend}</span>
        </div>
      </div>
    </Card>
  )
}

function TableRow({ d1, d2, type, typeCol, v1, v2, desc1, desc2, cat, catCol, pay, payCol, amt }: any) {
  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-white/[0.06] transition-colors">
      <td className="py-3 px-4">
        <div className="font-medium">{d1}</div>
        <div className="text-muted-foreground text-[11px]">{d2}</div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${typeCol}`}>{type}</span>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-[13px]">{v1}</div>
        <div className="text-muted-foreground text-[11px]">{v2}</div>
      </td>
      <td className="py-3 px-4">
        <div className="font-medium text-[13px]">{desc1}</div>
        <div className="text-muted-foreground text-[11px]">{desc2}</div>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${catCol}`}>{cat}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${payCol}`}>{pay}</span>
      </td>
      <td className="py-3 px-4 text-right font-bold tracking-tight text-brand-navy dark:text-white tabular-nums">
        {amt}
      </td>
      <td className="py-3 px-4 text-center">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 border border-green-100">
          <FileText className="w-3.5 h-3.5" />
        </Button>
      </td>
      <td className="py-3 px-4 text-center">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-brand-navy dark:hover:text-white hover:bg-gray-100/80 dark:hover:bg-white/10 border border-transparent">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  )
}

function TopVehicle({ row, desc, amt, pct, percentBar }: any) {
  // Extract number from className w-[xx%] to use as width
  const match = percentBar.match(/w-\[(\d+)%\]/);
  const widthVal = match ? `${match[1]}%` : "0%";

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="w-9 h-9 rounded bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 border border-gray-100 dark:border-white/10">
        <TruckIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-brand-navy dark:text-white truncate leading-tight">{row}</div>
        <div className="text-muted-foreground text-[11px] truncate pt-0.5">{desc}</div>
      </div>
      <div className="text-right w-[100px] shrink-0">
        <div className="font-semibold text-brand-navy dark:text-white leading-tight tabular-nums text-[13px]">{amt}</div>
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <div className="flex-1 h-[5px] bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden max-w-[60px]">
            <div className="h-full bg-green-500 rounded-full" style={{ width: widthVal }} />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium w-8 text-right tabular-nums tracking-tighter">{pct}</span>
        </div>
      </div>
    </div>
  )
}

// Optional icon to act as truck fallback
function TruckIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-9h-4M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
      <path d="M14 8h5l3 3v6h-3" />
    </svg>
  )
}