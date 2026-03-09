import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  Video, 
  HelpCircle, 
  BarChart3, 
  Settings,
  Plus,
  Calendar,
  Clock
} from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  
  const menuItems = [
    { 
      to: "/", 
      label: "Dashboard", 
      icon: LayoutDashboard,
      description: "Overview and stats"
    },
    { 
      to: "/candidates", 
      label: "Candidates", 
      icon: Users,
      description: "Manage candidates"
    },
    { 
      to: "/interviews", 
      label: "Interviews", 
      icon: Video,
      description: "Live & recorded"
    },
    { 
      to: "/questions", 
      label: "Question Bank", 
      icon: HelpCircle,
      description: "Question library"
    },
    { 
      to: "/analytics", 
      label: "Analytics", 
      icon: BarChart3,
      description: "Reports & insights"
    },
    { 
      to: "/settings", 
      label: "Settings", 
      icon: Settings,
      description: "Configuration"
    },
  ];

  return (
    <motion.div
      className="w-64 bg-slate-900 border-r border-border p-4 min-h-[calc(100vh-64px)] flex flex-col sticky top-16"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Logo/Brand */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Video className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">InterviewAI</h1>
            <p className="text-xs text-slate-400">Professional Assessment</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div 
        className="mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Link 
          to="/create-candidate"
          className="flex items-center justify-center w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 group"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-medium">New Candidate</span>
        </Link>
      </motion.div>

      {/* Navigation Menu */}
      <motion.nav
        className="space-y-1 flex-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {menuItems.map((item, index) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={item.to}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group ${
                location.pathname === item.to
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <motion.div
                className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                  location.pathname === item.to 
                    ? "bg-white/20" 
                    : "bg-slate-700 group-hover:bg-slate-600"
                }`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <item.icon className="h-4 w-4" />
              </motion.div>
              <div className="flex-1">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs opacity-70">{item.description}</div>
              </div>
              
              {/* Active indicator */}
              {location.pathname === item.to && (
                <motion.div
                  className="w-2 h-2 bg-white rounded-full"
                  layoutId="activeTab"
                />
              )}
            </Link>
          </motion.div>
        ))}
      </motion.nav>

      {/* Bottom Section - Pushed to bottom */}
      <motion.div
        className="mt-auto pt-4 border-t border-slate-700"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-2 text-slate-400 text-xs">
          <Clock className="h-3 w-3" />
          <span>Last sync: 2 min ago</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Sidebar;
