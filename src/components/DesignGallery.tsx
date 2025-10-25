import { useEffect, useState } from "react";
import DesignCard from "./DesignCard";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Design {
  id: string;
  title: string;
  price: number;
  image_url: string;
  likes_count: number;
  profiles: {
    name: string;
  };
}

const DesignGallery = () => {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('designs')
      .select(`
        id,
        title,
        price,
        image_url,
        likes_count,
        profiles:designer_id (
          name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      console.error('Error fetching designs:', error);
    } else {
      setDesigns(data as Design[]);
    }
    setLoading(false);
  };

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Trending <span className="text-primary text-glow">Designs</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the hottest T-shirt designs from our creative community
          </p>
        </motion.div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))
          ) : designs.length > 0 ? (
            designs.map((design, index) => (
              <DesignCard
                key={design.id}
                id={design.id}
                title={design.title}
                designer={design.profiles.name}
                price={Number(design.price)}
                imageUrl={design.image_url}
                likes={design.likes_count}
                views={Math.floor(Math.random() * 2000) + 500} // Mock views for now
                index={index}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground text-lg">No designs found. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {!loading && designs.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 border border-primary/50 hover:bg-primary/10 hover:border-primary text-foreground transition-all duration-300 font-semibold">
              Load More Designs
            </button>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default DesignGallery;