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
import { useExpenseStore, useFleetStore, useDriverStore } from "@/lib/store";
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
});
type ExpenseForm = z.infer<typeof expenseSchema>;

// MOCK DATA FOR CHARTS
const trendData = [
  { date: "May 24", fuel: 220000, expenses: 60000 },
  { date: "May 25", fuel: 260000, expenses: 90000 },
  { date: "May 26", fuel: 250000, expenses: 80000 },
  { date: "May 27", fuel: 280000, expenses: 120000 },
  { date: "May 28", fuel: 240000, expenses: 100000 },
  { date: "May 29", fuel: 270000, expenses: 140000 },
  { date: "May 30", fuel: 320000, expenses: 170000 },
];

const categoryData = [
  { name: "Toll Fees", value: 245670.50, color: "#3B82F6", percent: "29.5%" },
  { name: "Repairs & Maintenance", value: 198320.00, color: "#F59E0B", percent: "23.8%" },
  { name: "Driver Allowance", value: 156840.00, color: "#EAB308", percent: "18.8%" },
  { name: "Tires", value: 98500.00, color: "#8B5CF6", percent: "11.8%" },
  { name: "Parking", value: 45630.25, color: "#6366F1", percent: "5.5%" },
  { name: "Others", value: 87580.00, color: "#64748B", percent: "10.6%" },
];
const COLORS = ["#3B82F6", "#F59E0B", "#EAB308", "#8B5CF6", "#6366F1", "#64748B"];

export default function ExpensesPage() {
  const expenses = useExpenseStore((s) => s.expenses);
  const addExpense = useExpenseStore((s) => s.addExpense);
  const vehicles = useFleetStore((s) => s.vehicles);
  const drivers = useDriverStore((s) => s.drivers);
  const [tab, setTab] = useState<string>("overview");
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: "fuel", date: new Date().toISOString().split("T")[0] },
  });

  const onSubmit = (d: ExpenseForm) => {
    addExpense({ ...d, date: new Date(d.date).toISOString() });
    toast.success("Expense recorded");
    reset();
    setOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-navy">Fuel & Expenses</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage all fuel transactions and other operating expenses.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="bg-white border-brand-border shadow-sm font-medium">
            May 24 – May 30, 2024
            <CalendarIcon className="w-4 h-4 ml-2 text-muted-foreground" />
          </Button>
          <Button variant="outline" className="bg-white border-brand-border shadow-sm font-medium">
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
                  <Select value={watch("category")} onValueChange={(v: any) => setValue("category", v)}>
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
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.plate}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Driver (optional)</Label>
                  <Select onValueChange={(v) => setValue("driverId", v)}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Amount (₱)</Label><Input type="number" step="0.01" {...register("amount")} />{errors.amount && <p className="text-xs text-red-600 mt-1">Required</p>}</div>
                  <div><Label>Liters</Label><Input type="number" step="0.01" {...register("liters")} /></div>
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
          value="₱1,248,765.40" 
          trend="↑ 8.6%" trendColor="text-green-500" 
          icon={Fuel} iconBg="bg-green-100/50" iconColor="text-green-600" 
        />
        <KpiBlock 
          title="Total Expenses" 
          value="₱832,540.75" 
          trend="↑ 5.3%" trendColor="text-red-500" 
          icon={Receipt} iconBg="bg-blue-100/50" iconColor="text-blue-600" 
        />
        <KpiBlock 
          title="Total Cost" 
          value="₱2,081,306.15" 
          trend="↑ 7.2%" trendColor="text-green-500" 
          icon={FileText} iconBg="bg-purple-100/50" iconColor="text-purple-600" 
        />
        <KpiBlock 
          title="Avg. Cost / KM" 
          value="₱18.54" 
          trend="↑ 3.1%" trendColor="text-red-500" 
          icon={BarChart3} iconBg="bg-orange-100/50" iconColor="text-orange-600" 
        />
        <KpiBlock 
          title="Total Transactions" 
          value="186" 
          trend="↑ 6.5%" trendColor="text-green-500" 
          icon={CreditCard} iconBg="bg-emerald-100/50" iconColor="text-emerald-600" 
        />
      </div>

      {/* Main Tabs */}
      <div className="border-b border-brand-border pt-2 shrink-0">
        <div className="flex gap-6 -mb-px px-1">
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'overview' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy'}`}
            onClick={() => setTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'fuel' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy'}`}
            onClick={() => setTab('fuel')}
          >
            Fuel Transactions
          </button>
          <button 
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${tab === 'expenses' ? 'border-brand-teal text-brand-teal' : 'border-transparent text-muted-foreground hover:text-brand-navy'}`}
            onClick={() => setTab('expenses')}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <Select defaultValue="all-vehicles">
          <SelectTrigger className="w-[180px] bg-white h-9 text-sm"><SelectValue placeholder="All Vehicles" /></SelectTrigger>
          <SelectContent><SelectItem value="all-vehicles">All Vehicles</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="all-categories">
          <SelectTrigger className="w-[180px] bg-white h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent><SelectItem value="all-categories">All Categories</SelectItem></SelectContent>
        </Select>
        <Select defaultValue="all-payment">
          <SelectTrigger className="w-[200px] bg-white h-9 text-sm"><SelectValue placeholder="All Payment Methods" /></SelectTrigger>
          <SelectContent><SelectItem value="all-payment">All Payment Methods</SelectItem></SelectContent>
        </Select>
        
        <div className="flex-1" />
        
        <Button variant="outline" className="bg-white border-brand-border h-9 text-sm shadow-sm">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 xl:grid-cols-4 gap-4 xl:gap-6 items-start">
        {/* Left / Main Content */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4 xl:space-y-6">
          <div className="grid md:grid-cols-2 gap-4 xl:gap-6">
            {/* Trend Chart */}
            <Card className="shadow-sm border-brand-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-[15px] font-semibold">Fuel vs Expenses Trend</CardTitle>
                <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground pt-1">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>Fuel Cost</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div>Expenses</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} tickFormatter={(v) => `₱${v/1000}K`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(val: number) => `₱${val.toLocaleString()}`}
                      />
                      <Line type="monotone" dataKey="fuel" stroke="#22C55E" strokeWidth={2} dot={{ r: 4, fill: '#22C55E' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="expenses" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4, fill: '#3B82F6' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Donut Chart */}
            <Card className="shadow-sm border-brand-border">
              <CardHeader className="pb-0">
                <CardTitle className="text-[15px] font-semibold">Expenses by Category</CardTitle>
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
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `₱${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                    <span className="text-[11px] text-muted-foreground font-medium">Total</span>
                    <span className="font-bold text-[13px] text-brand-navy">₱832,540.75</span>
                  </div>
                </div>
                
                {/* Custom Legend */}
                <div className="flex-1 pl-4 space-y-3">
                  {categoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] xl:text-xs">
                      <div className="flex items-center justify-between gap-1 w-full min-w-0 pr-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="text-muted-foreground truncate">{cat.name}</span>
                        </div>
                        <span className="font-medium text-brand-navy shrink-0">{cat.percent}</span>
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
              <table className="w-full text-xs xl:text-sm text-brand-navy min-w-[900px]">
                <thead className="text-left text-muted-foreground border-b border-brand-border bg-gray-50/80 font-medium text-[11px] xl:text-xs">
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
                  <TableRow 
                    d1="May 30, 2024" d2="08:45 AM" 
                    type="Fuel" typeCol="text-green-600 bg-green-100/50 border border-green-200"
                    v1="NEX-101" v2="Mark Santos"
                    desc1="Petron - SLEX Mamplasan" desc2="Diesel"
                    cat="Fuel" catCol="text-green-600 bg-green-100/50"
                    pay="Fuel Card" payCol="text-purple-600 bg-purple-100/50"
                    amt="₱18,450.00"
                  />
                  <TableRow 
                    d1="May 30, 2024" d2="11:20 AM" 
                    type="Expense" typeCol="text-blue-600 bg-blue-100/50 border border-blue-200"
                    v1="NEX-104" v2="John Cruz"
                    desc1="SLEX - Mamplasan" desc2="Toll Fee"
                    cat="Toll Fees" catCol="text-orange-600 bg-orange-100/50"
                    pay="Cash" payCol="text-teal-600 bg-teal-100/50"
                    amt="₱1,250.00"
                  />
                  <TableRow 
                    d1="May 29, 2024" d2="07:30 PM" 
                    type="Expense" typeCol="text-blue-600 bg-blue-100/50 border border-blue-200"
                    v1="NEX-102" v2="Allan Reyes"
                    desc1="Kalayaan Tire Center" desc2="Tire Replacement"
                    cat="Tires" catCol="text-blue-600 bg-blue-100/50"
                    pay="Card" payCol="text-teal-600 bg-teal-100/50"
                    amt="₱9,800.00"
                  />
                  <TableRow 
                    d1="May 29, 2024" d2="05:15 PM" 
                    type="Fuel" typeCol="text-green-600 bg-green-100/50 border border-green-200"
                    v1="NEX-106" v2="Ryan Garcia"
                    desc1="Shell - Alabang" desc2="Diesel"
                    cat="Fuel" catCol="text-green-600 bg-green-100/50"
                    pay="Fuel Card" payCol="text-purple-600 bg-purple-100/50"
                    amt="₱16,250.00"
                  />
                  <TableRow 
                    d1="May 29, 2024" d2="01:10 PM" 
                    type="Expense" typeCol="text-blue-600 bg-blue-100/50 border border-blue-200"
                    v1="NEX-103" v2="Carlo Mendoza"
                    desc1="Driver Meal Allowance" desc2="May 29"
                    cat="Driver Allowance" catCol="text-yellow-600 bg-yellow-100/50"
                    pay="Cash" payCol="text-teal-600 bg-teal-100/50"
                    amt="₱850.00"
                  />
                </tbody>
              </table>
              <div className="p-4 border-t border-brand-border/60 flex items-center justify-between text-[13px] text-muted-foreground bg-gray-50/30">
                <span>Showing 1 to 5 of 186 transactions</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 px-2.5 shadow-sm text-xs font-medium"><span className="sr-only">Prev</span>&lt;</Button>
                  <Button variant="default" size="sm" className="h-8 w-8 p-0 bg-brand-teal shadow-sm text-xs font-medium text-white">1</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs font-medium">2</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs font-medium">3</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs font-medium">4</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs font-medium">5</Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs font-medium">...</Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-xs font-medium">38</Button>
                  <Button variant="outline" size="sm" className="h-8 px-2.5 shadow-sm text-xs font-medium"><span className="sr-only">Next</span>&gt;</Button>
                  <Select defaultValue="10">
                    <SelectTrigger className="h-8 ml-2 w-[90px] text-xs bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="10">10 / page</SelectItem></SelectContent>
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
              <CardTitle className="text-[14px] font-bold tracking-tight">Summary (May 24 – May 30, 2024)</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Opening Balance</span>
                <span className="font-semibold text-brand-navy">₱1,248,000.00</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Fuel Cost</span>
                <span className="font-semibold text-brand-navy">₱1,248,765.40</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Expenses</span>
                <span className="font-semibold text-brand-navy">₱832,540.75</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground text-[13px]">
                <span>Total Cost</span>
                <span className="font-semibold text-brand-navy">₱2,081,306.15</span>
              </div>
              <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center font-bold text-[14px]">
                <span className="text-brand-navy">Closing Balance</span>
                <span className="text-green-600">₱414,459.25</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Vehicles Card */}
          <Card className="shadow-sm border-brand-border">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[14px] font-bold tracking-tight">Top Vehicles by Fuel Cost</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs xl:text-[13px]">
              <TopVehicle row="NEX-101" desc="Isuzu FTR 24ft" amt="₱245,670.50" pct="19.7%" percentBar="w-[80%]" />
              <TopVehicle row="NEX-104" desc="Hino 500" amt="₱198,320.00" pct="15.9%" percentBar="w-[60%]" />
              <TopVehicle row="NEX-102" desc="Fuso Canter" amt="₱156,840.00" pct="12.6%" percentBar="w-[45%]" />
              <TopVehicle row="NEX-103" desc="Toyota Hiace" amt="₱123,450.75" pct="9.9%" percentBar="w-[35%]" />
              <TopVehicle row="NEX-106" desc="Toyota Hilux" amt="₱98,760.25" pct="7.9%" percentBar="w-[20%]" />
            </CardContent>
          </Card>

          {/* Payment Method Breakdown */}
          <Card className="shadow-sm border-brand-border">
            <CardHeader className="pb-3 border-b border-brand-border/60">
              <CardTitle className="text-[14px] font-bold tracking-tight">Payment Method Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs xl:text-[13px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shrink-0">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-brand-navy">Cash</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-brand-navy tabular-nums">₱1,245,450.25 <span className="text-muted-foreground font-medium text-[11px] ml-1">(59.8%)</span></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center text-gray-600 border border-gray-200 shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-brand-navy">Card</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-brand-navy tabular-nums">₱512,780.00 <span className="text-muted-foreground font-medium text-[11px] ml-1">(24.6%)</span></div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-brand-navy">Fuel Card</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-brand-navy tabular-nums">₱323,075.90 <span className="text-muted-foreground font-medium text-[11px] ml-1">(15.6%)</span></div>
                </div>
              </div>
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
    <Card className="shadow-sm border-brand-border p-4 lg:p-5 flex flex-col gap-4 bg-white transition-colors relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-2.5 rounded-lg ${iconBg} ${iconColor} shrink-0`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>
        <div className="text-right">
          <div className="text-[17px] md:text-[19px] lg:text-[22px] font-bold text-brand-navy tracking-tight whitespace-nowrap">{value}</div>
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-xs font-semibold text-brand-navy/80 mb-1">{title}</div>
        <div className="text-[10px] xl:text-[11px] text-muted-foreground whitespace-nowrap">vs Apr 24 - Apr 30 <span className={`font-semibold ml-0.5 ${trendColor}`}>{trend}</span></div>
      </div>
    </Card>
  )
}

function TableRow({ d1, d2, type, typeCol, v1, v2, desc1, desc2, cat, catCol, pay, payCol, amt }: any) {
  return (
    <tr className="hover:bg-gray-50/80 transition-colors">
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
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-brand-navy ${catCol}`}>{cat}</span>
      </td>
      <td className="py-3 px-4">
        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold text-brand-navy ${payCol}`}>{pay}</span>
      </td>
      <td className="py-3 px-4 text-right font-bold tracking-tight text-brand-navy tabular-nums">
        {amt}
      </td>
      <td className="py-3 px-4 text-center">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 bg-green-50 hover:bg-green-100 hover:text-green-700 border border-green-100">
          <FileText className="w-3.5 h-3.5" />
        </Button>
      </td>
      <td className="py-3 px-4 text-center">
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-brand-navy hover:bg-gray-100/80 border border-transparent">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </td>
    </tr>
  )
}

function TopVehicle({ row, desc, amt, pct, percentBar }: any) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="w-9 h-9 rounded bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
        <TruckIcon className="w-5 h-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-brand-navy truncate leading-tight">{row}</div>
        <div className="text-muted-foreground text-[11px] truncate pt-0.5">{desc}</div>
      </div>
      <div className="text-right w-[100px] shrink-0">
        <div className="font-semibold text-brand-navy leading-tight tabular-nums text-[13px]">{amt}</div>
        <div className="flex items-center justify-end gap-1.5 mt-1.5">
          <div className="flex-1 h-[5px] bg-gray-100 rounded-full overflow-hidden max-w-[60px]">
            <div className={`h-full bg-green-500 rounded-full ${percentBar}`} />
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
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}>
      <path d="M10 17h4V5H2v12h3" />
      <path d="M20 17h2v-9h-4M5 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0 M15 17a2 2 0 1 0 4 0a2 2 0 1 0-4 0" />
      <path d="M14 8h5l3 3v6h-3" />
    </svg>
  )
}