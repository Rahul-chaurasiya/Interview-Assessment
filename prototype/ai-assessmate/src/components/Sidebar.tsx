import { motion } from "framer-motion"; // 🌀 Framer Motion
import { NavLink } from "@/components/NavLink";
import { LayoutDashboard, Users, History, Plus } from "lucide-react";

const Sidebar = () => {
  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/candidates", icon: Users, label: "All Candidates" },
    { to: "/history", icon: History, label: "Interview History" },
    { to: "/create-candidate", icon: Plus, label: "New Interview" },
  ];

  return (
    <motion.aside
      className="hidden lg:block w-64 bg-primary-light min-h-[calc(100vh-4rem)] border-r border-primary shadow-lg"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.nav
        className="p-4 space-y-2"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
      >
        {navItems.map((item) => (
          <motion.div
            key={item.to}
            variants={{
              hidden: { opacity: 0, x: -10 },
              visible: { opacity: 1, x: 0 },
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            <NavLink
              to={item.to}
              end
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-primary-foreground hover:bg-primary/90 hover:text-white transition-all duration-300"
              activeClassName="bg-primary text-accent font-semibold shadow-md"
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.6 },
                }}
              >
                <item.icon className="h-5 w-5" />
              </motion.div>
              <span>{item.label}</span>
            </NavLink>
          </motion.div>
        ))}
      </motion.nav>
    </motion.aside>
  );
};

export default Sidebar;
