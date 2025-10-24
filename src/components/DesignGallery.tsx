import DesignCard from "./DesignCard";
import { motion } from "framer-motion";

const DesignGallery = () => {
  // Mock data - will be replaced with real data later
  const designs = [
    {
      id: 1,
      title: "Neon Dreams",
      designer: "Alex Rivera",
      price: 49,
      imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=500&fit=crop",
      likes: 234,
      views: 1250,
    },
    {
      id: 2,
      title: "Urban Jungle",
      designer: "Maya Chen",
      price: 39,
      imageUrl: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&h=500&fit=crop",
      likes: 189,
      views: 980,
    },
    {
      id: 3,
      title: "Cosmic Wave",
      designer: "Jordan Blake",
      price: 55,
      imageUrl: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500&h=500&fit=crop",
      likes: 312,
      views: 1500,
    },
    {
      id: 4,
      title: "Retro Vibes",
      designer: "Sam Taylor",
      price: 42,
      imageUrl: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&h=500&fit=crop",
      likes: 156,
      views: 850,
    },
    {
      id: 5,
      title: "Electric Soul",
      designer: "Riley Park",
      price: 48,
      imageUrl: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&h=500&fit=crop",
      likes: 278,
      views: 1340,
    },
    {
      id: 6,
      title: "Future Nostalgia",
      designer: "Casey Morgan",
      price: 52,
      imageUrl: "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=500&h=500&fit=crop",
      likes: 201,
      views: 1120,
    },
  ];

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
          {designs.map((design, index) => (
            <DesignCard key={design.id} {...design} index={index} />
          ))}
        </div>

        {/* Load More */}
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
      </div>
    </section>
  );
};

export default DesignGallery;
