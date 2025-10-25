import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Download, Eye } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface DesignCardProps {
  id: string;
  title: string;
  designer: string;
  price: number;
  imageUrl: string;
  likes?: number;
  views?: number;
  index?: number;
}

const DesignCard = ({ id, title, designer, price, imageUrl, likes = 0, views = 0, index = 0 }: DesignCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/design/${id}`);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      onClick={handleCardClick}
      className="cursor-pointer"
    >
      <Card className="group overflow-hidden border-border bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-glow">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <motion.img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
          
          {/* Overlay on Hover */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center gap-4"
          >
            <Button
              size="icon"
              variant="ghost"
              className="bg-card/90 hover:bg-primary hover:text-primary-foreground"
            >
              <Eye className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="bg-card/90 hover:bg-primary hover:text-primary-foreground"
            >
              <Download className="h-5 w-5" />
            </Button>
          </motion.div>

          {/* Best Seller Badge */}
          {index % 3 === 0 && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
              TRENDING
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {title}
              </h3>
              <p className="text-sm text-muted-foreground">by {designer}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleLikeClick}
              className={`${isLiked ? 'text-primary' : 'text-muted-foreground'} hover:text-primary`}
            >
              <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {likes}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {views}
            </span>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-foreground">
              ${price}
            </div>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              License
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default DesignCard;
