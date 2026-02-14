"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  DollarSign, 
  Calendar, 
  Image as ImageIcon, 
  HardDrive,
  MoreVertical,
  CheckCircle2,
  Clock,
  ChevronRight
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import AdminLayout from "../../components/AdminLayout";
import CheckUser from "@/app/components/checkuser";

// --- Mock Data ---
const chartData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 5000 },
  { name: "Apr", revenue: 4500 },
  { name: "May", revenue: 6000 },
  { name: "Jun", revenue: 5500 },
  { name: "Jul", revenue: 8000 },
];

const recentGalleries = [
  { id: 1, title: "Wedding: Sarah & Mike", date: "2 mins ago", status: "Processing", img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=200" },
  { id: 2, title: "Fashion Editorial", date: "2 hours ago", status: "Live", img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" },
  { id: 3, title: "Corporate Event: TechCo", date: "1 day ago", status: "Draft", img: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=200" },
];

const recentUsers = [
  { id: 1, name: "Alice Johnson", role: "Photographer", email: "alice@studio.com", status: "Active" },
  { id: 2, name: "Robert Smith", role: "Client", email: "rob@gmail.com", status: "Pending" },
  { id: 3, name: "Elena D.", role: "Editor", email: "elena@edit.com", status: "Active" },
  { id: 4, name: "Marcus Wright", role: "Client", email: "marcus@w.com", status: "Active" },
];

// Helper Components
const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="p-6 rounded-2xl bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 shadow-sm dark:shadow-none backdrop-blur-xl relative overflow-hidden group hover:border-indigo-300 dark:hover:border-zinc-700 transition-colors"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-200 dark:border-zinc-800 group-hover:border-indigo-500/30 transition-colors">
        <Icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${
        trend === 'up' 
          ? "bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20" 
          : "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
      }`}>
        {change}
      </span>
    </div>
    <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">{title}</h3>
    <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{value}</p>
    
    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/10 dark:group-hover:bg-indigo-500/20 transition-all" />
  </motion.div>
);

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Load user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Load theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Chart Colors based on Theme
  const chartColors = {
    grid: theme === "dark" ? "#27272a" : "#e4e4e7",
    text: theme === "dark" ? "#71717a" : "#71717a",
    tooltipBg: theme === "dark" ? "#18181b" : "#ffffff",
    tooltipBorder: theme === "dark" ? "#27272a" : "#e4e4e7",
    tooltipText: theme === "dark" ? "#fff" : "#000",
  };

  return (
    
    <AdminLayout user={user} pageTitle="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value="$45,231.89" change="+20.1%" icon={DollarSign} trend="up" />
        <StatCard title="Active Bookings" value="124" change="+180" icon={Calendar} trend="up" />
        <StatCard title="Galleries" value="3,205" change="+19%" icon={ImageIcon} trend="up" />
        <StatCard title="Storage Used" value="824 GB" change="+4%" icon={HardDrive} trend="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none transition-colors"
        >
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Revenue Overview</h2>
              <p className="text-sm text-zinc-500">Monthly earnings performance</p>
            </div>
            <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-zinc-400" />
            </button>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke={chartColors.text} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  fontSize={12}
                />
                <YAxis 
                  stroke={chartColors.text} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartColors.tooltipBg, 
                    borderColor: chartColors.tooltipBorder, 
                    borderRadius: '12px',
                    color: chartColors.tooltipText,
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Galleries */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm shadow-sm dark:shadow-none flex flex-col transition-colors"
        >
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Recent Galleries</h2>
          <p className="text-sm text-zinc-500 mb-6">Latest uploaded projects</p>

          <div className="space-y-4">
            {recentGalleries.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group cursor-pointer border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800">
                <div className="h-12 w-12 rounded-lg relative overflow-hidden bg-zinc-200 dark:bg-zinc-800">
                  <Image 
                    src={item.img} 
                    alt={item.title} 
                    fill 
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-zinc-900 dark:text-white truncate">{item.title}</h4>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" /> {item.date}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full border ${
                  item.status === 'Live' ? 'bg-green-50 text-green-600 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' : 
                  item.status === 'Processing' ? 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20' :
                  'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-400 dark:border-zinc-500/20'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>

          <button className="mt-auto w-full py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all mt-4">
            View All Galleries
          </button>
        </motion.div>

      </div>

      {/* Recent Users Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm dark:shadow-none transition-colors"
      >
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800/50 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Recent Users</h2>
            <p className="text-sm text-zinc-500">Manage access and permissions</p>
          </div>
          <button className="bg-zinc-900 dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg">
            + Add User
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 dark:text-zinc-400 uppercase bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Email</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs text-zinc-600 dark:text-zinc-300">
                      {user.name.charAt(0)}
                    </div>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{user.role}</td>
                  <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`w-4 h-4 ${user.status === 'Active' ? 'text-green-500' : 'text-zinc-400'}`} />
                      <span className={user.status === 'Active' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500 dark:text-zinc-400'}>{user.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      <CheckUser />
    </AdminLayout>
  );
}