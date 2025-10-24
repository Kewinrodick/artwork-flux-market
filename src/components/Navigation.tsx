import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingCart, User } from "lucide-react";

const Navigation = () => {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="bg-primary px-4 py-2 font-bold text-primary-foreground text-xl">
              T DESIGN
            </div>
          </motion.div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              Explore
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              Trending
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              Designers
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-smooth">
              For Buyers
            </a>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:text-primary">
              <User className="h-5 w-5" />
            </Button>
            <Button className="hidden md:inline-flex bg-primary text-primary-foreground hover:bg-primary/90 glow-energy">
              Upload Design
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navigation;
