import { Link } from "react-router-dom";
import { motion } from "framer-motion"; // 🌀 Framer Motion
import { Button } from "@/components/ui/button";
import { Target, Plus } from "lucide-react";

const Navbar = () => {
  return (
    <motion.nav
      className="sticky top-0 z-50 bg-primary border-b border-primary-light shadow-md"
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ✅ Logo Section */}
          <Link
            to="/"
            className="flex items-center space-x-2 text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 1 }}
            >
              <Target className="h-8 w-8 text-accent" />
            </motion.div>
            <span className="text-xl font-bold">AI Interview System</span>
          </Link>

          {/* ✅ Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {[
              { name: "Dashboard", path: "/" },
              { name: "Candidates", path: "/candidates" },
              { name: "History", path: "/history" },
            ].map((link, index) => (
              <motion.div
                key={link.name}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <Link
                  to={link.path}
                  className="relative text-primary-foreground hover:text-accent transition-colors group"
                >
                  {link.name}
                  <motion.span
                    className="absolute left-0 bottom-[-4px] w-full h-[2px] bg-accent origin-left scale-x-0 group-hover:scale-x-100"
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* ✅ New Interview Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/create-candidate">
              <Button className="bg-accent hover:bg-accent-dark text-accent-foreground font-semibold">
                <Plus className="h-4 w-4 mr-2" />
                New Interview
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
